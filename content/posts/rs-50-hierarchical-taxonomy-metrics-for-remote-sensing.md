---
title: "RS-50 Hierarchical Taxonomy Metrics for Remote Sensing"
date: 2026-06-07T09:49:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["数据集", "弱监督", "benchmark"]
categories: ["多源数据融合、效率部署与应用落地"]
draft: false
---

# RS-50 Hierarchical Taxonomy Metrics for Remote Sensing

## 结论摘要

遥感分割和检测的类别体系天然不是平面的：`impervious surface / road / runway / building`、`crop / rice / field`、`water / river / lake / flood water`、`tree / forest / shrubland` 常常同时包含 land-cover、land-use、object、material、function 和 fine-grained species。标准 `mIoU`、`h-mIoU`、`mAP` 会把“预测到同一父类但粒度不对”和“完全不相关类别”同等惩罚；开放词表模型又会因为同义词、上下位词、地区命名差异产生额外歧义。

最有潜力的小课题不是再提出一个 OVSS 模型，而是提出一个 **taxonomy-aware evaluation protocol**：同时报告叶子类别精度、父类一致性、语义距离、层级混淆矩阵和开放词表别名鲁棒性。这个指标体系可以服务于 SegEarth-OV / RSKT-Seg / Pi-Seg / AerOSeg / HieraRS / GeoFM-VLM 等模型，也能用于审计 OpenEarthMap、Dynamic World、ESA WorldCover、NLCD、CORINE 等不同类别体系之间的映射误差。

## 问题由来

