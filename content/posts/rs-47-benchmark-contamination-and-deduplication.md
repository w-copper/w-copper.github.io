---
title: "RS-47 Benchmark Contamination and Deduplication"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["数据集", "弱监督", "benchmark"]
source: "research/rs47_benchmark_contamination_deduplication.md"
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-47 Benchmark Contamination and Deduplication

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-47` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：专门研究遥感 benchmark contamination：预训练图像、下游测试、同一区域瓦片、增强副本、nearduplicate 如何去重；提出基于地理坐标、时间戳、图像哈希和 embedding 相似度的 dedup pipeline。 范围：光学/多光谱/高分辨率遥感优先；SARonly 不作为主线。本文与 [R

## 正文

# RS-47 Benchmark Contamination and Deduplication

更新时间：2026-06-07  
细问题：专门研究遥感 benchmark contamination：预训练图像、下游测试、同一区域瓦片、增强副本、near-duplicate 如何去重；提出基于地理坐标、时间戳、图像哈希和 embedding 相似度的 dedup pipeline。  
范围：光学/多光谱/高分辨率遥感优先；SAR-only 不作为主线。本文与 [RS-02 GeoFM Benchmark Leakage Audit](./RS-02_geofm_benchmark_leakage_audit.md) 和 [RS-25 OOD Split Design](./rs25_ood_split_design.md) 互补：RS-02 偏 GeoFM 评测泄漏审计，RS-25 偏 OOD split；本文件专门落在数据污染检测、近重复去重和可执行工具链。

## 1. 结论先行

遥感 benchmark contamination 不是一个抽象风险，而是已经被实证发现的硬问题。最直接的证据是 CVPR 2026 oral 论文 **Data Leakage Detection and De-duplication in Large Scale Geospatial Image Datasets**：作者审计 INRIA、SpaceNet 2 和 AICrowd Mapping Challenge 等建筑 footprint 数据集，发现 AICrowd 训练集中约 25 万张、接近 90% 图像是完全或增强重复；验证集中大量样本也出现在训练集中，并给出官方代码 [Hash_and_search](https://github.com/yeshwanth95/Hash_and_search)。

对 2024-2026 的 GeoFM/VLM 时代来说，问题更复杂：模型预训练数据往往来自全球 Sentinel-2、Landsat、NAIP、航空影像、Web caption、OSM/WorldCover/building footprint 等衍生产品；下游 benchmark 又可能使用相同区域、相同年份、相同 parent scene、相同标签产品或同源 caption/QA。只做 image-level random split 已经不够，必须做 **provenance-aware dedup**：同时用坐标、时间、传感器、parent scene、精确/感知哈希、embedding 近邻和标签来源审计。

## 2. 问题由来

遥感数据天然容易污染 benchmark，原因和自然图像不同：

- **大幅影像切 patch**：一张 5000 x 5000 或更大的航空/卫星图像切成很多 patch 后，如果随机划分，训练和测试共享同一个 parent scene 的纹理、光照、建筑风格和地物上下文。
- **同一区域多次采样**：同一 MGRS tile、Landsat path/row、城市、农田或灾区可能在不同日期、不同产品级别、不同分辨率下反复出现。测试图像没有逐像素重复，也可能是时空近邻。
- **增强副本和重采样副本**：旋转、翻转、裁剪、压缩、颜色增强、重采样后，文件 hash 不同但视觉内容相同或高度相似。
- **公开 benchmark 进入预训练语料**：GeoFM 预训练常会收集公开数据集或其同源影像；VLM 预训练还可能收集 benchmark 的 caption、QA、类别描述或项目页面。
- **标签产品泄漏**：模型预训练使用 OSM、building footprints、Dynamic World、ESA WorldCover、道路/水体产品作为辅助任务，而下游 benchmark 标签又来自同一产品或派生产品。
- **空间自相关放大高分**：即便没有严格重复，相邻 patch 的空间相关性也会让 reported score 高估真实部署能力。

因此，本方向的核心不是“找重复文件”这么窄，而是建立一个可复现的 **遥感数据血缘与近重复审计系统**。

## 3. 代表论文、项目与工具

| 论文/项目 | 年份/来源 | 链接 | 代码/数据 | 与 RS-47 的关系 |
|---|---:|---|---|---|
| Data Leakage Detection and De-duplication in Large Scale Geospatial Image Datasets | 2026 CVPR oral | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2026/papers/Adimoolam_Data_Leakage_Detection_and_De-duplication_in_Large_Scale_Geospatial_Image_CVPR_2026_paper.pdf), [arXiv](https://arxiv.org/abs/2304.02296) | [GitHub: Hash_and_search](https://github.com/yeshwanth95/Hash_and_search) | 本题最核心来源；用 perceptual hash 检测 exact/augmented duplicates 和跨 split leakage，实证发现 AICrowd building dataset 严重污染。 |
| PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models | 2024/2025 | [paper](https://arxiv.org/abs/2412.04204), [project](https://pangaea-bench.github.io/) | [GitHub](https://github.com/VMarsocci/pangaea-bench) | 多任务、多区域、多分辨率 GeoFM benchmark；需要加入 contamination report 才能支撑长期 leaderboard。 |
| EarthShift: a benchmark for measuring robustness to real-world distribution shifts in Earth observation | 2026 | [paper](https://arxiv.org/abs/2605.29330), [project](https://earthshift.github.io/) | [GitHub](https://github.com/kerner-lab/earthshift) | OOD/robustness benchmark；如果不做预训练覆盖和时空近邻去重，真实 shift 也可能被隐性污染。 |
| No One Knows the State of the Art in Geospatial Foundation Models | 2026 | [arXiv](https://arxiv.org/abs/2605.12678) | 待核验 | 直接指出 GeoFM SOTA 评测和比较不稳定；为“leaderboard 必须带数据血缘审计”提供动机。 |
| GEOBench-VLM | 2025 ICCV | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2411.19325) | [GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM) | VLM benchmark 需要检测图像、文本 QA、caption 模板和地理区域是否进入模型训练。 |
| VRSBench | 2024 NeurIPS Datasets & Benchmarks | [paper](https://arxiv.org/abs/2406.12384) | [GitHub](https://github.com/lx709/VRSBench) | 高质量 RS-VLM benchmark；适合研究 image-text pair contamination 与 QA/template overlap。 |
| Copernicus-FM / Copernicus-Bench | 2025 ICCV | [paper](https://arxiv.org/abs/2503.11849) | [GitHub](https://github.com/zhu-xlab/Copernicus-FM) | Copernicus 数据生态下，预训练和下游 benchmark 可能共享 Sentinel 系列源数据和产品链。 |
| REOBench | 2025 | [paper](https://arxiv.org/abs/2505.16793) | [GitHub](https://github.com/lx709/reobench), [HF](https://huggingface.co/datasets/xiang709/REOBench) | 扰动鲁棒性 benchmark；可加入 duplicate/corruption provenance，避免增强副本同时进入不同 split。 |
| SemDeDup | 2023, 可迁移方法 | [paper](https://arxiv.org/abs/2303.09540) | [GitHub](https://github.com/facebookresearch/SemDeDup) | 通用 semantic dedup 方法，可迁移到遥感 embedding 近重复聚类。 |
| Data Leakage in Visual Datasets | 2025/2026 preprint | [arXiv](https://arxiv.org/abs/2508.17416) | 待核验 | 通用视觉 benchmark contamination 方向，可为遥感近重复审计借鉴问题定义。 |
| Both Text and Images Leaked! A Systematic Analysis of Multimodal LLM Data Contamination | 2024 | [HF paper page](https://huggingface.co/papers/2411.03823) | 待核验 | 对 RS-VLM 很重要：不仅图像会泄漏，caption/QA/文本描述也可能污染评测。 |

## 4. 遥感 benchmark contamination taxonomy

| 编号 | 污染类型 | 典型例子 | 检测信号 | 风险 |
|---|---|---|---|---|
| C1 | Exact duplicate | 同一 PNG/JPEG/TIF 文件出现在 train/test 或 pretrain/test | checksum、file size、pixel hash | 最高，必须删除 |
| C2 | Augmented duplicate | 90/180/270 度旋转、水平/垂直翻转、轻微压缩副本 | pHash/aHash/dHash，增强后 hash collision | 最高，必须删除 |
| C3 | Crop/resize duplicate | 同一区域不同裁剪窗口、重采样或缩放版本 | local feature match、embedding kNN、坐标 IoU | 高，按 parent scene 或空间 buffer 处理 |
| C4 | Same parent scene | 同一大幅影像、mosaic、MGRS tile、NAIP tile 被切成不同 patch | parent_scene_id、STAC item、tile id | 高，不应跨 split |
| C5 | Spatial near-neighbor | 训练和测试 patch 不重叠但在几百米到几公里内 | footprint distance、buffer overlap、spatial autocorrelation | 中到高，影响真实泛化 |
| C6 | Temporal near-neighbor | 同一区域同季节/同事件前后多次采样 | datetime delta + footprint overlap | 中到高，尤其影响变化/灾害/作物 |
| C7 | Sensor/product twin | 同一区域同时间的 Sentinel-2 L1C/L2A/HLS 或不同产品处理链 | STAC source、sensor、product level | 中，需区分任务是否允许 |
| C8 | Label product collision | 预训练使用的 building footprint/OSM/WorldCover 与 benchmark 标签同源 | label_source、auxiliary products used in pretraining | 高，可能不是图像记忆而是标签泄漏 |
| C9 | Text contamination | VLM 训练见过 benchmark caption、QA、类别模板或论文页面 | text hash、n-gram overlap、embedding similarity | 高，影响 VQA/caption |
| C10 | Synthetic/auto-label feedback | benchmark 或预训练数据来自同一个 VLM/SAM/GroundingDINO 自动标注管线 | annotation provenance、model/source id | 中到高，会形成模型偏置闭环 |
| C11 | Hyperparameter contamination | test set 被反复用于模型选择或 prompt 调参 | experiment logs、leaderboard submissions | 中，不易自动检测 |
| C12 | Unknown provenance | 无坐标、无时间、无 parent id、无标签来源 | missing metadata rate | 高不确定性，不能只报单一分数 |

## 5. Dedup pipeline：坐标 + 时间 + 哈希 + embedding

建议实现一个四层流水线。核心原则：**先用便宜、确定的规则过滤，再用昂贵的 embedding 检索和人工抽查处理疑难样本**。

### 5.1 输入 schema

每个样本转成 STAC-like manifest，推荐保存为 `parquet` 或 `jsonl`：

```json
{
  "sample_id": "dataset/split/file_id",
  "dataset": "string",
  "split": "pretrain|train|val|test",
  "task": "classification|segmentation|detection|vqa|caption|change",
  "asset_uri": "path_or_url",
  "sensor": "Sentinel-2|Landsat|NAIP|WorldView|AerialRGB|...",
  "product_level": "L1C|L2A|HLS|orthomosaic|unknown",
  "datetime": "YYYY-MM-DDTHH:MM:SSZ",
  "footprint_wkt": "POLYGON(...)",
  "centroid_lon": 0.0,
  "centroid_lat": 0.0,
  "gsd_m": 0.3,
  "parent_scene_id": "MGRS_tile_or_mosaic_id_or_null",
  "label_source": "manual|OSM|WorldCover|building_footprint|auto|unknown",
  "annotation_model": "SAM|GroundingDINO|VLM|human|unknown",
  "checksum": "sha256_or_null",
  "phash64": "hex_or_null",
  "embedding_model": "DINOv2|Clay|Prithvi|RemoteCLIP|none",
  "embedding_uri": "path_or_null"
}
```

### 5.2 Layer A：metadata integrity check

先报告元数据缺失率，避免“无法判断的样本被当作干净”。

| 字段 | 缺失后果 | 处理 |
|---|---|---|
| footprint / centroid | 无法检测空间 near-neighbor | 标记 UX，不能进入 clean leaderboard 主榜 |
| datetime | 无法检测同季节/同事件泄漏 | 标记 temporal unknown |
| parent_scene_id | 无法检测同源瓦片 | 用坐标 + 文件名 + embedding 近邻替代 |
| label_source | 无法检测标签产品污染 | 数据卡必须声明 unknown rate |
| checksum/hash | 无法检测 exact/augmented duplicate | 重新计算 |

### 5.3 Layer B：exact and augmented duplicate detection

对所有图像计算：

- cryptographic hash：SHA-256，用于 exact file duplicate。
- pixel hash：对标准化像素数组 hash，避免文件编码差异。
- perceptual hash：pHash/aHash/dHash/wHash，用于压缩、亮度变化、翻转和旋转。
- augmented pHash：对 90/180/270 度旋转、水平/垂直翻转版本计算 hash。

最小规则：

```text
if sha256 match across train/test:
    risk = C1, remove from train or rebuild split
