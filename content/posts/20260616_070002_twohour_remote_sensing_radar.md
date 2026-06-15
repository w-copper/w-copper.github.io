---
title: "Gaze Heads：不用重训，直接把 VLM 的描述视线拨到指定区域"
date: "2026-06-16T07:00:02+08:00"
tags: ["VLM", "视觉定位", "注意力干预", "遥感问答", "幻觉诊断", "CV-to-RS"]
mode: "twohour"
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# Gaze Heads：不用重训，直接把 VLM 的描述视线拨到指定区域

**结论：这一轮最值得补进雷达的是 *Gaze Heads: How VLMs Look at What They Describe*。它不是遥感专用论文，而是一篇对遥感 VLM 很有迁移价值的 CV/ML 工作：作者发现 VLM 的语言模型 backbone 中存在一小组 attention heads，会跟踪模型当前正在描述的图像区域；只对这些 heads 加一个 inference-time attention-mask bias，就能把模型回答引到指定区域，不需要重新训练模型。论文在漫画面板任务上报告 top-100 gaze heads 的区域重定向准确率为 83.1%，项目页还显示同一机制可扩展到 COCO 自然图像的 bounding box 区域问答，并在 Qwen3-VL 2B 到 32B、Qwen2-VL、Ovis、InternVL 等模型家族中复现。对遥感来说，这个方向比“又做一个 VLM benchmark”更有用：它提供了一条可审计、可干预的区域 grounding 路线，可以服务于遥感 VQA、开放词表目标描述、变化解释、人工交互标注和幻觉诊断。**

我按 2026-06-16 07:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是通用 VLM 机制解释与可控推理方法，不涉及 SAR backscatter、coherence、interferometry 或微波传感器。同期本地文章已经覆盖 AI4Land、Clay-CNN Hybrids、TTABC、RPC-GS、OSMGraphCLIP、TUE-CD、GeoFM layer probing、MaskWAM、ShearFuse-UNet、LALE、CoastlineVLM、Stateful Visual Encoders、LG-SAM、LPM、CSI-Net、VecLang、TerraBench、OSTB、BCP、UltraVR、ABot-Earth 等方向，因此这里不重复写已有遥感条目。

## 背景

遥感 VLM 的核心问题不是“能不能说出一段漂亮 caption”，而是这段话到底有没有看对区域。大幅遥感影像里常见多个相似目标：一片工业区旁边有仓库、道路、裸地、停车场和水体；灾后影像里同一张图可能同时包含倒塌建筑、未受损建筑、临时道路和阴影；农业场景里不同地块的物候状态也可能同时出现。如果 VLM 只给出全图级回答，我们很难判断它是在描述目标区域，还是在描述旁边更显眼的背景。

现有遥感 VLM 研究常用三类办法处理这个问题。第一类是做更大的 instruction tuning 数据，把 box、mask、caption、VQA 混在一起训练；第二类是接 SAM、GroundingDINO、检测器或分割器，用外部模型把区域先切出来；第三类是做 benchmark，统计模型在区域问答、定位或 grounding 上的错误率。这些都重要，但它们都没有直接回答一个机制问题：一个 VLM 在生成某个词或句子时，内部到底把视觉注意力放到了哪里；如果它看偏了，能不能在不重训的情况下把它拨回来。

Gaze Heads 的价值就在这里。它把 VLM 的区域描述问题从“训练更多数据”转成“找出承担视觉 grounding 的少数 heads，然后在推理时控制它们”。这对遥感很有吸引力，因为遥感场景经常有大图、多目标、小目标、细粒度类别和强空间先验。如果可以把用户圈选的地块、建筑、道路段、变化区域或候选 mask 直接映射成 attention bias，那么 VLM 就不必每次都通过 prompt 文字猜“你说的是哪个区域”。

## 论文/项目

论文标题是 *Gaze Heads: How VLMs Look at What They Describe*，arXiv 编号 2606.14703，作者是 Rohit Gandikota 和 David Bau。arXiv 元数据显示论文日期为 2026-06-12，当前 cs.CV recent feed 中它排在最新批次的前列。项目页、官方 GitHub、交互式 demo 和 Hugging Face 数据集都已经公开。

主源链接如下：

- 论文：<https://arxiv.org/abs/2606.14703>
- 项目页：<https://gaze.baulab.info/>
- 官方代码：<https://github.com/rohitgandikota/gaze-heads>
- 数据集：<https://huggingface.co/datasets/baulab/openai-comic-strips>

官方 README 把任务说得很直接：先找出那些会看向模型正在描述内容的 attention heads，然后把它们指向别处，模型就会改为描述那里。实现主要面向 Qwen3-VL 家族，提供了 gaze head discovery、narration trajectory、VQA steering、static narration steering、dynamic narration steering 和交互式 notebook 等脚本。

