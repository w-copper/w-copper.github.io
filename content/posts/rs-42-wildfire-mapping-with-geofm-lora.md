---
title: "RS-42 Wildfire Mapping with GeoFM LoRA"
date: 2026-06-07T09:41:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感应用", "农业生态灾害", "方法化"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-42 Wildfire Mapping with GeoFM LoRA

细问题：面向 wildfire / burn scar / burn severity mapping，如何用低样本、参数高效的 GeoFM adapter/LoRA 适配 Prithvi、TerraMind、DINOv3、AlphaEarth 等遥感基础模型，并处理 pre/post-fire 光学影像、云烟干扰、不确定性和跨地区泛化。

## 1. 方向判断

Wildfire mapping 的经典路线是 NBR/dNBR、BAIS2、阈值、随机森林、U-Net/Siamese U-Net、ChangeFormer 一类变化检测模型。2024-2026 的新变化是：基础模型开始进入真正可复现的 wildfire 任务，而不只是“拿 Prithvi 做一个示例”。其中最直接的锚点是 2026 IGARSS 论文 [Low-Rank Adaptation of Geospatial Foundation Models for Wildfire Mapping Using Sentinel-2 Data](https://arxiv.org/abs/2605.04989)，其官方代码为 [alishibli97/wildfire-lora-gfm](https://github.com/alishibli97/wildfire-lora-gfm)。

这个方向的研究价值不在于“再做一个烧毁区分割模型”，而在于回答一个更窄的问题：在地理、时间、生态区和传感器条件都变化的情况下，LoRA/adapter 是否比 full fine-tuning 或 decoder-only fine-tuning 更稳，尤其是在小样本事件、云烟遮挡、火后恢复阶段、跨国家/跨生态区泛化时。

## 2. 问题由来

1. 火烧迹地是典型的 bi-temporal change problem。单张 post-fire 影像容易把裸土、采伐地、阴影、火山/矿区等误判为 burned area；pre-fire/post-fire 差分能增强变化信号，但也会引入季节、物候、云影、观测角和配准误差。
2. 标签天然有噪声。USGS BARC 数据说明 burn severity 产品通常基于 pre/post-fire 的 dNBR，并且阈值需要 BAER 团队结合现场观察调整；这意味着 severity label 在生态区边界和低/中 severity 类别上并不是绝对真值。
3. 跨地区泛化比随机切分难得多。2026 LoRA-GFM 论文使用美国和加拿大 2017-2023 的 3,820 个 wildfire events，并做 spatial/temporal generalization tests；这是该方向从“局部案例”走向“域泛化问题”的关键。
4. GeoFM 的预训练知识有用，但灾害任务需要强适配。Prithvi-EO-2.0 预训练于 HLS 全球时间序列，并引入 temporal/location embeddings；这对 wildfire 这种多时相任务很友好，但仍需解决任务头、差分建模和不确定性。

## 3. 代表论文、模型、数据与代码

| 项目 | 年份/venue | 链接 | 与本方向的关系 |
|---|---:|---|---|
| Low-Rank Adaptation of Geospatial Foundation Models for Wildfire Mapping Using Sentinel-2 Data | 2026 IGARSS / arXiv | [paper](https://arxiv.org/abs/2605.04989), [GitHub](https://github.com/alishibli97/wildfire-lora-gfm) | 直接比较 TerraMind、DINOv3、Prithvi-v2 的 full fine-tuning、decoder-only fine-tuning、LoRA；官方 README 显示包含 FPN adapter、UPerNet decoder、spatio-temporal splits、sliding-window full-fire inference、IoU/F1 和 fire-size summaries。 |
| Prithvi-EO-2.0 | 2024 arXiv, 2026 revised | [paper](https://arxiv.org/abs/2412.02732), [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) | 多时相 HLS GeoFM。论文摘要称其使用 4.2M 全球 HLS time-series samples，并提供 Hugging Face、TerraTorch 与 GitHub 资源；适合作为 wildfire LoRA 主干。 |
| Prithvi EO 2.0 Burn Scar Severity Detection | 2024/2025 HF model card | [model](https://huggingface.co/Tushar365/prithvi-burn-scar-model), [dataset](https://huggingface.co/datasets/Tushar365/prithvi-burn-scar-dataset) | 一个可直接运行的 Prithvi burn scar severity demo。输入为 pre-fire、post-fire、delta 三帧，6 个 Sentinel-2 band，输出 5 类 severity。模型卡自报 macro F1 从 0.116 提升到 0.622，但其限制也明确：单一北加州 wildfire 事件、云烟未评估、20m 分辨率可能漏细节。 |
| HLS Burn Scars Dataset | HF dataset | [dataset](https://huggingface.co/datasets/harshinde/hls-burn-scars) | HLS 2018-2021 CONUS burn scar segmentation，804 个 512x512 scenes，6 个 band，540 train / 264 validation；适合最小复现实验和 adapter sanity check。 |
| AlphaEarth Foundations | 2025 arXiv / Google DeepMind | [paper](https://arxiv.org/abs/2507.22291), [blog](https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/) | 64 维年度 embedding field，面向 sparse labels 的 global mapping。更适合做 linear probe / shallow adapter / sparse-label baseline，而不是端到端 LoRA。可用于 wildfire 小样本或跨区迁移对照。 |
| Burned Area Reflectance Classification (BARC) Thematic Burn Severity Mosaic | 2025 USGS data release | [USGS catalog](https://data.usgs.gov/datacatalog/data/USGS%3A62e3e9b4d34e394b65365bef) | 权威 severity label 来源之一。基于 Landsat/Sentinel pre/post-fire dNBR，但官方说明 severity 与 canopy/understory/soil effects 相关，且阈值需与现场观测调整，因此很适合讨论标签不确定性。 |
| SAFE: Segmentation of Any Fire Event | 2025 Remote Sensing | [paper](https://www.mdpi.com/2072-4292/17/1/54) | 训练自由路线：结合 SAM、MODIS/VIIRS hotspot、Sentinel-2 指数两步定位 burned area，并可生成高分辨率数据再训练区域模型。适合作为伪标签或半自动标注对照。 |
| California Wildfire GeoImaging Dataset (CWGID) | 2024 arXiv | [paper](https://arxiv.org/abs/2409.16380) | 构建 10 万+ before/after Sentinel-2 image pairs，用于 wildfire detection；偏分类/检测而非高精度 burn mask，但可用于预训练或事件级检索。 |
| Faster, better, and more accurate mapping of burned areas using Sentinel-2 multispectral images | 2025 RSE | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0034425725005413) | MSR-BACD 路线：全球大规模正负样本、pre/post Sentinel-2、candidate-based inference。可作为强监督专用模型 baseline。 |
| TransFireNet | 2025 Remote Sensing Letters | [publisher](https://www.tandfonline.com/doi/abs/10.1080/2150704X.2025.2544356) | bi-temporal Sentinel-2 burn severity estimation，45 个 European wildfire events；适合作为非 GeoFM 的 burn severity baseline。 |

## 4. 方法脉络比较

### 4.1 指数与阈值

NBR/dNBR、BAIS2、NDVI/NDWI 等指数可解释、低成本、部署简单，但跨生态区阈值不稳，对云影、裸土、采伐、湿地和季节变化敏感。BARC 的说明很适合用来支撑一个观点：severity label 不是纯影像数学事实，而是遥感指数、生态效应和现场知识的折中。

### 4.2 专用深度模型

U-Net/Siamese U-Net/Transformer change models 可以利用 pre/post-fire 差异，在固定区域内通常强于指数阈值。但它们容易学到区域、植被类型和季节偏置；跨国家/跨生态区时需要大量标注。MSR-BACD 这类大型 Sentinel-2 专用 burn model 是强 baseline，但其贡献更偏“数据工程 + 专用模型”。

### 4.3 SAM/自动标注路线

SAFE 说明 SAM + hotspot + Sentinel-2 fire index 可以生成高分 burned area 候选，并用于训练轻量区域模型。这条线适合解决标注稀缺，但 prompt、候选框、指数阈值和火点产品会把先验错误带进伪标签。它更适合作为 LoRA 训练数据扩增或人机标注 pipeline，而不是替代 GeoFM adapter。

### 4.4 GeoFM LoRA/adapter 路线

LoRA-GFM 的关键发现是：在 TerraMind、DINOv3、Prithvi-v2 上，LoRA 以小于 1% 的可训练参数获得更好的跨域泛化，Prithvi-v2 + LoRA 表现最好。这提示 wildfire mapping 的小切口可以是“参数高效适配如何抑制 overfitting”，而不是单纯追求最高 closed-set mIoU。

### 4.5 AlphaEarth embedding 路线

AlphaEarth 更像“年度地球表征产品”，优点是稀疏标签下的 map production，不必训练完整视觉主干。对于 wildfire，它可作为 sparse label baseline：用 AEF annual embeddings + pre/post year difference + linear probe / shallow MLP 来检测 burned area 或恢复状态。但 AEF 年度粒度可能不适合短时灾后响应；这是需要实证检验的限制。

## 5. 关键未解决问题

1. **跨生态区泛化**：针叶林、灌丛、草地、泥炭地、农地火灾的光谱变化不同；同一个 LoRA rank 是否能覆盖所有生态区还不清楚。
2. **时间选择**：pre-fire/post-fire 日期间隔、云量、物候阶段会显著影响 dNBR 和模型特征。多数论文没有把日期选择作为可学习或可评估模块。
3. **云烟与阴影**：火灾任务天然遇到 smoke/cloud/haze/shadow。很多 burn scar 模型用较干净影像训练，真实近实时场景会掉点。
4. **标签边界不确定性**：dNBR severity class 的边界不稳定；低 severity 与 unburned、moderate-low 与 moderate-high 常有生态解释差异，不应只用 hard CE loss。
5. **事件级推理**：chip-level mIoU 不等于完整 wildfire event 的面积估计好。LoRA-GFM repo 已包含 sliding-window full-fire inference 和 fire-size summaries，后续应把 event-level area error 作为主指标。
6. **LoRA 插入位置**：ViT q/k/v、MLP、decoder、FPN adapter、temporal embedding、location embedding 哪些位置最值得适配，目前还缺 ablation。
7. **binary burned area vs severity**：二分类 burned area 与 5 类 burn severity 需求不同；severity 更依赖生态现场知识，不确定性应更强。

## 6. 推荐论文课题

题目草案：**Uncertainty-Aware Spatio-Temporal LoRA for Cross-Region Wildfire Burn Scar Mapping**

核心假设：在 GeoFM 主干冻结或半冻结时，将 LoRA 放入多时相特征交互层，并显式建模标签/云烟/日期选择不确定性，可在跨生态区和跨时间 wildfire mapping 中优于 full fine-tuning、decoder-only fine-tuning 和普通 LoRA。

### 方法模块

1. **Bi-temporal input builder**：为每个 wildfire event 自动选择 pre/post-fire Sentinel-2/HLS 影像，过滤云量，并生成 delta channels、dNBR、NBR、BAIS2 作为可选辅助输入。
2. **GeoFM backbones**：Prithvi-EO-2.0 为主，TerraMind/DINOv3/Clay 作为对照；AlphaEarth embeddings 作为非端到端 sparse-feature baseline。
3. **LoRA placement ablation**：比较 encoder attention LoRA、MLP LoRA、temporal embedding adapter、decoder-only、FPN adapter + UPerNet。
4. **Uncertainty head**：输出 burned probability、severity logits、aleatoric uncertainty；对 dNBR 边界区域和 cloud/smoke 区域降低 hard supervision 权重。
5. **Event-level reconstruction**：使用 sliding window + logit averaging，输出完整 fire polygon/mask，并报告面积误差和小火灾漏检。
6. **Cloud/smoke robustness augmentation**：加入薄云、烟雾、阴影、季节差异和轻微 misregistration augmentation。

### 数据设计

| 数据 | 用途 | 备注 |
|---|---|---|
| LoRA-GFM wildfire events | 主实验 | 2017-2023 US/Canada 3,820 events；复现 spatio-temporal splits。 |
| HLS Burn Scars | 最小可复现 | 804 HLS scenes；适合快速比较 LoRA rank、decoder、loss。 |
| USGS BARC | severity label / weak label | 2025 data release；需要处理 dNBR 阈值和生态不确定性。 |
| CWGID | event-level detection / pretraining | 10 万+ Sentinel-2 before/after pairs；适合先做 event detection 或 hard negative mining。 |
| SAFE pseudo labels | 弱监督扩增 | 用 SAM + hotspot 生成候选，研究伪标签质量对 LoRA 的影响。 |

### 评价指标

- Pixel-level：IoU、F1、precision/recall、boundary F1。
- Event-level：burned area error、small/medium/large fire 分组 F1、per-fire IoU。
- Severity：macro F1、weighted F1、ordinal error、severity transition confusion。
- 泛化：leave-year-out、leave-region/ecoregion-out、US-to-Canada、Canada-to-US。
- 不确定性：ECE、Brier score、risk-coverage curve、cloud/smoke subset performance。
- 效率：trainable parameters、GPU memory、inference time、LoRA rank vs mIoU/F1。

## 7. 实验矩阵

| 实验 | Backbone | Adaptation | 输入 | Split | 主要指标 | 目的 |
|---|---|---|---|---|---|---|
| E1 | Prithvi-v2 | decoder-only | post only | random | IoU/F1 | 最弱 GeoFM baseline |
| E2 | Prithvi-v2 | full FT | pre+post | spatial | IoU/F1/area error | 检查 full FT 是否过拟合 |
| E3 | Prithvi-v2 | LoRA q/v | pre+post+delta | spatial/temporal | IoU/F1/ECE | 复现 LoRA-GFM 主结论 |
| E4 | Prithvi-v2 | LoRA + uncertainty | pre+post+delta+indices | ecoregion | F1/ECE/risk-coverage | 验证不确定性是否提升跨区稳健性 |
| E5 | TerraMind/DINOv3 | LoRA | pre+post+delta | same splits | F1/params | 比较主干差异 |
| E6 | AlphaEarth | linear/MLP | pre-year/post-year embedding diff | sparse label | F1/area error | 检验 embedding 产品的低样本价值 |
| E7 | U-Net/ChangeFormer | supervised | pre+post+indices | same splits | F1/area error | 非 GeoFM 强 baseline |
| E8 | SAFE pseudo labels + Prithvi | LoRA | post + hotspot pseudo mask | low-label | label cost/F1 | 研究自动标注对 LoRA 的帮助 |

## 8. 可投稿的小创新点

1. **Boundary-soft severity loss**：根据 dNBR/BAIS2 与人工 severity class 的边界距离，为 low/moderate severity 区域引入 soft ordinal label。
2. **Date-selection adapter**：把 pre/post 日期间隔、云量、NDVI 季节差作为 token 输入，让 LoRA 适配火前火后差异质量。
3. **Ecoregion-conditioned LoRA routing**：按生态区或气候带选择 LoRA expert，但用共享低秩空间防止参数爆炸。
4. **Pseudo-label trust score**：融合 SAFE/SAM mask stability、hotspot distance、dNBR consistency、GeoFM uncertainty，为伪标签分配权重。
5. **Event-level calibration**：不只校准像素概率，还校准整场火灾面积估计的不确定性区间。

## 9. 最小可行复现实验

1. 下载 [HLS Burn Scars](https://huggingface.co/datasets/harshinde/hls-burn-scars) 做快速实验。
2. 使用 Prithvi-EO-2.0/TerraTorch 初始化 backbone。
3. 建立三组模型：decoder-only、full fine-tune、LoRA rank 4/8/16。
4. 输入对比：post only、pre+post、pre+post+delta、pre+post+delta+NBR/dNBR。
5. 指标：IoU、F1、ECE、area error。
6. 再迁移到 LoRA-GFM 的 spatio-temporal splits，检验小实验结论是否成立。

## 10. 风险

- LoRA-GFM 依赖较新的 DINOv3/TerraMind/Prithvi-v2 wrapper，环境复现可能有摩擦。
- AlphaEarth 年度 embedding 对灾后短时间变化可能不够敏感，需要把它定位为 sparse-feature baseline。
- BARC/dNBR severity label 并非绝对真值，过度拟合 severity class 可能降低生态解释性。
- 云烟真实样本不足时，鲁棒性增强可能只是在合成扰动上有效。
- 若训练数据已覆盖同一 wildfire event 的相邻 tile，必须做 event-level split，避免地理泄漏。

## 11. 下一步阅读顺序

1. [Low-Rank Adaptation of Geospatial Foundation Models for Wildfire Mapping Using Sentinel-2 Data](https://arxiv.org/abs/2605.04989)
2. [wildfire-lora-gfm official code](https://github.com/alishibli97/wildfire-lora-gfm)
3. [Prithvi-EO-2.0 paper](https://arxiv.org/abs/2412.02732) and [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
4. [HLS Burn Scars Dataset](https://huggingface.co/datasets/harshinde/hls-burn-scars)
5. [USGS BARC Thematic Burn Severity Mosaic](https://data.usgs.gov/datacatalog/data/USGS%3A62e3e9b4d34e394b65365bef)
6. [SAFE burned area extraction](https://www.mdpi.com/2072-4292/17/1/54)
7. [AlphaEarth Foundations](https://arxiv.org/abs/2507.22291)
