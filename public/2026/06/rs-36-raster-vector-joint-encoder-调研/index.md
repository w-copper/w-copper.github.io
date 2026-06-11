# RS-36 Raster-Vector Joint Encoder 调研


# RS-36 Raster-Vector Joint Encoder 调研

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-36` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务来源：research/50threadprompts.md 中 RS36 范围：20242026，光学遥感/地理空间 AI 为主；不把 SAR 作为主线。 1. 问题定义 细问题：影像 patch、道路/建筑/地块 polygon、POI、行政区和 tabular covariates 如何进入同一个 encoder，并在不

## 正文

# RS-36 Raster-Vector Joint Encoder 调研

更新时间：2026-06-07  
任务来源：`research/50_thread_prompts.md` 中 RS-36  
范围：2024-2026，光学遥感/地理空间 AI 为主；不把 SAR 作为主线。

## 1. 问题定义

**细问题**：影像 patch、道路/建筑/地块 polygon、POI、行政区和 tabular covariates 如何进入同一个 encoder，并在不把矢量数据粗暴栅格化的情况下，共同学习可迁移的地理空间表示？

这个问题的价值在于：纯 raster foundation model 很擅长捕捉连续的光谱、纹理和空间形态，但它天然缺少显式对象、拓扑、地块边界、道路连通性、POI 功能语义和行政单元属性。矢量数据正好补这些信息，却又和影像 patch 的数据结构完全不同：点、线、面、标签表、拓扑关系、空间范围和时效性都不一致。

因此，2024-2026 的关键趋势是从“把 OSM/道路/建筑 rasterize 成额外通道”转向“把 raster patch 与 vector geoentity 直接对齐、交互和联合预训练”。

## 2. 代表论文与项目

| 论文/项目 | 年份/来源 | 链接 | 代码/资源 | 相关性 |
|---|---:|---|---|---|
| Spatial Representation Learning Beyond Pixels | 2026 arXiv | [arXiv](https://arxiv.org/abs/2606.02374) | 暂未见代码 | 观点/路线图论文，明确提出 raster perception 与 vector reasoning 需要进入统一 embedding space。 |
| GeoLink: Empowering Remote Sensing Foundation Model with OpenStreetMap Data | 2025 arXiv / NeurIPS 2025 repo 标注 | [arXiv HTML](https://ar5iv.labs.arxiv.org/html/2509.26016), [arXiv](https://arxiv.org/abs/2509.26016) | [GitHub](https://github.com/bailubin/GeoLink_NeurIPS2025) | 目前最直接的 RS patch + OSM geoentity 融合范式：OSM 异构图编码器、image-OSM contrastive learning、object-patch cross-attention。 |
| NARA: Anchor-Conditioned Relation-Aware Contextualization of Heterogeneous Geoentities | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.12276) | 暂未见官方代码 | 专注 vector geoentities，统一点、线、面，并建模语义、几何、距离和拓扑关系；可作为 raster-vector 系统中的 vector encoder。 |
| GeoViSTA: Geospatial Vision-Tabular Transformer | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.14406) | 暂未见官方代码 | 将 co-registered imagery 与 tabular/census tract token 用 bilateral cross-attention 融合，适合扩展到行政区/社会经济属性。 |
| Geo2Vec: Shape- and Distance-Aware Neural Representation of Geospatial Entities | 2025 arXiv / AAAI 2026 页面线索 | [arXiv](https://arxiv.org/abs/2508.19305) | [GitHub](https://github.com/chuchen2017/GeoNeuralRepresentation) | 用 signed distance field 思路统一点、线、面几何表示，强调形状、位置、距离和拓扑关系。 |
| Poly2Vec: Polymorphic Fourier-Based Encoding of Geospatial Objects | 2025 ICML | [arXiv](https://arxiv.org/abs/2408.14806) | [GitHub](https://github.com/USC-InfoLab/poly2vec) | 矢量对象统一编码框架，支持 OSM points/polylines/polygons，适合做 geometry encoder baseline。 |
| UrbanFusion: Stochastic Multimodal Fusion for Robust Spatial Representations | 2025 arXiv | [arXiv](https://arxiv.org/abs/2510.13774) | [GitHub](https://github.com/DominikM198/UrbanFusion) | 融合 remote sensing、street view、cartographic maps、POI 等城市多模态数据；适合作为多源融合训练目标参考。 |
| AETHER / Beyond AlphaEarth via POI-Guided Contrastive Learning | 2025 arXiv | [arXiv](https://arxiv.org/abs/2510.09894) | 需进一步确认官方代码 | 用 POI 语义对齐 AlphaEarth/EO embedding，使物理影像表示获得城市功能语义。 |
| GeoSynth | 2024 CVPR EarthVision | [Project](https://vishu26.github.io/geosynth/index.html) | 项目页含 arXiv/GitHub/模型入口 | 用 OSM layout 控制卫星图像生成，说明 vector layout 可作为生成式先验；更偏数据生成，但可迁移到对齐预训练。 |
| MapTracker | 2024 ECCV Oral | [Project](https://map-tracker.github.io/) | 项目页含 paper/code | 自动驾驶 HD map 方向，使用 raster BEV latent 与 vector road-element latent；不是遥感，但 raster-vector latent tracking 很可迁移。 |

## 3. 方法脉络

### 3.1 旧路线：矢量转栅格或转标签

常见做法是把 OSM 道路、建筑、土地利用 polygon rasterize 成额外通道，或者直接作为弱标签训练 segmentation。优点是工程简单，能沿用 CNN/ViT；缺点是会损失拓扑关系、对象边界、标签表语义和多尺度结构。GeoLink 的论文把这类路线归纳为 data conversion / data derivation / knowledge graph 等间接融合方式，并指出它们往往任务特定、区域小、空间信息损失较大。

### 3.2 新路线：RS patch 与 OSM geoentity 直接融合

GeoLink 是最贴近 RS-36 的核心参考。它包含三个关键模块：

- RS image encoder：ViT 对遥感 patch 编码。
- OSM encoder：把 OSM 点、线、面构成异构图，节点带 tag semantics，边带空间/拓扑关系。
- object-patch fusion encoder：用 cross-attention 让影像 patch 与 OSM node/object 交互，得到 hybrid RS-OSM patch encoding 和 hybrid OSM-RS object encoding。

GeoLink 的预训练目标也很值得复用：

- image mask reconstruction：保留 MAE 风格 raster 表示学习。
- region-image contrastive alignment：同一地理范围内的 RS image 与 OSM graph 对齐。
- object-patch spatial consistency：让 OSM object 与附近 image patch 的融合具有空间一致性。

这比“OSM rasterize 后拼通道”更强，因为模型仍保留矢量对象粒度，并能在 patch-object 层面学习对应关系。

### 3.3 Vector-only encoder：点、线、面如何统一

NARA、Poly2Vec、Geo2Vec 是 raster-vector joint encoder 的关键组件候选。

- Poly2Vec：用 Fourier-style polymorphic encoding 统一点、线、面，适合快速得到 fixed-length vector geometry embedding。
- Geo2Vec：用 signed distance field 直接在原空间表达 geoentity，强调细粒度边界、距离和拓扑。
- NARA：进一步把 geoentity 放进上下文里，建模语义、几何、距离、拓扑和 anchor-conditioned relations。

对 RS-36 来说，一个合理路线是：先用 Geo2Vec/Poly2Vec 编码单个几何，再用 NARA/heterogeneous graph transformer 编码区域内对象关系，最后和 image patch 做 cross-attention。

### 3.4 Tabular/POI/行政区 token 融合

GeoViSTA 提醒我们，很多地理空间任务不是纯“影像 + OSM geometry”，还需要 census tract、人口、健康、火灾风险等 tabular covariates。它用 geography-aware attention 对齐连续 image patches 与 irregular tabular tokens。AETHER/POI-guided contrastive learning 则强调 POI 能给 EO embedding 注入人类活动和城市功能语义。

这说明 raster-vector joint encoder 不应该只看几何；POI tag、行政区属性、道路等级、建筑用途、地块类型都应成为 token semantics。

## 4. 当前问题

1. **空间对齐不可靠**：遥感影像、OSM、建筑 footprint、行政边界可能来自不同年份和不同坐标精度。直接 cross-attention 会把不存在或错位的对象对齐到 patch。
2. **矢量数据噪声高**：OSM tag 稀疏、自由标签体系不统一，建筑用途/道路等级/POI 语义随地区变化很大。
3. **几何类型异构**：点、线、面在尺度、拓扑和面积覆盖上差异很大，统一成 token 后容易丢掉形状和边界细节。
4. **粒度不匹配**：一个 image patch 可能覆盖多个小建筑，也可能只覆盖一个大 polygon 的一角；一个行政区 token 又覆盖大量 patch。
5. **负迁移风险**：矢量先验可能让模型在 OSM 完整地区很好，在 OSM 缺失或过时地区反而更差。
6. **评测缺失**：现有 benchmark 很少显式测试 raster-only、vector-only、raster+vector 在跨地区、矢量缺失、矢量错位下的差异。

## 5. 可投稿的小课题方案

### 题目草案

**GeoPatch-Entity: Uncertainty-Aware Raster-Vector Joint Encoding for Remote Sensing Foundation Models**

### 核心假设

如果把 OSM/建筑/道路/地块等 vector geoentities 作为带不确定性的对象 token，与遥感 image patch 进行空间约束 cross-attention，而不是简单 rasterize 成通道，就能在城市功能区、土地覆盖、建筑/道路分割和人口/碳排估计等任务上获得更强的跨区域泛化，并降低矢量错位带来的负迁移。

### 模型结构

1. **Raster branch**：使用 Prithvi/Clay/SkySense/ViT-MAE/GeoLink image encoder 提取 patch tokens。
2. **Vector branch**：点/线/面先用 Poly2Vec 或 Geo2Vec 得到 geometry embedding；tag-value 文本用 BERT/Sentence-BERT 编码；再进入 heterogeneous graph transformer。
3. **Spatial alignment module**：根据 patch footprint 与 geoentity geometry 计算 overlap、distance、contains/intersects/adjacent 等关系，作为 attention bias。
4. **Uncertainty gate**：为每个 vector token 估计可靠度，来源包括 OSM timestamp、tag completeness、geometry-image consistency、region OSM density。
5. **Fusion module**：双向 cross-attention，输出 image-enhanced entity tokens 与 vector-enhanced patch tokens。
6. **Pretraining objectives**：masked image reconstruction、masked tag reconstruction、region-level contrastive alignment、object-patch consistency、geometry relation prediction。

### 数据对齐方案

- 影像：Sentinel-2、NAIP、Bing/Google-style VHR 数据，或公开城市遥感数据集。
- 矢量：OpenStreetMap via Overpass/Geofabrik，Overture Maps，Microsoft building footprints，行政区/census tract。
- 单位：以 fixed geohash/H3 tile 或 image tile 为 region；每个 region 内保留 patch grid 和 vector objects。
- 坐标：统一 CRS，记录数据时间戳；所有 geometry 与 patch footprint 保存原始关系，不只保存 rasterized mask。

## 6. 实验矩阵

| 实验 | 数据 | Baseline | 指标 | 目的 |
|---|---|---|---|---|
| Land cover / scene classification | EuroSAT、MLRSNet、RESISC-45、城市 VHR | raster-only ViT/GeoFM、GeoLink unimodal、rasterized OSM channel | Acc、F1、cross-city Acc | 测 vector 信息是否提升语义判别 |
| Urban function zone segmentation | UFZ/城市功能区数据、OSM + VHR | U-Net/SegFormer、GeoLink、rasterized OSM | mIoU、macro-F1、rare-class F1 | 测 POI/道路/建筑 tag 对功能语义的贡献 |
| Building/road segmentation | SpaceNet、DeepGlobe Road、Vaihingen/Potsdam + OSM | SegFormer、SAM-assisted、topology postprocess | mIoU、Boundary F1、Connectivity、Topo-F1 | 测 geometry/topology 是否改善边界和连通性 |
| Population/carbon/health proxy | census tract + imagery + tabular | image-only AlphaEarth/Prithvi、GeoViSTA-style tabular fusion | RMSE、MAE、spatial CV | 测行政区/tabular token 与 image patch 的协同 |
| Robustness stress test | OSM missing/noisy/shifted variants | 同上 | performance drop、calibration ECE | 测矢量缺失、错位、过时带来的负迁移 |

## 7. Baseline 推荐

- **Raster-only**：MAE/ViT、Prithvi-EO-2.0、Clay、SkySense、AlphaEarth embeddings。
- **Rasterized-vector**：把 OSM roads/buildings/landuse rasterize 成额外通道或弱标签。
- **Region contrastive**：RS image embedding 与 OSM graph/POI aggregate 做 CLIP-style 对齐。
- **GeoLink**：最重要的 direct fusion baseline。
- **Vector-only**：Poly2Vec、Geo2Vec、NARA-style vector encoder。
- **Tabular fusion**：GeoViSTA-style bilateral cross-attention。

## 8. 失败模式与消融

必须做的消融：

- 无 vector、rasterized vector、direct vector token 三者比较。
- 只用 geometry、只用 tags、geometry+tags。
- 无 attention bias、distance bias、topology bias、overlap bias。
- OSM 完整、OSM 随机 drop、OSM 系统性缺失、OSM 平移错位。
- city-in-domain 与 leave-city-out。
- patch size 对小对象对齐的影响。

重点失败模式：

- 模型过度相信 OSM，导致影像中真实新增建筑/道路被忽略。
- POI 稠密地区性能好，POI 稀疏地区性能崩。
- 大 polygon 覆盖多个语义区域，给 patch 带来错误先验。
- 矢量 timestamp 旧，城市更新区域出现强负迁移。

## 9. 未来研究方向

1. **时效性感知 vector token**：把 OSM/建筑 footprint 的时间戳、不确定性和更新频率纳入 token reliability。
2. **可微拓扑约束**：不仅把拓扑作为 attention bias，还让模型预测 contains/intersects/adjacent 等关系。
3. **polygon-native decoder**：从 fused patch/entity tokens 直接输出建筑/道路/地块 polygon，而不是先 raster mask 再矢量化。
4. **缺失矢量鲁棒训练**：训练时随机删除道路、建筑、POI 或行政区 token，让模型不依赖某一类先验。
5. **多尺度 geoentity memory**：地块、街区、行政区、城市四级 token 共同参与推理。
6. **证据可解释 VLM 扩展**：让遥感 VLM 回答问题时同时引用 image patch 和 vector entity 作为证据。

## 10. 最小可行实验

最小实验建议先做 **OSM-assisted urban function zone segmentation**：

1. 取一个城市级 VHR/航空影像数据集，配套 OSM roads/buildings/POIs。
2. 构建三种输入：image-only、image+rasterized OSM、image+vector tokens。
3. Vector branch 先用简单 geometry features + tag text encoder + graph attention。
4. Fusion 使用 patch-entity cross-attention，并加入 overlap/distance attention bias。
5. 评估 mIoU、macro-F1、leave-district-out 泛化，以及 OSM drop/shift robustness。

如果这个最小实验显示 direct vector token 比 rasterized OSM 更稳，就可以扩展到 GeoFM 预训练或 foundation embedding adapter。

## 11. 参考链接

- [Spatial Representation Learning Beyond Pixels](https://arxiv.org/abs/2606.02374)
- [GeoLink arXiv HTML](https://ar5iv.labs.arxiv.org/html/2509.26016)
- [GeoLink GitHub](https://github.com/bailubin/GeoLink_NeurIPS2025)
- [NARA](https://arxiv.org/abs/2605.12276)
- [GeoViSTA](https://arxiv.org/abs/2605.14406)
- [Geo2Vec](https://arxiv.org/abs/2508.19305)
- [Geo2Vec GitHub](https://github.com/chuchen2017/GeoNeuralRepresentation)
- [Poly2Vec arXiv](https://arxiv.org/abs/2408.14806)
- [Poly2Vec GitHub](https://github.com/USC-InfoLab/poly2vec)
- [UrbanFusion](https://arxiv.org/abs/2510.13774)
- [UrbanFusion GitHub](https://github.com/DominikM198/UrbanFusion)
- [AETHER / Beyond AlphaEarth via POI-Guided Contrastive Learning](https://arxiv.org/abs/2510.09894)
- [GeoSynth](https://vishu26.github.io/geosynth/index.html)
- [MapTracker](https://map-tracker.github.io/)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