需要把事实和推断分开。已验证事实是：代码、项目页、demo 和漫画数据集已经公开；论文实验主要建立在通用 VLM 和通用图像/漫画面板上。本文对遥感的部分是迁移判断：如果遥感 VLM 使用类似可访问 attention 的 decoder-only 或多模态 LLM 结构，并且影像区域可以被 box、mask 或 patch token 对齐，那么 gaze-head 干预可以被改造成遥感区域问答和幻觉控制工具。

## 数据

这篇论文的核心控制场景是漫画条带。项目页和数据集页显示，作者提供了 baulab/openai-comic-strips 数据集：500 条六面板漫画，共 3,000 张图像，由 OpenAI gpt-image-1 生成，并带有结构化元数据，包括艺术风格、重复主角和每个面板的一句话 caption。这个数据集不是为了做遥感，而是为了把“区域顺序”控制得足够清楚：六个面板横向排列，每个面板都有明确边界，模型在叙述时应该从一个面板移动到另一个面板。

官方 README 还说明，论文协议在 COMICS corpus 上发现 heads，并在 disjoint OpenAI strips 上评估 steering。COMICS 原始 panel images 约 65 GB；OpenAI comic strips 可以通过仓库脚本下载到 `data/comics/`，每条漫画一个文件夹，内部是 `p1.png` 到 `p6.png`。这种设计把 discovery 和 evaluation 分开，避免只在同一批生成图像上过拟合 gaze head 排名。

对遥感迁移来说，漫画面板可以类比成遥感大图中的候选区域。最简单的改法是把六面板换成遥感 tile 内的多个候选框：例如一张 1024 x 1024 光学影像中切出 6 个建筑候选、6 个道路交叉口、6 个变化斑块或 6 个农田地块，让 VLM 回答“第 k 个区域有什么”。更进一步，可以不用规则面板，而是把用户 box、SAM mask、检测器 proposal 或地块 polygon 映射到 image tokens 上，直接作为 gaze-head bias 的目标区域。

## 方法

方法分两步：发现 gaze heads，然后干预 gaze heads。

发现阶段很轻量。作者对每个候选区域发起区域查询，例如问模型第 k 个面板是什么，并记录每个 attention head 对各个面板 image tokens 的注意力分布。一个真正的 gaze head 应该随着查询目标变化而移动：问第 1 个面板时看第 1 个，问第 4 个面板时看第 4 个。作者用一个简单相关性得分给 heads 排名。官方 README 说，在单张 A6000 级别 GPU 上，500 个样本的 head discovery 可在 10 分钟内完成；不需要训练，不需要标签，只需要每个面板查询的一次 forward pass。

干预阶段也不改模型权重。作者只在 top-ranked gaze heads 的 attention 计算中加入一个 pre-softmax bias：提升目标区域 image tokens 的 attention，压低其他区域 image tokens 的 attention，文本 attention 不动，其他 heads 也不动。项目页强调，Qwen3-VL-8B 有 1,152 个 attention heads，核心实验只重定向 top-100 gaze heads，少于全部 heads 的 9%。

这和常见 prompt 工程不同。prompt 只能用文字说“请关注左上角建筑”，但模型内部可能仍然被更显眼的道路或阴影吸引。gaze-head 干预直接作用在视觉 token 路由上，相当于给 VLM 一个软性的空间读窗。它也不同于裁剪图像：裁剪会丢失上下文，而 attention bias 可以让模型保留全图上下文，同时优先描述目标区域。

对遥感而言，关键工程问题是 image token 到地理区域的映射。如果 VLM 的视觉编码器输出 patch tokens，那么 box 很容易映射成 token set；mask 或 polygon 可以先栅格化到 patch 网格；多分辨率遥感影像则需要记录 tile 坐标、GSD、投影和 padding。只要能得到目标区域 token indices，gaze-head steering 就可以接入遥感 VQA、目标描述和交互式标注。

## 实验

论文摘要和项目页报告了几个关键结果。

第一，gaze heads 不只是相关性现象，而是可干预因子。把 top-100 gaze heads 指向指定漫画面板后，模型回答被引到目标面板的准确率达到 83.1%；随机 non-gaze heads 不能有效重定向；对所有 heads 干预反而会破坏生成。这说明有用的控制信号集中在少数 heads 上，盲目干预全部注意力会损伤语言生成。

第二，控制强度有可调曲线。项目页显示，重定向 5 个 top gaze heads 时准确率约 36%，随着 heads 数量增加，准确率上升，并在 100 个 heads 左右达到 83.1% 的峰值。这对实际系统有意义：遥感应用可以在“区域约束强度”和“自然语言流畅度”之间调参，而不是只有开关两种状态。

