---
title: "SST-CD：把无标签建筑变化检测从差异图变成自训练"
date: "2026-06-12T17:00:02+08:00"
tags: ["变化检测", "无标签学习", "自训练", "伪标签", "建筑变化", "LEVIR-CD"]
mode: "twohour"
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# SST-CD：把无标签建筑变化检测从差异图变成自训练

**结论：这一轮值得单独跟踪的是 SST-CD，不是因为它又给变化检测堆了一个复杂网络，而是因为它把“无标签建筑变化检测”从差异图后处理，推进到一个更像论文问题的设定：没有人工变化标注时，能不能用带噪时相差异只监督可靠位置，训练出真正面向建筑变化的检测器。**

我按 2026-06-12 17:00 +08 检索公开来源，过滤了 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 项。Earth-OneVision 这类多模态 RS-MLLM 虽然更新更近，但摘要显式覆盖 SAR，因此按本次规则不作为主项。ZODS-RS 和 VecLang 已在前两篇两小时雷达中写过。本篇选择 2026-06-09 提交、2026-06-10 修订的 *Spatially Selective Self-Training for Unsupervised Building Change Detection*，把它作为“光学双时相建筑变化、无标签自训练、公开 benchmark 可检验”的候选方向。

## 摘要

SST-CD 关注 unsupervised building change detection，输入是无标签双时相遥感影像，输出是建筑变化 mask。论文指出，许多 label-free 方法遵循 discrepancy-to-mask 范式：先用时相差异、冻结基础模型响应、prompt 输出或后处理得到候选变化图，再直接把它当最终结果。这类方法能避免标注，但没有真正学习一个建筑变化检测器，也容易把光照、季节、配准误差、非建筑变化误判为建筑变化。

SST-CD 的做法是把这些时相差异只当作 candidate pseudo labels，再用 spatially reliable pixels 训练端到端检测器。可靠性由局部一致性标准估计，不稳定区域不参与监督。为减轻噪声伪标签的影响，论文加入轻量 feature adapter 重新校准双时相特征，并用 prototype-based decoder 形成更紧凑的 change/no-change 表示。作者在 LEVIR-CD、WHU-CD、DSIFN-CD 上报告 F1 分别为 83.08%、91.69%、86.60%，超过已有 unsupervised 和 label-free baseline。

当前可复现性要保留意见。我用 GitHub API 按论文题名和 `SST-CD LEVIR-CD WHU-CD DSIFN-CD` 检索，没有确认到官方仓库；arXiv 页面也没有列出代码链接。因此 SST-CD 目前更适合作为方法设定和复现实验线索，而不是已经能直接 `git clone` 跑通的项目。

## 背景

建筑变化检测的实际约束很清楚：城市更新、灾后评估、违建巡查、基础设施统计都需要跨年份或灾前灾后影像，但高质量像素级变化标注昂贵，而且强依赖地区、时间、传感器和人工标注协议。监督模型在 LEVIR-CD、WHU-CD 这类数据集上能刷出较高分数，但换城市、换季节、换影像来源后，性能常被伪变化拖垮。

无标签路线本来很诱人。最直观的办法是计算前后时相差异，再阈值化或接一个后处理模块；近两年也有人用 SAM、DINO、CLIP、GeoFM 响应作为变化线索。但这类路线的核心风险是“差异不等于建筑变化”。阴影变了、树冠变了、道路施工、裸地翻耕、影像未严格配准，都可能产生强差异；而真实新增建筑如果外观和周围屋顶相近，又可能差异不强。

SST-CD 的题眼在这里：不要把差异图直接当答案，而是把它当作不干净的老师。学生模型只从空间上更可信的像素学习，并通过自训练逐步形成任务特定表征。这个转向比“换一个更大的 backbone”更值得跟踪，因为它正好对应遥感落地中的常态：我们不缺原始影像，也不缺粗差异线索，缺的是能把噪声伪标签变成稳定模型的训练协议。

## 论文/项目

论文全名是 *Spatially Selective Self-Training for Unsupervised Building Change Detection*，arXiv 编号 2606.10775，v1 提交于 2026-06-09，v2 修订于 2026-06-10。作者把问题设为 fully label-free building change detection，也就是训练阶段不用人工变化 mask。

评测数据集是三个经典光学建筑变化检测 benchmark：LEVIR-CD、WHU-CD 和 DSIFN-CD。这组数据集的组合比较合理：LEVIR-CD 常用于大规模建筑变化检测，WHU-CD 更强调高分辨率建筑变化，DSIFN-CD 场景复杂度更高。三者都不是 SAR 场景，符合本轮过滤条件。

论文的贡献不是提出一个全新的遥感基础模型，而是提出一个训练框架：从 noisy temporal discrepancy 出发，筛选可靠区域，训练检测器，并用 adapter 和 prototype decoder 稳定学习。它适合作为“无标签变化检测”的复现目标，也适合作为后续主动学习、少标注学习和 foundation-model 伪标签清洗的基线。

## 方法

SST-CD 可以拆成三步看。

第一步是候选伪标签生成。模型先从双时相影像中得到 temporal discrepancies，这些差异可以来自简单图像差分、特征差分或冻结模型响应。关键是论文没有把它们直接输出为最终变化图，而是把它们视为 noisy pseudo supervision。

