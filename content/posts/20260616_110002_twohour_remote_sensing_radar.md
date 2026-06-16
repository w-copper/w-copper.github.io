---
title: "RATS：让 ViT 的 register token 自发学出可复用部件"
date: "2026-06-16T11:00:03+08:00"
tags: ["RATS", "DINO", "部件发现", "ViT", "自监督", "CV-to-RS"]
mode: "twohour"
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RATS：让 ViT 的 register token 自发学出可复用部件

**结论：这一轮最值得补进雷达的是 *RATS! Patches Talk Through Registers: Emergent Parts in Register Attention Transformers*。它不是遥感专用论文，而是一篇很适合迁移到遥感密集预测和可解释基础模型的 CV 方法：作者把 ViT 里原本用于全局聚合的分类 token，改造成多个 learnable register tokens，并让 patch 信息经过 `L -> N -> N -> L` 的 compress、communicate、broadcast 瓶颈流动。结果是，在没有部件标注、没有辅助分割损失的情况下，每个 register 会自发专化到相对一致的 proto-semantic region。论文报告 RATS 在 5 个 part/region segmentation benchmark 上平均 mIoU 比最强 baseline 高约 12 个点，并且用 Mask2Former 下游微调时，在 ADE20K 语义分割和 COCO instance segmentation 上也有小幅但一致提升。对遥感来说，RATS 的意义不是“直接拿来刷新 LoveDA”，而是提供了一种把大图 patch 组织成可复用局部部件的架构先验：建筑屋顶、道路交叉口、田块边界、水岸线、车辆/船舶局部结构，都可能从这种 register bottleneck 中得到更可解释、更可控的中间表示。**

我按 2026-06-16 11:00 +08 检查公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是通用视觉自监督架构，输入实验主要是自然图像；遥感部分是迁移判断，不把自然图像结果直接等同为遥感性能。同期本地文章已经覆盖 Gaze Heads、TTABC、Clay-CNN Hybrids、AI4Land、MaskWAM、GeoFM layer probing、LALE、CoastlineVLM、Stateful Visual Encoders、LG-SAM、CSI-Net、VecLang、TerraBench、OSTB 等方向，因此这里不重复写已有条目。

## 背景

遥感基础模型现在有一个很现实的问题：patch token 很强，但我们经常不知道它们在语义上怎么组织。一个 ViT 可以在下游语义分割、变化检测、场景分类里表现不错，可是当我们想问“这个建筑为什么被分成两块”“这条道路为什么断了”“这片田块边界为什么跟地籍线不一致”时，普通 patch embedding 很难提供可读的中间结构。

DINO 系列和很多自监督 ViT 已经显示出局部语义涌现：PCA 或 attention 可视化里经常能看到前景、部件和对象边界。但这种结构多数是事后观察出来的，不是模型架构中显式承诺的表示。对于遥感尤其麻烦，因为我们的目标经常不是 ImageNet 式单物体，而是大幅影像中的大量重复结构：屋顶、道路、树冠、耕地纹理、水体边界、裸地斑块和阴影混在一起。如果没有一种机制把 patch 聚成稳定的局部原语，模型很容易只学到全局场景纹理，而不是可复用的地物组成。

RATS 的切入点正好在这里。它不是再加文本监督，也不是用 SAM 生成伪标签，而是改 ViT 的 token 路由方式：让 patch 之间的通信必须通过一组 register tokens。这个瓶颈迫使 register 学会承载局部或部件级信息，而不是让所有 patch 在全连接 attention 中自由混合。对遥感来说，这类“可解释的中间 token”可能比单纯更大的 backbone 更有用。

## 论文/项目

论文标题是 *RATS! Patches Talk Through Registers: Emergent Parts in Register Attention Transformers*，arXiv 编号 2606.14701，作者来自 Johns Hopkins University、Office of Naval Research 和 Mayo Clinic。arXiv 页面显示论文提交时间为 2026-06-12，出现在 2026-06-15 的 cs.CV recent 批次中。官方 GitHub 已公开，仓库使用 MIT license，但目前还是早期状态，star 和 release 都很少，需要继续跟踪代码完整度。

主源链接如下：

- 论文：<https://arxiv.org/abs/2606.14701>
- HTML：<https://arxiv.org/html/2606.14701>
- 官方代码：<https://github.com/yangtiming/RATS>

