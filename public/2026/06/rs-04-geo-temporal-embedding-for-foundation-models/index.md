# RS-04 Geo-Temporal Embedding for Foundation Models


# RS-04 Geo-Temporal Embedding for Foundation Models

## 1. 执行摘要

2024-2026 的 GeoFM 正在从“只看像素”转向“像素 + 传感器 + 时间 + 地理位置 + 生态/气候上下文”的条件化表示。这个方向的关键不只是把经纬度和日期塞给模型，而是要回答：模型是否学到了可迁移的地理时间规律，还是只是记住某个地方常见什么地物。

目前可以把方法分成五类：

| 类别 | 做法 | 代表 | 优点 | 风险 |
|---|---|---|---|---|
| 显式连续元数据 embedding | 对 lat/lon、week/hour、GSD、wavelength 做数值归一化后编码 | Clay, Prithvi-EO-2.0 | 工程直接、适合下游 adapter | 容易让模型记地理偏置 |
| 离散 token 化 | 将经纬度/时间/模态等转成离散 token，与图像 token 一起预训练 | TerraMind | 适合任意模态生成和 token-level 推理 | token 粒度影响很大，坐标离散会损失连续空间关系 |
| 时空统一检索空间 | 把图像、位置、时间映射到同一 embedding space | TIGeR, GT-Loc | 可做 geolocation、time prediction、geo-time retrieval | 主要来自自然图像/街景，迁移到卫星需处理俯视和传感器差异 |
| 年度/时序 embedding field | 生成每年每个像元的地表 embedding | AlphaEarth Foundations, Tessera | 适合全球制图和时间序列监测 | 模型内部不可控，可能隐藏空间不公平性 |
| 采样/benchmark 层面的地理时间控制 | 用 spatial/temporal split、生态区覆盖、跨年评测控制偏差 | EarthShift, PANGAEA, SSL4EO-S12 v1.1 | 可验证泛化 | 不是模型结构，不能单独提升能力 |

核心研究机会：提出一个 **Geo-Time Conditional Adapter (GTCA)**，在冻结 GeoFM backbone 的前提下，只用轻量模块注入经纬度、年内时间、年份、气候区和 GSD，并通过反偏置训练约束避免“坐标捷径”。

## 2. 问题由来

遥感图像里的同一视觉纹理在不同地方和时间可能语义不同。例如绿色斑块在温带夏季可能是玉米地，在热带可能是常绿林，在旱季可能是灌溉农田。反过来，模型如果知道坐标，也可能偷懒：看到某个区域就猜常见类别，而不是看图像证据。

这导致一个张力：

- 需要地理时间元数据，因为地表过程具有强烈的季节性、生态区差异和区域先验。
- 不能让模型过度依赖地理时间元数据，否则跨区域、跨年份、异常事件和少数类会失败。

所以 RS-04 的真正问题是：**如何把地理时间信息作为可校准、可关闭、可解释的条件，而不是不可控的空间记忆。**

## 3. 代表论文与项目

