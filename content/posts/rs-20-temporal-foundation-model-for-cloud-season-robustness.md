---
title: "RS-20 Temporal Foundation Model for Cloud/Season Robustness"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["多时相", "变化检测", "时序遥感"]
source: "research/rs20_temporal_foundation_model_cloud_season.md"
categories: ["时序变化、跨域泛化与可信评测"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-20 Temporal Foundation Model for Cloud/Season Robustness

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-20` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：多时相 foundation model 如何对云、缺测和季节变化鲁棒？能否设计一个 masked temporal reconstruction + downstream change/crop mapping 的小论文方案？ 1. 方向概述 光学/多光谱遥感时序的关键困难不是“没有时间维度”，而是时间维度经常不干净：云

## 正文

# RS-20 Temporal Foundation Model for Cloud/Season Robustness

更新时间：2026-06-07  
细问题：多时相 foundation model 如何对云、缺测和季节变化鲁棒？能否设计一个 `masked temporal reconstruction + downstream change/crop mapping` 的小论文方案？

## 1. 方向概述

光学/多光谱遥感时序的关键困难不是“没有时间维度”，而是时间维度经常不干净：云、云影、雪、薄雾、传感器缺测、不同重访周期、物候周期和真实地物变化混在一起。传统做法常用云掩膜、最佳像元合成、插值、时序平滑或单任务云去除，但 foundation model 时代的机会是：把“缺测、遮挡、季节变化”变成预训练任务本身，让模型学会在不完整、多季节、多区域、多传感器序列中形成稳定表示。

本方向可被压成一个很具体的论文问题：

> 在 Sentinel-2 / HLS 多时相序列中，用真实或模拟云缺测做 masked temporal reconstruction 预训练，是否能同时提升云遮挡条件下的 crop mapping 和真实变化检测，并减少把季节变化误判为变化的错误？

## 2. 问题由来

遥感时序和普通视频不同。视频帧通常时间间隔密集、同一相机、视角连续；卫星时序是稀疏、不规则、多传感器、多大气条件，而且同一像元的语义可能因物候周期而显著变化。对于 crop mapping，模型必须理解不同作物的物候曲线，而不是只看单期纹理。对于 change detection，模型必须区分真实建设/灾害/砍伐变化与季节性植被变化、云影、观测角和配准误差。

因此，单期 MAE 或普通图像 encoder 不够；只做云去除也不够。更有价值的是把 temporal masking、cloud-aware reconstruction、seasonal contrastive learning 和 downstream robustness 放在同一个评测框架里。

## 3. 代表论文与项目

| 论文/项目 | 年份/venue | 链接 | 代码/模型/数据 | 与本问题的关系 |
|---|---:|---|---|---|
| Prithvi-EO-2.0: A Versatile Multi-Temporal Foundation Model for Earth Observation Applications | 2024 arXiv / NASA-IBM | [arXiv](https://arxiv.org/abs/2412.02732), [NASA NTRS PDF](https://ntrs.nasa.gov/api/citations/20240015391/downloads/RSE%20Prithvi%20Global.pdf) | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0), [HF 300M](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M) | HLS 多时相 MAE，使用 3D spatiotemporal patch embedding、time/geolocation encoding；是本课题最直接基线。 |
| SkySense: A Multi-Modal Remote Sensing Foundation Model | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.html), [arXiv](https://arxiv.org/abs/2312.10115) | [GitHub](https://github.com/Jack-bo1220/SkySense) | 使用大规模时序遥感数据和 factorized spatiotemporal encoder；说明 temporal sequence 已是 RSFM 核心能力。 |
| SkySense++: A semantic-enhanced multi-modal RSFM for EO | 2025 Nature Machine Intelligence | [Nature](https://www.nature.com/articles/s42256-025-01078-8) | [GitHub](https://github.com/kang-wu/SkySensePlusPlus) | 加入语义增强多模态建模，可作为“时序表示 + 语义任务”参照。 |
| Galileo: Learning Global and Local Features in Pretrained Remote Sensing Models | 2025 arXiv / OpenReview | [arXiv](https://arxiv.org/abs/2502.09356), [OpenReview PDF](https://openreview.net/pdf?id=gqZO3eSZRy) | [GitHub](https://github.com/nasaharvest/galileo), [HF](https://huggingface.co/nasaharvest/galileo) | 设计为灵活处理不同空间和时间形状的多模态 RS 输入；适合做可变长度/不规则时序基线。 |
| TerraMind: Large-Scale Generative Multimodality for Earth Observation | 2025 ICCV/arXiv | [arXiv](https://arxiv.org/abs/2504.11171), [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Jakubik_TerraMind_Large-Scale_Generative_Multimodality_for_Earth_Observation_ICCV_2025_paper.pdf) | [GitHub](https://github.com/IBM/terramind), [HF](https://huggingface.co/ibm-esa-geospatial/TerraMind-1.0-base) | 任意模态生成和 Thinking-in-Modalities 可转化为“缺测时生成辅助模态/时间片”的鲁棒方案。 |
| ChronoEarth-492K | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.15666) | 待确认官方代码/数据 | 长时间跨度 hyperspectral 时序 benchmark，强调 temporal calibration，可启发长期时序评测。 |
| UniTS: Unified Time Series Generative Model for Remote Sensing | 2025 arXiv | [arXiv](https://arxiv.org/abs/2512.04461) | 待确认官方代码 | 统一时序重建、云去除、语义变化检测、预测；与本课题的生成式预训练目标很接近。 |
| SatSwinMAE: Efficient Autoencoding for Multiscale Time-series Satellite Imagery | 2024 arXiv | [arXiv](https://arxiv.org/abs/2405.02512) | 待确认官方代码 | 3D masked autoencoder + Video Swin，直接支持多尺度时序影像自编码。 |
| SatMAE | 2022 NeurIPS, 仍是时间/多光谱 MAE 基线 | [Project](https://sustainlab-group.github.io/SatMAE/), [PDF](https://papers.neurips.cc/paper_files/paper/2022/file/01c561df365429f33fcd7a7faa44c985-Paper-Conference.pdf) | 项目页 | 虽早于目标窗口，但 temporal/multispectral MAE 设计仍是所有 2024-2026 方法的重要参照。 |
| Reconstruction of seamless HLS time series via self-supervised learning | 2024 RSE | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0034425724002098) | 论文页 | HLS 时序无缝重建与 gap filling 是 masked temporal reconstruction 的应用前身。 |
| AnytimeFormer | 2025 RSE | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0034425725005243) | 论文页 | 目标是任意时间 reflectance reconstruction；含 SAR-optical 融合，本文只借鉴异步时序重建思想，不把 SAR 作为主线。 |
| RESTORE-DiT | 2025 RSE | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0034425725002767) | 论文页 | 时序重建/云去除的 diffusion transformer 代表；同样含 SAR-optical，作为生成式重建参照。 |
| AgriFM: A Multi-source Temporal RSFM for Crop Mapping | 2025 arXiv | [arXiv](https://arxiv.org/abs/2505.21357), [HF paper](https://huggingface.co/papers/2505.21357) | [GitHub planned](https://github.com/flyakon/AgriFM) | 面向 crop mapping 的多源长时序 foundation model，适合作为下游农业任务对比。 |
| Spatiotemporal masked pre-training for crop mapping with limited labels | 2025 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1569843225000731) | 论文页 | 明确验证 spatiotemporal masking 对低标签 crop mapping 的价值。 |
| SITS-MoCo: Self-supervised pre-training for large-scale crop mapping | 2024/2023 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0924271623003386) | [GitHub](https://github.com/YXu556/SITS-MoCo) | 对 temporal shift、spectral noise、irregular length 做鲁棒表示学习，是 contrastive baseline。 |

## 4. 方法脉络

### 4.1 多时相 MAE 路线

代表：Prithvi-EO-2.0、SatSwinMAE、SatMAE。  
核心思想是 mask 掉空间、谱段或时间 patch，让模型重建缺失观测。优点是简单、可扩展，能自然模拟云遮挡和缺测。问题是像素重建质量不一定等价于下游语义鲁棒性，尤其容易学到“平滑插值”而不是物候语义。

### 4.2 多模态/任意模态生成路线

代表：TerraMind、UniTS、RESTORE-DiT、AnytimeFormer。  
核心是用其他时间片、其他模态或辅助产品生成缺失时间/模态。对云去除很有吸引力，但如果引入 SAR，论文主线会变成 SAR-optical fusion；本任务建议把 SAR 设为可选辅助，不作为核心贡献。

### 4.3 时序对比/不变性路线

代表：SITS-MoCo、crop mapping temporal SSL。  
目标不是重建像素，而是让同一地块在轻微云噪声、时间错位、观测缺失下表示稳定。优点是更贴近分类/制图，缺点是难以处理真实变化，因为模型可能把有意义变化也压成不变。

### 4.4 任务驱动长时序路线

代表：AgriFM、crop mapping ViT、ChronoEarth benchmark。  
强调物候、长期趋势和作物/生态下游任务。优点是应用价值强；风险是模型可能过度贴合农业标签，泛化到灾害变化或城市变化时不稳。

## 5. 当前未解决的问题

1. 云 mask 不等于真实缺测。很多实验用随机 mask 或矩形 mask，和云的空间形态、薄云、云影、雪混淆不一致。
2. 重建指标与下游指标脱节。PSNR/SSIM/MAE 好，不代表 crop F1 或 change F1 好。
3. 季节变化和真实变化容易混淆。模型需要知道“同一作物春夏秋变化是正常的”，但建筑新增、火烧、水体扩张是真变化。
4. 不规则时间间隔处理不足。Sentinel-2/HLS 在不同地区、云量和纬度下有效观测间隔差异大。
5. 跨区域物候偏移明显。同一作物在不同气候带的生长期不同，固定 positional/month embedding 可能引入区域偏差。
6. 公开 benchmark 缺少“云遮挡鲁棒性曲线”。多数论文只在干净 split 或固定云量下报告单点分数。
7. 多模态生成容易引入伪细节。生成出来的云下像元如果只为了好看，可能污染变化检测和物候判断。

## 6. 推荐小论文方案

### 题目草案

Cloud- and Season-Robust Temporal Foundation Models via Masked Phenological Reconstruction

### 核心假设

如果预训练时使用真实云形态/云影形态的 temporal masking，并同时约束像素重建、物候曲线一致性和语义下游稳定性，那么模型在云遮挡和季节偏移条件下的 crop mapping 与 change detection 会比普通 MAE、随机 temporal masking 和单期 GeoFM 更稳。

### 方法模块

1. **Cloud-aware temporal masking**  
   使用 Sentinel-2 SCL、s2cloudless、Fmask/HLS QA 或真实云 mask 构造遮挡；额外加入薄云、云影、局部缺测和整期缺测。mask 策略包括 random patch、cloud-shaped patch、full-date dropout、phenology-critical-date dropout。

2. **Masked temporal reconstruction**  
   backbone 可从 Prithvi-EO-2.0、Galileo 或轻量 Temporal ViT 开始。输入为 `T x C x H x W`，输出被遮挡时间片/波段的 reflectance 或 latent token。推荐比较 pixel reconstruction、latent reconstruction 和 index reconstruction（NDVI/NDWI/NBR）。

3. **Phenology consistency loss**  
   对植被相关区域，约束重建后的 NDVI/EVI/NBR 曲线形状与可见观测一致；避免只优化 RGB/reflectance 平滑。

4. **Seasonal contrastive regularization**  
   同一地块在相邻季节或同物候阶段为正样本，不同作物/不同变化状态为负样本。注意不能把真实变化样本错误拉近。

5. **Downstream robustness head**  
   在 crop mapping 和 change detection 上微调，训练时保留 cloud dropout；评测时报告随云量、缺测期数、季节偏移变化的性能曲线。

### 数据集建议

| 用途 | 数据 | 说明 |
|---|---|---|
| 预训练 | HLS / Sentinel-2 L2A 全球多时相 patch | 优先选含 QA/cloud mask 的区域；可从 Prithvi-EO-2.0/HLS 工作流复用思路。 |
| crop mapping | PASTIS, CropHarvest, NASA HLS crop classification, AgriFM 相关数据 | 适合评估物候和缺测鲁棒性。 |
| change detection | S2Looking, SECOND, DynamicEarthNet, OSCD, xBD 部分光学任务 | 需构造季节 hard negatives，避免只测建筑变化。 |
| cloud reconstruction | HLS seamless reconstruction 数据、Sentinel-2 多时相云遮挡样本 | 用真实云 mask 做重建评测。 |
| OOD | leave-region/leave-year/leave-season split | 必须报告跨区域和跨年份。 |

### Baselines

| 类别 | Baseline |
|---|---|
| 单期 GeoFM | Prithvi-EO-1.0 / Clay / SatMAE feature + downstream head |
| 多时相 GeoFM | Prithvi-EO-2.0, SkySense, Galileo |
| 时序 SSL | SITS-MoCo, SatSwinMAE, spatiotemporal masked crop pretraining |
| 云去除/重建 | HLS SSL reconstruction, CloudTran++, RESTORE-DiT, AnytimeFormer |
| 下游任务模型 | U-TAE/TempCNN/Transformer crop mapping, ChangeFormer/BIT/DSIFN 等变化检测模型 |

### 指标

1. Reconstruction: MAE/RMSE、SAM spectral angle、NDVI/EVI/NBR error、cloud-region-only error。
2. Crop mapping: macro-F1、per-class F1、mIoU、early-season accuracy、missing-date robustness curve。
3. Change detection: F1/IoU、seasonal false positive rate、cloud-shadow false positive rate、boundary F1。
4. Robustness: performance vs cloud ratio、performance vs missing dates、leave-year/leave-region drop。
5. Calibration: ECE、uncertainty-error correlation、cloud-mask-conditioned confidence。

## 7. 实验矩阵

| 实验 | 变量 | 目的 |
|---|---|---|
| E1 Mask 策略 | random patch / cloud-shaped / full-date dropout / phenology-critical-date dropout | 验证真实云形态是否比随机 mask 更有用。 |
| E2 重建目标 | reflectance / latent / NDVI+reflectance / spectral indices only | 判断像素重建与语义鲁棒性的关系。 |
| E3 时间编码 | absolute date / day-of-year / relative interval / learned temporal embedding | 处理不规则时间间隔和跨地区物候偏移。 |
| E4 Backbone | Temporal ViT / Prithvi-EO-2.0 frozen+adapter / Galileo / lightweight MAE | 比较从头训练与基于 GeoFM 适配。 |
| E5 下游任务 | crop mapping / binary change / semantic change | 验证是否从重建迁移到语义任务。 |
| E6 OOD split | leave-year / leave-region / leave-crop-zone / high-cloud region | 测真实鲁棒性，而不是随机 split。 |
| E7 生成辅助 | no generation / TerraMind-style auxiliary modality / diffusion reconstruction | 检查生成补全是否带来伪细节风险。 |

## 8. 可能的创新点

1. **云形态感知的 temporal masking**：用真实云/云影分布替代随机 mask，目标更贴近部署。
2. **物候一致性重建**：不仅重建 reflectance，还约束 vegetation index curve 和关键物候阶段。
3. **下游鲁棒性驱动的预训练评测**：把 cloud ratio / missing dates / season shift 作为主指标。
4. **变化检测中的季节 hard negatives**：专门测模型是否把正常季节变化误判为真实变化。
5. **GeoFM adapter 路线**：不重新训练大模型，而是在 Prithvi/Galileo 上加 temporal-cloud adapter，降低算力门槛。

## 9. 风险与规避

| 风险 | 规避 |
|---|---|
| 预训练数据过大，算力不够 | 使用 Prithvi-EO-2.0/Galileo frozen backbone + adapter；先做区域级 HLS 子集。 |
| 云去除重建看起来好但下游无收益 | 将 crop/change downstream robustness 设为主实验，重建指标只做辅助。 |
| SAR-optical 融合偏离本方向 | 将 SAR 只作为 optional ablation；主线保持 optical/HLS/Sentinel-2。 |
| 生成模型产生伪细节 | 使用 uncertainty、spectral index consistency 和 change false positive rate 约束。 |
| 物候差异导致模型记住地区 | 使用 leave-region/leave-climate-zone split，并比较 day-of-year vs phenology-stage encoding。 |

## 10. 最小可行实验

1. 选 3 个区域、2 年 Sentinel-2/HLS 时序，保留真实 cloud mask。
2. 构造 4 种 masking：random patch、cloud-shaped、full-date dropout、cloud+shadow。
3. 用轻量 Temporal ViT 或 Prithvi-EO-2.0 frozen encoder + adapter 做 masked temporal reconstruction。
4. 下游只做两个任务：PASTIS/CropHarvest crop mapping 和 OSCD/S2Looking binary change。
5. 报告 clean、30% cloud、60% cloud、missing 2 dates、leave-year 的性能曲线。
6. 若 cloud-shaped masking 在高云量和 leave-year 下明显优于 random masking，即可支持继续扩展为完整论文。

## 11. 下一步阅读队列

- [Prithvi-EO-2.0 arXiv](https://arxiv.org/abs/2412.02732) 和 [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
- [SkySense CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/html/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.html) 和 [GitHub](https://github.com/Jack-bo1220/SkySense)
- [Galileo arXiv](https://arxiv.org/abs/2502.09356) 和 [GitHub](https://github.com/nasaharvest/galileo)
- [TerraMind arXiv](https://arxiv.org/abs/2504.11171) 和 [GitHub](https://github.com/IBM/terramind)
- [ChronoEarth-492K](https://arxiv.org/abs/2605.15666)
- [UniTS](https://arxiv.org/abs/2512.04461)
- [AgriFM](https://arxiv.org/abs/2505.21357)
- [SatSwinMAE](https://arxiv.org/abs/2405.02512)
- [SITS-MoCo code](https://github.com/YXu556/SITS-MoCo)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
