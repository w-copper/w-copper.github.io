# RS-11 Reference-Guided SAM for Few-Shot Remote Sensing Segmentation


# RS-11 Reference-Guided SAM for Few-Shot Remote Sensing Segmentation

## 1. 问题由来

遥感 few-shot segmentation 的难点不是单纯“样本少”，而是样本少叠加了遥感特有的数据形态：俯视视角、小目标密集、尺度变化大、同类跨区域外观差异大、背景纹理容易和目标混淆。传统 few-shot segmentation 通常用 support image/mask 学一个 prototype，再去 query image 上匹配；它能带来类别语义，但边界往往粗。SAM 则相反：边界和候选 mask 很强，但它是 category-agnostic，需要点、框、mask 等 prompt 才知道要分哪个对象。

因此 2024-2026 的一个自然小方向是：让少量参考图像自动给 SAM 生成提示，或者生成类别 prototype，再把 SAM 的边界能力和 few-shot 的语义能力合起来。RS-11 的核心问题可以表述为：

> 给定 1-5 张带 mask 的遥感参考图像，如何自动在目标遥感图像中找到同类地物，并生成足够稳定的 SAM prompt / prototype，使模型既不需要人工点框，又能保持遥感小目标和复杂边界质量？

## 2. 方法脉络

### 2.1 粗 prompt / prototype 驱动 SAM

SAM-RSP 将 few-shot prototype 与 SAM 结合：用 SAM encoder 感知 query 的区域边界，再用传统 few-shot backbone 产生 rough segmentation prompt，最后用 prompt transformer decoder 融合 query embedding、prompt 和 prototype。它不是遥感专用，但思路直接可迁移：prototype 提供“是什么”，SAM 提供“边界在哪里”。论文页明确给出代码链接 `https://github.com/Jiaguang-NEU/SAM-RSP`。

Self-guided Few-shot Semantic Segmentation for Remote Sensing Imagery Based on Large Vision Models 是更早的遥感方向雏形：作者指出 SAM 依赖人工 prompt 且 category-agnostic，因此用 prior guided masks 自动产生粗 pixel-wise prompts，再交给 SAM 做遥感 few-shot segmentation。

### 2.2 SAM mask candidate + 支持集语义解析

SEMPNet 是遥感专用路线。它先利用 SAM 生成候选 mask，再通过支持集信息对 mask 做类别解析/分类。优势是工程上清楚：SAM 自动给出对象级候选，few-shot 模块只需要判断候选是否属于目标类。它的 GitHub 仓库 `TinyAway/SEMPNet` 包含 iSAID 数据准备、SAM mask generation 和训练脚本。

这一路线的关键风险是：SAM 候选 mask 的召回率决定上限。如果小目标、细长道路、贴近建筑或阴影区域没有被 SAM 候选覆盖，后面的语义分类再好也救不回来。

### 2.3 视觉参考 prompt：PerSAM / VRP-SAM / ProSAM

PerSAM 是 reference-guided SAM 的经典简单基线：给一张参考图和 mask，在不训练的情况下分割目标视觉概念；PerSAM-F 只训练两个 mask weight，属于极低参数 one-shot adaptation。它不是遥感论文，但适合作为 RS few-shot 的 training-free baseline。

VRP-SAM 是 CVPR 2024 方法，官方 GitHub 是 `syp2ysy/VRP-SAM`。它训练外部 Visual Reference Prompt Encoder，从参考图像/mask 中提取视觉参考信息，为 SAM 自动生成 prompt；仓库说明支持 point、scribble、box、mask 等 condition。它主要在 PASCAL-5i 和 COCO-20i 上评测，但对遥感很有迁移价值：遥感支持集也可以看作 visual reference，只是需要解决域差异和小目标密集问题。

ProSAM 是 ICCV 2025 方法，关注 visual reference prompt 的鲁棒性。它指出很多 SAM-based visual reference 方法会把 prompt 生成在目标边界或不稳定区域，导致结果不稳；因此学习 probabilistic prompts，避免落在不鲁棒位置。对遥感尤其重要，因为建筑边界、道路边缘、船/飞机等小目标附近背景干扰很强。

### 2.4 视觉 + 语言参考 prompt：VLP-SAM