elif phash distance <= tau_exact_or_augmented:
    risk = C2, inspect or remove
elif augmented_phash collision:
    risk = C2, remove
```

CVPR 2026 的 Hash_and_search 给出一个简单而有效的起点：先计算 64-bit perceptual hash，再比较 train/val hash collisions；对增强副本，额外生成旋转/翻转后的 hash。

### 5.4 Layer C：geospatial-temporal leakage detection

对 test 样本与 train/pretrain 样本做空间时间连接：

| 检查 | 判定建议 | 输出 |
|---|---|---|
| footprint IoU | IoU > 0 或 overlap area > epsilon | direct spatial overlap |
| buffer overlap | centroid distance < 1/5/10/50 km，按任务/GSD 调整 | spatial near-neighbor curve |
| parent scene match | parent_scene_id 相同 | same-scene leakage |
| temporal proximity | 同 footprint 或同 buffer 内，时间差 < 7/30/90/365 天 | temporal near-duplicate |
| sensor/product twin | 同位置同日期但 product_level 不同 | product-chain contamination |

建议报告 `buffer sensitivity curve`：半径从 0、100 m、500 m、1 km、5 km、10 km、50 km 逐步扩大，看 clean test 数量和性能如何变化。

### 5.5 Layer D：embedding near-duplicate detection

当坐标缺失或图像经过裁剪/重采样时，embedding 检索更有用。建议并行使用三类特征：

- **低层视觉特征**：DINOv2、ResNet、SIFT/ORB 局部特征；适合 crop/resize duplicate。
- **遥感基础模型特征**：Clay、Prithvi、SatMAE、SkySense、Copernicus-FM；适合地物结构相似的 near duplicate。
- **图文特征**：RemoteCLIP、GeoRSCLIP、CLIP；适合 RS-VLM 图文 benchmark 的 image-text pair contamination。

流程：

1. 对 train/pretrain 建 FAISS/HNSW 索引。
2. 对每个 test 样本找 top-k nearest neighbors。
3. 结合相似度、空间距离、时间差、parent id 打分。
4. 抽样人工检查 near-duplicate gallery。
5. 用阈值敏感性报告，而不是只选一个阈值。

一个简单综合风险分数：

```text
risk_score =
  1.0 * exact_hash_match +
  0.9 * augmented_phash_match +
  0.8 * parent_scene_match +
  0.7 * footprint_overlap +
  0.5 * spatial_buffer_match +
  0.5 * temporal_near_match +
  0.6 * embedding_topk_high_sim +
  0.8 * label_source_collision
