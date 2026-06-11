# RS-25 OOD Split Design for Remote Sensing Benchmarks


# RS-25 OOD Split Design for Remote Sensing Benchmarks

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-25` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务：专门调研遥感 benchmark 的 OOD split 设计，比较 random split、spatial block split、leavecityout、leavecountryout、leaveseasonout、leavesensorout 各自测到什么，并输出适合论文复现实验的 split protocol。 

## 正文

# RS-25 OOD Split Design for Remote Sensing Benchmarks

更新时间：2026-06-07  
任务：专门调研遥感 benchmark 的 OOD split 设计，比较 random split、spatial block split、leave-city-out、leave-country-out、leave-season-out、leave-sensor-out 各自测到什么，并输出适合论文复现实验的 split protocol。  
默认范围：光学/多光谱/高分辨率遥感为主；不把 SAR-only 作为主线。

## 摘要

遥感 benchmark 的最大风险是“随机划分高分，真实部署掉分”。影像瓦片具有强空间自相关，同一区域相邻 patch、同一城市不同裁片、同一季节同一传感器采样出来的数据，常常让训练集和测试集在纹理、建筑形态、植被物候、成像条件上高度相似。OOD split 的研究价值在于把这种相似性有意打散，分别测试模型面对新地理区域、新时间窗口、新传感器、新空间分辨率和新数据源时是否仍可靠。

2024-2026 的趋势很明确：PANGAEA 和 PhilEO Bench 试图统一 GeoFM 评测；REOBench 开始系统评估高分辨率光学任务在真实扰动下的鲁棒性；EarthShift 进一步把 OOD 从“单一 corruption”推进到 location、temporal、sensor、scale、data-source 等真实分布偏移；RWDS 专门把卫星目标检测放到真实空间域偏移下评测；Distribution Shifts at Scale/TARDIS 则关注如何在部署阶段检测 ID/OOD。

## 代表论文和项目

| 项目 | 年份/来源 | 链接 | 代码/数据 | 与 OOD split 的关系 |
|---|---:|---|---|---|
| EarthShift: a benchmark for measuring robustness to real-world distribution shifts in Earth observation | 2026 arXiv | [paper](https://arxiv.org/abs/2605.29330), [project](https://earthshift.github.io/) | [GitHub](https://github.com/kerner-lab/earthshift) | 明确覆盖 location、temporal、sensor、scale、data-source shift；适合作为 RS OOD split 的总框架。 |
| PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models | 2024 arXiv / 2025 rev. | [paper](https://arxiv.org/abs/2412.04204) | [GitHub](https://github.com/VMarsocci/pangaea-bench) | 标准化多任务、多分辨率、多传感器、多时相 GeoFM 评测；提醒单一地区/任务评测过窄。 |
| PhilEO Bench: Evaluating Geo-Spatial Foundation Models | 2024 IGARSS/arXiv | [paper](https://arxiv.org/abs/2401.04464), [project](https://phileo-bench.github.io/) | [HF](https://huggingface.co/PhilEO-community/PhilEO-Bench) | 全球 stratified Sentinel-2 benchmark，支持 n-shot 和统一测试框架；可借鉴地理分层采样。 |
| REOBench: Benchmarking Robustness of Earth Observation Foundation Models | 2025 arXiv | [paper](https://arxiv.org/abs/2505.16793) | [GitHub](https://github.com/lx709/reobench), [HF](https://huggingface.co/datasets/xiang709/REOBench) | 高分辨率光学影像 6 类任务、12 类扰动；不是严格 geographic OOD，但适合做 corruption OOD 辅助维度。 |
| Benchmarking Object Detectors under Real-World Distribution Shifts in Satellite Imagery | 2025 CVPR | [paper](https://arxiv.org/abs/2503.19202), [CVF](https://openaccess.thecvf.com/content/CVPR2025/papers/Al-Emadi_Benchmarking_Object_Detectors_under_Real-World_Distribution_Shifts_in_Satellite_Imagery_CVPR_2025_paper.pdf) | [GitHub](https://github.com/RWGAI/RWDS) | RWDS 针对卫星目标检测构造真实 DG benchmark，重点是气候区、灾害类型、地理区域 shift。 |
| Distribution Shifts at Scale: Out-of-distribution Detection in Earth Observation | 2024 arXiv / 2025 CVPRW EarthVision | [paper](https://arxiv.org/abs/2412.13394), [CVF](https://openaccess.thecvf.com/content/CVPR2025W/EarthVision/html/Ekim_Distribution_Shifts_at_Scale_Out-of-distribution_Detection_in_Earth_Observation_CVPRW_2025_paper.html) | [GitHub](https://github.com/microsoft/geospatial-ood-detection) | TARDIS 在 EuroSAT、xBD 和 Fields of the World 上做 covariate/semantic shift OOD 检测；适合部署时发现 split 外样本。 |
| Analysing Satellite Imagery Classification under Spatial Domain Shift across Geographic Regions | 2025 IJCV | [paper](https://link.springer.com/article/10.1007/s11263-025-02518-z) | [GitHub](https://github.com/RWGAI/DSGR) | 构造 DSGR 大规模区域域偏移分类数据集，直接针对跨地理区域空间 domain shift。 |

## Split 类型到底测什么

| Split | 设计方式 | 测到的能力 | 容易误判的地方 | 适用任务 |
|---|---|---|---|---|
| Random split | 在 image/patch 级随机划分 | 同分布插值、模型拟合能力、常规训练稳定性 | 空间泄漏严重；相邻 patch 可同时进入 train/test；高分不代表可部署 | sanity check、debug、低风险基线 |
| Spatial block split | 按空间网格或 buffer 后的地理块划分 | 局部空间自相关之外的泛化；接近真实制图部署 | block 太小仍泄漏；block 太大可能导致类别缺失 | land cover、road/building segmentation、crop mapping |
| Leave-city-out | 按城市/区域训练，留一个或多个城市测试 | 城市形态、建筑风格、道路结构、采集条件迁移 | 城市标签粒度不一；训练城市数量少时方差大 | VHR semantic segmentation、building/road extraction、urban detection |
| Leave-country-out / leave-region-out | 按国家、大洲、生态区、气候带留出 | 大尺度地理、社会经济、气候和景观差异 | 类别先验变化会混入 semantic shift；需报告类别覆盖 | global land cover、crop、settlement、population proxy |
| Leave-season-out / temporal split | 按月份、季节、年份、灾前灾后窗口划分 | 物候、季节、太阳高度、云影、灾害时序迁移 | 若地点完全相同，仍可能记住地理纹理；需和 spatial split 组合 | crop mapping、change detection、flood/wildfire、phenology |
| Leave-sensor-out | 训练传感器 A，测试传感器 B | 光谱响应、GSD、噪声、辐射定标差异 | 传感器 shift 常和分辨率/时间/地区混在一起 | multispectral/hyperspectral、GeoFM adapter、cloud/flood mapping |
| Leave-GSD/resolution-out | 按空间分辨率或重采样尺度划分 | 尺度鲁棒性、小目标尺度理解 | 人工重采样不等于真实传感器；需区分 native GSD 与 resampled GSD | detection、segmentation、VLM grounding、大图推理 |
| Leave-data-source-out | 训练数据源/供应商/标注规范 A，测试 B | 标注规范、影像处理链、数据提供方差异 | 很难判断是 label shift 还是 image shift | 多源 benchmark、GeoFM 评测、地图产品迁移 |
| Corruption split | 对 test 注入 haze/blur/noise/rotation/scale 等扰动 | 成像/环境扰动和几何扰动鲁棒性 | 不等同真实 geographic OOD；可作为补充 | REOBench 风格多任务鲁棒性评测 |

## 推荐复现实验协议

### 1. 数据元信息要求

每个样本至少需要保存：

- `sample_id`
- `geometry` 或中心经纬度和 footprint
- `timestamp`
- `sensor/platform`
- `native_gsd`
- `data_source/provider`
- `label_source`
- `class_labels`
- `tile_parent_id`，用于识别同源大图切片
- `split_group_id`，如 city、country、ecoregion、season、sensor

如果缺少 footprint，至少要有 tile 所属大图和中心坐标；否则空间 block split 很容易做成假 OOD。

### 2. 三层 split 设计

第一层：ID random split  
目的只是验证训练 pipeline 和同分布上限，不作为主结果。

第二层：single-factor OOD split  
每次只改变一个主因素：

- `spatial_block`: train/test block 间设置 buffer，避免相邻 patch 泄漏。
- `leave_city`: 按城市留出。
- `leave_region`: 按国家/生态区/气候带留出。
- `leave_time`: 按季节或年份留出。
- `leave_sensor`: 按传感器留出。
- `leave_gsd`: 按 native GSD 或真实数据源分辨率留出。

第三层：compound OOD split  
组合两个因素，例如 `leave_city + leave_season`、`leave_country + leave_sensor`。论文主表不要只放 compound，因为它难解释；但附表必须有，能接近真实部署。

### 3. 空间 block split 细节

建议流程：

1. 将样本 footprint 投影到等面积坐标系或使用 S2/H3 grid。
2. 设置 block 大小为模型输入 patch 尺寸的 5-20 倍；VHR 城市任务可从 2 km、5 km、10 km 做敏感性分析。
3. 在 train/test block 之间设置 buffer，buffer 至少覆盖一个大图切片的空间范围。
4. 按类别分布贪心分配 block，保证 test 中包含主要类别。
5. 报告 Moran's I 或 nearest-neighbor distance，证明 train/test 空间相关性被降低。

### 4. Leave-city / leave-country 细节

建议使用多折：

- `leave-one-city-out`: 每个城市轮流做 test，适合城市数量较少的 VHR 数据。
- `leave-group-out`: 按气候带、经济水平、建筑密度、洲/国家分组，适合全球数据。
- 每折都报告 macro average 和 worst-domain score。

核心指标不只看平均 mIoU/mAP，还要看：

- worst-domain mIoU/mAP
- OOD drop = ID score - OOD score
- relative OOD drop = `(ID - OOD) / ID`
- domain variance
- class-wise OOD drop

### 5. Leave-season / temporal split 细节

对农作物、变化检测、水体、灾害任务，时间 split 比 random 更重要。

建议：

- `train`: 多年或多季节的一部分。
- `val`: 与 train 同区域但不同月份，用于调参。
- `test-temporal`: 同区域不同年份/季节。
- `test-spatiotemporal`: 新区域 + 新年份/季节。

必须区分：

- 季节/物候 shift
- 成像条件 shift
- 灾害事件 shift
- 真实语义变化

变化检测任务尤其要保留配准误差、云影、季节变化 hard negatives。

### 6. Leave-sensor / leave-GSD 细节

传感器 OOD 不应只通过人工重采样模拟。推荐至少两类测试：

- `native sensor split`: Sentinel-2 -> Landsat/HLS/Planet/NAIP/EnMAP 等真实传感器迁移。
- `controlled resampling split`: 在同一数据源上做 scale perturbation，用于隔离尺度因素。

报告时要拆开：

- spectral shift
- spatial resolution shift
- radiometric processing shift
- label/source shift

否则 leave-sensor-out 的结论会变得含糊。

## 实验矩阵

| 任务 | 数据集候选 | ID split | OOD split | 模型 | 指标 |
|---|---|---|---|---|---|
| Scene classification | EuroSAT, RESISC45, DSGR | random image split | leave-region/country, semantic/covariate shift | ResNet, ViT, Prithvi/Clay/SatMAE features | Acc, macro-F1, OOD drop, AUROC for OOD detection |
| Land cover / semantic segmentation | LoveDA, DeepGlobe, PhilEO, PANGAEA tasks | random/spatial block | leave-city, leave-region, leave-season | U-Net, SegFormer, DINOv2, GeoFM linear probe/LoRA | mIoU, worst-domain mIoU, class-wise drop |
| Building/road extraction | SpaceNet, Inria, PhilEO road/building | random tile split | spatial block, leave-city | U-Net, HRNet, SAM-assisted, GeoFM features | IoU, boundary F1, topology metrics |
| Object detection | xView, DOTA optical subset, RWDS | random image split | leave-climate-zone, leave-disaster-region | YOLO/RT-DETR/DETR, foundation features | mAP, AP-small, worst-domain AP |
| Crop mapping | Fields of the World, Sentinel-2 crop datasets | random field split | leave-season, leave-region, leave-year | temporal CNN/Transformer, Prithvi/SkySense | macro-F1, crop-wise drop, calibration |
| VLM / RS-VQA | GEOBench-VLM, VRSBench, OmniEarth | random QA split | leave-region/GSD/task-template | GeoChat, LLaVA-style RS-VLM, Qwen-VL baseline | exact/LLM judge, evidence IoU, hallucination rate |

## 一个可投稿的小课题

题目草案：**SplitRS: A Leakage-Aware OOD Split Protocol for Remote Sensing Foundation Model Evaluation**

### 核心假设

如果遥感 benchmark 同时报告 random、spatial block、leave-region、leave-season 和 leave-sensor，并显式控制空间泄漏与类别覆盖，那么模型真实性能排序会与 random split 下的排序显著不同；GeoFM 的优势更可能体现在低标注和部分 shift 上，而不是所有 OOD 设置。

### 方法模块

1. **Metadata normalizer**：把不同数据集统一到 STAC-like 元信息。
2. **Leakage checker**：基于坐标 buffer、tile parent id、图像 hash、embedding nearest neighbor 检测 train/test 近重复。
3. **Split generator**：生成 random、spatial block、leave-city/country、leave-season、leave-sensor、compound split。
4. **Split diagnostics**：输出类别分布、空间距离、时间跨度、传感器差异、Moran's I、domain coverage。
5. **Robustness report card**：统一报告 ID score、OOD score、OOD drop、worst-domain score、calibration。

### Baselines

- Supervised task models：U-Net/DeepLab/SegFormer/YOLO/DETR。
- Generic vision FM：DINOv2/MAE/CLIP features。
- Geospatial FM：Prithvi-EO-2.0、Clay、SatMAE/SatMAE++、SkySense 或 PANGAEA 支持的开放模型。
- Adaptation methods：linear probe、full fine-tune、LoRA/adapter、test-time adaptation。

### 最小可行实验

第一阶段只做两个任务：

1. LoveDA/DeepGlobe 语义分割：random vs spatial block vs leave-city。
2. EuroSAT/DSGR 分类：random vs leave-region/country。

输出：

- 每种 split 的模型排序变化。
- OOD drop 和 worst-domain score。
- 空间泄漏诊断图。
- 每类错误的地理分布。

第二阶段再加入：

- RWDS 目标检测。
- EarthShift 的 paired datasets。
- leave-season 或 leave-sensor。

## 未来研究方向

1. **OOD split 自动生成器**：给任意带坐标/时间/传感器元数据的数据集，自动生成一组可解释 split。
2. **Spatial leakage score**：量化 train/test 在空间、时间、图像 embedding 上的相似度，作为 benchmark 数据卡必填项。
3. **Worst-domain optimization**：不只优化平均 mIoU/mAP，而是优化最差区域、最差季节或最差传感器。
4. **OOD-aware model selection**：用小规模 validation OOD proxy 选择模型，避免只在 ID val 上调参。
5. **GeoFM robustness leaderboard**：基于 EarthShift/PANGAEA/REOBench/RWDS，建立按 shift type 分解的榜单，而不是单一总分。

## 阅读队列

1. [EarthShift project](https://earthshift.github.io/) 和 [GitHub](https://github.com/kerner-lab/earthshift)
2. [PANGAEA paper](https://arxiv.org/abs/2412.04204) 和 [GitHub](https://github.com/VMarsocci/pangaea-bench)
3. [REOBench GitHub](https://github.com/lx709/reobench)
4. [RWDS paper](https://arxiv.org/abs/2503.19202) 和 [GitHub](https://github.com/RWGAI/RWDS)
5. [Distribution Shifts at Scale / TARDIS](https://arxiv.org/abs/2412.13394) 和 [GitHub](https://github.com/microsoft/geospatial-ood-detection)
6. [PhilEO Bench](https://phileo-bench.github.io/)
7. [DSGR / Spatial Domain Shift across Geographic Regions](https://link.springer.com/article/10.1007/s11263-025-02518-z)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