| 论文/项目 | 年份/来源 | 元数据使用方式 | 链接 | 代码/模型 |
|---|---:|---|---|---|
| Prithvi-EO-2.0: A Versatile Multi-Temporal Foundation Model | 2024 arXiv / NASA-IBM | 使用 temporal 和 location embeddings；4.2M HLS 全球时间序列样本 | [arXiv](https://arxiv.org/abs/2412.02732), [NASA PDF](https://ntrs.nasa.gov/api/citations/20240015391/downloads/RSE%20Prithvi%20Global.pdf) | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) |
| Clay Foundation Model v1.5 | 2024-2025 open model | 输入包含 `time`、`latlon`、`waves`、`gsd`；patch embedding 可拼接 latlon/time | [Docs](https://clay-foundation.github.io/model/release-notes/specification.html), [Embedding docs](https://clay-foundation.github.io/model/clay-v0/model_embeddings.html) | [GitHub](https://github.com/Clay-foundation/model) |
| TerraMind: Large-Scale Generative Multimodality for EO | 2025 ICCV | 将 geolocation 离散成 coordinate tokens；作为 token-level modality 与影像、DEM、LULC、NDVI 等融合 | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Jakubik_TerraMind_Large-Scale_Generative_Multimodality_for_Earth_Observation_ICCV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2504.11171), [Project](https://ibm.github.io/terramind/) | [GitHub](https://github.com/IBM/terramind), [HF](https://huggingface.co/papers/2504.11171) |
| Galileo: Learning Global & Local Features of Many Remote Sensing Modalities | 2025 ICML | 多模态、跨空间和时间建模；输入包含中心位置、天气、地形等多源时空变量 | [OpenReview](https://openreview.net/forum?id=gqZO3eSZRy), [arXiv](https://arxiv.org/abs/2502.09356) | [GitHub](https://github.com/nasaharvest/galileo) |
| AlphaEarth Foundations | 2025 Google DeepMind | 生成 2017-2024 年全球年度 64D embedding field；吸收空间、时间和多源观测上下文 | [DeepMind blog](https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/), [arXiv](https://arxiv.org/abs/2507.22291), [GEE tutorial](https://developers.google.com/earth-engine/tutorials/community/satellite-embedding-01-introduction) | [GCS/GEE dataset](https://developers.google.com/earth-engine/guides/aef_on_gcs_readme) |
| SkySense / SkySense++ | 2024 CVPR / 2025 NMI | 因子化多模态时空编码；SkySense++ 使用多模态、时间序列和语义增强预训练 | [SkySense CVPR](https://openaccess.thecvf.com/content/CVPR2024/papers/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.pdf), [SkySense++ NMI](https://www.nature.com/articles/s42256-025-01078-8) | [SkySense](https://github.com/Jack-bo1220/SkySense), [SkySense++](https://github.com/kang-wu/SkySensePlusPlus) |
| SSL4EO-S12 v1.1 | 2025 dataset update | 数据层面保留 cloud mask、geolocation 等 meta-information，便于自监督预训练 | [HF paper page](https://huggingface.co/papers/2503.00168) | HF datasets linked on page |
| TIGeR: Time, Images and Geo-location Retrieval | 2026 CVPR | 图像、geolocation、time 进入统一 geo-temporal embedding space | [arXiv](https://arxiv.org/abs/2603.24749), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Shatwell_TIGER_A_Unified_Framework_for_Time_Images_and_Geo-location_Retrieval_CVPR_2026_paper.pdf) | 未在检索结果中确认官方代码 |
| GT-Loc: Unifying When and Where in Images | 2025 ICCV | 地面图像、卫星图像、时间戳、地理位置四编码器联合检索；时间使用周期性 metric learning | [Project](https://davidshatwell.com/gtloc.github.io/), [CVF PDF](https://www.openaccess.thecvf.com/content/ICCV2025/papers/Shatwell_GT-Loc_Unifying_When_and_Where_in_Images_Through_a_Joint_ICCV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2507.10473) | project page shows code link area |
| EarthShift | 2026 arXiv | 评测层面构造真实世界地理/时间/尺度/传感器 shift | [arXiv](https://arxiv.org/abs/2605.29330), [Project](https://earthshift.github.io/) | project page |
| Geospatial FM Embeddings Improve Population Estimation Unevenly | 2026 arXiv | 分析 foundation-model embeddings 在不同空间和尺度上的不均匀收益 | [arXiv](https://arxiv.org/abs/2605.01650) | 未确认 |

## 4. 方法脉络

### 4.1 连续元数据作为 embedding

Clay 是最清楚的工程范式之一。其输入 batch 明确包含 `time`、`latlon`、`waves` 和 `gsd`；文档中还说明 embedding 输出表会保存 spatiotemporal metadata，便于在 GeoParquet 中做地理分析。Prithvi-EO-2.0 则在技术报告中强调 temporal/location embeddings，并在 HLS 2015-2024 全球时间序列上训练。

适合迁移的点：

- 把地理时间元数据放在 adapter，而不是改动 backbone。
- 对 week-of-year、hour/day、year 等周期变量用 sin/cos 或 toroidal encoding。
- 对经纬度避免直接 raw coordinate，可引入 S2 cell、MGRS tile、生态区 one-hot 或 learned spatial basis。

风险：

- 如果训练/测试区域重叠，模型可能把坐标当作类别查表。
- 如果只用随机 split，lat/lon embedding 的收益可能是虚假的。

### 4.2 离散 token 化：把坐标当“语言”

TerraMind 的一个重要设计是将 geolocation 当作 sequence-like modality：把地理坐标离散化并表示成字符串/特殊 coordinate tokens，与 captions 共用或扩展 text tokenizer，再参与任意模态生成。这个路线的好处是可以自然支持“给定位置生成/补全其他模态”，也便于和 LULC、NDVI、DEM、caption 等 token-level 信息融合。

适合迁移的点：

- 对遥感任务，可以把坐标 token 作为可选 prompt：启用/禁用它来测试是否有坐标依赖。
- 可以做 coordinate dropout，迫使模型不能只依赖坐标。
- 可以把气候区、生态区、行政区、MGRS tile 作为不同粒度 token，比较泛化。

风险：

- 坐标离散粒度过细会变成 location ID；过粗又不能表达生态梯度。
- 经纬度 token 不天然表达距离和邻近关系，最好配合连续或图结构编码。

### 4.3 统一 geo-time retrieval space

TIGeR 和 GT-Loc 虽然更偏通用视觉/地理定位，但对 GeoFM 很有启发：它们把图像、位置和时间映射到同一空间，从而支持用任意组合检索另一种模态，例如“给定位置和目标时间检索图像”。TIGeR 的任务定义很值得迁移到卫星：不是问“这张图像在哪里”，而是问“同一地点在另一个季节/年份应该是什么样”。

遥感迁移路径：

- 用 Sentinel-2/HLS 多年份同地块影像构造 `(image, latlon, date)` triplets。
- 支持 image -> time、image -> location、(location, target month) -> image retrieval。
- 下游可接 change detection、crop phenology、season-robust retrieval。

风险：

- 街景/地面图像和卫星俯视图差异大。
- 遥感传感器、云、GSD、物候等变量比自然图像时间戳更复杂。

### 4.4 年度 embedding field

AlphaEarth Foundations 把多源 EO 数据压成 2017-2024 年度 64D embedding field，Google Earth Engine/GCS 中提供年度全球嵌入。这类模型把时空上下文内化到 embedding 中，特别适合少标签制图、变化监测和跨年分析。

适合 RS-04 的研究点：

- 对 AlphaEarth embedding 做 year-to-year consistency 测试。
- 检查 embedding 维度是否与气候、植被、水文、地形变量相关。
- 分析下游误差是否在不同气候区、城市/农村、纬度带上不均匀。

风险：

- 公开的是 embedding，不一定能控制元数据注入方式。
- 很难区分模型学到的是地理规律还是数据集偏置。

### 4.5 评测与采样策略

EarthShift、PANGAEA、SSL4EO-S12 v1.1 这类工作提醒我们：地理时间元数据的价值必须用严格 split 验证。只在 random split 上汇报结果，会高估 latlon/time embedding。

建议最少包含四种 split：

1. Random split：测常规拟合能力。
2. Leave-region-out：测跨城市/跨生态区泛化。
3. Leave-year/season-out：测跨年和季节泛化。
4. Metadata-conflict split：故意给错误/扰动坐标或季节，测模型是否过度依赖元数据。

## 5. 可复现实验设计

### 5.1 目标

验证“地理时间条件化 adapter”是否能在冻结 GeoFM backbone 的情况下提升跨季节/跨区域表现，同时不让模型学会坐标捷径。

### 5.2 候选 backbone

- Clay v1.5：输入接口已支持 `time`、`latlon`、`waves`、`gsd`，最适合做快速原型。
- Prithvi-EO-2.0：多时相 HLS 预训练，适合 Sentinel-2/Landsat/HLS 任务。
- TerraMind：适合比较 coordinate token 与 continuous adapter 的差异。
- AlphaEarth embeddings：适合作为 frozen embedding baseline。

### 5.3 数据集与任务

| 任务 | 数据 | 为什么适合 |
|---|---|---|
| 土地覆盖分类/分割 | PANGAEA、GEO-Bench、Dynamic World 风格标签 | 类别受地区和季节影响明显 |
| 作物分类 | Sentinel-2/HLS crop mapping 数据 | 物候时间强，适合测试 week/month encoding |
| 洪水/野火制图 | Prithvi/灾害相关公开任务 | 异常事件能测试模型是否过度相信季节先验 |
| 人口/财富/城市指标 | AlphaEarth downstream papers | 可测 embedding 在空间和尺度上的不均匀性 |

### 5.4 GTCA 模型草案

**输入元数据**

- 连续：latitude、longitude、GSD、day-of-year、year。
- 周期：month/week/hour 的 sin/cos。
- 离散：MGRS tile、Koppen climate zone、ecoregion、sensor id。
- 可选：cloud fraction、solar zenith、acquisition season。

**结构**

1. `MetaEncoder`：分别编码 coordinate、cyclic time、year、climate/sensor tokens。
2. `GatedAdapter`：用元数据生成 LoRA/adaptation gate，注入每层或最后几层。
3. `Evidence Regularizer`：训练中随机 drop/perturb metadata，约束有无元数据时预测不能无理由剧烈变化。
4. `Anti-Shortcut Loss`：对同类跨区域样本拉近，对同区域不同类样本拉远，避免 location ID 记忆。

### 5.5 Baselines

- No metadata：只用图像。
- Naive concat：lat/lon/date 拼接到 CLS token。
- Clay-style continuous embedding。
- TerraMind-style coordinate tokens。
- Retrieval-only：用 AlphaEarth/Clay embedding + kNN + metadata filter。
- GTCA：本文方案。

### 5.6 指标

- 主任务：mIoU、F1、OA、mAP，按任务选择。
- 泛化：leave-region-out gap、leave-year-out gap、season shift gap。
- 坐标依赖：metadata perturbation sensitivity。
- 校准：ECE、NLL、uncertainty under wrong metadata。
- 公平性：按气候区/纬度带/城市农村分组误差。

## 6. 未来研究方向

1. **坐标捷径诊断 benchmark**  
   给同一影像配正确坐标、邻近坐标、远处同气候坐标、远处异气候坐标，测模型是否被坐标误导。

2. **生态区条件化而非原始坐标条件化**  
   用 Koppen 气候区、WWF ecoregion、海拔带替代精确 lat/lon，减少记住地点的可能。

3. **Geo-time adapter 的可关闭性**  
   训练一个可以在推理时调节 metadata 权重的 adapter，在异常事件场景降低季节先验。

4. **跨年 embedding drift 分析**  
   用 AlphaEarth/Clay/Prithvi embedding 检查同地块 2017-2024 的变化是否对应真实地表变化，而不是传感器或处理链 drift。

5. **从 retrieval 到 generation 的 geo-time prompting**  
   参考 TIGeR/TerraMind，研究“给定位置和季节，生成或检索合理的遥感表示”，再用于变化检测 hard negative。

## 7. 最小可行实验

第一周可做：

1. 选 Clay v1.5 或 AlphaEarth embedding 作为 frozen backbone。
2. 选一个 Sentinel-2 crop/land-cover 数据集，构造 random、leave-region、leave-year 三种 split。
3. 跑 no-metadata、naive metadata concat、GTCA-lite 三个 baseline。
4. 加入 metadata perturbation test：坐标随机偏移 10km/100km/1000km，月份偏移 3/6 个月。
5. 输出每组 split 的性能、校准和 metadata sensitivity。

如果 GTCA-lite 在 leave-region/leave-year 上提升，同时对错误 metadata 不过度敏感，就有继续扩展成论文的价值。

## 8. 读文献顺序

1. [Clay v1.5 specification](https://clay-foundation.github.io/model/release-notes/specification.html) 和 [Clay embeddings docs](https://clay-foundation.github.io/model/clay-v0/model_embeddings.html)
2. [Prithvi-EO-2.0 arXiv](https://arxiv.org/abs/2412.02732) 与 [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
3. [TerraMind ICCV 2025](https://openaccess.thecvf.com/content/ICCV2025/papers/Jakubik_TerraMind_Large-Scale_Generative_Multimodality_for_Earth_Observation_ICCV_2025_paper.pdf) 与 [GitHub](https://github.com/IBM/terramind)
4. [Galileo OpenReview](https://openreview.net/forum?id=gqZO3eSZRy) 与 [GitHub](https://github.com/nasaharvest/galileo)
5. [AlphaEarth Foundations](https://arxiv.org/abs/2507.22291) 与 [GEE dataset guide](https://developers.google.com/earth-engine/guides/aef_on_gcs_readme)
6. [TIGeR CVPR 2026](https://arxiv.org/abs/2603.24749) 和 [GT-Loc ICCV 2025](https://davidshatwell.com/gtloc.github.io/)
7. [EarthShift](https://arxiv.org/abs/2605.29330) 用于设计泛化评测

