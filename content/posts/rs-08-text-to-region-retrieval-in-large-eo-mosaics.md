---
title: "RS-08 Text-to-Region Retrieval in Large EO Mosaics"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感VLM", "视觉语言", "地理空间推理"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-08 Text-to-Region Retrieval in Large EO Mosaics

## 研究问题

把遥感图文检索从“给一句文本，检索一张固定裁剪图”推进到“给一句自然语言，在大范围地理空间影像镶嵌图中检索一个或多个候选区域”。例如：

- “找到沿河分布、旁边有密集建筑的太阳能板区域。”
- “找出疑似新建物流园区：大屋顶、规则停车区、靠近高速出入口。”
- “在这个城市范围内找可能的采石场或裸土扩张区域。”

这不是普通 RS image-text retrieval 的简单放大版。普通检索默认候选是预切好的 image chips；text-to-region retrieval 的候选空间是连续地理空间，需要解决尺度、tile 粒度、候选区域生成、坐标索引、跨 tile 上下文、语义歧义和证据定位。

## 为什么这个问题出现了

2024-2026 的几个趋势把这个问题推到了台前：

1. 遥感 CLIP/RS-VLM 已经能做图文检索和语义定位。RemoteCLIP、GeoRSCLIP/RS5M、PriorCLIP 等把 CLIP 式 image-text alignment 迁移到遥感。
2. 大范围检索需求来自真实应用。用户通常不是要找“最像这张图的图片”，而是在一个城市、省域或全球瓦片中找符合自然语言描述的区域。
3. GeoFM embedding 变成可索引资产。AlphaEarth Foundations 把年度多源 EO 信息压缩成 Google Earth Engine 中的 64 维 10m embedding，说明“先建全球 embedding，再按任务检索/制图”已经可操作。
4. VLM2GeoVec 开始把图像、文本、bbox 和地理坐标放入统一向量空间，并引入 semantic geospatial retrieval 评测，说明“文本 + 坐标 + 区域语义”的检索正在从想法变成任务。
5. LRS-VQA 证明超大遥感图像不能直接整体送入 VLM，需要 coarse-to-fine tile selection 和 text-guided token pruning。这套思想可直接迁移到 text-to-region retrieval。

## 代表论文与项目