第三，动态控制可行。项目页给出的 narration trajectory 实验显示，在生成过程中每 50 个 tokens 切换一次目标面板，模型会结束当前面板描述并转向新目标；gaze-head trajectory 与人为指定 schedule 的 Spearman 相关系数达到 0.87。这对多区域遥感报告很有启发：一个 VLM 可以按用户指定顺序依次解释多个地块、多个变化斑块或多个疑似灾损区域，而不是随机游走式描述全图。

第四，方法不只适用于漫画。项目页说明，作者把 gaze heads 指向 COCO 图像中的对象 bounding boxes，并询问目标区域内容，gaze redirection 使区域回答准确率超过 baseline 的两倍。虽然 COCO 不是遥感，但它说明该机制可以从离散面板转到自然图像中的连续区域。遥感中的 box、mask 和 polygon 更接近这个设置。

第五，机制具有模型家族差异。项目页显示，Qwen3-VL 2B 到 32B 都能找到可 steering 的 gaze heads；Qwen2-VL、Ovis、InternVL 也有类似现象，峰值重定向准确率在 60% 到 83% 之间。但 LLaVA family 和 Bunny 没有可比的可控 head set。作者推测可控机制与视觉编码器是否在 VLM 任务中被 fine-tune 有关，不过这仍需要受控训练实验验证。这个结论对遥感 VLM 选型很实际：不是所有开源 VLM 都适合做这种 attention-level 区域控制。

## 亮点

第一，它给 VLM grounding 提供了可操作机制。很多遥感 VLM 文章只报告 VQA accuracy、caption score 或 grounding benchmark 分数，但无法解释错误来自哪里。Gaze Heads 至少提供了一个内部观测点：模型生成某段话时，少数 heads 是否真的在看目标区域。

第二，它是 inference-time 方法。遥感场景里重新训练大模型成本很高，尤其是需要多传感器、多地区、多尺度数据时。gaze-head steering 不改权重，理论上可以叠加到现有遥感 VLM、通用 VLM 或微调后的领域模型上，用作推理控制层。

第三，它适合人机交互。遥感解译常常由分析员圈选区域，再要求模型解释“这里是什么”“这里有没有变化”“这个目标是否可信”。如果把圈选区域转为 attention bias，模型回答可以更稳定地围绕用户关注区域，而不是被全图最显眼目标带偏。

第四，它可用于幻觉诊断。遥感 VLM 的幻觉常见于小目标、遮挡、阴影、低分辨率和类别相似区域。gaze-head trajectory 可以记录回答期间 attention 是否落在证据区域；如果模型声称“这里有光伏板”，但 gaze heads 长时间看的是道路或建筑阴影，这就是一个可审计的风险信号。

第五，它能和已有遥感工具互补。SAM/RemoteSAM 给 mask，检测器给 box，地块数据给 polygon，变化检测模型给 changed blobs，gaze-head steering 则把这些空间先验接到 VLM 的语言生成过程里。它不替代分割和检测，而是把“检测到哪里”转成“描述哪里、解释哪里、不要跑题”。

## 不足

第一，论文不是遥感实验。所有遥感价值都需要二次验证，不能直接把漫画和 COCO 上的数字当成遥感 VQA 或遥感 grounding 的性能承诺。

第二，方法依赖模型结构和可访问 attention。商业闭源 VLM 或封装很深的推理服务通常拿不到每层每头 attention，也不能注入 pre-softmax bias。即使是开源模型，高效推理框架也可能需要改 attention kernel 才能实现区域 bias。

第三，小目标可能仍然困难。项目页也提到，小 bounding boxes 覆盖的 image tokens 太少时，attention bias 可作用的空间有限。遥感里车辆、小船、窄路、杆塔和小型建筑正好常常是低 token 占比目标，因此需要更高分辨率视觉 token、局部放大或多尺度 token routing。

第四，地理坐标和 patch token 对齐不可省略。遥感影像有 GSD、投影、重采样、padding、tiling 和 overlap。如果 token-region 映射不严格，模型可能被指向错位区域。真正落地时必须把 geospatial metadata 和视觉 token 网格绑定起来。

第五，attention steering 不等于事实校验。把 VLM 指向正确区域，只能降低看错区域的风险，不能保证它识别对类别、数量、变化原因或时间关系。遥感高风险应用仍需要外部证据：多时相影像、传感器元数据、检测/分割置信度、GIS 图层和人工复核。

## 遥感迁移方案