已验证事实是：论文提出 Register Attention Transformers，使用 DINO self-distillation 训练；官方摘要和 README 均说明方法不使用部件标注或辅助 part loss；实验包含 COCO、ADE20K、ImageNet val、ImageNet-S919 和 PartImageNet；下游迁移用 Mask2Former 在 ADE20K 和 COCO 上比较 DINO ViT-S/16 与 RATS 初始化。本文对遥感的部分是基于架构和任务形态的迁移推断。

## 问题

遥感密集预测长期依赖两类中间表示。一类是 CNN/U-Net 的局部 feature map，边界和纹理强，但语义组织未必清晰；另一类是 ViT/GeoFM 的 patch tokens，全局上下文强，但局部部件和对象组成经常被摊平。RATS 提醒我们，基础模型不一定只能输出全局 embedding 或密集 patch grid，也可以输出一组有语义倾向的 register tokens。

这个问题在遥感里至少有 4 个具体表现。

第一，建筑和道路需要拓扑部件。建筑提取不只是前景/背景，还包括屋顶主体、附属结构、阴影、相邻道路、院落和误检裸地。道路提取也不只是路面 mask，还包括交叉口、桥梁、停车场、道路边界和断裂点。

第二，开放词汇遥感分割需要稳定区域原语。VLM 或 CLIP 可以给文本类别，但 mask 的区域组织仍然需要视觉侧支持。如果 register 能稳定对应“屋顶面”“路面段”“树冠块”“水岸线”等视觉原语，文本对齐会更容易落到局部区域。

第三，变化检测需要部件级差异。很多变化不是整栋建筑从无到有，而是屋顶扩建、道路拓宽、地块翻耕、水岸线移动、施工场地局部变化。普通全图或全对象表示很容易把这些细粒度变化平均掉。

第四，遥感模型需要可审计。制图和监测任务不能只给一个 mIoU。我们还需要知道模型把哪些 patch 聚成了同一个地物部件，哪些 register 反复在不同城市、季节、GSD 下指向同类结构，哪些 register 是不稳定或背景驱动的。

## 方法

RATS 的核心是一个 register-token bottleneck。普通 ViT 让所有 patch tokens 通过 multi-head self-attention 直接互相通信，并用一个 `[CLS]` token 聚合全局信息。RATS 则把全局聚合拆成多个 register tokens，让每个 block 中的信息流经过三步。

第一步是 compress：patch tokens 把信息聚合到 register tokens。第二步是 communicate：register tokens 之间做 self-attention，交换局部结构之间的上下文。第三步是 broadcast：register tokens 再把更新后的信息写回 patch tokens。这个路径可以写成 `L -> N -> N -> L`，其中 `L` 是 patch 数量，`N` 是 register 数量。

关键设计是 per-head partition。RATS 把 `N` 个 registers 硬分配到 `H` 个 attention heads，不同 head 拥有独立的 register 子集，不跨 head 混合。这个约束会减少不同 register 之间的语义纠缠，鼓励不同 head 和不同 register 捕捉不同区域或部件。官方 README 把它概括为：每个 head 拥有独立 register subset，从结构上保证多样性，让部件级专化自然涌现。

训练目标没有额外复杂化。论文使用 DINO self-distillation recipe，不增加 part labels、region labels 或辅助分割损失。最终层 register tokens 的均值进入 DINO projection head，teacher 仍然用 EMA 更新。也就是说，part-like register 不是被标签强行教出来的，而是由瓶颈结构和自监督目标共同诱导出来的。

可视化也很直接。作者计算 register token 与 patch tokens 的 cosine similarity，把每个 register 对应的 score map reshape 回空间网格，再按最高响应分配 patch，得到 unsupervised part segmentation map。这个机制对遥感很有吸引力，因为它天然给出“哪个 register 看哪里”的证据，而不是只输出一个不可解释 embedding。

## 数据/评价

论文预训练 RATS-S/B，使用 ImageNet-1k 和 DINO recipe。评价覆盖 5 个 benchmark：COCO 2017 val、ADE20K validation、ImageNet val、ImageNet-S919 val 和 PartImageNet test。由于 ImageNet 没有 segmentation masks，COCO instance annotation 也只覆盖部分图像，作者用 SAM 2.1 生成 proxy masks；ADE20K、ImageNet-S919 和 PartImageNet 则使用原生标注。

主要指标是 many-to-one mIoU 和 ARI。many-to-one mIoU 允许多个预测区域映射到同一个真实区域，适合评价 unsupervised grouping；ARI 衡量预测分组和真实分组的一致性。论文还在 ablation 中使用 one-to-one mIoU，用来观察过分割：如果 M2O 高但 O2O 低，说明模型可能把一个语义区域拆成了太多 registers。

对遥感迁移，评价指标需要调整。建议不要只看 mIoU，还要看这些指标：

