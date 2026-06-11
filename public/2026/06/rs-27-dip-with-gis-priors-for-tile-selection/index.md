# RS-27 DIP with GIS Priors for Tile Selection


# RS-27 DIP with GIS Priors for Tile Selection

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-27` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：把 dynamic image pyramid / coarsetofine tile selection 与 GIS 先验结合，让道路、水系、建筑密度、历史变化热力图、POI 等外部地理信息指导高分辨率 tile 选择，用于遥感 VQA 和 visual grounding。 结论先行 这个方向的研究空位比较清晰：ICC

## 正文

# RS-27 DIP with GIS Priors for Tile Selection

更新时间：2026-06-07  
细问题：把 dynamic image pyramid / coarse-to-fine tile selection 与 GIS 先验结合，让道路、水系、建筑密度、历史变化热力图、POI 等外部地理信息指导高分辨率 tile 选择，用于遥感 VQA 和 visual grounding。

## 结论先行

这个方向的研究空位比较清晰：ICCV 2025 的 LRS-VQA / Dynamic Image Pyramid 已经证明“大幅面遥感 VLM 不能直接缩放整图，需要 coarse-to-fine tile selection 和 text-guided token pruning”。但它的 selection 主要依赖图像和文本相关性；遥感任务天然有 GIS 层，例如道路、水体、建筑 footprint、POI、地块、历史变化区域。当前还缺一个系统研究：这些 GIS 先验如何进入 tile selection，什么时候帮忙，什么时候导致模型偷看地图或被过期地图误导。

最值得做的小论文题目可以是：

> **GeoPrior-DIP: GIS-prior guided dynamic image pyramid for evidence-grounded remote sensing VQA and visual grounding.**

核心假设：在大幅面遥感图像中，若问题和地理关系相关，例如“道路旁的受损建筑”“靠近水体的施工区域”“机场附近的飞机”“高建筑密度区域中的停车场”，把 GIS prior 作为 tile selection 的软约束，可以在相同高分辨率 tile budget 下提升 evidence tile recall、grounding IoU 和 VQA accuracy；但必须加入 image-only / GIS-only / noisy-GIS 对照，避免模型只靠地图先验猜答案。

## 代表论文与项目

| 类别 | 论文/项目 | 年份/来源 | 链接 | 与 RS-27 的关系 |
|---|---|---:|---|---|
| 大图 VLM / DIP | When Large Vision-Language Model Meets Large Remote Sensing Imagery: Coarse-to-Fine Text-Guided Token Pruning | ICCV 2025 | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Luo_When_Large_Vision-Language_Model_Meets_Large_Remote_Sensing_Imagery_Coarse-to-Fine_ICCV_2025_paper.html), [arXiv](https://arxiv.org/abs/2503.07588), [GitHub/LRS-VQA](https://github.com/VisionXLab/LRS-VQA) | 直接前作；提出 Dynamic Image Pyramid 和 text-guided pruning，是本方向的 image/text baseline。 |
| 大图检索 | Text-to-Region Retrieval in Large EO Mosaics | 本项目 RS-08 | [本地文件](./rs08_text_to_region_retrieval.md) | 已提出 GIS prior index 思路；RS-27 将其从检索扩展到 VQA/grounding tile selection。 |
| 证据约束 VQA | Evidence-Grounded RS-VQA | 本项目 RS-06 | [本地文件](./rs06_evidence_grounded_rsvqa.md) | 提供 answer + evidence tile/bbox/mask 的评价框架，可直接作为 RS-27 的任务定义。 |
| 视觉定位 | GeoGround: A Unified Large Vision-Language Model for Remote Sensing Visual Grounding | arXiv 2024 | [arXiv](https://arxiv.org/abs/2411.11904), [GitHub](https://github.com/VisionXLab/GeoGround) | 可提供 HBB/OBB/mask grounding baseline；GIS-prior selection 可以作为高分辨率候选 tile 前端。 |
| VLM benchmark | GEOBench-VLM | ICCV 2025 | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf), [GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM) | 任务覆盖计数、定位、分割、时序分析；可借鉴任务类型和人工核验方式。 |
| RS-VLM 数据 | VRSBench | NeurIPS 2024 Datasets & Benchmarks | [arXiv](https://arxiv.org/abs/2406.12384), [GitHub](https://github.com/lx709/VRSBench) | 有 caption、object reference、VQA，可作为 evidence-grounded QA 数据源之一。 |
| Geo prior VLM | GeoPriorCLIP | 2025/2026 方向 | [ORNL page](https://impact.ornl.gov/en/publications/geopriorclip-a-foundational-remote-sensing-vision-language-model-/) | 通过级联地理信息先验增强 RSVLM，说明“地理先验 + 图文对齐”是合理路线。 |
| Raster-vector 表示 | Spatial Representation Learning Beyond Pixels | arXiv 2026 | [arXiv](https://arxiv.org/abs/2606.02374) | 代表 raster 与 vector semantics 融合趋势；RS-27 可把 vector semantics 下沉为 tile prior。 |
| Geoentity 表示 | NARA: Anchor-Conditioned Relation-Aware Contextualization of Heterogeneous Geoentities | arXiv 2026 | [arXiv](https://arxiv.org/abs/2605.12276) | 提供 heterogeneous geoentities / relation-aware 表示思路，适合建 POI/road/building relation prior。 |
| 图像+表格/环境变量 | GeoViSTA: Geospatial Vision-Tabular Transformer | arXiv 2026 | [arXiv](https://arxiv.org/abs/2605.14406) | 说明遥感/地理任务正在融合 image + tabular/geospatial attributes。 |
| 鲁棒性 | EarthShift | arXiv 2026 | [arXiv](https://arxiv.org/abs/2605.29330), [project](https://earthshift.github.io/) | 可用于测试 GIS prior 在真实分布偏移下是否仍有效。 |
| 地图先验数据 | OpenStreetMap | 持续更新 | [OSM](https://www.openstreetmap.org/), [Overpass API](https://overpass-api.de/) | 道路、水体、POI、landuse 的主要开放来源，但存在时效和覆盖偏差。 |
| 建筑 footprint | Microsoft Global ML Building Footprints | 数据源 | [GitHub](https://github.com/microsoft/GlobalMLBuildingFootprints) | 建筑密度、建筑 footprint entropy、urban prior。 |
| 建筑 footprint | Google Open Buildings | 数据源 | [project](https://sites.research.google/open-buildings/) | 适合非洲、南亚等区域的建筑先验与覆盖偏差分析。 |
| 动态地表 | Dynamic World | 数据源 | [project](https://dynamicworld.app/), [Nature article](https://www.nature.com/articles/s41597-022-01307-4) | 可构造历史变化热力图和水体/植被/建成区先验。 |

## 问题由来

大幅面遥感 VQA 和 grounding 有一个很具体的瓶颈：问题相关区域可能只占整图极小比例。直接缩放整图会吞掉小目标；固定切 tile 会让 token 数和延迟爆炸；只靠低分辨率图像注意力又容易漏掉语义弱但地理关系强的目标。

GIS 先验之所以有价值，是因为很多遥感问题本来就带有空间关系：

- “道路旁的建筑是否受损”：候选区域应靠近道路和建筑 footprint。
- “水体附近是否出现新施工”：候选区域应靠近水体边界，且历史变化热力图较高。
- “机场停机坪上有多少飞机”：候选区域应靠近 airport/runway/apron POI 或 OSM aeroway。
- “城市边缘是否有新增裸地”：候选区域应在建成区边缘，且多时相变化显著。
- “桥梁附近是否有洪水淹没道路”：候选区域应同时满足 road-water intersection / bridge prior。

这不是把 GIS 信息粗暴拼给 VLM。真正的问题是：**在高分辨率 tile budget 有限时，GIS prior 如何帮助选择该放大的局部区域，同时不让模型偷懒只靠地图作答。**

## Proposed Method: GeoPrior-DIP

### 输入与输出

输入：

- 大幅面光学遥感图像或 mosaic：`I`
- 自然语言问题或 grounding query：`q`
- 多尺度 tile pyramid：`T_l = {t_i^l}`
- 可选 GIS 层：道路、水体、建筑 footprint、POI、地块、行政边界、历史变化热力图

输出：

- VQA：答案 `a`、证据 tile ids、bbox/mask、置信度
- Grounding：目标 bbox/OBB/mask、证据 tile ids、GIS consistency score

### 模块 1：Query-to-Prior Parser

把问题中的地理实体和关系解析成 prior weights。

| Query token / relation | 对应 GIS prior |
|---|---|
| road, highway, bridge, intersection, runway | road density, distance-to-road, road class, line orientation |
| river, lake, coastline, flooded, water | water mask overlap, distance-to-water, flood/change score |
| building, residential, dense urban, damaged | building footprint density, footprint size distribution, building-road adjacency |
| airport, school, hospital, port, factory | POI category count, distance-to-POI, landuse tag |
| newly built, changed, expanded, damaged | historical change heatmap, multi-temporal embedding difference |
| near, adjacent, inside, between, along | distance transform, topology relation, containment, intersection |

实现上先不必训练 parser。最小版本可以用规则和关键词；增强版本可用 LLM 抽取 `(entity, relation, prior_type)`，再映射到 GIS feature。

### 模块 2：Tile Prior Feature Bank

对每个 tile 预计算 GIS 特征，避免推理时重复 rasterize。

```text
tile_features[t] = {
  road_density,
  distance_to_major_road_min,
  water_fraction,
  distance_to_water_min,
  building_density,
  building_footprint_entropy,
  poi_type_histogram,
  landuse_histogram,
  historical_change_score,
  map_age_or_confidence,
  gis_coverage_flag
}
```

注意：每个 GIS layer 要记录来源和时间戳。过期道路、缺失建筑 footprint、POI 覆盖偏差都要进入鲁棒性测试，而不是被当作干净真值。

### 模块 3：Image/Text/GIS Fusion Scorer

对候选 tile 计算三类分数：

```text
S(t | q) =
  alpha * S_visual_lowres(t, q)