一个最小可复现实验可以这样做：选 Qwen3-VL 或另一个开源 VLM，先用普通光学遥感图像构建区域问答集合。每张图给 4 到 8 个候选区域，可以来自 DOTA/DIOR/NWPU VHR-10 的检测框、LoveDA/OpenEarthMap 的语义区域、LEVIR-CD 的变化斑块，或人工圈选的地块。问题保持模糊，例如“这个区域里主要是什么目标”“这里是否有新增建筑”“该区域更像道路、建筑还是裸地”。然后比较三种输入：全图加文本提示、裁剪区域、全图加 gaze-head steering。

评价指标不要只看 VQA accuracy。应同时记录区域命中率、回答是否引用目标区域内证据、类别准确率、幻觉率、重复/跑题率和人工偏好。对变化检测解释任务，还应要求模型输出“变化前证据、变化后证据、变化类型、置信理由”，再检查 gaze heads 是否在对应时相的变化区域上。

更进一步，可以把 gaze-head score 变成遥感 VLM 的诊断指标。对同一张大图，给定一个 box 或 mask，计算生成回答时 gaze heads 在目标区域 token 上的 attention mass。如果回答正确但 attention 不在目标区域，说明模型可能利用了数据偏差；如果回答错误且 attention 偏离目标区域，说明是 grounding failure；如果 attention 在目标区域但回答错误，说明是识别或知识错误。这种错误分解比单一 accuracy 更有研究价值。

## 可做的论文方向

第一，做 Remote Gaze Steering：面向遥感 VLM 的区域可控描述。方法上直接复现 gaze-head discovery，再把目标区域从漫画面板换成遥感 box/mask/polygon。数据可用 DOTA、DIOR、NWPU VHR-10、LoveDA、OpenEarthMap、LEVIR-CD 或本地标注样本。指标包括 region-conditioned VQA accuracy、grounding faithfulness、hallucination rate 和人工评审。baseline 包括纯 prompt、crop-only、box prompt、SAM crop 和无干预全图 VLM。

第二，做 Evidence-Grounded RS-VQA。让模型回答遥感问题时必须给出证据区域，并用 gaze-head attention 检查回答 token 与证据区域是否一致。这个方向可以和已有 RS-VQA、VRSBench、Earth-Bench 或 GeoBench-VLM 类任务结合，重点不是刷新榜单，而是把“回答正确”拆成“看对区域”和“说对语义”两部分。

第三，做 Change Gaze Heads。变化检测和变化 caption 常常需要同时看 t1 与 t2。可以把目标 token 分成 pre-change region 和 post-change region，观察 VLM 在生成“新增、拆除、扩建、变绿、变水体”等词时是否在两个时相之间正确切换。这里的核心问题是时序 grounding，而不是单图 grounding。

第四，做 GeoSAM + Gaze Heads 交互标注。用 SAM/RemoteSAM 生成候选 mask，用户点击或框选后，gaze-head steering 让 VLM 只描述该 mask，并输出类别、边界疑点、相邻对象和是否需要人工复核。这样可以把 VLM 从“全图聊天工具”变成“标注质检助手”。

第五，做小目标失败分析。专门收集车辆、船舶、储罐、光伏板、屋顶设施等小目标，系统改变 GSD、patch size、tile overlap 和目标面积占比，测试 gaze-head steering 何时失效。这个方向很适合遥感，因为小目标和大图上下文的矛盾比自然图像更突出。

## 复现优先级

优先复现官方仓库的三个脚本：`01_discover_gaze_heads.py`、`03_steer_vqa.py`、`interactive_steering.ipynb`。先在作者的 OpenAI comic strips 上跑通 head discovery 和 steering，确认本地环境能拿到 attention 并注入 bias。README 说明 steering evaluations 使用 Claude 作为 judge，需要 `ANTHROPIC_API_KEY`；但 discovery 和 trajectory plots 不需要 API key。

第二步再替换数据加载器。把漫画六面板替换成遥感多区域样本，保持“一个大图、多个候选区域、一个目标区域”的协议不变。这样可以最小化工程变量，先验证 attention steering 是否仍能把描述引到指定遥感区域。

第三步再接真实遥感任务。不要一开始就做完整遥感 agent。更务实的路线是先做 region caption 或 region VQA，再做变化解释，最后才做多轮交互式解译。每一步都要保留 attention trajectory、目标区域 token mass 和回答文本，方便人工审计。

## 参考链接

- arXiv: <https://arxiv.org/abs/2606.14703>
- Project: <https://gaze.baulab.info/>
- GitHub: <https://github.com/rohitgandikota/gaze-heads>
- Hugging Face dataset: <https://huggingface.co/datasets/baulab/openai-comic-strips>
