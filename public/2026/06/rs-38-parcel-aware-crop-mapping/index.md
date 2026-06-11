# RS-38 Parcel-Aware Crop Mapping


# RS-38 Parcel-Aware Crop Mapping

## 摘要

作物制图不应该只按像素分类。农业管理的基本单元是 field parcel：同一地块内部作物通常一致，边界决定时序聚合、面积估计和轮作分析。2024-2026 的趋势是将 field boundary segmentation、WorldCereal/Fields of the World、Delineate Anything、PRUE、AgriFM 和多时相 foundation model 结合，形成 parcel-aware crop mapping。最值得做的小课题是：先估计地块边界和边界不确定性，再在 parcel 内聚合多时相特征，测试跨年份和跨区域泛化。

## 问题由来

像素级 crop classification 会在地块边界、混合像元、云影、裸土期和不同作物物候接近时出错。若将地块作为结构先验，可以把时序信号在地块内聚合，并减少椒盐噪声。但地块边界本身并不总是可用，OSM/LPIS 等矢量数据也可能过期、错位或不完整。

## 代表论文与项目

| 工作 | 年份 | 链接 | 价值 |
|---|---:|---|---|
| Self-supervised pre-training for large-scale crop mapping using Sentinel-2 time series | 2024 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0924271623003386) | 时序自监督作物制图基线。 |
| Delineate Anything | 2025 | [HF paper](https://huggingface.co/papers/2504.02534) | resolution-agnostic field boundary delineation，强调 zero-shot generalization。 |
| AgriFM | 2025 | [arXiv](https://arxiv.org/abs/2505.21357) | 多源时序作物制图 foundation model，显式强调物候。 |
| WorldCereal / Presto real-world deployment | 2025 | [arXiv](https://arxiv.org/abs/2508.00858) | 真实作物制图部署经验，强调 benchmark 到 operational gap。 |
| Fields of The World | 2025 | [GitHub org](https://github.com/fieldsoftheworld/) | 多洲、多国家 field boundary benchmark 生态。 |
| PRUE | 2026 CVPR | [arXiv](https://arxiv.org/abs/2603.27101) | field boundary segmentation at scale，适合地块边界主基线。 |
| Region-Adaptive Phenology-Aware Network | 2025 | [MDPI](https://www.mdpi.com/2072-4292/17/24/4011) | 区域自适应物候网络，说明跨区域作物物候偏移的重要性。 |

## 方法脉络

1. pixel-first：直接对 Sentinel-2 time series 做像素分类。
2. parcel-first：已有地块矢量，聚合每个 parcel 的时序特征。
3. boundary-first：先从影像预测 field boundary，再生成 parcel。
4. joint：同时学习 boundary、parcel embedding 和 crop label。

## 当前问题

- 公开地块边界跨国家不均衡。
- parcel 边界错位会污染时序聚合。
- 小地块、梯田和复种区域难分。
- 作物物候跨年份、气候带和管理制度变化很大。
- 单纯 parcel majority voting 会掩盖地块内混作或变化。

## 可执行研究方案

题目：Uncertainty-Aware Parcel Aggregation for Crop Mapping

方法：

1. 用 PRUE/Delineate Anything 或 SAM-based field delineation 预测 parcel。
2. 为每条边界估计 uncertainty。
3. 对 parcel 内 Sentinel-2/HLS time series 做 temporal transformer 聚合。
4. 对高边界不确定地块采用 soft aggregation，而不是硬分区。

数据：

- Fields of The World、WorldCereal、CropHarvest、EuroCrops、区域 LPIS。

指标：

- pixel F1、parcel-level F1、area estimation error。
- boundary F-score、parcel IoU。
- cross-year/cross-region generalization。
- small-field performance。

最小实验：

在一个有地块边界和作物标签的区域，比较 pixel-only、ground-truth parcel aggregation、predicted parcel aggregation、uncertainty-aware parcel aggregation。

## 未来方向

1. parcel-aware temporal foundation model。
2. 地块边界变化检测与作物轮作联合建模。
3. 用农业机械轨迹或 cadastral map 辅助 field delineation。
4. 小地块区域的超分辨率与边界联合优化。
5. parcel-level active learning，优先标注边界不确定且类别不确定的地块。

