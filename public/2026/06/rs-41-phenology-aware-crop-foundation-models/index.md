# RS-41 Phenology-Aware Crop Foundation Models


# RS-41 Phenology-Aware Crop Foundation Models

## 摘要

作物识别的关键不是某一天的影像，而是作物在一个生长季中的物候轨迹。2024-2026 的作物遥感研究从传统 Sentinel-2 time series 分类，走向 multi-source temporal foundation model、region-adaptive phenology、WorldCereal 实际部署和 AgriFM。最有价值的小问题是：如何让 foundation model 学到“可迁移的物候阶段”，而不是记住某地区某年的日历日期。

## 问题由来

同一种作物在不同纬度、海拔、管理制度和气候年份下，播种、返青、抽穗、成熟和收获时间都会偏移。模型若用固定 day-of-year 作为强特征，很容易跨年份或跨区域失效。物候感知模型需要处理不规则时间采样、云导致的缺测、多源传感器和作物生长阶段对齐。

## 代表论文与项目

| 工作 | 年份 | 链接 | 价值 |
|---|---:|---|---|
| Self-supervised pre-training for large-scale crop mapping using Sentinel-2 time series | 2024 | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0924271623003386) | 大规模 S2 时序自监督作物制图。 |
| Temporally transferable crop mapping with temporal encoding and augmentations | 2024 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1569843224002218) | 使用 temporal encoding 和 day shifting 提升跨年份迁移。 |
| AgriFM | 2025 | [arXiv](https://arxiv.org/abs/2505.21357) | 多源时序 crop mapping foundation model，强调多尺度时空模式。 |
| Deploying GFMs in the Real World: WorldCereal | 2025 | [arXiv](https://arxiv.org/abs/2508.00858) | 用 Presto 等模型讨论真实作物制图部署难点。 |
| Region-Adaptive Phenology-Aware Network | 2025 | [MDPI](https://www.mdpi.com/2072-4292/17/24/4011) | 区域自适应物候网络，强调跨区域泛化。 |
| Benchmarking FMs for hyperspectral crop type mapping | 2025 | [arXiv](https://arxiv.org/abs/2510.11576) | 将 foundation model 用于 cereal crop type mapping。 |
| FLORO | 2026 | [arXiv](https://doi.org/10.48550/arXiv.2605.28174) | 生态遥感 across sensors/scales，可迁移到农业生态任务。 |

## 方法脉络

1. 时间编码：day-of-year、month、season embedding。
2. 物候增强：random day shifting、temporal cropping、cloud gap simulation。
3. 阶段对齐：用 NDVI/EVI 曲线估计生长阶段，再让模型按阶段而非日期聚合。
4. 多源时序：Sentinel-2、Landsat/HLS、SAR 可选、气象和地块先验共同建模；本系列默认光学/多光谱优先。
5. foundation model 适配：Presto、Prithvi、AgriFM、Galileo 等作为时序基座。

## 当前问题

- 日历日期和物候阶段混淆。
- 云缺测导致关键阶段观测不足。
- 作物标签跨区域定义不一致。
- 多年、多地、多传感器 benchmark 不统一。
- foundation model 在真实部署中仍需要区域微调。

## 可执行研究方案

题目：Phenology-Phase Adapter for Crop Foundation Models

方法：

1. 从 NDVI/EVI/NIR-SWIR 指数中估计生长阶段 token。
2. 将 day-of-year token 与 phenology-phase token 分离输入 temporal transformer。
3. 使用 random day shifting 和 region-level leave-out 训练。
4. 在 frozen temporal GeoFM 上训练轻量 adapter。

数据：

- CropHarvest、WorldCereal、EuroCrops、HLS/Sentinel-2 time series。

指标：

- crop F1、macro F1、area estimation error。
- leave-year-out、leave-region-out。
- early-season accuracy：只看播种后 N 天的性能。
- missing observation robustness。

最小实验：

用 Sentinel-2 作物数据比较 day-of-year encoding、random day shifting、phenology-phase token 三种设置，在 leave-year-out 上看泛化。

## 未来方向

1. 用物候阶段替代固定日期，提升跨纬度泛化。
2. phenology-aware contrastive pretraining。
3. 地块级 temporal aggregation 与 crop FM 结合。
4. 早季作物识别的不确定性校准。
5. 将气象异常作为 domain shift 输入，而不是训练噪声。