```

不要把这个分数伪装成精确概率；它适合作为排序和人工审计优先级。

## 6. Leakage risk levels

| 等级 | 名称 | 定义 | 建议处理 |
|---|---|---|---|
| L0 | Clean documented | 坐标、时间、parent id、标签来源清楚；无重复和 near-neighbor 风险 | 可进入主榜 |
| L1 | Low-risk neighbor | 空间/时间较远，仅 embedding 相似但无元数据证据 | 保留，报告抽查结果 |
| L2 | Spatially nearby | 在 buffer 内或同一城市/地块附近，但无 parent scene/像素重叠 | 单独报告 sensitivity |
| L3 | Same parent/product | 同一 parent scene、同一 mosaic、同一 STAC item 或同一产品链 | 不跨 split；需重划分 |
| L4 | Exact/augmented duplicate | 文件、像素、pHash 或增强 hash 命中 | 必须删除或合并 |
| L5 | Label/text contamination | 预训练用到下游标签同源产品、caption、QA、类别模板 | 主结果不可用，需隔离 |
| UX | Unknown provenance | 关键元数据缺失，无法判定 | 不能称 clean；单独报告 |

## 7. 实验矩阵

### 7.1 数据集与任务

| 任务 | 数据集候选 | 污染风险 | 审计重点 |
|---|---|---|---|
| 建筑 footprint / polygon extraction | AICrowd Mapping Challenge, INRIA, SpaceNet 2, xBD building | patch duplicate、parent scene、增强副本 | Hash_and_search 复现；same-city/scene split |
| 道路/建筑语义分割 | DeepGlobe, LoveDA, Inria, SpaceNet roads/buildings | 同城市 patch、OSM/footprint 标签同源 | spatial block + label source audit |
| GeoFM 多任务评测 | PANGAEA, PhilEO Bench, Copernicus-Bench | 预训练覆盖、传感器产品链共享 | pretrain/test manifest overlap |
| OOD/鲁棒性 | EarthShift, REOBench, RWDS | OOD split 被预训练见过，扰动副本污染 | provenance + buffer sensitivity |
| RS-VLM | GEOBench-VLM, VRSBench, OmniEarth, RS5M/GeoRSCLIP | 图像泄漏、caption/QA 文本泄漏 | image hash + text hash + CLIP/RemoteCLIP kNN |
| 多时相/变化检测 | LEVIR-CD, WHU-CD, xView2/xBD, DynamicEarthNet | 同区域不同时间和灾前灾后重叠 | spatiotemporal overlap + event id |

### 7.2 模型与比较

| 模型组 | 作用 |
|---|---|
| 常规监督模型：UNet、DeepLab、SegFormer、YOLO/DETR | 测试 contaminated split 对传统模型的抬分幅度 |
| 通用 VFM：DINOv2、CLIP、SAM feature | 比较自然图像预训练模型是否也受 near-duplicate 影响 |
| GeoFM：Prithvi、Clay、SkySense、SatMAE、Copernicus-FM、Galileo | 测试预训练覆盖与 clean split 后排名变化 |
| RS-VLM：GeoChat、RS-LLaVA、Qwen-VL/InternVL 遥感适配 | 测试图像和文本双重污染 |

### 7.3 主要报告指标

| 指标 | 定义 |
|---|---|
| Duplicate rate | split 内 exact/augmented duplicate 比例 |
| Cross-split leakage rate | train/pretrain 与 val/test 命中的比例 |
| Parent-scene collision rate | test 样本 parent_scene_id 在 train/pretrain 出现的比例 |
| Spatial neighbor rate | test 样本在不同 buffer 半径内有 train/pretrain 邻居的比例 |
| Temporal neighbor rate | 同区域时间差小于阈值的比例 |
| Label-source collision rate | 标签产品或自动标注来源与预训练辅助数据同源的比例 |
| Unknown provenance rate | 关键字段缺失比例 |
| Clean score drop | 原始 split 分数与去污染 split 分数差 |
| Rank instability | 去污染后模型排名变化 |
| Dedup retention | 去重后保留样本量和类别覆盖率 |

## 8. 可复现 pipeline 设计

### 8.1 目录结构建议

```text
geors_dedup/
  manifests/
    pretrain_samples.parquet
    benchmark_samples.parquet
  hashes/
    sha256.parquet
    phash64.parquet
    augmented_phash64.parquet
  embeddings/
    dinov2.faiss
    clay.faiss
    remoteclip.faiss
  reports/
    duplicate_report.md
    leakage_risk_table.csv
    near_duplicate_gallery/
  splits/
    original/
    clean_l0_l1/
    no_parent_scene_overlap/
    buffer_1km/
    buffer_10km/
