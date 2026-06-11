---
title: "RS-23 Uncertainty-Calibrated Large-Scale Mapping"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["泛化", "OOD", "不确定性"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-23 Uncertainty-Calibrated Large-Scale Mapping

## 摘要

大范围遥感制图的核心问题不是只把 mIoU、F1 或 RMSE 做高，而是让地图产品知道“哪里可靠、哪里不可靠、为什么不可靠”。2024-2026 的相关工作正在把 conformal prediction、spatial calibration、Bayesian/ensemble uncertainty、neural processes 和 geospatial foundation model embeddings 放到一起。最值得做的小课题是：在 land cover、森林属性、生物量或灾害制图中，构造一个空间感知的不确定性校准协议，让模型在跨区域、跨生态区和跨传感器时仍能给出可信的 prediction set 或 prediction interval。

## 问题由来

遥感制图天然具有空间自相关。普通深度模型往往把每个像素或 patch 当成独立样本，输出 softmax probability 后直接解释为置信度；但在真实部署里，误差会沿地形、城市形态、生态区、季节和传感器成片出现。一个模型在测试集总体精度很高，并不意味着它在某个山区、云影边缘或少数土地覆盖类型上可靠。

不确定性校准要回答三个具体问题：

1. 预测概率是否能对应真实正确率。
2. 模型能否给出覆盖率可控的类别集合或连续区间。
3. 这种覆盖率在空间分组、生态区、GSD、传感器和长尾类别上是否仍成立。

## 代表论文与资源

| 工作 | 年份 | 链接 | 价值 |
|---|---:|---|---|
| Assessing Predictive Uncertainties in Remote Sensing Image Classification via Conformal Prediction | 2024 | [DLR entry](https://elib.dlr.de/208182/) | 将 conformal prediction 引入遥感分类不确定性，适合作为分类基线。 |
| Uncertainty quantification for forest attribute maps with conformal prediction and k-nearest neighbor method | 2025 RSE | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0034425725001622) | 面向森林属性图的不确定性区间，说明传统遥感制图也需要覆盖率保证。 |
| Interpolation of GEDI Biomass Estimates with Calibrated Uncertainty Quantification | 2026 | [arXiv summary](https://researchtrend.ai/papers/2601.16834) | 用 local observation sets 和 GeoFM embeddings 改善生物量估计的校准。 |
| Calibrated spatial uncertainty for Earth observation | 2026 | [EarthArXiv PDF](https://eartharxiv.org/repository/object/13059/download/23139/?embed=True) | 强调空间依赖、Matérn covariance 和 foundation model 特征下的空间不确定性。 |
| EarthShift | 2026 | [Project](https://earthshift.github.io/), [arXiv](https://arxiv.org/abs/2605.29330) | 提供真实 distribution shift 场景，可作为校准 OOD benchmark。 |
| Prithvi-EO-2.0 | 2024 | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) | 可作为 frozen GeoFM backbone，测试不确定性头。 |
| AlphaEarth Foundations | 2025 | [Google Research](https://research.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/) | 年度 embedding field 适合做大范围制图和空间公平性误差分析。 |

## 方法脉络

### Softmax/ensemble calibration

最小基线是 temperature scaling、deep ensemble、MC dropout 和 test-time augmentation。它们容易实现，但常把模型方差误当成数据噪声，在跨区域部署时会过度自信。

### Conformal prediction

Conformal prediction 的优势是给出有限样本覆盖率保证。分类任务可以输出 prediction set，回归任务可以输出 prediction interval。遥感中关键改造是 calibration split 不能随机抽样，而应保留空间块、生态区和时间分组，避免空间自相关造成虚假的覆盖率。

### Spatial calibration

空间校准关心局部覆盖率。可以按 ecoregion、城市、地形、GSD、传感器、云量、类别频次分组计算 coverage gap，也可以引入局部邻域特征、GeoFM embedding 或高斯过程/神经过程建模空间残差。

### Uncertainty-aware mapping product

对于地图产品，最终输出不应只是一张类别图，还应包括 confidence map、prediction set size、OOD score、coverage diagnostics 和审核优先级。

## 当前问题

- 随机 calibration split 会高估校准质量。
- softmax confidence 对长尾类别和 OOD 区域经常过度自信。
- 空间自相关导致像素级 ECE 不能代表地图级风险。
- segmentation/dense mapping 的 conformal prediction 计算成本高。
- 大部分论文报告精度，但很少报告局部 coverage、set size、人工审核收益。

## 可执行研究方案

题目：Spatial-Conformal Calibration for GeoFM-Based Large-Scale Mapping

方法：

1. 使用 frozen GeoFM backbone，如 Prithvi、Clay 或 AlphaEarth embedding。
2. 下游任务选择 land cover segmentation、forest biomass regression 或 flood mapping。
3. 构建三类 calibration split：random、spatial block、leave-region-out。
4. 分类输出 prediction set，回归输出 prediction interval。
5. 用局部 GeoFM embedding、地形/气候区和邻域残差学习 adaptive conformal score。

数据：

- DynamicEarthNet、Chesapeake Land Cover、Sen1Floods11 光学子集、GEDI biomass paired data、EarthShift tasks。

指标：

- accuracy/F1/RMSE。
- ECE、Brier score、NLL。
- marginal coverage、group coverage、local coverage gap。
- average set size / interval width。
- audit efficiency：人工优先检查高不确定区域时发现错误的比例。

最小实验：

在一个 land cover 数据集上比较 random vs spatial conformal split，验证随机校准是否在 leave-region-out 测试中失效。若 coverage gap 明显，就是一个扎实的小论文起点。

## 未来方向

1. 空间块 conformal prediction for semantic segmentation。
2. GeoFM embedding conditioned uncertainty head。
3. 面向地图产品的数据卡：每张图附带 coverage report。
4. 不确定性驱动主动学习，优先标注高风险空间块。
5. 将 OOD detection 与 conformal set size 结合，区分“不确定但可校准”和“完全出分布”。