+ beta  * S_gis_prior(t, q)
+ gamma * S_uncertainty_or_novelty(t)
- lambda * S_redundancy(t, selected_tiles)
```

- `S_visual_lowres`：LRS-VQA/DIP 风格的低分辨率图文相关性。
- `S_gis_prior`：query parser 权重与 tile GIS feature 的匹配度。
- `S_uncertainty_or_novelty`：避免只选最像的区域，保留可能漏检的小目标/长尾区域。
- `S_redundancy`：diversity term，避免 top-K 都集中在同一片城区。

关键设计：GIS prior 只用于 tile selection 和 reranking，不直接生成最终答案。最终答案必须由高分辨率图像证据支持。

### 模块 4：Coarse-to-Fine Selection

1. Level 0：低分辨率全图，计算 image/text saliency。
2. Level 1：粗 tile，融合 GIS prior，选 top-K。
3. Level 2：对子 tile 继承父 tile GIS feature，并加入局部 rasterized prior。
4. Level 3：高分辨率 tile 送入 VLM/grounding head。
5. Re-query：如果 answer confidence 高但 evidence/GIS consistency 低，触发更多 tile。

### 模块 5：Evidence-Grounded Answering

输出必须包含证据：

```yaml
answer: "yes / count / class / description"
evidence:
  tile_ids: [...]
  bbox_or_mask: [...]