```

### 8.2 核心算法

1. **Manifest normalization**：把不同数据集的文件、坐标、时间、传感器、标签来源统一。
2. **Hash computation**：计算 SHA-256、pixel hash、pHash；对旋转/翻转增强也计算 pHash。
3. **Exact/augmented dedup**：在 split 内和 split 间查 hash collisions。
4. **Geo-temporal join**：用 footprint IoU、centroid distance、parent_scene_id、datetime delta 查时空泄漏。
5. **Embedding kNN**：用 DINOv2/Clay/Prithvi/RemoteCLIP 做 top-k 近邻检索。
6. **Risk scoring**：融合哈希、坐标、时间、parent、label source、embedding 相似度。
7. **Clean split generator**：按 L0-L1、no-parent-overlap、buffer-km 等规则生成多个 split。
8. **Sensitivity evaluator**：在 original 和 clean splits 上复现实验，报告掉分和排名变化。

### 8.3 伪代码

```python
for sample in samples:
    sample.sha256 = compute_file_hash(sample.asset_uri)
    sample.phash = compute_phash(sample.asset_uri)
    sample.aug_phashes = compute_augmented_phashes(sample.asset_uri)

duplicate_edges = find_hash_collisions(samples, keys=["sha256", "phash", "aug_phashes"])
geo_edges = spatial_temporal_join(test_samples, train_or_pretrain_samples)
knn_edges = embedding_knn(test_embeddings, train_or_pretrain_embeddings, top_k=20)
label_edges = detect_label_source_collision(test_samples, model_pretraining_card)