- **区域一致性：** 同一个 register 在不同城市、不同季节、不同 GSD 下是否反复激活相同地物部件。
- **边界质量：** building/road/water mask 的 boundary F-score、Hausdorff distance、polygon simplification error。
- **拓扑质量：** 道路连通性、建筑 polygon 自交率、田块边界闭合率。
- **跨域鲁棒性：** train-on-city-A test-on-city-B、urban-to-rural、跨季节、跨传感器光学/多光谱。
- **字典可解释性：** register dictionary 是否能被命名为屋顶、道路段、水岸线、树冠、裸地、阴影等地物原语。

适合第一轮验证的数据集包括 LoveDA、OpenEarthMap、SpaceNet building、DOTA/DIOR、iSAID、WHU building、LEVIR-CD/WHU-CD 光学变化检测，以及带地块边界的农业样本。若要验证 multispectral，需要在 RGB 预训练和多光谱输入之间设计 band adapter，不能直接假设 ImageNet register 会识别 NIR/SWIR 模式。

## 实验

论文报告的核心结果有三组。

第一，part/region segmentation 明显优于 baseline。表 1 中，RATS 在 COCO、ADE20K、ImageNet、ImageNet-S919 和 PartImageNet 上相对 DINOv1、DINOv3、Mamba with registers、SPFormer、SPiT、AdaSlot 等方法都有更好的平均 many-to-one mIoU。最强配置 RATS-B/16 with 192 registers 的平均 M2O mIoU 为 39.54，而 AdaSlot ViT-B/16 为 27.45，差距约 12.09 个点。这个结果支持了作者的主张：register bottleneck 不只是可视化好看，确实提升了无监督区域/部件分组质量。

第二，下游迁移不是纯可解释玩具。作者把 RATS register tokens 用作 Mask2Former 查询初始化，并在 ADE20K 和 COCO 上微调。相同 100 epoch ImageNet-1k 预训练下，DINO ViT-S/16 在 ADE20K mIoU 为 45.41，RATS 为 46.52；COCO instance segmentation AP 从 37.9 到 38.1。提升幅度不大，但方向一致，说明 register token 不是只适合 part discovery，也可以进入标准 dense prediction decoder。

第三，字典分析显示可复用部件。论文构建 register dictionary，并在 PartImageNet 上观察到 within-super-category consistency、taxonomic proximity 和 functional analogy。例如某些 entry 会在同类对象不同实例上对齐相似部件，车轮和自行车轮这类功能相似结构也会靠近。对遥感来说，这一点最值得关注：如果 register dictionary 能在遥感中形成“屋顶面、道路段、田埂、水岸线、树冠块、阴影边缘”等条目，它就能成为基础模型和 GIS/VLM 之间的中间词表。

消融也给出一个重要工程信号。论文表 3 显示，RATS baseline 在 512 x 512、batch 16 的 A5000 GPU 设置下，相比 ViT-S/16 DINO 有更低显存和延迟，同时区域质量更好；Perceiver-IO style 虽然更快，但牺牲空间细节。这对遥感大图推理很关键：我们需要降低 patch-patch attention 成本，但不能把边界和小目标细节压没。

## 亮点

第一，RATS 把“部件涌现”从事后现象变成架构先验。DINO 特征本来就可能出现部件结构，但 RATS 用 register bottleneck 显式承载这些结构，使它更容易被读取、排序、命名和复用。

第二，它不需要部件标注。遥感最缺的正是细粒度部件级标注。我们可能有建筑 mask、道路 mask、土地覆盖标签，但很少有“屋顶主体、阴影、道路交叉口、田块边缘”的大规模标注。RATS 的自监督路线降低了构建遥感部件词表的门槛。

第三，它适合大图和高分辨率密集预测。register bottleneck 可以减少全连接 patch attention 的压力，同时保留可广播回 patch grid 的局部结构。遥感 tile 很大，目标尺度跨度也大，这个方向比单纯堆更长 context 更实际。

第四，它能接 Mask2Former/SAM/VLM。register tokens 可以作为 query-based decoder 的初始化，也可以给 SAM/GeoSAM 候选 mask 做解释，或者作为 VLM region prompt 的视觉侧锚点。它不是一个孤立 backbone，而是可以变成多模块遥感系统里的结构化视觉中间层。

第五，它天然支持失败分析。一个 register 如果在不同地区总是激活阴影而不是建筑，或者在农村/城市域之间语义漂移，就可以被单独诊断。普通 dense feature map 很难做到这种粒度的审计。

## 不足

