# RS-14 SAM3 Presence Score Calibration for Remote Sensing OVSS


# RS-14 SAM3 Presence Score Calibration for Remote Sensing OVSS

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-14` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务原文：以 SegEarthOV3/SAM3 为核心，研究遥感开放词表分割中的 presence score 校准问题。关注不存在类别误检、类别同义词、landcover 与 object label 混用、尺度先验和地理先验，设计 prompt ensemble 与 calibration 实验。 1. 研究问题 细问题：SA

## 正文

# RS-14 SAM3 Presence Score Calibration for Remote Sensing OVSS

更新时间：2026-06-07  
任务原文：以 SegEarth-OV3/SAM3 为核心，研究遥感开放词表分割中的 presence score 校准问题。关注不存在类别误检、类别同义词、land-cover 与 object label 混用、尺度先验和地理先验，设计 prompt ensemble 与 calibration 实验。

## 1. 研究问题

细问题：SAM3 的 `presence score` 被设计成“概念是否存在”的全局判别信号。SegEarth-OV3 将它用于遥感开放词表语义分割，过滤大词表和 patch-level 推理中不存在类别造成的 false positives。RS-14 关注的不是“做一个遥感开放词表分割模型”，而是一个更窄的环节：

> 当遥感大图被切成多个 patch，并且输入词表包含大量同义词、层级词、对象词和土地覆盖词时，如何校准 SAM3/SegEarth-OV3 的 presence score，使它更可靠地区分“该类别真的在当前区域出现”与“语义相近、尺度不匹配或上下文诱导的误检”？

这个方向适合做成一个小论文，因为它抓住了 SAM3 相比 SAM/SAM2 的新能力：SAM/SAM2 主要是 class-agnostic mask generator，SAM3 引入 promptable concept segmentation，能直接接收文本/示例图像概念，并通过 presence head 把“识别是什么”和“定位在哪里”解耦。遥感 OVSS 的痛点恰好在于：类别词表大、概念层级混乱、patch 切片破坏场景上下文、自然图像概念和遥感概念不完全对齐。

## 2. 问题由来

### 2.1 SAM 到 SAM3 的变化

SAM/SAM2 在遥感中已经被广泛用作边界生成器，但它们本质上不知道“这个 mask 是建筑还是道路”。开放词表遥感分割通常要把 CLIP/RS-CLIP/DINO/VLM 的语义分数和 SAM mask 融合：语义模型负责类别，SAM 负责边界。这会带来两个典型问题：

- 语义分数高但 mask 不对：例如把停车场纹理误当作建筑。
- mask 边界好但类别不对：例如道路、跑道、河流、裸地这些长条或低纹理区域容易互相混。

SAM3 的新接口是 promptable concept segmentation。Hugging Face 文档将 SAM3 描述为能基于文本或图像示例概念返回实例/语义 mask，并指出 recognition/localization 通过 presence head 解耦；Ultralytics 文档也强调了 presence head 用于全局概念存在判断。对遥感来说，这意味着我们不必只依赖 CLIP similarity 后验去猜类别，而是可以利用 SAM3 自带的 presence score 作为“类别是否存在”的门控。

### 2.2 SegEarth-OV3 为什么需要 presence-guided filtering

SegEarth-OV3 的官方 GitHub README 明确给出三步 pipeline：

1. instance aggregation：合并稀疏对象预测；
2. dual-head mask fusion：融合 instance head 的细粒度细节和 semantic head 的全局覆盖；
3. presence-guided filtering：用 presence score 抑制 absent categories 的 false positives。

arXiv 摘要同样指出，SegEarth-OV3 使用 SAM3 presence head 的 presence score 过滤场景中不存在的类别，减少大词表和 geospatial patch-level processing 带来的误检。

这正是 RS-14 的切入点：SegEarth-OV3 已经证明 presence score 有用，但它更像一个工程过滤器。遥感场景下，这个分数很可能需要专门校准，而不是使用统一阈值。

### 2.3 遥感 OVSS 为什么比自然图像更需要校准

遥感开放词表分割有几类独特干扰：

- 大图 patch 化：一个 10k x 10k 影像被切成很多 patch，某类别可能在整图存在但在当前 patch 不存在；也可能 patch 太小，只看到局部纹理，导致 presence score 误判。
- 类别层级混合：`building`、`residential building`、`damaged building`；`road`、`highway`、`runway`；`water`、`river`、`lake` 不是同一层级，但常被放在同一个词表里。
- land-cover 与 object 混用：`impervious surface` 是覆盖类型，`building` 是对象；`vegetation` 是覆盖类型，`tree` 是对象；presence 的含义不一样。
- 尺度依赖强：同样是 `car`，在 5cm GSD 航空影像可见，在 10m Sentinel-2 中不可见；统一阈值会把尺度不可见当成类别不存在或误检。
- 地理先验显著：`rice paddy`、`snow`、`desert`、`harbor`、`runway` 的出现概率与地理区域、季节、近水/近城市上下文有关，但先验不能替代图像证据。

所以，presence calibration 的目标不是简单“提高阈值减少 false positive”，而是在不同词、尺度、场景、patch 层级下，让分数具有可解释的概率意义。

## 3. 代表论文与项目

| 论文/项目 | 年份/venue | 链接 | 官方代码/资源 | 与 RS-14 的关系 |
|---|---:|---|---|---|
| SAM 3: Segment Anything with Concepts | 2025/ICLR 2026 | [OpenReview PDF](https://openreview.net/pdf?id=r35clVtGzw), [HF docs](https://huggingface.co/docs/transformers/model_doc/sam3), [Ultralytics docs](https://docs.ultralytics.com/models/sam-3/) | [facebookresearch/sam3](https://github.com/facebookresearch/sam3) | presence head 来源；将 concept presence 和 mask localization 解耦。 |
| SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images | 2025 arXiv | [arXiv](https://arxiv.org/abs/2512.08730) | [GitHub](https://github.com/earth-insights/SegEarth-OV-3) | 直接将 SAM3 presence score 用于遥感 OVSS、变化检测和 3D segmentation 的 false positive filtering。 |
| SegEarth-OV: Towards Training-Free Open-Vocabulary Segmentation for Remote Sensing Images | 2025 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Li_SegEarth-OV_Towards_Training-Free_Open-Vocabulary_Segmentation_for_Remote_Sensing_Images_CVPR_2025_paper.pdf), [project](https://earth-insights.github.io/SegEarth-OV) | project/code | SegEarth-OV3 的前身；CLIP/SAM training-free OVSS 基线，适合比较“无 presence head”时的误检。 |
| ReSeg-CLIP | 2026 arXiv | [arXiv](https://arxiv.org/abs/2602.23869) | 未见明确官方代码 | 利用 SAM mask 做 hierarchical attention masking，并组合 RS-CLIP；适合作为 SAM-mask + CLIP semantic calibration 对照。 |
| ConInfer | 2026 CVPRF/arXiv | [arXiv](https://arxiv.org/abs/2603.29271), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2026F/papers/Chen_ConInfer_Context-Aware_Inference_for_Training-Free_Open-Vocabulary_Remote_Sensing_Segmentation_CVPRF_2026_paper.pdf) | [GitHub](https://github.com/Dog-Yang/ConInfer) | 训练自由的上下文推理；说明 patch 独立预测会导致类别不一致，presence calibration 可吸收上下文一致性。 |
| Towards Realistic Open-Vocabulary Remote Sensing Segmentation: Benchmark and Baseline | 2026 arXiv | [arXiv](https://arxiv.org/abs/2604.15652) | [GitHub branch](https://github.com/LiBingyu01/RSKT-Seg/tree/Pi-Seg) | 提出更现实的 OVRSISBenchV2/OVRSIS95K；适合作为 calibration benchmark。 |
| DINO Soars | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.03175) | [GitHub](https://github.com/rfaulk/DINO_Soars) | DINOv3 + text 的遥感 OVSS；可作为非 SAM3 的强开放词表分割 baseline。 |
| AerOSeg | 2025 arXiv/CVPRW EarthVision | [arXiv](https://arxiv.org/abs/2504.09203) | 未见明确官方代码 | 使用 SAM 引导开放词表遥感分割；可比较 SAM 特征引导与 SAM3 presence filtering。 |
| Remote SAMsing | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.00256) | 论文称 open-source pipeline | 证明遥感大图中 tile size 影响 mask coverage/quality，提示 presence score 也应随 tile/GSD/coverage 校准。 |
| From Pixels to Concepts: Do Segmentation Models Understand What They Segment? | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.09591) | 未见官方代码 | 直接质疑 SAM3 类概念分割是否真正理解查询概念，适合作为语义一致性评测参考。 |
| DisDop | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.24639) | 未见明确官方代码 | 开放词表航空目标检测中的 domain prior distillation，可迁移为 presence prior。 |

说明：SAM3/SegEarth-OV3 是核心；SegEarth-OV、ReSeg-CLIP、ConInfer、DINO Soars 是对照路线；Remote SAMsing 提供大图/tile 失败模式；Towards Realistic OVRSIS 提供更接近真实任务的评测背景。

## 4. Presence Score 在遥感中的失败模式

### 4.1 Absent-category false positives

大词表中包含很多当前图像不存在的类别。自然图像中 `dog`、`bus`、`person` 往往有清晰对象形态；遥感中 `airport`、`runway`、`road`、`parking lot`、`impervious surface` 可能共享纹理和几何结构。presence score 如果只看局部纹理，很容易把不存在类别判为存在。

典型例子：

- `runway` vs `road`：长条灰色区域在工业园、机场、城市道路中都存在。
- `building` vs `impervious surface`：屋顶、停车场、硬化地面纹理相近。
- `ship` vs `dock`/`container`：港口小目标密集，水陆边界复杂。

### 4.2 Synonym and prompt sensitivity

同一个类别用不同 prompt 可能得到不同 presence：

- `building`, `buildings`, `house`, `residential building`
- `road`, `highway`, `street`, `runway`
- `farmland`, `cropland`, `field`, `rice paddy`

如果直接对每个 prompt 独立阈值，会导致同义词互相冲突；如果简单取最大值，又容易放大 false positive。

### 4.3 Land-cover vs object label mismatch

land-cover 类别通常覆盖整片区域，object 类别通常是离散实例。SAM3 的 promptable concept segmentation 更自然地适配“可数对象”，但遥感语义分割常包含不可数覆盖类：

- object：car, ship, airplane, building
- stuff/land-cover：water, forest, cropland, impervious surface, bare soil
- hybrid：road, runway, river, parking lot

presence calibration 应该对不同类别类型使用不同解释：object 类看实例存在概率，land-cover 类看区域覆盖比例/置信度。

### 4.4 Scale and GSD mismatch

遥感类别可见性强依赖 GSD。`car` 在 0.1m 航空图像中是对象，在 10m Sentinel-2 中基本不可辨；`crop field` 在 10m 中可见，在很小的 UAV tile 里可能只呈现局部纹理。统一阈值会混淆：

- 因尺度不可见导致的低 presence；
- 因类别真的不存在导致的低 presence；
- 因纹理相似导致的高 presence。

### 4.5 Patch-level context loss

SegEarth-OV3 关注 patch-level geospatial processing，这很关键。遥感大图切片时，一个类别在整张影像存在，但当前 patch 只包含背景；或者当前 patch 中出现目标局部，缺少全局形态。presence score 在 patch、super-patch、整图三个层级的含义不同。

### 4.6 Geographic prior overuse

地理先验有帮助，但也危险。靠近海岸并不意味着一定有 `ship`；城市中心并不意味着当前 patch 有 `building`；稻作区并不意味着每个季节都有 `rice paddy`。校准时要把先验当作弱证据，不能让它替代图像证据。

## 5. 方法比较：从过滤到校准

### 5.1 Baseline A：单阈值过滤

做法：对所有类别使用统一 threshold，例如 `presence_score > t` 才保留类别/mask。

优点：简单，能立刻减少 absent-category false positives。

缺点：忽略类别频率、同义词、尺度、patch 大小和 land-cover/object 差异。对长尾类别通常会过度过滤，对高频类别可能仍误检。

### 5.2 Baseline B：类别特定阈值

做法：在验证集上为每个类别学习一个 threshold。

优点：比统一阈值更合理，能适应 `building` 和 `car` 的分数分布差异。

缺点：开放词表场景下无法为所有未见类别标定；同义词 prompt 的阈值需要共享或平滑。

### 5.3 Baseline C：prompt ensemble

做法：为每个类别构造 prompt set，例如：

- building: `building`, `buildings`, `rooftop`, `residential building`
- water: `water`, `river`, `lake`, `pond`
- road: `road`, `street`, `highway`

然后对 presence score 做 max/mean/logit average/trimmed mean。

优点：降低单一 prompt wording 的不稳定性。

缺点：同义词不总等价，尤其是层级词；max 会放大错误，mean 会稀释真正细粒度类别。

### 5.4 Proposed：RS-PresCal

名称草案：RS-PresCal: Scale- and Taxonomy-Aware Presence Calibration for SAM3 Remote Sensing Open-Vocabulary Segmentation

核心思想：把 SAM3 presence score 从一个原始模型分数校准为条件概率：

`P(class present | prompt set, SAM3 score, mask evidence, GSD, patch context, taxonomy, optional geo prior)`

它不是重训 SAM3 主体，而是在 SegEarth-OV3 推理结果之后加一个轻量 calibration layer。

输入特征：

1. SAM3 presence features
   - raw presence score
   - prompt ensemble mean/max/variance
   - positive/negative prompt margin

2. mask evidence features
   - mask area ratio
   - instance count
   - mean mask confidence/logit
   - boundary compactness / elongation / connected components
   - semantic head 与 instance head 一致性

3. scale features
   - GSD
   - patch size in meters
   - expected object size range for class
   - tile pyramid level

4. taxonomy features
   - object/stuff/hybrid class type
   - parent/child/sibling relation
   - synonym group id
   - mutual exclusion group, e.g. `runway` vs `road` 不强互斥，`water` vs `building` 更强互斥

5. context/geographic features
   - super-patch/neighbor-patch presence consistency
   - scene type prior from CLIP/DINO/GeoFM embedding
   - optional OSM/land-cover prior, used only as weak feature

输出：

- calibrated presence probability；
- calibrated absent probability；
- uncertainty / abstention flag；
- optional per-class threshold recommendation。

模型选择：

- 最小可复现：temperature scaling + isotonic regression；
- 中等复杂度：logistic regression / gradient boosting；
- 可投稿增强：taxonomy-aware graph calibration，把同义词、父子类和互斥类作为图约束。

## 6. Prompt Ensemble 设计

### 6.1 Prompt 类型

| 类型 | 例子 | 作用 | 风险 |
|---|---|---|---|
| canonical | `building` | 数据集主标签 | 对遥感语义可能太粗 |
| plural/object | `buildings`, `cars` | 与实例存在更匹配 | 对 stuff 类无意义 |
| subtype | `residential building`, `industrial building` | 检测细粒度语义 | 容易和父类冲突 |
| visual synonym | `rooftop`, `paved road` | 遥感视角下更接近外观 | 可能改变类别定义 |
| negative prompt | `not a road`, `no buildings` 或 hard-negative prompt set | 用于 margin，而非直接输出 | SAM3 接口对负文本支持需实测 |
| geo-context prompt | `airport runway`, `urban road` | 引入上下文 | 容易用语言先验代替图像证据 |

建议不要只用自然语言模板 `a satellite image of {class}`。遥感 OVSS 中，prompt 的语义应按 taxonomy 管理，否则同义词会变成隐藏变量。

### 6.2 Ensemble 聚合策略

需要比较四种：

1. max：只要一个 prompt 高就认为存在。召回高，误检高。
2. mean：同义词一致才高。稳定，但细粒度类易被稀释。
3. trimmed mean：去掉最高/最低极端分数，适合减少 prompt outlier。
4. margin：`positive_prompt_score - hard_negative_or_sibling_score`，例如 `runway` 与 `road` 的 margin。

推荐主方法使用 `trimmed mean + sibling margin + variance uncertainty`。如果 prompt variance 很大，则进入 abstain 或人工审核。

## 7. 实验矩阵

### 7.1 数据集

SegEarth-OV3 仓库列出的可评测数据覆盖较广，建议分层选择：

| 任务类型 | 数据集 | 目的 |
|---|---|---|
| Semantic segmentation | OpenEarthMap, LoveDA, iSAID, Potsdam, Vaihingen, UAVid, UDD5, VDD | 评估多类别 OVSS 与 object/stuff 混合标签 |
| Building extraction | WHU Aerial, WHU Satellite II, Inria, xBD-pre | 评估高频 object/stuff 混淆与边界 |
| Road extraction | DeepGlobe, Massachusetts, SpaceNet, CHN6-CUG | 评估 road/runway/impervious surface 等细长类别 |
| Water extraction | WBS-SI | 评估 stuff/水体类 coverage |
| Change detection | LEVIR-CD, WHU-CD, S2Looking | 检查 presence 是否可用于变化类别过滤 |
| Realistic OVRSIS | OVRSISBenchV2 / OVRSIS95K | 评估开放词表、大词表与跨数据集泛化 |

### 7.2 Baseline

| 编号 | 方法 | 校准方式 | 目的 |
|---|---|---|---|
| B0 | SegEarth-OV3 default | 仓库默认 presence filtering | 复现主基线 |
| B1 | no presence filtering | 不使用 presence score | 测 presence score 原始价值 |
| B2 | global threshold | 单一阈值 | 简单过滤基线 |
| B3 | per-class threshold | 类别阈值 | 闭集上限基线 |
| B4 | prompt max/mean ensemble | 文本集成 | 测 prompt wording 敏感性 |
| B5 | CLIP/SAM route | SegEarth-OV/ReSeg-CLIP | 无 SAM3 presence head 的对照 |
| B6 | context route | ConInfer | 测上下文一致性能否替代 calibration |
| Ours | RS-PresCal | scale/taxonomy/context calibration | 主方法 |

### 7.3 消融实验

| 实验 | 变量 | 问题 |
|---|---|---|
| E1 | global vs per-class vs calibrated threshold | 校准是否优于简单阈值 |
| E2 | canonical prompt vs prompt ensemble | prompt wording 是否影响 presence |
| E3 | max/mean/trimmed/margin | 哪种 ensemble 最稳 |
| E4 | object/stuff/hybrid 分组 | 类别类型是否需要不同校准 |
| E5 | 加/不加 GSD 和 patch size | 尺度先验是否有用 |
| E6 | patch-only vs neighbor/super-patch context | 上下文是否减少 patch 误检 |
| E7 | 加/不加 taxonomy graph | 同义词/层级冲突是否缓解 |
| E8 | 加/不加 geo prior | 地理先验是否真的提升，是否造成偏置 |
| E9 | seen categories vs unseen synonyms | 开放词表泛化能力 |
| E10 | high-frequency vs rare classes | 长尾类是否被过度过滤 |

## 8. 指标设计

传统 mIoU 不足以评价 presence calibration，需要同时看“类别是否存在”和“mask 是否正确”。

### 8.1 Presence-level 指标

- AUROC / AUPRC：类别存在/不存在二分类。
- Brier score：概率校准质量。
- ECE / adaptive ECE：presence score 是否可解释为概率。
- FPR@95TPR：高召回情况下误检率。
- absent-category false positive rate：输入词表中不存在类别被保留的比例。
- prompt variance：同义词 prompt 间分数方差。

### 8.2 Segmentation-level 指标

- mIoU / hIoU / seen-unseen IoU。
- false-positive area ratio：不存在类别 mask 面积占比。
- class confusion matrix：尤其看 sibling classes。
- object/stuff 分组 IoU。
- boundary F1：避免校准只删 mask、不改善质量。

### 8.3 Remote-sensing-specific 指标

- scale-binned calibration：按 GSD 或目标像素面积分桶看 ECE。
- patch consistency：邻近 patch 对同一类别的 calibrated presence 是否连续。
- taxonomy consistency：子类 presence 不应无根据地高于父类；互斥类不能同时高置信。
- abstention utility：模型选择“不确定/需人工审核”时能减少多少误检面积。

## 9. 可投稿方法方案

题目草案：

> RS-PresCal: Scale- and Taxonomy-Aware Presence Calibration for SAM3 Open-Vocabulary Remote Sensing Segmentation

### 9.1 核心假设

SAM3 presence score 在自然图像概念分割中能减少 hard-negative false positives，但在遥感 OVSS 中，原始分数受 prompt wording、尺度、patch 上下文和类别层级影响。若显式加入遥感尺度、taxonomy 和邻域上下文进行校准，可以在不重训 SAM3 的情况下显著降低 absent-category false positives，同时保持开放词表召回。

### 9.2 方法模块

1. Taxonomy-aware prompt builder
   - 为每个类别构造 canonical/synonym/subtype/sibling prompt set。
   - 标注类别类型：object、stuff、hybrid。
   - 构建 parent-child/sibling/mutual-exclusion graph。

2. Multi-prompt SAM3 inference
   - 对每个 prompt 获取 presence score、instance masks、semantic masks。
   - 保留 SegEarth-OV3 的 instance aggregation 和 dual-head mask fusion。

3. Scale-context feature extractor
   - 从影像元数据获取 GSD；没有 GSD 时用数据集默认值。
   - 计算 patch physical size、mask area ratio、instance count、shape compactness。
   - 统计 neighbor/super-patch presence consistency。

4. Calibration layer
   - 轻量版本：temperature scaling + logistic regression。
   - 完整版本：taxonomy graph calibration，约束同义词一致、父子类单调、兄弟类 margin。

5. Decision module
   - calibrated score 高：保留 mask。
   - calibrated score 中等且 uncertainty 高：abstain 或进入人工审核。
   - sibling conflict：保留 margin 更高的类别，或合并到父类。

### 9.3 最小实现路线

1. 复现 SegEarth-OV3 在 LoveDA、iSAID、Potsdam、DeepGlobe 或 OpenEarthMap 上的 default inference。
2. 构造每个数据集标签的 prompt set 和 sibling set。
3. 生成类别存在 GT：一个类别在 patch 中是否有非零 mask。
4. 收集 raw presence score、prompt ensemble score、mask evidence、GSD/patch size。
5. 用 validation split 训练 calibration layer，测试集报告 presence 和 segmentation 指标。
6. 与 no-filter/global-threshold/per-class-threshold/prompt-ensemble 做消融。

### 9.4 预期贡献

- 第一个专门面向 SAM3 remote sensing OVSS 的 presence calibration protocol。
- 一个 object/stuff/hybrid + taxonomy-aware prompt ensemble 设计。
- 一个尺度/GSD 与 patch context 感知的轻量校准器。
- 一个错误分析工具，解释 absent-category FP、同义词冲突、层级冲突和尺度误判。

## 10. 风险与规避

| 风险 | 影响 | 规避 |
|---|---|---|
| SegEarth-OV3/SAM3 本身版本更新快 | 复现不稳定 | 固定 checkpoint、commit、配置和数据 split |
| 校准需要验证集标签 | 开放词表泛化受限 | 使用少量 validation + taxonomy sharing；报告 unseen prompt 泛化 |
| 地理先验造成偏见 | 模型可能靠位置猜类别 | geo prior 作为可选特征，并做 image-only vs image+geo 对照 |
| 只降低 FP、伤害 recall | mIoU 可能下降 | 用 AUPRC、FPR@95TPR、seen/unseen recall 共同评价 |
| prompt ensemble 人工设计过强 | 泛化差 | 使用可复现 prompt template，并报告 prompt sensitivity |
| object/stuff 类别定义不清 | 指标混乱 | 先做类别 taxonomy card，再报告分组指标 |

## 11. 未来研究方向

1. Active calibration：优先让人审核高不确定、高面积、高业务风险类别，快速提升校准器。
2. GeoFM prior calibration：用 AlphaEarth/Prithvi/Clay embedding 提供 scene prior，但保持图像证据约束。
3. Change-aware presence：双时相 OVSS 中校准“类别是否新增/消失”，而不是单时相存在。
4. SAM3 + RS-CLIP disagreement mining：当 SAM3 presence 与 RS-CLIP text similarity 冲突时，自动生成 hard negatives。
5. Taxonomy-aware evaluation toolkit：为遥感 OVSS 提供 hierarchy-aware IoU、semantic distance、presence ECE。
6. Scale transfer：在 UAV/VHR/Sentinel-2 多尺度数据上学习类别可见性曲线。
7. Human-in-the-loop prompt refinement：把 prompt variance 高的类别交给人类选择更合适的遥感术语。

## 12. 推荐阅读顺序

1. [SAM 3: Segment Anything with Concepts](https://openreview.net/pdf?id=r35clVtGzw)
2. [SAM3 Hugging Face documentation](https://huggingface.co/docs/transformers/model_doc/sam3)
3. [SegEarth-OV3 GitHub](https://github.com/earth-insights/SegEarth-OV-3)
4. [SegEarth-OV3 arXiv](https://arxiv.org/abs/2512.08730)
5. [SegEarth-OV CVPR 2025 PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Li_SegEarth-OV_Towards_Training-Free_Open-Vocabulary_Segmentation_for_Remote_Sensing_Images_CVPR_2025_paper.pdf)
6. [ReSeg-CLIP](https://arxiv.org/abs/2602.23869)
7. [ConInfer](https://arxiv.org/abs/2603.29271) and [GitHub](https://github.com/Dog-Yang/ConInfer)
8. [Towards Realistic OVRSIS](https://arxiv.org/abs/2604.15652)
9. [DINO Soars](https://arxiv.org/abs/2605.03175) and [GitHub](https://github.com/rfaulk/DINO_Soars)
10. [Remote SAMsing](https://arxiv.org/abs/2605.00256)
11. [From Pixels to Concepts](https://arxiv.org/abs/2605.09591)

## 13. 最小复现实验清单

- 固定模型：SAM3 official checkpoint + SegEarth-OV3 repo commit。
- 数据：LoveDA、iSAID、Potsdam/Vaihingen、DeepGlobe Road；可选 OVRSISBenchV2。
- 词表：每个数据集标签构造 3-5 个 synonym/subtype prompt，并标注 object/stuff/hybrid。
- 推理：记录每个 patch、每个 prompt 的 presence score、mask area、instance count、semantic/instance head 一致性。
- 校准：global threshold、per-class threshold、prompt ensemble、RS-PresCal。
- 指标：presence AUROC/AUPRC/Brier/ECE、absent FPR、mIoU、false-positive area、taxonomy consistency、scale-binned ECE。
- 可视化：展示原始 SegEarth-OV3、统一阈值、RS-PresCal 在 absent class、sibling class、scale mismatch 三类失败上的对比。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