risk_table = merge_edges(duplicate_edges, geo_edges, knn_edges, label_edges)
clean_splits = generate_splits(samples, risk_table, policy="L0_L1_only")
evaluate_models(original_split, clean_splits)
```

## 9. 最小可行实验

### Phase 1：复现 CVPR 2026 hash 审计

- 数据：AICrowd Mapping Challenge、INRIA、SpaceNet 2。
- 工具：Hash_and_search。
- 目标：复现 exact/augmented duplicate 和 cross-split leakage 统计。
- 输出：duplicate gallery、leakage rate、clean split。

### Phase 2：加入坐标与 parent scene

- 数据：SpaceNet 2 或 Inria/SpaceNet 派生建筑任务。
- 方法：用 GeoJSON/GeoTIFF 元数据补 parent_scene_id 和 footprint。
- 目标：比较仅 hash 去重 vs parent-scene 去重 vs spatial buffer 去重。
- 输出：三种 clean split 下的建筑分割/提取性能。

### Phase 3：GeoFM benchmark contamination

- 数据：PANGAEA 或 PhilEO Bench 的 2-3 个光学任务。
- 模型：DINOv2、Prithvi-EO-2.0、Clay、SatMAE 或 Copernicus-FM。
- 方法：构建 benchmark test vs open pretrain data manifest 的 overlap report。
- 输出：reported split、L0-L1 clean split、buffer split 的性能和排名变化。

### Phase 4：RS-VLM 图文双重污染

- 数据：GEOBench-VLM、VRSBench、RS5M/GeoRSCLIP 可用样本。
- 方法：图像 hash/embedding + 文本 n-gram/hash/embedding。
- 目标：检测 image-text pair 是否与训练数据或公开 caption/QA 重叠。
- 输出：image contamination rate、text contamination rate、clean VQA/caption score。

## 10. 可投稿 proposal

### 题目

**GeoDedup: Provenance-Aware Contamination Detection and De-duplication for Remote Sensing Foundation Model Benchmarks**

### 核心假设

遥感 benchmark 的 reported SOTA 部分来自 exact duplicate、增强副本、同源瓦片、时空近邻和标签产品污染；用 provenance-aware dedup 清洗后，模型性能、模型排名和 OOD drop 会发生可测变化。

### 方法贡献

1. 遥感污染 taxonomy：C1-C12。
2. STAC-like benchmark manifest schema。
3. 四层 dedup pipeline：metadata、hash、geo-temporal、embedding。
4. L0-L5/UX 风险等级和 clean split 生成器。
5. `GeoDedup Report Card`：每个 benchmark 必须报告污染率、未知血缘率、clean score drop 和 rank instability。

### 实验设计

| 实验 | 目标 | 数据 | 模型 |
|---|---|---|---|
| E1 Hash audit replication | 验证 exact/augmented duplicate 检测 | AICrowd、INRIA、SpaceNet 2 | UNet/SegFormer 或论文复现基线 |
| E2 Parent-scene audit | 量化同源大图切 patch 泄漏 | SpaceNet/Inria/LoveDA | SegFormer、SAM-assisted baseline |
| E3 GeoFM clean split | 看 GeoFM 排名是否变化 | PANGAEA/PhilEO/Copernicus-Bench | DINOv2、Prithvi、Clay、Copernicus-FM |
| E4 RS-VLM contamination | 检测图文双重泄漏 | GEOBench-VLM/VRSBench/RS5M subset | GeoChat、RS-LLaVA、Qwen-VL/InternVL |
| E5 Buffer sensitivity | 研究空间自相关影响 | land-cover/building/crop | supervised + GeoFM linear probe |

### 指标

- contamination rate：C1-C12 分解。
- clean retention：清洗后样本、类别、区域、季节保留比例。
- clean score drop：`reported_score - clean_score`。
- rank instability：Kendall tau / Spearman rho 比较模型排名。
- provenance completeness：坐标、时间、parent、label source 完整率。
- audit cost：每百万图像 hash/embedding 计算成本。

### 风险

- 很多预训练数据不公开，只能做公开语料覆盖和黑盒 membership-like 审计。
- embedding near-duplicate 可能误伤相似地物但不同地点，必须结合坐标/时间和人工抽查。
- 清洗后样本量可能下降，需报告类别覆盖和置信区间。
- 标签产品污染常依赖模型/数据卡透明度，缺失时只能标 UX。

## 11. 未来研究方向

1. **GeoFM pretraining data card standard**：要求模型发布时列出传感器、时间范围、空间采样、公开 benchmark 排除策略、标签产品来源和不可公开数据比例。
2. **Leakage-aware leaderboard**：PANGAEA/EarthShift/GEOBench-VLM 等榜单增加 contamination column，主排名只使用 L0-L1 样本。
3. **Black-box contamination detection for GeoFM**：当预训练数据不可公开时，用 embedding 置信度、loss、nearest-neighbor consistency 和时间切分做 membership-like 检测。
4. **Spatial autocorrelation adjusted confidence interval**：去重之外，还要用 spatial block bootstrap 估计置信区间，避免把相邻 patch 当独立样本。
5. **Text-image dual dedup for RS-VLM**：同时审计图像、caption、QA、类别描述、prompt template 的污染。
6. **Benchmark release with hidden future split**：为 2026 之后的 GeoFM 建立动态 benchmark：公开部分用于开发，保留未来时间/新地区样本用于最终评测。
7. **Dedup-aware active data collection**：主动补采 clean split 后缺失的地理区域、季节和长尾类别，而不是只删除污染样本。
8. **Provenance-preserving synthetic data**：合成遥感数据必须记录生成模型、prompt、参考图像和是否使用 benchmark 样本作为条件。

## 12. 交付物建议

如果把这个方向推进成实际项目，建议产出：

- `geodedup` Python 包：manifest、hash、geo-temporal join、embedding kNN、risk scoring。
- `GeoDedup-Reports`：AICrowd/INRIA/SpaceNet/PANGAEA/GEOBench-VLM 的审计报告。
- `clean_splits/`：每个数据集的 L0-L1、no-parent-overlap、buffer-1km、buffer-10km split。
- `near_duplicate_gallery/`：可视化 HTML，便于人工检查。
- `leaderboard_delta.md`：原始 split 与 clean split 下模型排名变化。

## 13. 下一步阅读队列

1. [Data Leakage Detection and De-duplication in Large Scale Geospatial Image Datasets, CVPR 2026](https://openaccess.thecvf.com/content/CVPR2026/papers/Adimoolam_Data_Leakage_Detection_and_De-duplication_in_Large_Scale_Geospatial_Image_CVPR_2026_paper.pdf)
2. [Hash_and_search official GitHub](https://github.com/yeshwanth95/Hash_and_search)
3. [PANGAEA paper](https://arxiv.org/abs/2412.04204) and [GitHub](https://github.com/VMarsocci/pangaea-bench)
4. [EarthShift paper](https://arxiv.org/abs/2605.29330), [project](https://earthshift.github.io/), [GitHub](https://github.com/kerner-lab/earthshift)
5. [No One Knows the State of the Art in Geospatial Foundation Models](https://arxiv.org/abs/2605.12678)
6. [GEOBench-VLM GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM)
7. [VRSBench GitHub](https://github.com/lx709/VRSBench)
8. [Copernicus-FM GitHub](https://github.com/zhu-xlab/Copernicus-FM)
9. [SemDeDup paper](https://arxiv.org/abs/2303.09540) and [GitHub](https://github.com/facebookresearch/SemDeDup)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
