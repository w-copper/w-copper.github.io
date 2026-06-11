---
title: "RS-05 AlphaEarth/Prithvi Embeddings for Small-Area LoRA"
date: 2026-06-07T09:04:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感基础模型", "GeoFM", "2024-2026"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-05 AlphaEarth/Prithvi Embeddings for Small-Area LoRA

## 结论摘要

这个方向最值得做的不是“再证明 foundation model 有用”，而是做一个严格、可复现、成本可控的比较：同样的小区域标签预算下，公开 embedding、冻结编码器、轻量 adapter/LoRA、decoder-only 和 full fine-tuning 到底谁更稳，尤其在跨区域、跨年份、跨生物群区、跨城市形态时谁掉得少。

关键边界：

- AlphaEarth Foundations 当前主要以 Google Satellite Embedding 数据集形式开放：10 m、年度、64 维、2017-2024 的全球 embedding layers，适合做 frozen embedding + classifier/head，不适合直接对模型本体做 LoRA。
- Prithvi-EO-2.0、Clay、SatlasPretrain 是更适合做参数高效微调的 open model/backbone 路线。Prithvi-EO-2.0 官方 GitHub 已提供 TerraTorch 下游任务配置，TerraTorch 也明确支持 Prithvi、TerraMind、SatMAE、Satlas、DOFA、Clay 等 backbone。
- 小区域制图的核心问题是“局部标签少 + 空间自相关强 + 区域外泛化难”。随机划分会虚高；必须做 spatial block、leave-region、leave-year、leave-biome 或 leave-city 测试。

## 问题由来

传统遥感制图依赖人工特征、光谱指数、随机森林或任务专用深度网络。它们在本地标签足够、同分布测试时表现不错，但迁移到新的城市、农田制度、火烧迹地、气候带或传感器组合时往往需要重新标注。GeoFM 的承诺是：用大规模未标注 EO 数据预训练出通用表示，再用很少的本地标签快速制图。

2024-2026 出现了两条明显路线：

1. **Embedding-as-data**：AlphaEarth 把多源 EO 信息压成年度 embedding field。用户在 Earth Engine 或 GCS 中读取 64 维 embedding，再训练线性模型、树模型、MLP 或轻量空间头。
2. **Open-backbone fine-tuning**：Prithvi、Clay、SatlasPretrain 等提供模型权重和代码，用户可以做 frozen linear probe、decoder-only、adapter、LoRA 或 full fine-tuning。

这两条路线目前缺一个公平实验：在同样标签预算、同样 spatial split、同样任务指标下比较“公开 embedding + 轻量 head”和“可微调 backbone + LoRA/adapter”。

## 代表论文与项目