第一，论文没有遥感实验。自然图像上的 part segmentation、ADE20K 和 COCO 提升不能直接外推到光学遥感、多光谱遥感、UAV 或 VHR 制图。

第二，ImageNet 预训练的部件概念未必覆盖遥感地物。鸟头、车轮、动物躯干这类自然图像部件，与屋顶、道路、农田、水岸线、裸地纹理的统计结构差别很大。真正有价值的遥感 RATS 需要在大规模 EO 数据上重新预训练或至少做领域自监督适配。

第三，SAM proxy masks 会影响部分评价。COCO 和 ImageNet 的 proxy ground truth 来自 SAM 2.1，并不等同于人工 part labels。遥感里如果也用 SAM/GeoSAM 生成伪真值，必须防止把 SAM 的偏差当成模型能力。

第四，register 数量存在粒度权衡。论文消融显示，更多 register 会提高覆盖但可能造成过分割；更少 register 更完整但更粗。遥感不同任务的最佳粒度会不同：建筑 footprint 需要完整对象，道路拓扑需要连续线状结构，小目标检测则需要更细局部。

第五，多光谱和时序输入还没解决。RATS 当前是 2D RGB ViT 语境。遥感真正常用的 Sentinel-2、Landsat、HLS、时序作物监测和变化检测，都涉及 band/time 维度。直接把 register bottleneck 套上去还不够，需要设计 band-aware、time-aware 或 geo-aware registers。

## 遥感迁移方案

最小可复现实验可以先做 **Remote-RATS for Building and Road Parts**。

训练阶段选两条路线。轻量路线是在 DINO/GeoFM backbone 上加 RATS bottleneck，对 OpenEarthMap、LoveDA、SpaceNet、WHU building、DeepGlobe road 的 RGB/VHR tile 做 self-supervised adaptation。完整路线是在更大规模光学遥感图像上重训 RATS-S/16，输入分辨率从 224/512 扩到 512/1024，保留多尺度 crop。

评价阶段不要一开始追求全遥感 SOTA。先做 register grouping 诊断：把 register similarity map 与已有 building/road/water/vegetation masks 对齐，计算 M2O/O2O mIoU、ARI、boundary F-score 和 register purity。再人工抽样命名高频 register，看它们是否对应屋顶、路面、树冠、水岸、裸地、阴影等地物原语。

下游阶段接 Mask2Former 或 SegFormer decoder。对比 `DINO/Prithvi/Clay backbone + learned queries`、`RATS backbone + learned queries`、`RATS backbone + register queries` 三种设置。数据用 LoveDA urban/rural split、OpenEarthMap cross-region split、SpaceNet cross-city building split。重点不是只看 mIoU，而是看跨域性能下降、边界质量和小目标/细长结构召回。

如果要接 VLM，可以把 register dictionary 转成视觉 token 证据：给定文本“道路交叉口”“小型建筑”“农田边界”“水岸线”，先检索最相关的 registers 和区域，再让 VLM 只解释这些候选区域。这样比直接把整张遥感大图扔给 VLM 更可控。

## 可做的论文方向

第一，做 **Remote-RATS: Self-Supervised Register Tokens for Interpretable Remote Sensing Segmentation**。问题是遥感 GeoFM 缺少可解释的局部结构；假设是 register bottleneck 能在无部件标注下形成地物部件词表。方法是在光学遥感 tile 上做 DINO-style self-supervised adaptation，再用 register maps 做 building/road/water/vegetation grouping 和 Mask2Former downstream transfer。指标包括 mIoU、boundary F-score、ARI、register purity、跨域性能下降。

第二，做 **Geo-Register Dictionary for Open-Vocabulary Mapping**。问题是开放词汇遥感分割缺少稳定视觉原语；方法是从 RATS registers 中构建地物部件字典，再与 RemoteCLIP/GeoRSCLIP 文本 embedding 对齐。输出不是直接类别 mask，而是“视觉部件 -> 文本类别 -> GIS 规则”的组合式制图。适合接 LoveDA、OpenEarthMap、DOTA/DIOR 和自建文本类别集。

第三，做 **Change Registers for Fine-Grained Optical Change Detection**。问题是变化检测常把局部扩建、道路拓宽、地块翻耕等细粒度变化混成二值 change mask。方法是对 t1/t2 共享 RATS backbone，比较对应 register dictionary 的激活迁移和空间差异，输出部件级变化解释。数据可用 LEVIR-CD、WHU-CD、CDD、S2Looking 的非 SAR 光学部分。

