---
title: "RS-02 GeoFM Benchmark Leakage Audit"
date: 2026-06-07T09:01:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感基础模型", "GeoFM", "2024-2026"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-02 GeoFM Benchmark Leakage Audit

研究问题：geospatial foundation model 评测中的训练-测试泄漏如何影响 SOTA，尤其是地理区域重叠、时间重叠、同源瓦片、下游数据被预训练数据覆盖四类问题。本文面向光学/多光谱遥感优先，方法也可用于多模态 GeoFM；涉及 SAR 的模型只作为评测设置参考。

## 1. 问题由来

GeoFM 的预训练数据通常来自全球尺度 Sentinel-2、Landsat、NAIP、航空影像、气象/地理辅助数据和公开下游数据集合并。模型越大，越容易出现一个尴尬问题：下游 benchmark 的测试图像、相邻瓦片、同一 Sentinel/Landsat scene、同一年同一区域影像，可能已经在预训练中出现过。

这会让 SOTA 被高估，尤其在以下场景中：

- 地理区域重叠：训练或预训练见过同一城市、同一农田地块、同一灾区附近区域，测试看似独立但空间自相关很强。
- 时间重叠：测试年份、季节或灾害前后影像被预训练覆盖，模型可能记住局部地物状态，而不是真正泛化。
- 同源瓦片泄漏：大幅影像被切成 patch 后随机划分，训练/测试 patch 共享同一 parent scene 或 mosaic。
- 下游数据覆盖：模型预训练直接使用了下游 benchmark 的影像、标签衍生产品、caption/QA 或同源公开数据。

2024-2026 的趋势是：PANGAEA、PhilEO Bench、Copernicus-Bench、GEOBench-VLM 等开始统一评测；EarthShift 和 REOBench 开始强调真实分布偏移；`No One Knows the State of the Art in Geospatial Foundation Models` 则把问题进一步推到“GeoFM SOTA 是否可被清晰比较”的层面。我的判断是：未来两年，GeoFM 论文如果没有清楚的数据血缘和泄漏审计，很难让评测结论真正站稳。

## 2. 重点来源