scores:
  answer_confidence: ...
  tile_recall_proxy: ...
  gis_consistency: ...
  image_gis_disagreement: ...
```

当 GIS prior 与图像证据冲突时，模型应报告 `image_gis_disagreement`，例如 OSM 显示有道路但影像里道路已被淹没或地图过期。

## 任务设计

### Task A：GIS-guided Large Image VQA

样例问题：

- “Is there a damaged building near the main road?”
- “How many aircraft are parked near the runway?”
- “Are there construction changes along the river?”
- “Is the flooded area covering any road segments?”
- “Which dense-building area contains a parking lot?”

标注：

- answer
- evidence tile id
- bbox/mask
- query relation type：road / water / building / POI / change
- GIS layer availability and timestamp

### Task B：GIS-guided Visual Grounding

输入 query：

- “the building cluster west of the river”
- “the bridge crossing the flooded road”
- “airplanes near the terminal apron”
- “new bare soil patches beside the highway”

输出 bbox/OBB/mask。重点测 tile selection 是否先找到正确 high-res tile，再测 grounding。

### Task C：Map-Image Disagreement Detection

这是最有新意的扩展任务：故意收集地图过期或遥感影像显示变化的区域，让模型判断“GIS prior 与影像是否冲突”。这能防止 GIS prior 变成捷径。

## 数据构造方案

### 最小可行数据集

| 组件 | 数据来源 | 用途 |
|---|---|---|
| 大图/高分辨率影像 | LRS-VQA、xView、SpaceNet、DeepGlobe、Vaihingen/Potsdam、NAIP/Maxar 可用区域 | 大图 VQA / grounding 主影像 |
| 道路 | OSM roads、SpaceNet Roads、DeepGlobe Roads | road prior、bridge/intersection queries |
| 建筑 | Microsoft Global ML Building Footprints、Google Open Buildings、SpaceNet buildings | building density、building footprint prior |
| 水体 | OSM water、Dynamic World、JRC Global Surface Water | water proximity、flood/water relation |
| POI | OSM POI tags | airport/school/hospital/port/factory prior |
| 历史变化 | Dynamic World time series、Sentinel-2 NDVI/NDBI/NDWI diff、已有 change labels | change heatmap prior |

### 标注流程

1. 选 20-50 张大幅面影像或 mosaic。
2. 对齐 OSM/建筑/水体/POI GIS 层，生成多尺度 tile feature bank。
3. 按 prior 类型自动生成候选 query，例如 road-near-building、water-near-road、airport-aircraft。
4. 用 GIS 只生成候选，不直接当真值；人工核验 answer 与 evidence bbox/mask。
5. 构造 noisy-GIS split：随机删除、平移、过期或替换部分 GIS layer。

## Baselines

| Baseline | 描述 | 目的 |
|---|---|---|
| Fixed grid | 固定切 tile，按顺序或均匀采样 | 最朴素成本基线 |
| Low-res only | 缩放整图直接 VQA/grounding | 测小目标损失 |
| Image-only DIP | LRS-VQA 风格，仅用 image/text saliency | 直接前作 |
| GIS-only selector | 只用 GIS prior 选 tile，再看图回答 | 检测 prior shortcut |
| Late fusion | image-only top-K 与 GIS top-K 合并 | 简单融合 |
| GeoPrior-DIP | image/text/GIS/uncertainty 联合 scorer | 目标方法 |
| Oracle tile | 用标注 evidence tile 作为上限 | 测后端 VLM/grounding 上限 |

## 指标

### Tile selection 指标

- `Evidence Tile Recall@K`：top-K tile 是否覆盖人工证据区域。
- `Evidence Area Coverage@K`：top-K tile 覆盖证据 mask 的比例。
- `Tile Budget`：平均处理高分辨率 tile 数。
- `Token/Latency Cost`：视觉 token 数、推理时间、显存。
- `Selection Diversity`：选中 tile 的空间分散程度，避免只集中在城区。

### VQA / Grounding 指标

- VQA accuracy / F1 / exact match。
- Grounding IoU、mAP、pointing game accuracy。
- Evidence consistency：答案是否由证据 bbox/mask 支撑。
- Relation correctness：near/inside/along/intersection 等空间关系是否成立。

### GIS 依赖与鲁棒性指标

- `Prior Reliance Gap`：image+GIS 与 GIS-only 的差距。若 GIS-only 很高，要警惕捷径。
- `Noisy-GIS Robustness`：GIS layer 删除、平移、过期时性能下降。
- `Image-GIS Conflict Detection`：地图和影像冲突时能否拒绝或报告不一致。
- `Coverage Bias`：不同国家/城乡/OSM 完整度下的性能差异。

## Ablation Matrix

| 实验 | Road | Water | Building | POI | Change heatmap | Uncertainty | 目标问题 |
|---|---:|---:|---:|---:|---:|---:|---|
| A0 image-only DIP | 0 | 0 | 0 | 0 | 0 | 0 | 直接前作 |
| A1 + road | 1 | 0 | 0 | 0 | 0 | 0 | road-near-object 是否提升 |
| A2 + water | 0 | 1 | 0 | 0 | 0 | 0 | flood/river/coast query |
| A3 + building | 0 | 0 | 1 | 0 | 0 | 0 | dense urban/building query |
| A4 + POI | 0 | 0 | 0 | 1 | 0 | 0 | airport/port/school/hospital query |
| A5 + change heatmap | 0 | 0 | 0 | 0 | 1 | 0 | newly built/damaged/expanded query |
| A6 all GIS | 1 | 1 | 1 | 1 | 1 | 0 | GIS 全量收益 |
| A7 all + uncertainty | 1 | 1 | 1 | 1 | 1 | 1 | 防止漏掉 prior 弱区域 |
| A8 noisy GIS | 1 | 1 | 1 | 1 | 1 | 1 | 地图错误下的鲁棒性 |
| A9 GIS-only | 1 | 1 | 1 | 1 | 1 | 0 | 检查捷径和偏置 |

## 预期结果表

论文中可以把结果表设计成这样：

| Method | Tile R@5 | Evidence Coverage@5 | VQA Acc | Grounding IoU | Tokens | Latency | Noisy-GIS Drop |
|---|---:|---:|---:|---:|---:|---:|---:|
| Low-res only | 低 | 低 | 中 | 低 | 低 | 低 | - |
| Fixed grid | 中 | 中 | 中 | 中 | 高 | 高 | - |
| Image-only DIP | 中高 | 中高 | 中高 | 中高 | 中 | 中 | - |
| GIS-only | query-dependent | query-dependent | 不稳定 | 不稳定 | 低 | 低 | 高 |
| GeoPrior-DIP | 高 | 高 | 高 | 高 | 中 | 中 | 可控 |
| Oracle tile | 上限 | 上限 | 上限 | 上限 | 中 | 中 | - |

## 关键风险

1. **GIS shortcut**：模型可能只靠地图作答，例如 OSM 有 airport 就回答有飞机。解决：必须做 image-only、GIS-only、image+GIS、noisy-GIS 四组。
2. **地图过期**：OSM/建筑 footprint 与影像时间不一致。解决：记录 GIS timestamp，构造 image-GIS conflict split。
3. **覆盖偏差**：OSM 在欧美城市更完整。解决：按国家、城乡、OSM completeness 分层报告。
4. **空间错位**：矢量数据与影像存在 meter-level shift。解决：tile-level prior 用软距离场，不用硬 intersection。
5. **先验过强导致漏检**：不在地图附近的目标被忽略。解决：加入 uncertainty/novelty branch，保留 image-only 高不确定区域。
6. **评价混淆**：VQA 答案提升可能来自更好的 tile selection，也可能来自后端 VLM。解决：单独报告 tile recall 与 oracle tile 上限。

## 最小实验路线

### Week 1：数据与 feature bank

- 选 10-20 张大图，优先 LRS-VQA 或公开 VHR 城市影像。
- 用 OSM + building footprints + water layer 对齐影像 footprint。
- 构造 3 层 pyramid：全图、1024/2048 tile、512/1024 子 tile。
- 预计算 road/water/building/POI/change features。

### Week 2：Baseline selector

- 实现 fixed grid、image-only DIP、GIS-only selector、late fusion。
- 先做 tile recall，不接复杂 VLM。
- 人工标注 100-200 个 evidence tile/query。

### Week 3：GeoPrior-DIP

- 实现 query parser 和 fusion scorer。
- 加 uncertainty/diversity term。
- 接 GeoGround/GroundingDINO/SAM 或 VLM QA 后端。

### Week 4：Ablation 与论文雏形

- 做 A0-A9 ablation。
- 做 noisy-GIS：删除 30% road、平移 building footprint、替换 POI。
- 报告 tile recall、answer accuracy、grounding IoU、cost、prior reliance gap。

## 可投稿贡献点

1. **任务贡献**：第一个系统研究 GIS-prior guided tile selection 的遥感大图 VQA/grounding benchmark。
2. **方法贡献**：GeoPrior-DIP，将 image/text saliency、GIS prior、uncertainty/diversity 融合到 dynamic pyramid selection。
3. **评测贡献**：提出 prior reliance gap、noisy-GIS robustness、image-GIS conflict detection 等指标。
4. **实践贡献**：降低高分辨率 tile 处理量，在 relation queries 上提升 evidence recall。

目标 venue：TGRS / ISPRS JPRS / CVPR EarthVision / ICCV workshop；若数据和实验足够强，可向 ICCV/CVPR 地理空间 VLM 方向冲击。

## 与相邻线程的关系

- RS-06：提供 evidence-grounded VQA 评价。
- RS-08：提供 text-to-region retrieval 的粗索引思路。
- RS-09：提供 HBB/OBB/mask grounding 后端。
- RS-21：提供真实分布偏移和 OOD split 设计。
- RS-39：后续可专门研究 POI-assisted VLM reasoning，避免 POI shortcut。

## 需要继续检索的关键词

- `large remote sensing imagery vision language model dynamic image pyramid`
- `coarse-to-fine tile selection remote sensing VQA`
- `GIS priors remote sensing visual grounding`
- `OpenStreetMap prior remote sensing VLM`
- `raster vector fusion geospatial foundation model`
- `map prior guided tile selection satellite imagery`

## 参考链接

1. [When Large Vision-Language Model Meets Large Remote Sensing Imagery, ICCV 2025](https://openaccess.thecvf.com/content/ICCV2025/html/Luo_When_Large_Vision-Language_Model_Meets_Large_Remote_Sensing_Imagery_Coarse-to-Fine_ICCV_2025_paper.html)
2. [LRS-VQA GitHub](https://github.com/VisionXLab/LRS-VQA)
3. [GeoGround arXiv](https://arxiv.org/abs/2411.11904)
4. [GeoGround GitHub](https://github.com/VisionXLab/GeoGround)
5. [GEOBench-VLM CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf)
6. [GEOBench-VLM GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM)
7. [VRSBench arXiv](https://arxiv.org/abs/2406.12384)
8. [VRSBench GitHub](https://github.com/lx709/VRSBench)
9. [GeoPriorCLIP ORNL page](https://impact.ornl.gov/en/publications/geopriorclip-a-foundational-remote-sensing-vision-language-model-/)
10. [Spatial Representation Learning Beyond Pixels arXiv](https://arxiv.org/abs/2606.02374)
11. [NARA arXiv](https://arxiv.org/abs/2605.12276)
12. [GeoViSTA arXiv](https://arxiv.org/abs/2605.14406)
13. [EarthShift arXiv](https://arxiv.org/abs/2605.29330)
14. [OpenStreetMap](https://www.openstreetmap.org/)
15. [Overpass API](https://overpass-api.de/)
16. [Microsoft Global ML Building Footprints](https://github.com/microsoft/GlobalMLBuildingFootprints)
17. [Google Open Buildings](https://sites.research.google/open-buildings/)
18. [Dynamic World](https://dynamicworld.app/)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