第四，做 **Topology-Aware Register Queries for Road and Building Extraction**。问题是道路和建筑不只要求像素准确，还要求拓扑和 polygon 合法性。方法是让 register tokens 初始化 query decoder，同时加入 connectivity/polygon loss 或后处理约束。指标包括 road connectivity、building polygon IoU、自交率、断裂率和面积误差。

第五，做 **Register Stability Audit for GeoFM**。问题是 GeoFM 在跨城市、跨季节、跨 GSD 下的局部语义是否稳定很少被测。方法是固定模型，统计 register 激活在不同域上的一致性、漂移和背景偏置。这个方向可以作为 benchmark 论文，贡献不一定是新模型，而是给 GeoFM 一个可解释鲁棒性测试协议。

## 实验建议

建议先做一个小而硬的反证实验，不要直接开大规模预训练。

1. 选 LoveDA 和 OpenEarthMap，各取 2-3 个城市或区域，构造 urban-to-rural / region-to-region split。
2. 用 DINOv2/Prithvi/Clay/RemoteCLIP 特征作为 baseline，再实现一个最小 RATS bottleneck adaptation。
3. 只训练 50-100 epoch 自监督，不做任何遥感 mask 监督。
4. 用已有 segmentation label 事后评价 register maps，看 register 是否真的聚到地物区域，而不是只学颜色和阴影。
5. 再接同一个 Mask2Former decoder，比较 learned queries 与 register queries。

最小成功标准可以设得很明确：RATS register maps 在 building/road/water/vegetation 上的 M2O/O2O 或 ARI 要明显优于 DINO patch clustering；下游分割至少要在跨域 split 上提升边界或校准，而不只是训练域 mIoU 小涨。如果这两点做不到，说明自然图像部件先验迁移到遥感的价值有限，需要换成多光谱/地理位置/尺度感知 register。

可直接用于论文审稿或内部评估的 prompt：

```text
你是遥感基础模型与密集预测审计器。
给定一个 register-token 模型、若干遥感 tile、register attention/similarity maps、下游 segmentation 结果和跨域 split，请判断该模型是否真的学到了可复用地物部件，而不是只产生好看的可视化。

必须检查：
1. register 是否在不同城市、不同季节、不同 GSD 下稳定对应同类地物或部件。
2. register map 是否与人工 mask、GIS polygon 或高质量候选 mask 有可量化重合，而不是只看颜色、阴影或纹理。
3. 增加 register 数量是否导致过分割；必须同时报告 M2O、O2O、ARI 和 boundary 指标。
4. register query 是否给下游 decoder 带来独立增益；需要区分 backbone 增益和 query 初始化增益。
5. 小目标、细长目标和拓扑结构是否单独评估，不能只看平均 mIoU。
6. 若使用 SAM/GeoSAM 伪真值，必须说明伪标签偏差和人工抽样验证结果。
7. 若迁移到多光谱或时序数据，必须说明 band/time token 如何进入 register bottleneck。

输出：
- 结论：promising / inconclusive / weak
- 最稳定的 register 部件：最多 5 个
- 最大失败类型：最多 3 个
- 必须补的实验
- 是否值得继续做完整论文
```

## 今日判断

RATS 的短期价值在于给遥感 GeoFM 一个新的中间表示设计：不再只依赖全局 embedding 或密集 patch grid，而是显式学习一组可读、可排序、可命名、可接 decoder 的 register tokens。它与今天遥感 AI 的几个痛点都能对上：开放词汇分割需要视觉原语，变化解释需要局部部件，跨域制图需要稳定结构，大图推理需要降低 patch attention 成本。

但这条线也有明确风险：自然图像 part discovery 不一定能迁移到遥感地物；SAM proxy 评价不等于真实遥感标注；多光谱和时序还没处理。如果要投入，最务实的第一步不是写一个大系统，而是在 LoveDA/OpenEarthMap/SpaceNet 上证明 register map 比 DINO patch clustering 更稳定、更可解释，并且能给 Mask2Former 或 VLM grounding 带来独立收益。

## 参考来源

- RATS! Patches Talk Through Registers: Emergent Parts in Register Attention Transformers. <https://arxiv.org/abs/2606.14701>
- RATS HTML version. <https://arxiv.org/html/2606.14701>
- RATS official GitHub. <https://github.com/yangtiming/RATS>
- arXiv cs.CV recent. <https://arxiv.org/list/cs.CV/recent>
- LoveDA dataset. <https://github.com/Junjue-Wang/LoveDA>
- OpenEarthMap. <https://open-earth-map.org/>
- SpaceNet. <https://spacenet.ai/>