| 来源 | 年份 | 链接 | 与泄漏审计的关系 |
|---|---:|---|---|
| PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models | 2024/2025 | [arXiv](https://arxiv.org/abs/2412.04204), [project](https://pangaea-bench.github.io/), [GitHub](https://github.com/yurujaja/pangaea-bench) | 跨任务、跨区域、跨模态统一评测，是审计协议的主目标之一。 |
| EarthShift: a benchmark for measuring robustness to real-world distribution shifts in Earth observation | 2026 | [arXiv](https://arxiv.org/abs/2605.29330), [project](https://earthshift.github.io/) | 明确把真实世界 shift 放进 benchmark，可用于“去泄漏后性能下降”对照。 |
| No One Knows the State of the Art in Geospatial Foundation Models | 2026 | [arXiv](https://arxiv.org/abs/2605.12678) | 直接指出 GeoFM SOTA 比较不稳定、评测协议和透明度不足。 |
| Prithvi-EO-2.0 | 2024 | [arXiv](https://arxiv.org/abs/2412.02732), [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0), [HF](https://huggingface.co/ibm-nasa-geospatial) | HLS 多时相预训练，适合审计同 MGRS tile、同日期、同区域覆盖。 |
| Clay Foundation Model | 2024/2025 | [docs](https://clay-foundation.github.io/model/), [GitHub](https://github.com/Clay-foundation/model), [HF](https://huggingface.co/made-with-clay) | 多传感器、多时相工程化开源模型，模型卡/数据卡透明度适合做 audit case。 |
| SkySense | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.html), [GitHub](https://github.com/Jack-bo1220/SkySense) | 大规模多模态遥感 FM，代表高性能但数据源复杂的评测场景。 |
| Galileo | 2025 | [arXiv](https://arxiv.org/abs/2502.09356), [GitHub](https://github.com/nasaharvest/galileo) | 全球/局部多模态 EO 表征，适合审计跨区域与下游任务覆盖。 |
| TerraMind | 2025 | [arXiv](https://arxiv.org/abs/2504.11171), [GitHub](https://github.com/IBM/terramind) | 任意模态到任意模态 EO 生成/表征，适合审计“预训练是否见过下游目标模态或标签产品”。 |
| PhilEO Bench | 2024 | [project](https://phileo-bench.github.io/), [arXiv](https://arxiv.org/abs/2401.04464), [HF](https://huggingface.co/PhilEO-community/PhilEO-Bench) | few-shot/n-shot GeoFM benchmark，可用来验证去泄漏 split 后的样本效率变化。 |
| Copernicus-FM / Copernicus-Bench | 2025 | [arXiv](https://arxiv.org/abs/2503.11849), [GitHub](https://github.com/zhu-xlab/Copernicus-FM), [HF](https://huggingface.co/wangyi111/Copernicus-FM) | Copernicus 数据预训练和层级任务评测，适合做同源 Copernicus 数据覆盖审计。 |
| REOBench | 2025 | [arXiv](https://arxiv.org/abs/2505.16793), [GitHub](https://github.com/lx709/reobench), [HF](https://huggingface.co/datasets/xiang709/REOBench) | 光学遥感扰动鲁棒性 benchmark，可作为泄漏之外的 robustness 对照。 |

## 3. 方法脉络：从随机划分到数据血缘审计

### 3.1 传统随机划分的问题

很多遥感数据集来自若干城市或少量大幅影像。随机切 patch 会让训练和测试共享同一城市纹理、同一传感器条件、同一季节，甚至同一 parent image。对于建筑、道路、作物和土地覆盖任务，这种空间自相关足以显著抬高测试分数。

### 3.2 空间留出与时序留出

更强的做法是 leave-city-out、leave-region-out、leave-country-out、leave-season-out 和 leave-year-out。但这仍然不够，因为预训练语料可能已经覆盖了测试区域。对 GeoFM 来说，必须审计“预训练数据 vs 下游测试数据”，而不是只审计“下游训练 vs 下游测试”。

### 3.3 同源瓦片与 parent-scene 审计

遥感影像常有清晰 parent ID，例如 Sentinel-2 MGRS tile、Landsat path/row、NAIP tile、Maxar/航空影像 mosaic id。若训练和测试 patch 来自同一 parent scene，即使 patch 没有像素重叠，也会共享成像条件和空间上下文。GeoFM 评测应报告 parent-scene overlap rate。

### 3.4 近重复与 embedding 审计

当数据缺少完整元数据时，需要用 pixel hash、感知哈希、CLIP/GeoFM embedding 近邻和地理近邻共同去重。仅靠文件名或经纬度不够，因为公开数据集常经过重采样、裁剪、压缩和增强。

### 3.5 下游标签和衍生产品污染

更隐蔽的一类泄漏来自标签产品：预训练任务可能使用已有 land cover map、building footprint、road map 或 caption/QA，后续 benchmark 又用同源产品作为标签。此时模型不一定见过测试影像，但可能见过测试标签的衍生来源。

## 4. 可复现 Leakage Audit Protocol

### 4.1 输入

对每个模型和 benchmark，收集以下元数据：

- 模型侧：预训练数据集列表、时间范围、空间范围、传感器、产品级别、采样策略、是否包含公开下游数据、是否包含标签/文本/矢量产品。
- benchmark 侧：每个样本的 footprint、acquisition time、sensor、GSD、parent scene id、tile id、split、label source。
- 文件侧：原始文件名、STAC item、checksum、图像尺寸、重采样方式。

推荐统一成 STAC-like schema：

```json
{
  "sample_id": "string",
  "dataset": "PANGAEA_or_downstream_name",
  "split": "train|val|test|pretrain",
  "sensor": "Sentinel-2|Landsat|NAIP|...",
  "product_level": "L1C|L2A|HLS|...",
  "datetime": "YYYY-MM-DD",
  "footprint_wkt": "POLYGON(...)",
  "parent_scene_id": "string_or_null",
  "gsd_m": 10,
  "label_source": "manual|OSM|ESA_WorldCover|auto|unknown",
  "asset_hash": "optional"
}
```

### 4.2 审计指标

| 指标 | 定义 | 用途 |
|---|---|---|
| Spatial Overlap Rate | test footprint 与 pretrain/train footprint 的 IoU 或 buffer overlap 比例 | 发现同区域泄漏 |
| Parent Scene Match Rate | test 样本 parent scene id 在 pretrain/train 中出现的比例 | 发现同源瓦片泄漏 |
| Temporal Proximity Rate | test 与 pretrain/train 在同区域内时间差小于阈值的比例 | 发现同季节/同事件泄漏 |
| Near-Duplicate Rate | pHash/embedding/top-k nearest neighbor 超过阈值的比例 | 发现重采样、裁剪、压缩后的重复 |
| Label Source Collision | benchmark label source 与 pretraining auxiliary product 是否同源 | 发现标签产品污染 |
| Unknown Provenance Rate | 无法确认空间/时间/父场景/标签来源的样本比例 | 衡量模型评测透明度 |

### 4.3 风险等级

| 等级 | 名称 | 判定示例 | 建议处理 |
|---|---|---|---|
| L0 | Clean/Documented | 无空间重叠，时间和 parent scene 不重叠，数据血缘清楚 | 可作为主结果 |
| L1 | Nearby Context | 测试区域周边 buffer 内出现训练/预训练样本 | 报告敏感性分析 |
| L2 | Same Region/Season | 同城市或同 MGRS tile，同季节但不同 parent scene | 单独报告 region-holdout |
| L3 | Parent Scene Leakage | 同一 parent scene/mosaic 被训练和测试共享 | 不应作为主 SOTA |
| L4 | Near-Duplicate Leakage | 图像近重复或裁剪自同一像素区域 | 必须剔除 |
| L5 | Label/Product Leakage | 预训练使用了测试标签同源产品或下游测试集 | 必须隔离并声明 |
| UX | Unknown | 元数据不足无法判断 | 不能只报单一分数，应作为高风险不确定项 |

### 4.4 实验设计

对每个模型做四组评测：

1. Reported split：复现实验原始 split。
2. De-overlapped split：移除 L3-L5 样本，L2 样本单独标注。
3. Spatial buffer split：测试区域周围 1/5/10/50 km buffer 内的训练/预训练样本剔除。
4. Leave-domain split：按城市、国家、生态区、季节、年份、传感器分别留出。

报告这些数：

- 原始分数：mIoU、F1、mAP、OA、RMSE 或任务指标。
- 去泄漏分数：同样指标。
- Leakage Sensitivity：`(reported_score - clean_score) / reported_score`。
- Robustness Ratio：`clean_score / in_domain_score`。
- Unknown Provenance Rate：越高，结论越弱。

### 4.5 最小可复现实验

建议先做一个小而完整的 proof-of-concept：

| 模块 | 推荐选择 |
|---|---|
| 模型 | Prithvi-EO-2.0、Clay、SkySense 或 Galileo 中至少 2 个开源模型 |
| benchmark | PANGAEA 中 2-3 个光学任务 + PhilEO Bench 或 EarthShift 一个鲁棒任务 |
| 任务 | land cover segmentation、crop/building mapping、flood/wildfire binary mapping |
| 元数据 | STAC footprint、日期、sensor、MGRS tile/scene id、label source |
| 审计方法 | spatial join + parent scene matching + temporal delta + embedding nearest neighbor |
| 输出 | 原始 split vs de-overlapped split 的性能差和风险报告 |

## 5. 可能的实现路线

### 5.1 数据表构建

把所有样本转成 `samples.parquet`：

- `sample_id`
- `dataset`
- `split`
- `geometry`
- `datetime`
- `sensor`
- `parent_scene_id`
- `label_source`
- `asset_uri`

### 5.2 空间/时间审计

用 GeoPandas 或 DuckDB Spatial 做空间连接：

- test vs pretrain/train IoU。
- test centroid 到最近 pretrain/train footprint 距离。
- 同区域时间差分布。
- buffer 距离敏感性曲线。

### 5.3 近重复审计

三层去重：

- 精确 hash：找完全重复文件。
- perceptual hash：找重采样/压缩后的近重复。
- embedding kNN：用 Clay/Prithvi/DINOv2/RemoteCLIP feature 找语义和视觉近重复，再人工抽查。

### 5.4 标签产品审计

对每个标签记录来源：

- manual polygon/mask。
- OSM/building footprint/road map。
- ESA WorldCover/Dynamic World/GlobCover 等土地覆盖产品。
- VLM/SAM/GroundingDINO 自动生成。

若模型预训练或辅助任务使用同一产品，标为 L5 或至少 UX。

## 6. 未来研究方向

### 方向 A：GeoFM 数据血缘卡

给每个 GeoFM 增加“pretraining provenance card”：列出传感器、时间范围、空间覆盖、公开 benchmark 是否排除、标签产品是否使用、不可公开数据比例。贡献点不是新模型，而是让模型评测可审计。

### 方向 B：Leakage-aware leaderboard

为 PANGAEA/EarthShift 类 benchmark 增加 leakage risk column：主排名只看 L0-L1；L2-L5 分数只能作为辅助结果。这样可以解释为什么某模型 reported SOTA 高但 clean split 掉分明显。

### 方向 C：空间自相关校正指标

传统置信区间假设样本独立，不适合遥感 patch。可以引入 spatial block bootstrap 或 variogram-aware confidence interval，让 benchmark 报告更真实的不确定性。

### 方向 D：近重复自动审计工具

做一个开源工具 `geofm-leakage-audit`：输入 STAC catalog 和模型数据卡，输出 overlap report、risk heatmap、near-duplicate gallery 和 clean split。这个方向工程味重，但很容易服务多个论文。

### 方向 E：预训练数据不可公开时的黑盒审计

很多商业或大规模模型不能公开完整预训练数据。可研究 membership inference 的遥感版本：基于模型 embedding、loss、nearest-neighbor consistency 和区域留出表现，估计测试样本是否可能在预训练中出现。

## 7. 一页论文 proposal

题目：Leakage-Aware Evaluation for Geospatial Foundation Models

核心假设：当前 GeoFM benchmark 的一部分性能来自空间、时间、同源瓦片和标签产品泄漏；系统审计并清洗后，模型排名和泛化结论会发生可测变化。

方法：

1. 建立 STAC-like provenance schema。
2. 定义 L0-L5/UX 泄漏风险等级。
3. 对 PANGAEA、PhilEO Bench、EarthShift 的若干任务构建 clean/de-overlapped splits。
4. 评测 Prithvi-EO-2.0、Clay、SkySense/Galileo/TerraMind 可用 checkpoint 或公开 embedding。
5. 发布 audit tool 和 leaderboard report。

实验：

- 主实验：reported split vs clean split。
- 消融：只去空间重叠、只去 parent scene、只去 temporal overlap、只去 near duplicate。
- 泛化：leave-city、leave-country、leave-season、leave-sensor。
- 稳健性：不同 buffer 半径与不同 pHash/embedding 阈值。

风险：

- 模型预训练数据不完全公开，部分只能标 UX。
- 有些 benchmark 缺少精确 footprint，需要从文件名或 STAC 回填。
- 去泄漏后数据量变小，需要报告样本量和置信区间。

预期贡献：

- 给 GeoFM 评测提供可复现审计协议。
- 解释 SOTA 排名不稳定的部分原因。
- 让后续 GeoFM 论文更难依赖隐性数据覆盖获得高分。

## 8. 下一步阅读与执行清单

1. 逐篇读 PANGAEA、EarthShift、No One Knows the SOTA，抽取它们对数据划分和鲁棒性的定义。
2. 下载或查看 Prithvi-EO-2.0、Clay、Galileo、TerraMind 的 model/data card，记录预训练时间范围、传感器和数据透明度。
3. 选 2 个公开 benchmark 做样本级 metadata 表。
4. 写最小 `audit_report.ipynb`：空间重叠、parent scene、时间差、near duplicate。
5. 先用 linear probe 复现实验，不急着 full fine-tune，快速观察 clean split 掉分幅度。