第二步是空间选择。SST-CD 用 local consistency criterion 判断哪些像素或区域更可靠。直观理解是：真实建筑变化通常有局部结构一致性，比如一个新增建筑块在空间上应形成相对连续的区域；而配准误差、阴影边缘、纹理抖动往往更碎、更不稳定。只在可靠区域施加监督，可以减少错误伪标签把模型带偏。

第三步是自训练检测器。轻量 feature adapter 用来重新校准双时相特征，使模型不只是被动读取差异，而是学习面向建筑变化的特征对齐方式。prototype-based decoder 则把 change 和 no-change 压成更紧凑的原型表示，降低噪声像素对决策边界的扰动。

这个方法的工程意义在于，它不要求人工 mask，也不要求大规模指令数据或 VLM 标注；它更像一个可以插到现有变化检测流水线里的训练协议。已有监督 CD backbone、GeoFM 特征、SAM/SegEarth-OV 候选 mask、OSM 建筑轮廓，都可以成为候选伪标签或可靠性判断的来源。

## 实验

论文摘要报告的主结果是：SST-CD 在 LEVIR-CD、WHU-CD、DSIFN-CD 上分别取得 83.08%、91.69%、86.60% F1，并超过 existing unsupervised and label-free baselines。这个结果的价值不在于和 fully supervised 方法硬比，而在于说明“差异图 + 空间可靠性筛选 + 自训练”能比直接 discrepancy-to-mask 更稳。

从 benchmark 设计看，三个数据集都属于建筑变化检测常用公开集，足以做第一轮复现和消融。最应该复核的指标不只是 F1，还应包括 precision、recall、IoU、边界 F-score、小建筑变化召回率、伪变化误报率，以及跨数据集泛化。例如在 LEVIR-CD 上生成伪标签并调参，再直接测试 WHU-CD 或 DSIFN-CD，能更真实地检验它是否学到建筑变化，而不是学到某个数据集的影像风格。

如果后续要把 SST-CD 变成自己的研究方向，最小复现实验可以很具体：固定一个轻量 CD backbone，比较四组训练监督，分别是原始差异图直接训练、阈值后处理结果训练、SST-CD 式可靠像素训练、再加入 foundation-model feature discrepancy 的可靠像素训练。评价中要报告伪标签覆盖率和可靠区域比例，否则很难判断提升来自“筛得准”，还是来自“只在简单样本上训练”。

## 问题

第一，代码暂未确认公开。SST-CD 的关键在于可靠像素选择、伪标签阈值、adapter 插入位置、prototype 更新方式和训练轮次。如果没有代码，复现者很容易在这些细节上得到不同结论。

第二，可靠性筛选可能引入选择偏差。局部一致性强的区域往往是更大、更规则、更清晰的建筑变化；小建筑、密集城中村、灾后破损建筑、配准不稳的边界区域可能被过滤掉。这样 F1 提升未必等价于难例能力提升。

第三，三套公开数据集仍不足以证明真实跨域鲁棒性。LEVIR-CD、WHU-CD、DSIFN-CD 都是常用 benchmark，但真实业务会遇到不同 GSD、不同采集季节、不同城市形态和不同标注定义。无标签方法最该证明的是跨城市、跨年份和跨传感器光学影像的稳定性。

第四，建筑变化只是变化检测的一小类。SST-CD 的空间一致性和 prototype 思路可能迁移到道路、裸地、洪水、水体、农田变化，但每类目标的“可靠变化”形态不同，不能直接假设通用。

## 启发

一个可以继续做的小论文方向是：**面向光学遥感建筑变化的“可靠伪标签 + 少量点/框校正”自训练框架**。SST-CD 完全无标签，但实际项目里通常可以承受少量人工点、框或粗 mask。与其追求纯零标注，不如研究少量人机交互如何显著修正伪标签噪声。

具体方案可以这样落地。第一阶段，用时相差异、DINO/GeoFM 特征差异和 SAM-style mask proposals 生成候选变化区域；第二阶段，用 SST-CD 式 local consistency 选出高置信伪标签，同时把低置信但面积大、边界复杂或靠近建筑 footprint 的区域送给人工，只要求点选“变化/未变化”或画一个 box；第三阶段，用点/框约束修正伪标签，再训练轻量变化检测器；第四阶段，在无标签目标城市上用一致性和不确定性做 test-time calibration。

数据集可以从 LEVIR-CD、WHU-CD、DSIFN-CD 开始，外加 xBD 或 SpaceNet building 的光学灾害/城市变化子集。指标除了 F1、IoU，还要报告人工交互次数、每平方公里审核成本、伪标签噪声率、跨数据集性能下降、ECE 校准误差和小建筑召回率。基线包括直接差异阈值、ChangeStar/ChangeFormer 类监督模型、无标签 discrepancy-to-mask、SST-CD 复现、少样本监督微调。

这个方向的可发表点不是“又一个变化检测网络”，而是把无标签变化检测做成可审计训练协议：哪些像素被当作老师，哪些区域被拒绝，哪些样本需要人审，少量人审究竟省下多少标注。对遥感 AI 来说，这比单纯 prompt 一个 VLM 问“哪里变了”更扎实，因为最终输出可以落到 mask、置信度、审核队列和跨域误差上。

## 参考来源

- arXiv: *Spatially Selective Self-Training for Unsupervised Building Change Detection*：https://arxiv.org/abs/2606.10775
- LEVIR-CD dataset project page：https://justchenhao.github.io/LEVIR/
- WHU building/change detection dataset page：http://gpcv.whu.edu.cn/data/building_dataset.html