| 项目/论文 | 年份 | 链接 | 资源状态 | 和 RS-05 的关系 |
|---|---:|---|---|---|
| AlphaEarth Foundations | 2025 | [Google DeepMind blog](https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/), [arXiv](https://arxiv.org/abs/2507.22291) | [Earth Engine Satellite Embedding](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL), [GCS guide](https://developers.google.com/earth-engine/guides/aef_on_gcs_readme) | 公开年度 embedding，适合 sparse label mapping 和小区域制图的 frozen feature baseline。 |
| Google Satellite Embedding V1 Annual | 2025 | [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL) | 10 m、64 维、2017-2024、Earth Engine image collection | 直接可用于 crop/urban/fire 的线性头、RF/XGBoost、MLP、轻量 CNN head。 |
| Prithvi-EO-2.0 | 2024 | [arXiv](https://arxiv.org/abs/2412.02732), [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0), [HF org](https://huggingface.co/ibm-nasa-geospatial) | 300M/600M，含 temporal/location embeddings 版本 | 适合 frozen、decoder-only、LoRA、full fine-tuning 的主模型。 |
| TerraTorch | 2025 | [arXiv](https://arxiv.org/abs/2503.20563), [GitHub](https://github.com/torchgeo/terratorch) | 支持 Prithvi、TerraMind、SatMAE、Satlas、DOFA、Clay；支持 PEFT extra | 推荐作为可复现实验框架。 |
| Clay v1.5 | 2024 | [model spec](https://clay-foundation.github.io/model/release-notes/specification.html), [GitHub](https://github.com/Clay-foundation/model), [HF](https://huggingface.co/made-with-clay/Clay) | Apache-2.0，dynamic embedding block，多传感器、多 band | 和 Prithvi 对比：多传感器输入更灵活，但需要处理 patch embedding 与下游头。 |
| SatlasPretrain Models | 2024 | [GitHub](https://github.com/allenai/satlaspretrain_models) | aerial/Sentinel-2/Landsat pretrained backbones and heads | 适合作为高分辨率 aerial/urban 和 Landsat 多时相 baseline。 |
| Finetuning GFM for Land Cover Mapping | 2024 | [IBM Research](https://research.ibm.com/publications/finetuning-the-geospatial-foundation-model-for-land-cover-mapping), [OpenReview PDF](https://openreview.net/pdf?id=56567S7W9E) | 小训练集 Prithvi LULC fine-tuning | 说明小标签 LULC 是 Prithvi 早期目标场景。 |
| Finetuning GFM for Wildfire Scars in Himalayan Region | 2025 | [IBM Research](https://research.ibm.com/publications/finetuning-geospatial-foundation-model-for-wildfire-scars-in-himalayan-region) | Prithvi 100M, HLS, wildfire scar | 适合复用为 burn scar 小区域实验背景。 |
| Low-Rank Adaptation of GFMs for Wildfire Mapping | 2026 | [arXiv](https://arxiv.org/abs/2605.04989) | 比较 TerraMind、DINOv3、Prithvi-v2 的 full/decoder-only/LoRA | RS-05 的直接近邻论文，应作为 LoRA baseline 和实验设计参考。 |
| Mapping Tomato Cropping Systems with AlphaEarth | 2026 | [arXiv](https://arxiv.org/abs/2605.21804) | AlphaEarth embedding chips + field masks | AlphaEarth 用于田块级 crop mapping 的直接证据。 |
| AlphaEarth for Irrigated Cropland Mapping | 2026 | [Remote Sensing](https://www.mdpi.com/2072-4292/18/7/1065) | AlphaEarth embedding + irrigation mapping | 适合作为 crop/irrigation 小区域分类参考。 |
| Earth Embeddings Reveal Diverse Urban Signals from Space | 2026 | [arXiv](https://arxiv.org/abs/2604.03456) | 比较 AlphaEarth、Prithvi、Clay 预测 6 个美国都市区的 14 个 urban indicators | urban mapping/urban signal prediction 的关键参考。 |

## 方法脉络

### 1. Frozen embedding + shallow learner

适合 AlphaEarth，也适合作为 Prithvi/Clay/Satlas 的最弱微调 baseline。

常见形式：

- Pixel/parcel/patch embedding -> logistic regression / linear probe。
- Embedding -> Random Forest / XGBoost / LightGBM，适合小样本和非线性边界。
- Embedding chip -> 1x1 conv / shallow U-Net head，用于像素级 burn scar 或 crop segmentation。
- Parcel 聚合：mean/max/std/temporal difference of embeddings -> parcel-level classifier。

优点：训练快、标签少、可解释性较好、适合 Earth Engine。缺点：无法调整 representation，本地类别或细粒度边界不足时上限低。

### 2. Frozen encoder + trainable decoder/head

适合 Prithvi、Clay、Satlas。冻结 backbone，只训练 segmentation decoder、FPN/head 或 MLP。

这是最重要的公平基线，因为它把“表示能力”和“微调成本”分开。若 frozen head 已经很好，LoRA 的收益就必须用跨区泛化、少样本曲线或边界质量证明。

### 3. Adapter / LoRA / parameter-efficient fine-tuning

适合 Prithvi、Clay、Satlas；AlphaEarth 因为模型本体未开放，不能做模型内部 LoRA，只能对 embedding 后接 adapter/head。

关键设计：

- LoRA 插入 attention `q/k/v/o` 或 MLP projection。
- Adapter 插入 encoder block 或 decoder block。
- Decoder-only fine-tuning 作为低风险 baseline。
- Full fine-tuning 作为性能上限，但要报告 trainable parameters、GPU memory、训练时长和过拟合。

2026 wildfire LoRA 论文已经把 TerraMind、DINOv3、Prithvi-v2 在 burned-area mapping 上进行 full/decoder-only/LoRA 比较，可作为最直接复现起点。

### 4. Hybrid feature stacking

对小区域制图很现实：把 GeoFM embedding 与传统 EO 特征组合。

候选特征：

- AlphaEarth 64D annual embedding。
- Sentinel-2/HLS 原始 band、NDVI/NBR/NDWI/NDBI。
- DEM/slope/aspect、climate zone、distance to road/water/urban area。
- 前后时相 embedding difference 或 angle。

研究价值在于判断：foundation embedding 是否替代传统指数，还是二者互补。

## 可复现实验设计

### 任务 1：Wildfire / burn scar 小区域制图

目标：比较 GeoFM 在少量火烧迹地标签下的 burn scar segmentation，强调跨生物群区和跨年份。

数据候选：

- Prithvi 官方 fine-tuning 任务中的 [hls_burn_scars](https://huggingface.co/datasets/ibm-nasa-geospatial/hls_burn_scars)。
- 2026 LoRA wildfire 论文中的 US/Canada Sentinel-2 wildfire events 设置。
- MTBS / Fire perimeter + Sentinel-2/HLS 自建标签。
- Himalayan wildfire scar Prithvi fine-tuning 作为区域困难案例。

模型矩阵：

| 编号 | 输入/模型 | 训练方式 | 目的 |
|---|---|---|---|
| W0 | Sentinel-2/HLS bands + U-Net/SegFormer | from scratch | 传统监督基线 |
| W1 | AlphaEarth annual embedding | RF/XGBoost/MLP/1x1 conv head | embedding-as-data baseline |
| W2 | Prithvi-EO-2.0 | frozen encoder + decoder | 表示能力基线 |
| W3 | Prithvi-EO-2.0 | LoRA | 参数高效微调 |
| W4 | Prithvi-EO-2.0 | decoder-only | 与 LoRA 区分 |
| W5 | Prithvi-EO-2.0 | full fine-tuning | 性能上限 |
| W6 | Clay / Satlas | frozen + LoRA/adapter | open backbone 对照 |

关键 split：

- 少样本：1/5/10/25/50 fires 或 1/5/10% labeled pixels。
- 空间泛化：leave-state-out / leave-ecoregion-out。
- 时间泛化：train 2017-2021, test 2022-2023。
- 生物群区泛化：forest、shrubland、grassland、agriculture 分开报告。

指标：

- mIoU、F1、boundary F1、burned-area area error。
- Calibration：ECE、Brier score。
- 泛化掉点：in-domain vs OOD delta。
- 成本：trainable parameters、GPU memory、训练时长、标签量。

### 任务 2：Crop / irrigation / tomato 小区域制图

目标：评估公开 embedding 和可微调 backbone 在 parcel-scale crop mapping 中谁更稳。

数据候选：

- AlphaEarth tomato mapping 论文中的 California tomato setting。
- AlphaEarth irrigated cropland mapping 论文。
- USDA CDL + Sentinel-2/HLS 自建 county/region split。
- Prithvi 官方 multi-temporal crop classification 数据。
- Sen4Map Europe land-cover/crop 设置。

模型矩阵：

- AlphaEarth parcel embedding 聚合 + RF/XGBoost/MLP。
- AlphaEarth embedding chip + shallow CNN。
- Prithvi multi-temporal crop segmentation：frozen/decoder-only/LoRA/full。
- Clay dynamic multiband input + frozen/adapter。
- Satlas Landsat/Sentinel model + head。

关键 split：

- leave-county-out、leave-year-out、leave-crop-system-out。
- 小标签：每类 5/10/20/50 parcels。
- 田块级 vs 像素级：parcel majority vote 与 pixel mIoU 同时报。

指标：

- macro-F1、balanced accuracy、per-class F1、parcel-level accuracy。
- 面积估计误差：per-crop area RMSE。
- OOD delta：同县/跨县/跨年。

### 任务 3：Urban / built environment small-area mapping

目标：评估 GeoFM embedding 在城市局部指标、impervious surface、building density、land use proxy 上的迁移。

数据候选：

- Earth Embeddings Reveal Diverse Urban Signals from Space：AlphaEarth、Prithvi、Clay，6 个美国都市区，14 个 urban indicators。
- NLCD / Chesapeake / Dynamic World / local parcel or census indicators。
- 高分辨率 urban segmentation 数据集可作为补充，但注意 GSD 与 AlphaEarth 10 m 的 mismatch。

模型矩阵：

- AlphaEarth embedding + ridge/random forest/MLP。
- Prithvi/Clay embedding + same shallow learner。
- Prithvi/Clay fine-tuned segmentation/regression head。
- Hybrid：embedding + roads/POI/building footprints。

关键 split：

- leave-city-out。
- leave-year-out。
- city-year holdout。
- neighborhood spatial block split。

指标：

- regression：R2、MAE、Spearman、spatial residual Moran's I。
- classification/segmentation：macro-F1、mIoU、boundary F1。
- fairness：不同收入、密度、城市形态分组误差。

## 推荐的公平比较协议

1. 固定标签预算：例如每个任务 1%、5%、10% 标签，外加每类 5/10/20 个样本。
2. 固定 spatial split：不允许随机 tile split 作为主结果，只能作为 sanity check。
3. 固定 preprocessing：统一 patch size、projection、cloud mask、year/time window。
4. 统一训练轮数和 early stopping：用验证区域，而不是测试区域。
5. 报告参数和成本：trainable params、总 params、GPU hours、inference time。
6. 至少包含一个传统 EO baseline：raw bands + indices + RF/UNet/SegFormer。
7. 至少包含一个 hybrid baseline：GeoFM embedding + NDVI/NBR/DEM/road distance。
8. 对每个模型做少样本曲线：不要只报一个标签比例。
9. 报告 OOD drop：in-domain score、OOD score、差值。
10. 对错误做地图化分析：不要只给表格，展示典型失败区域。

## 可能的论文方案

标题草案：**Do Public Geospatial Embeddings Replace Local Fine-Tuning? A Low-Label Cross-Region Study for Small-Area Mapping**

核心问题：在小区域低样本制图中，公开 embedding + shallow learner 是否足以替代 open GeoFM 的 LoRA/adapter 微调？

假设：

- H1：AlphaEarth 在极低标签预算下会强于 raw spectral baseline，尤其在 crop/urban 这类长期表征任务。
- H2：Prithvi/Clay 的 LoRA 在需要局部边界或灾害短期变化的任务上优于 frozen embedding。
- H3：hybrid embedding + spectral indices 在 OOD 上比纯 embedding 或纯 raw bands 更稳。

方法：

- 构建 3 任务 benchmark：wildfire、crop、urban。
- 模型分 5 档：raw baseline、AlphaEarth shallow、frozen Prithvi/Clay/Satlas、LoRA/adapter、full fine-tune。
- 评估 3 类泛化：cross-region、cross-year、cross-biome/city。
- 输出 cost-performance frontier。

预期贡献：

- 给出公开 embedding 与 LoRA 微调的清晰使用边界。
- 建立低标签、跨区制图的公平协议。
- 产出可复用的 TerraTorch + Earth Engine/GCS 数据抽取 pipeline。

风险：

- AlphaEarth 是 multi-modal embedding，包含 SAR/LiDAR 等信息；若研究严格限定光学，要在文中标注 mixed-modality risk。
- AlphaEarth 模型本体不可微调，不能和 Prithvi/Clay 的 LoRA 完全同类比较；需要把对比表述为 deployment choices，而不是 architecture-only ablation。
- Earth Engine/GCS 数据抽取可能成为工程瓶颈。
- 10 m AlphaEarth 对建筑边界等超高分任务分辨率不足。

## 最小可执行实验路线

1. 选择一个小区域任务先跑通：建议 `hls_burn_scars` 或 California crop/irrigation。
2. 准备三类输入：raw HLS/Sentinel-2、AlphaEarth 64D embedding、Prithvi/Clay/Satlas model input。
3. 先跑 shallow baselines：RF/XGBoost/MLP/linear probe。
4. 用 TerraTorch 跑 Prithvi frozen decoder、decoder-only、LoRA、full fine-tune。
5. 加 Clay/Satlas frozen + lightweight head。
6. 加 spatial block split 和 leave-year split。
7. 输出少样本曲线和 OOD drop。
8. 只在最有差异的任务上做 full fine-tune，控制算力。

## 未来细化方向

- AlphaEarth embedding 的哪些维度/方向对应 crop phenology、burn severity、urban texture？需要可解释性分析，但不要把单个 Axx band 当物理 band。
- LoRA 插入层位置对遥感小样本是否敏感：只插高层、全层、decoder-only 的差异。
- 用 embedding angle/dot product 做 change features，和传统 NBR/NDVI difference 比较。
- 地理偏置控制：加入或移除 coordinates/time embeddings，看模型是在学地物还是记区域。
- 小区域 active learning：优先标注 embedding 空间中的边界样本，比较 uncertainty sampling 和 diversity sampling。

## 阅读清单

- [AlphaEarth Foundations paper](https://arxiv.org/abs/2507.22291)
- [Google Satellite Embedding Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL)
- [Prithvi-EO-2.0 paper](https://arxiv.org/abs/2412.02732)
- [Prithvi-EO-2.0 GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
- [TerraTorch GitHub](https://github.com/torchgeo/terratorch)
- [Clay v1.5 specification](https://clay-foundation.github.io/model/release-notes/specification.html)
- [SatlasPretrain models](https://github.com/allenai/satlaspretrain_models)
- [Low-Rank Adaptation of GFMs for Wildfire Mapping](https://arxiv.org/abs/2605.04989)
- [Earth Embeddings Reveal Diverse Urban Signals from Space](https://arxiv.org/abs/2604.03456)
- [Mapping Tomato Cropping Systems with AlphaEarth](https://arxiv.org/abs/2605.21804)