VLP-SAM 在视觉参考之外加入文本标签语义，官方 GitHub 是 `kosukesakurai1/VLP-SAM`。它的迁移意义是：遥感类别词如 `building`、`airplane`、`ship`、`cropland`、`water` 可以提供类别语义，但自然语言标签也会带来粒度不匹配，例如 `field`、`farmland`、`crop`、`rice` 在遥感数据集里不是同一层级。若与 RemoteCLIP/GeoRSCLIP 结合，可以把文本语义替换成遥感图文预训练空间中的类别原型。

### 2.5 遥感专用 reference-guided SAM：ViRefSAM

ViRefSAM 是 RS-11 最核心的近年论文。arXiv 摘要显示它面向 remote sensing segmentation，使用少量带类别对象的 annotated reference images 自动分割目标图像中的同类对象。它引入两个关键部件：

- Visual Contextual Prompt Encoder：从参考图像提取 class-specific semantic clues，并通过与目标图像交互产生 object-aware prompts。
- Dynamic Target Alignment Adapter：插入 SAM image encoder，以类别相关语义缓解自然图像 SAM 与遥感图像之间的 domain gap。

它在 iSAID-5i、LoveDA-2i 和 COCO-20i 上评测，正好覆盖本条目的两个目标遥感 benchmark。

## 3. 代表论文/项目表