传统遥感数据集通常固定一个闭集标签表。OpenEarthMap 用 8 类高分辨率 land-cover 标签覆盖 44 个国家和 97 个区域，适合全球高分辨率制图，但类别较粗。[OpenEarthMap project](https://open-earth-map.org/overview.html)

全球产品的标签体系差异更明显。ESA WorldCover 2021 提供 10 m 全球 land-cover 产品，图例包含 11 个通用类别，如 Tree cover、Cropland、Built-up、Permanent water bodies 等。[ESA WorldCover](https://worldcover2021.esa.int/)

Dynamic World 是近实时 10 m LULC 数据集，提供 9 类像素级概率和 label；它强调概率输出可被用户重新阈值化或扩展到新标签，这正好暴露了“固定 argmax label 不够表达语义不确定性”的问题。[Google Earth Engine Dynamic World](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1)

NLCD 使用 modified Anderson Level II 的 16 个 land-cover 类别，并明确来源于具备逻辑层级关系的 Anderson 分类系统。[USGS Annual NLCD](https://www.usgs.gov/centers/eros/science/annual-nlcd-land-cover-classification)

CORINE Land Cover 的标准 nomenclature 有 44 个类，组织成三级层级：5 个 Level-1、15 个 Level-2、44 个 Level-3。[CORINE legend](https://clc.gios.gov.pl/index.php/gios-clc-2006/gios-clc-2006-legend)

进入 2024-2026 后，开放词表遥感分割和层级 LCLU 让这个问题变得更尖锐。OVRSISBenchV2 把 10 个下游数据集合进一个 128 类评测，说明遥感开放词表评测正在走向更真实但也更混杂的类别空间。[OVRSISBenchV2 / Pi-Seg](https://arxiv.org/abs/2604.15652), [GitHub](https://github.com/LiBingyu01/RSKT-Seg_and_Pi-Seg)

HieraRS 明确提出 hierarchical LCLU classification：像素应被赋予多个语义粒度的标签，并支持从 LCLU 树迁移到作物等异构层级任务。[HieraRS](https://arxiv.org/abs/2507.08741), [GitHub](https://github.com/AI-Tianlong/HieraRS)

KG-OVRSeg 则指出遥感 OVSS 中存在命名约定不一致、层级依赖和 embedding 空间语义邻近不足的问题，并用知识图谱的 hypernym/hyponym/synonym 关系增强类别表示。[KG-OVRSeg, ISPRS JPRS 2025/2026](https://www.sciencedirect.com/science/article/abs/pii/S0924271625004666)

CV 侧也有可迁移线索。CVPR 2024 的 `Flattening the Parent Bias` 说明层级语义分割中的父类精度和校准可能受 embedding 空间偏置影响，并提供 hyperbolic / Poincare 表示作为修正思路。[CVPR 2024 paper](https://openaccess.thecvf.com/content/CVPR2024/papers/Weber_Flattening_the_Parent_Bias_Hierarchical_Semantic_Segmentation_in_the_Poincare_CVPR_2024_paper.pdf), [GitHub](https://github.com/tum-vision/hierahyp)

SHiNe 则针对开放词表检测中的多粒度词表问题，使用类别层级生成 hierarchy-aware sentence embeddings；这可以迁移到遥感开放词表检测和分割。[SHiNe, CVPR 2024](https://arxiv.org/abs/2405.10053)

## 代表论文与项目

| 方向 | 论文/项目 | 年份/来源 | 链接 | 与 RS-50 的关系 |
|---|---|---:|---|---|
| 开放词表 RS 分割基准 | Towards Realistic Open-Vocabulary Remote Sensing Segmentation: Benchmark and Baseline | 2026 arXiv | [paper](https://arxiv.org/abs/2604.15652), [code](https://github.com/LiBingyu01/RSKT-Seg_and_Pi-Seg) | 170K images、128 类，类别覆盖变广后更需要层级评价 |
| 高效 OVRSIS | Exploring Efficient Open-Vocabulary Segmentation in the Remote Sensing | 2025 arXiv | [paper](https://arxiv.org/abs/2509.12040), [code](https://github.com/LiBingyu01/RSKT-Seg_and_Pi-Seg) | 仍主要报告 mIoU/mACC，可作为新指标复评对象 |
| SAM + OVSS | AerOSeg | 2025 CVPRW EarthVision | [paper](https://arxiv.org/abs/2504.09203) | 报告 seen/unseen 与 h-mIoU，但未解决 land-cover/object 层级混淆 |
| 层级 LCLU | HieraRS | 2025/2026 arXiv | [paper](https://arxiv.org/abs/2507.08741), [GitHub](https://github.com/AI-Tianlong/HieraRS) | 直接面向多粒度 LCLU，适合借鉴 consistency 设计 |
| 多层级 land cover | Multi-Task Learning with Cross-Level Semantic Consistency | 2025 Remote Sensing | [paper](https://www.mdpi.com/2072-4292/17/14/2442) | 引入 cross-level consistency 和 SAD/ESAD 类指标，可作为 RS 指标参考 |
| 类别层级建模 | Clustering-Based Class Hierarchy Modeling for Semantic Segmentation Using RS Imagery | 2025 Mathematics | [paper](https://www.mdpi.com/2227-7390/13/3/331) | 从数据驱动方式构造 class hierarchy |
| 遥感语义歧义 | KG-OVRSeg | 2025/2026 ISPRS JPRS | [paper](https://www.sciencedirect.com/science/article/abs/pii/S0924271625004666) | 使用知识图谱缓解同义词/上下位词/层级依赖 |
| 层级引导 OVSS | HG-RSOVSSeg | 2026 Remote Sensing | [paper](https://www.mdpi.com/2072-4292/18/2/213) | 将 hierarchical guidance 用于高分遥感 OVSS |
| 通用层级分割 | Flattening the Parent Bias | 2024 CVPR | [paper](https://openaccess.thecvf.com/content/CVPR2024/papers/Weber_Flattening_the_Parent_Bias_Hierarchical_Semantic_Segmentation_in_the_Poincare_CVPR_2024_paper.pdf), [code](https://github.com/tum-vision/hierahyp) | 提供 parent-level calibration 与 hyperbolic embedding 思路 |
| 通用开放词表检测 | SHiNe | 2024 CVPR | [paper](https://arxiv.org/abs/2405.10053) | 多粒度词表鲁棒性，可迁移到遥感开放词表检测 |
| 遥感基准数据 | OpenEarthMap | WACV 2023 + 2024 challenges | [project](https://open-earth-map.org/overview.html), [GitHub](https://github.com/bao18/open_earth_map) | 8 类高分 land-cover，可作为粗粒度评测 |
| 全球 LULC 产品 | Dynamic World | 2022-present product | [GEE catalog](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1), [GitHub](https://github.com/google/dynamicworld) | 9 类概率输出，适合验证概率/层级不确定性 |
| 全球 LULC 产品 | ESA WorldCover | 2021 product | [project](https://worldcover2021.esa.int/) | 11 类通用图例，适合跨 taxonomy 映射 |
| 美国 LULC 产品 | Annual NLCD | 2024 product page | [USGS](https://www.usgs.gov/centers/eros/science/annual-nlcd-land-cover-classification) | Modified Anderson Level II，天然有层级来源 |
| 欧洲 LULC 体系 | CORINE Land Cover | official nomenclature | [legend](https://clc.gios.gov.pl/index.php/gios-clc-2006/gios-clc-2006-legend) | 5/15/44 三级层级，适合做 hierarchy metric 示例 |

## 现有评价的缺口

1. `mIoU` 是平面指标：`road -> impervious surface`、`river -> water`、`rice -> crop` 与 `road -> water` 被同等视为错误。
2. `h-mIoU` 在 OVSS 中通常只表示 seen/unseen harmonic mean，不等于 hierarchical mIoU。这个术语容易造成误读。
3. 遥感类别常跨语义轴：land-cover 关心物理覆盖，land-use 关心功能，object detection 关心实例，disaster mapping 关心状态。一个 tree 很难表达所有关系，许多关系更像 DAG 或多轴 taxonomy。
4. 开放词表模型对 prompt 名称敏感：`built-up`、`impervious surface`、`urban fabric`、`building`、`residential area` 可能被 embedding 拉近，但 ground truth 只允许一个类别。
5. 数据集间 label mapping 缺少不确定性：OpenEarthMap 8 类映射到 WorldCover 11 类、Dynamic World 9 类、CORINE 44 类时，不是简单的一对一关系。
6. 指标很少区分“粒度错误”和“空间边界错误”：模型可能 mask 很准但粒度粗，或类别正确但边界偏。

## 建议指标体系

设 taxonomy 为 `T`，类别可以是 tree 或 DAG。`y_i` 是像素/实例真值，`p_i` 是预测。`a_l(c)` 表示类别 `c` 在第 `l` 层的祖先，`d_T(c1,c2)` 是 taxonomy 距离，`sim_T(c1,c2)` 是语义相似度。

### 1. Flat Score

继续报告传统 `mIoU_leaf`、`mAcc_leaf`、`mAP_leaf`，用于和现有论文可比。这个指标必须保留，但只作为第一列。

### 2. Hierarchical IoU at Levels

把真值和预测都投影到每个层级：

```text
y_i^l = a_l(y_i)
p_i^l = a_l(p_i)
HIoU_l = mIoU({y_i^l}, {p_i^l})
HIoU = Σ_l w_l HIoU_l
```

解释：如果模型把 `runway` 预测成 `road`，在 Level-1 的 `artificial surface` 可能正确，但在 Level-3 错误。报告 `HIoU_L1 / HIoU_L2 / HIoU_L3` 能看出错误发生在哪个粒度。

### 3. Hierarchical Consistency

当模型同时输出多层级结果时，检查子类预测是否与父类预测一致：

```text
HC = mean_i 1[a_l(p_i^{leaf}) == p_i^l for all l]
```

解释：模型不能同时说某像素是 `water` 的父类、又说叶子是 `building`。

### 4. Semantic Distance Error

用 taxonomy 距离衡量错误严重程度：

```text
SDE = mean_i d_T(y_i, p_i) / d_max
SDS = mean_i exp(-lambda * d_T(y_i, p_i))
```

解释：`river -> lake` 的距离应小于 `river -> runway`。

### 5. Hierarchy-Weighted Confusion Matrix

构造 `C[a,b]`，再用语义相似度矩阵 `S[a,b]` 加权：

```text
S[a,b] = 1                           if a == b
       = alpha                       if same parent
       = beta                        if same grandparent
       = gamma * CLIP/text_sim(a,b)  if synonym or near-synonym
       = 0                           otherwise
```

推荐默认值：`alpha=0.5, beta=0.25, gamma<=0.5`，并做敏感性分析。这个矩阵应公开，避免指标被随意调参。

### 6. Open-Vocabulary Alias Robustness

对每个类别构造同义词、上下位词和地区用语 prompt set：

```text
built-up: built-up area, urban fabric, impervious surface, developed land
water: water body, river, lake, reservoir, flood water
crop: cropland, crop field, rice field, maize field
```

报告同一模型在 prompt set 下的均值和方差：

```text
OVAR = mean_score - std_score
```

解释：如果换一个合理类别名性能大幅波动，模型不适合真实开放词表部署。

### 7. Boundary-vs-Taxonomy Error Decomposition

把错误分为三类：

```text
E_boundary: 类别相同但边界偏差
E_granularity: mask 与父类区域重合，但叶子类别粒度错误
E_semantic: taxonomy 距离大，是真正语义错误
```

实现上可用 `HIoU_L1 - mIoU_leaf` 估计粒度错误空间，再结合 boundary IoU / trimap IoU 分离边界误差。

## 最小实验设计

### 数据集组合

| 数据 | 作用 | 建议处理 |
|---|---|---|
| OpenEarthMap | 高分辨率 8 类 land-cover | 作为粗层级基准 |
| Dynamic World | 9 类概率 LULC | 用概率评估不确定性和 alias robustness |
| ESA WorldCover | 11 类全球图例 | 与 Dynamic World/OpenEarthMap 做 taxonomy mapping |
| CORINE CLC | 5/15/44 三级体系 | 构造明确 tree taxonomy |
| iSAID/DLRSD | object/scene/object-like categories | 测 land-cover 与 object 混合标签 |
| OVRSISBenchV2 | 128 类开放词表 | 作为最终大规模 benchmark |

### 模型候选

| 模型族 | 候选 | 目的 |
|---|---|---|
| 监督分割 | DeepLabv3+, SegFormer, Mask2Former | 平面标签 baseline |
| 遥感 OVSS | SegEarth-OV, RSKT-Seg, Pi-Seg, AerOSeg, KG-OVRSeg | 评估开放词表语义歧义 |
| SAM/VLM 管线 | CLIP + SAM, GroundingDINO + SAM, RemoteSAM | 评估 prompt/alias 敏感性 |
| 层级模型 | HieraRS, hierarchical MTL | 比较训练层级 vs 只做层级评估 |

### 实验矩阵

| 实验 | 问题 | 指标 |
|---|---|---|
| E1 单数据集平面复评 | 新指标是否解释 mIoU 看不出的错误 | mIoU_leaf, HIoU_l, SDE, HC |
| E2 跨 taxonomy 映射 | OpenEarthMap/WorldCover/Dynamic World 标签是否可互评 | HIoU_l, alias robustness, mapping uncertainty |
| E3 OVSS prompt 扰动 | 类别名变化是否改变预测 | OVAR, semantic-distance confusion |
| E4 粗到细评价 | 粗类正确但细类错误是否被合理计分 | HIoU curve, E_granularity |
| E5 地区迁移 | 新区域是否更多发生粒度错误 | SDE by region, HIoU_l by continent |
| E6 目标/土地覆盖混合 | building/road/runway/water 这类混合标签如何评价 | multi-axis taxonomy score |

## 可投稿方法草案

题目候选：`Taxonomy-Aware Evaluation for Open-Vocabulary Remote Sensing Segmentation`

### 核心假设

在遥感开放词表分割中，标准 `mIoU` 低估了语义邻近预测的价值，也掩盖了粗粒度正确但细粒度错误、或 prompt alias 引起的模型不稳定。引入 taxonomy-aware metrics 可以更准确诊断模型失败，并给出更可靠的 benchmark 排名。

### 方法模块

1. `Taxonomy Builder`：整合 WordNet/GeoNames/OSM tag、CORINE、NLCD、WorldCover、Dynamic World、OpenEarthMap，构建 tree/DAG。
2. `Label Mapper`：支持 one-to-one、one-to-many、ancestor、descendant、alias、ambiguous 五种映射关系。
3. `Metric Suite`：输出 `mIoU_leaf`、`HIoU@L`、`HC`、`SDE`、`SDS`、`OVAR`、`boundary-vs-taxonomy decomposition`。
4. `Error Explorer`：可视化层级混淆矩阵、类别别名敏感性、空间分布、不同区域的 taxonomy error。
5. `Benchmark Re-ranking`：用新指标复评 3-5 个 OVRSIS 模型，展示标准 mIoU 排名和 taxonomy-aware 排名差异。

### 预期贡献

1. 一个遥感 taxonomy-aware evaluation toolkit。
2. 一个公开的跨数据集类别映射表。
3. 一套面向 OVSS/LULC/object 混合类别的指标。
4. 对 2024-2026 代表模型的复评报告。
5. 对 prompt 别名、层级粒度、地理迁移的系统误差分析。

## 风险与缓解

| 风险 | 影响 | 缓解 |
|---|---|---|
| taxonomy 主观性 | 指标可能被质疑 | 公开 taxonomy、做多 taxonomy 敏感性分析 |
| DAG 关系复杂 | tree-based LCA 不够 | 允许 multi-parent，并报告最短路径和多轴分数 |
| 数据集 label 定义不一致 | 映射噪声影响结论 | 给每个映射关系标注 confidence |
| 软指标可能纵容粗预测 | 模型只输出父类也得高分 | 同时报告 leaf mIoU 和 granularity penalty |
| prompt alias 列表不完整 | OVAR 评估偏 | 用人工 + LLM + WordNet/OSM tag 生成并人工抽检 |

## 第一轮实现路线

1. 选 3 个数据集：OpenEarthMap、Dynamic World、OVRSISBench/RSKT-Seg 数据。
2. 手工构建 30-50 个类别的 taxonomy v0。
3. 实现 `taxonomy_metrics.py`，输入预测 mask、真值 mask、taxonomy JSON、alias JSON。
4. 复评 2 个模型：一个监督模型，一个开放词表模型。
5. 输出层级混淆矩阵和 prompt alias robustness 图。
6. 写成 workshop/期刊短文：重点不追求模型 SOTA，而是说明现有 SOTA 排名在 taxonomy-aware 视角下可能不同。

## 建议文件结构

```text
research/rs50_hierarchical_taxonomy_metrics.md
taxonomy/
  remote_sensing_taxonomy_v0.json
  alias_sets_v0.json
  dataset_label_mappings/
    openearthmap_to_taxonomy.json
    dynamicworld_to_taxonomy.json
    worldcover_to_taxonomy.json
metrics/
  taxonomy_metrics.py
  confusion_tree.py
experiments/
  rs50_metric_recheck.md
```

## 阅读队列

1. [HieraRS](https://arxiv.org/abs/2507.08741)
2. [OVRSISBenchV2 / Pi-Seg](https://arxiv.org/abs/2604.15652)
3. [KG-OVRSeg](https://www.sciencedirect.com/science/article/abs/pii/S0924271625004666)
4. [AerOSeg](https://arxiv.org/abs/2504.09203)
5. [Flattening the Parent Bias, CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/papers/Weber_Flattening_the_Parent_Bias_Hierarchical_Semantic_Segmentation_in_the_Poincare_CVPR_2024_paper.pdf)
6. [SHiNe](https://arxiv.org/abs/2405.10053)
7. [OpenEarthMap](https://open-earth-map.org/overview.html)
8. [Dynamic World](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1)
9. [ESA WorldCover](https://worldcover2021.esa.int/)
10. [USGS Annual NLCD](https://www.usgs.gov/centers/eros/science/annual-nlcd-land-cover-classification)