| 方向 | 论文/项目 | 年份/venue | 链接 | 代码/模型/数据 | 对 text-to-region 的价值 |
|---|---|---:|---|---|---|
| 遥感 VLM 基座 | RemoteCLIP: A Vision Language Foundation Model for Remote Sensing | 2024 TGRS | [GitHub repo](https://github.com/ChenDelong1999/RemoteCLIP) | [RemoteCLIP GitHub](https://github.com/ChenDelong1999/RemoteCLIP) | 提供 RSITR 常用基座和 RSITMD/RSICD/UCM 检索脚本，可作 text-to-chip baseline。 |
| 大规模图文数据 | RS5M and GeoRSCLIP | 2024 TGRS | [arXiv](https://arxiv.org/abs/2306.11300) | [RS5M GitHub](https://github.com/om-ai-lab/RS5M), [GeoRSCLIP HF](https://huggingface.co/Zilun/GeoRSCLIP) | 5M 遥感图文对和 GeoRSCLIP，支持 cross-modal retrieval 与 semantic localization，是检索模型强基线。 |
| 噪声与先验 | PriorCLIP / PIR-CLIP | 2024 arXiv | [HF paper page](https://huggingface.co/papers/2405.10160) | 论文页含 GitHub 入口 | 关注遥感图文检索中的语义噪声和 open-domain retrieval，可用于处理自然语言查询歧义。 |
| 多光谱检索 | Multi-Spectral Remote Sensing Image Retrieval Using Geospatial Foundation Models | 2024 arXiv | [arXiv](https://arxiv.org/abs/2403.02059) | [IBM GitHub](https://github.com/IBM/remote-sensing-image-retrieval) | 用 Prithvi 等 GeoFM 做多光谱 image retrieval，提示 text-to-region 不应只依赖 RGB chip。 |
| 组合检索 | Composed Image Retrieval for Remote Sensing | 2024 IGARSS | [arXiv](https://arxiv.org/abs/2405.15587) | [GitHub](https://github.com/billpsomas/rscir) | 将 image query + text modification 用于遥感检索，可扩展为“初始区域 + 文本约束”的交互式区域检索。 |
| 位置与区域统一 embedding | VLM2GeoVec | 2025 arXiv | [arXiv](https://arxiv.org/abs/2512.11490) | 论文称 acceptance 后开源 | 单编码器把 image/text/bbox/coordinates 放进统一 embedding，并提出 RSMEB，包含 semantic geospatial retrieval。 |
| 超大图 VLM | When Large Vision-Language Model Meets Large Remote Sensing Imagery | 2025 ICCV | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Luo_When_Large_Vision-Language_Model_Meets_Large_Remote_Sensing_Imagery_Coarse-to-Fine_ICCV_2025_paper.html), [arXiv](https://arxiv.org/abs/2503.07588) | [LRS-VQA GitHub](https://github.com/VisionXLab/LRS-VQA) | Dynamic Image Pyramid + text-guided token pruning，可迁移为 coarse-to-fine region retrieval。 |
| 全球 embedding | AlphaEarth Foundations / Satellite Embedding V1 | 2025 Google DeepMind / Earth Engine | [DeepMind blog](https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/), [paper PDF](https://storage.googleapis.com/deepmind-media/DeepMind.com/Blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/alphaearth-foundations.pdf) | [Earth Engine catalog](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL), [GCS guide](https://developers.google.com/earth-engine/guides/aef_on_gcs_readme) | 提供年度 10m 全球 embedding，可作为大范围候选索引或 reranking 特征。 |
| 组合检索评测 | Benchmarking Composed Image Retrieval for Applied Earth Observation | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.24442) | 未核到官方 GitHub | 将 composed retrieval 推向应用 EO 和变化中心数据集，可借鉴任务构造和指标。 |
| 地理先验 CLIP | GeoPriorCLIP | 2026 TGRS/ORNL page | [ORNL page](https://impact.ornl.gov/en/publications/geopriorclip-a-foundational-remote-sensing-vision-language-model-/) | 未核到官方代码 | 通过级联地理信息先验增强 RSVLM；适合检索时加入地理、边界和空间关系。 |

## 方法脉络

### 1. Text-to-chip retrieval

输入文本，候选库是固定大小 image chips。RemoteCLIP、GeoRSCLIP、PriorCLIP、PR-CLIP、CMPAGL 等都属于这条线。优点是易复现、指标成熟；缺点是候选 chip 的边界由数据集预先定义，不解决“在大图中找区域”的问题。

### 2. Text/image composed retrieval

输入可以是“参考图像 + 文本修改”，例如“像这个港口，但更靠近城区”。RSCIR 和 2026 composed retrieval benchmark 属于这条线。它适合交互式地图搜索：用户先点一个区域，再用语言修正目标。

### 3. Region-aware multimodal embedding

VLM2GeoVec 是最接近本题的方向：将 image、text、bbox、coordinates 统一到单编码器 embedding。它的价值在于把“区域”显式作为输入/输出的一部分，而不是把区域隐含在 chip 裁剪中。

### 4. Coarse-to-fine large mosaic search

LRS-VQA 的 Dynamic Image Pyramid 可以改造成检索流程：低分辨率整图找候选热区，中分辨率筛选 tile，高分辨率提取候选区域并 rerank。这样避免对整个大图做高分辨率 dense VLM 推理。

### 5. Global embedding field search

AlphaEarth embedding 提供连续地理空间的预计算表征。它本身不是文本模型，但可以作为 region prior：先用 embedding 聚类/异常/相似性缩小候选，再用 RS-CLIP/VLM2GeoVec 做文本语义匹配。

## 任务定义建议

### 输入

- 文本查询 `q`：自然语言描述，可包含对象、关系、尺度、上下文、地理约束。
- 搜索范围 `A`：一个城市、省域、流域或任意 polygon。
- 可选上下文：时间范围、传感器、GSD、已有示例区域、排除条件。

### 输出

- Top-K 区域，每个区域为 bbox、polygon 或 mask。
- 每个区域附带 score、证据 tile、可解释 caption、数据来源和坐标。
- 可选：不确定性或“未找到”判断。

### 查询类型

1. Object query：如“密集停放的小型飞机”。
2. Scene query：如“港口集装箱堆场”。
3. Relation query：如“靠近河流的工业厂房”。
4. Attribute query：如“浅色大屋顶、规则停车线”。
5. Change query：如“过去一年新增的裸土采石区域”。
6. Geo-constrained query：如“城市边缘、靠近高速出口的物流园区”。

## 推荐系统结构

### Stage A: 多尺度候选生成

1. 将搜索范围 `A` 切成多尺度 tile：例如 256m、512m、1km、2km。
2. 对每个 tile 预计算：
   - RGB/多光谱视觉 embedding：RemoteCLIP/GeoRSCLIP/Prithvi/Clay。
   - AlphaEarth 统计特征：mean/max/variance、聚类直方图、时间差分。
   - GIS 先验：道路距离、水体距离、建筑密度、POI 类型、行政区。
3. 先用文本 embedding 做粗检索，保留 top-N tile。

### Stage B: 文本引导细化

1. 对 top-N tile 构建 Dynamic Image Pyramid。
2. 使用 text-guided saliency 或 VLM region focus 选择高分辨率子 tile。
3. 运行 region proposal：SAM、GroundingDINO、selective search、object detector 或 sliding window。
4. 对候选区域计算 region embedding，并与文本/坐标 joint embedding rerank。

### Stage C: 区域输出与校准

1. 合并重叠候选，输出 bbox/polygon/mask。
2. 用 VLM 做证据说明：为什么这个区域匹配查询。
3. 用 hard negative 校准阈值：相似但不符合关系/属性的区域应降分。
4. 输出 uncertainty 和 failure flags。

## 可复现实验设计

### 数据选择

- 基础图文检索：RSITMD、RSICD、UCM captions、RS5M 子集。
- 大图/区域：LRS-VQA 中的大幅面图像和 QA 区域线索。
- 语义定位：GeoRSCLIP 的 Semantic Localization 设置、VLM2GeoVec/RSMEB 的 semantic geospatial retrieval 设置。
- 全球 embedding：Google Earth Engine `GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL`，用于构造城市级候选库。
- 自建小型 benchmark：选 3-5 个城市，每城 100-300 个查询，查询由对象、关系、属性、变化四类组成。

### Baselines

1. RemoteCLIP text-to-chip retrieval。
2. GeoRSCLIP/RS5M text-to-chip retrieval。
3. PriorCLIP/PIR-CLIP open-domain retrieval。
4. Prithvi/Clay/AlphaEarth embedding + text caption bridge：先用 captioner 生成 tile caption，再做 text retrieval。
5. LRS-VQA style coarse-to-fine tile selection。
6. VLM2GeoVec 或通用 VLM2Vec-style embedding，如果代码/权重可用。

### Metrics

- Retrieval：Recall@K、mAP、nDCG、MRR。
- Region quality：IoU@K、center distance、area error、polygon boundary F1。
- 地理覆盖：不同城市/气候带/GSD 的 per-split Recall@K。
- 关系理解：relation query 子集单独统计。
- 大图效率：每平方公里推理成本、平均延迟、token 数、候选 tile 数。
- 可信度：calibration error、false discovery rate、abstention accuracy。

### Ablation

| 模块 | 消融问题 |
|---|---|
| AlphaEarth prior | 是否能减少粗检索候选数量，并提升跨季节稳定性？ |
| GIS prior | relation query 是否更准，如“靠近道路/水体/城区边缘”？ |
| 多尺度 tile | 固定 tile vs dynamic pyramid 对小目标召回的影响。 |
| region proposal | sliding window、SAM、GroundingDINO、VLM attention 哪个更适合不同查询？ |
| coordinate embedding | 加入坐标是否提升 geo-constrained query，还是引入区域偏见？ |
| hard negatives | 相似地物负样本是否降低误检？ |

## 一个可投稿的小方法方案

题目草案：GeoSearch-Pyramid: Text-to-Region Retrieval over Large Earth Observation Mosaics with Geospatial Priors

核心假设：大范围 text-to-region retrieval 需要同时解决“语义匹配”和“空间搜索成本”。如果用 AlphaEarth/GeoFM embedding 和 GIS 先验做粗索引，再用文本引导的多尺度 pyramid 对少量候选区域细化，可以在保持 Recall@K 的同时显著降低高分辨率 VLM 推理成本。

方法模块：

1. Geo-prior index：为每个 tile 存储视觉 embedding、AlphaEarth embedding 统计、GIS 距离特征、时间差分特征。
2. Query parser：将自然语言拆成 object、attribute、relation、geo constraint、time constraint。
3. Coarse retrieval：RemoteCLIP/GeoRSCLIP 文本相似度 + geo-prior score 得到 top-N tile。
4. Pyramid refinement：对 top-N tile 做 text-guided 子 tile 选择，保留可能包含答案的高分辨率区域。
5. Region reranker：融合 region visual embedding、text embedding、bbox/coordinate embedding、GIS relation consistency。
6. Evidence head：输出支持该区域的 caption/关系解释和置信度。

最小实验：

- 区域：3 个城市或 3 个不同地貌区。
- 查询：每个区域 50 个 object/scene 查询、50 个 relation 查询、30 个 hard negative 查询。
- 标注：bbox 或 polygon，先人工少量标注；可用 OSM/建筑/道路/水体数据辅助生成候选后人工审核。
- Baseline：RemoteCLIP fixed-tile、GeoRSCLIP fixed-tile、LRS-style pyramid、GeoSearch-Pyramid。
- 目标：在相同 Recall@10 下减少高分辨率 tile 处理量；在 relation query 上显著提升 nDCG/IoU。

## 风险与应对

1. 文本查询太主观：先限制到可视觉验证的对象、属性和空间关系。
2. 坐标/GIS 先验可能造成偏见：必须报告 image-only、geo-only、image+geo 三种设置。
3. AlphaEarth 含多源信息，包括 radar 等：本方向以光学检索为主，使用 AlphaEarth 时标注为 mixed-modality prior，并设置不用 AlphaEarth 的对照。
4. 大范围标注昂贵：先做小型城市级 benchmark，查询由 OSM/land-cover/product label 自动生成，再人工确认。
5. VLM2GeoVec 代码未完全公开：先用 RemoteCLIP/GeoRSCLIP + bbox/coordinate MLP 自建弱替代 baseline。

## 后续研究方向

1. Text-to-region retrieval 与 visual grounding 统一：检索阶段输出候选区域，grounding 阶段输出 mask。
2. Interactive map search：用户给一个结果点选“像这个但更靠近河流”，结合 composed retrieval。
3. Change-aware region retrieval：查询新增建筑、采石扩张、洪水淹没等变化区域。
4. Hierarchical retrieval：先 scene，再 object，再 mask，避免直接全分辨率搜索。
5. Open-world abstention：当搜索范围内没有目标时，模型应该拒答而不是强行返回 top-K。
6. Region-level retrieval benchmark：构造包含 bbox/polygon、文本、坐标、hard negative、跨城市 split 的公开数据集。

## 阅读队列

1. RemoteCLIP GitHub: https://github.com/ChenDelong1999/RemoteCLIP
2. RS5M/GeoRSCLIP: https://github.com/om-ai-lab/RS5M
3. PriorCLIP/PIR-CLIP: https://huggingface.co/papers/2405.10160
4. VLM2GeoVec: https://arxiv.org/abs/2512.11490
5. LRS-VQA: https://github.com/VisionXLab/LRS-VQA
6. AlphaEarth Foundations: https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/
7. Earth Engine Satellite Embedding V1: https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL
8. Composed Image Retrieval for Remote Sensing: https://github.com/billpsomas/rscir
9. Benchmarking Composed Image Retrieval for Applied Earth Observation: https://arxiv.org/abs/2605.24442
10. IBM multi-spectral retrieval: https://github.com/IBM/remote-sensing-image-retrieval