| 方法 | 年份/venue | 是否遥感专用 | 是否训练 | 输入参考 | 与 SAM/CLIP 对齐方式 | 链接 |
|---|---:|---|---|---|---|---|
| Self-guided FSS for RSI based on LVMs | 2023 arXiv，作为背景 | 是 | 需要训练/适配 | support mask / prior mask | prior guided mask 产生 coarse pixel-wise prompt | [arXiv](https://arxiv.org/abs/2311.13200) |
| SAM-RSP | 2024 Image and Vision Computing / SSRN | 否，可迁移 | 训练 decoder | support image/mask | prototype + rough segmentation prompt + SAM query embedding | [SSRN](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4756692), [GitHub](https://github.com/Jiaguang-NEU/SAM-RSP) |
| SEMPNet | 2024/2025 IJGIS | 是 | 训练 mask parsing network | support image/mask | SAM 生成候选 mask，few-shot 模块做语义解析 | [paper](https://www.tandfonline.com/doi/abs/10.1080/15481603.2024.2426589), [GitHub](https://github.com/TinyAway/SEMPNet) |
| PerSAM / PerSAM-F | 2023，作为强基线 | 否，可迁移 | PerSAM 不训练；PerSAM-F 训练极少参数 | 1 张 reference image + mask | reference-target 相似度生成 prompt / mask 权重 | [GitHub](https://github.com/ZrrSkywalker/Personalize-SAM) |
| VRP-SAM | 2024 CVPR | 否，可迁移 | 训练 visual reference prompt encoder | point/scribble/box/mask reference | external VRP encoder 自动生成 SAM prompts | [CVF](https://openaccess.thecvf.com/content/CVPR2024/papers/Sun_VRP-SAM_SAM_with_Visual_Reference_Prompt_CVPR_2024_paper.pdf), [GitHub](https://github.com/syp2ysy/VRP-SAM) |
| VLP-SAM | 2025 arXiv | 否，可迁移 | 训练 | visual reference + text label | visual prompt + language prompt，可接 CLIP/RS-CLIP | [arXiv](https://arxiv.org/abs/2502.00719), [GitHub](https://github.com/kosukesakurai1/VLP-SAM) |
| ProSAM | 2025 ICCV | 否，可迁移 | 训练 prompt distribution | visual reference | probabilistic prompts，避免不稳定边界点 | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Wang_ProSAM_Enhancing_the_Robustness_of_SAM-based_Visual_Reference_Segmentation_with_ICCV_2025_paper.html) |
| ViRefSAM | 2025 arXiv / 2026 TGRS 线索 | 是 | 训练 VCP encoder + adapter | 1-5 张 RS reference image/mask | Visual Contextual Prompt Encoder + Dynamic Target Alignment Adapter | [arXiv](https://arxiv.org/abs/2507.02294) |
| SAM-Aug | 2026 arXiv | 是，时序地块 | 插件式/少训练 | few-shot parcel labels | SAM priors 作为 parcel segmentation regularizer | [arXiv](https://arxiv.org/abs/2601.09110) |

## 4. 关键比较

### 是否需要训练

- Training-free：PerSAM 是最轻量 baseline，但对遥感类别变化、背景干扰和多实例召回不一定稳。
- 轻量训练：PerSAM-F、SAM-RSP decoder、VLP-SAM prompt 模块适合做低成本适配。
- 遥感域训练：SEMPNet、ViRefSAM 更贴近 iSAID/LoveDA，但需要注意 benchmark split、公平 baseline 和数据泄漏。

### 如何选参考样本

参考样本不是随机越多越好。遥感中同类目标跨尺度、区域和背景差异大，建议比较四种选择策略：

1. random support：标准 few-shot baseline。
2. diversity support：用 DINO/RemoteCLIP embedding 选择外观多样的 support。
3. geography-aware support：避免 support 和 query 来自同一场景瓦片，测试真正跨区域能力。
4. prototype-quality support：根据 mask 面积、边界清晰度、遮挡/阴影比例筛选 reference。

### 如何与 RS-CLIP/SAM 特征对齐

一个合理结构是三路对齐：

- SAM image encoder：提供边界和局部结构特征。
- RS-CLIP/RemoteCLIP/GeoRSCLIP：提供遥感类别语义与文本标签对齐。
- Reference prototype：从 1-5 张 support mask pooling 得到类别视觉原型。

可研究的小模块：用 cross-attention 让 reference prototype 查询 target feature；再把响应图转成 SAM point/box/mask prompt；最后用 RS-CLIP 文本原型过滤错误候选。这样可以把 ViRefSAM 的视觉参考、VLP-SAM 的语言参考、SEMPNet 的 mask parsing 合到一个统一 pipeline。

## 5. 现有问题

1. Prompt 稳定性不足：reference 生成的点容易落在边界、阴影或相邻实例之间，ProSAM 指出的 instability 在遥感小目标中会更明显。
2. 候选 mask 召回决定上限：SEMPNet 类方法若 SAM 自动 mask 漏掉细长道路、小船、小车，后续语义解析无法恢复。
3. 参考样本选择被低估：few-shot 论文常随机 support，但遥感中 support 的地理区域、尺度、背景和成像条件会显著影响结果。
4. SAM 与遥感域差异：SAM 在自然图像上预训练，面对俯视目标、重复纹理、低对比边界和地物混合像元时需要 adapter 或 domain-specific prompt。
5. 类别语义粒度冲突：LoveDA/iSAID 的类别与自然语言标签、RemoteCLIP 文本空间不一定一致。
6. Patch 化造成不一致：大幅面遥感图像切片后，同一类对象在不同 tile 上可能 prototype 漂移，拼接后边界断裂。

## 6. 推荐实验方案：iSAID-5i / LoveDA-2i

### 6.1 数据与 split

- iSAID-5i：基于 iSAID 航空影像，适合目标类、小目标和密集实例；建议遵循 ViRefSAM 使用的 few-shot fold。
- LoveDA-2i：城乡遥感语义分割，适合测试跨域、背景复杂和 land-cover 类别。
- 每个 fold 做 1-shot、3-shot、5-shot；每个 shot 至少 5 个随机种子。
- 增加 geography-aware split：support/query 不允许来自同一原始大图或邻近瓦片，降低空间泄漏。

### 6.2 Baseline

必须比较三类 baseline：

- 传统 FSS：PFENet、HSNet、CyCTR 或近年 RS-FSS 方法。
- SAM-reference：PerSAM、VRP-SAM、SAM-RSP、VLP-SAM。
- 遥感 SAM-reference：SEMPNet、ViRefSAM。

### 6.3 指标

- mIoU / class mIoU：主指标。
- novel mIoU / base mIoU / harmonic IoU：若做 generalized few-shot。
- Boundary F-score：评估 SAM 是否真的改善边界。
- Small-object IoU：按目标面积分桶，专门看小目标。
- Prompt cost：需要人工点/框/mask 数量；reference-guided 方法应统计人工成本。
- Runtime / GPU memory：SAM-H、SAM-B、SAM2、adapter 方法差异很大。
- Support sensitivity：不同 support 选择策略下的均值、方差和最坏性能。

### 6.4 最小复现矩阵

| 实验 | 模型 | 变量 | 目的 |
|---|---|---|---|
| E1 | PerSAM, VRP-SAM, ViRefSAM | 1/3/5-shot | 看 reference 数量是否稳定提升 |
| E2 | ViRefSAM w/o adapter | adapter 开/关 | 验证遥感域对齐是否必要 |
| E3 | SEMPNet w/o SAM masks | SAM 候选开/关 | 验证候选 mask 对上限的影响 |
| E4 | VLP-SAM + RemoteCLIP | text label / RS text prototype | 测语言语义是否减少类混淆 |
| E5 | ProSAM-style probabilistic prompt | deterministic / probabilistic prompt | 测边界附近 prompt 稳定性 |
| E6 | random/diverse/geography-aware support | support 选择策略 | 测参考样本选择对遥感泛化的影响 |

## 7. 一个可投稿的小课题

题目草案：GeoRef-SAM: Geography-Aware Visual Reference Prompting for Few-Shot Remote Sensing Segmentation

核心假设：在遥感 few-shot segmentation 中，reference prompt 的失败主要来自两个来源：support 样本不代表 query 的地理/尺度变化，以及 prompt 点落在不稳定边界或背景区域。若同时做 geography-aware support selection 和 probabilistic prompt generation，可以比单纯增加 shot 数更稳定地提升 novel-class segmentation。

方法草图：

1. 用 RemoteCLIP/DINO/SAM encoder 从候选 support 中选多样且边界清晰的 reference。
2. 在 support mask 内提取 class prototype，同时提取 boundary-negative prototype。
3. 用 prototype-target cross-attention 生成响应图。
4. 将响应图转为 probabilistic point/box/mask prompt：中心区域给正点，混淆边界给低权重，背景相似区域给负点。
5. 调用 SAM/SAM2 decoder 生成候选 mask，再用 RS-CLIP 文本原型和 support prototype 二次筛选。
6. 训练时只更新 reference prompt encoder、轻量 adapter 或 LoRA，冻结 SAM 主体。

预期贡献：

- 一个 geography-aware reference selection protocol。
- 一个 uncertainty/probability-aware prompt generator，专门避免遥感边界不稳定点。
- 一套 iSAID-5i/LoveDA-2i 的 support sensitivity 评测，而不是只报随机均值。

## 8. 后续阅读队列

1. [ViRefSAM](https://arxiv.org/abs/2507.02294)
2. [SEMPNet](https://www.tandfonline.com/doi/abs/10.1080/15481603.2024.2426589) and [GitHub](https://github.com/TinyAway/SEMPNet)
3. [VRP-SAM](https://openaccess.thecvf.com/content/CVPR2024/papers/Sun_VRP-SAM_SAM_with_Visual_Reference_Prompt_CVPR_2024_paper.pdf) and [GitHub](https://github.com/syp2ysy/VRP-SAM)
4. [PerSAM](https://github.com/ZrrSkywalker/Personalize-SAM)
5. [SAM-RSP](https://papers.ssrn.com/sol3/papers.cfm?abstract_id=4756692) and [GitHub](https://github.com/Jiaguang-NEU/SAM-RSP)
6. [VLP-SAM](https://arxiv.org/abs/2502.00719) and [GitHub](https://github.com/kosukesakurai1/VLP-SAM)
7. [ProSAM, ICCV 2025](https://openaccess.thecvf.com/content/ICCV2025/html/Wang_ProSAM_Enhancing_the_Robustness_of_SAM-based_Visual_Reference_Segmentation_with_ICCV_2025_paper.html)
8. [Learnable Prompt for Few-Shot Semantic Segmentation in Remote Sensing Domain, CVPRW 2024](https://openaccess.thecvf.com/content/CVPR2024W/L3D-IVU/papers/Immanuel_Learnable_Prompt_for_Few-Shot_Semantic_Segmentation_in_Remote_Sensing_Domain_CVPRW_2024_paper.pdf)

