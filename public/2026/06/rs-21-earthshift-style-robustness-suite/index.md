# RS-21 EarthShift-Style Robustness Suite


# RS-21 EarthShift-Style Robustness Suite

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-21` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：以 EarthShift 为核心，设计一个遥感模型真实分布偏移评测套件，覆盖跨城市、跨国家、跨气候带、跨季节、跨 GSD、跨传感器，比较 GeoFM、传统监督模型、TTA 方法，并提出报告模板。 范围：光学/多光谱遥感优先；不把 SARonly 设置作为主线。若某 benchmark 含 SAR 或多模态，只保留可用光学/

## 正文

# RS-21 EarthShift-Style Robustness Suite

更新时间：2026-06-07  
细问题：以 EarthShift 为核心，设计一个遥感模型真实分布偏移评测套件，覆盖跨城市、跨国家、跨气候带、跨季节、跨 GSD、跨传感器，比较 GeoFM、传统监督模型、TTA 方法，并提出报告模板。  
范围：光学/多光谱遥感优先；不把 SAR-only 设置作为主线。若某 benchmark 含 SAR 或多模态，只保留可用光学/多光谱任务或标注为 mixed-modality。

## 1. 结论先行

EarthShift 把 2024-2026 GeoFM 评测里最关键的问题挑明了：当前大量遥感 benchmark 主要测的是 in-distribution performance，但真实部署经常遇到新的时间窗口、地理区域、空间尺度和传感器。EarthShift 官方页说明其覆盖 5 类 shift、11 个任务和 8 个 geospatial foundation models；论文摘要报告 GFMs 在 OOD 上平均约 15-20% 性能下降，并且这种下降不因模型结构、尺寸、预训练或微调策略而自然消失。

因此，一个可投稿的小方向不是“再做一个平均精度更高的 GeoFM”，而是做一个更可解释、更可诊断、更贴近部署的 robustness suite：明确每类 shift 的因果来源，区分模型能力、数据泄漏、传感器差异和标签体系变化，并把结果报告成性能、鲁棒性、校准、效率和失败类型的组合。

## 2. 问题由来

遥感数据的分布偏移比自然图像更“结构化”：

- 地理偏移：同一类建筑、道路、农田、水体在不同城市、国家、气候带中的纹理和上下文不同。
- 时间偏移：季节、作物物候、施工进度、灾害前后、传感器重访周期都会改变表观。
- 尺度偏移：GSD 改变后，同一对象的像素大小和局部纹理完全不同。
- 传感器偏移：Sentinel-2、Landsat、Planet、NAIP、航空 RGB、无人机影像的谱段、响应函数、噪声和分辨率不同。
- 标注/任务偏移：land cover、land use、object、parcel-level label、行政产品标签之间语义不完全一致。

传统随机划分会高估模型泛化能力，因为相邻瓦片、同一城市、同一季节、同一传感器的数据往往同时进入训练和测试。GeoFM 的大规模预训练进一步放大了这个问题：模型可能在预训练阶段已经看过测试区域或同源影像，但 benchmark 报告并不总是给出地理/时间去重信息。

## 3. 代表论文与项目

| 项目/论文 | 年份/venue | 链接 | 代码/数据 | 对 RS-21 的价值 |
|---|---:|---|---|---|
| EarthShift: a benchmark for measuring robustness to real-world distribution shifts in Earth observation | 2026 arXiv | https://arxiv.org/abs/2605.29330 | https://earthshift.github.io/ | 核心锚点；官方页称覆盖 realistic distribution shifts，论文摘要给出 8 个 GFM、11 任务、5 shift types 和 OOD 平均约 15-20% 下降。 |
| REOBench: Benchmarking Robustness of Earth Observation Foundation Models | 2025 NeurIPS D&B / arXiv | https://arxiv.org/abs/2505.16793 | https://github.com/lx709/REOBench | 关注高分辨率光学遥感下 6 类任务、12 类图像扰动；适合补 EarthShift 的 corruption/perturbation 维度。 |
| PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models | 2024/2025 arXiv | https://arxiv.org/abs/2412.04204 | https://github.com/VMarsocci/pangaea-bench | 指出 GFM 评测 narrow、地理偏向欧美、任务和分辨率覆盖不足；可作为 suite 的多任务基础框架。 |
| Towards a Unified Copernicus Foundation Model for Earth Vision | 2025 ICCV oral | https://arxiv.org/abs/2503.11849 | https://github.com/zhu-xlab/Copernicus-FM | Copernicus-Bench 覆盖 Sentinel 多任务、多层级应用；适合做 cross-sensor / Sentinel-family shift 的对照。 |
| Parameter Efficient Self-Supervised Geospatial Domain Adaptation | 2024 CVPR | https://openaccess.thecvf.com/content/CVPR2024/html/Scheibenreif_Parameter_Efficient_Self-Supervised_Geospatial_Domain_Adaptation_CVPR_2024_paper.html | https://github.com/HSG-AIML/GDA | 代表 PEFT/adapter 路线；官方 repo 描述了 SLR adapter、目标域自监督 MIM、再监督微调的三阶段适配。 |
| LoveDA: A Remote Sensing Land-Cover Dataset for Domain Adaptive Semantic Segmentation | 2021 NeurIPS D&B | https://arxiv.org/abs/2110.08733 | https://github.com/Junjue-Wang/LoveDA | 虽早于 2024，但仍是 cross-domain urban/rural segmentation 的常用基准，可作为 cross-city/cross-context split 的基础。 |
| Benchmarking Object Detectors under Real-World Distribution Shifts in Satellite Imagery | 2025 arXiv | https://arxiv.org/abs/2503.19202 | https://github.com/RWGAI/RWDS | 专门研究卫星目标检测中的真实空间 domain shift，补足 segmentation 之外的 detection 任务。 |
| WILDS: A Benchmark of in-the-Wild Distribution Shifts | 2021 ICML | https://proceedings.mlr.press/v139/koh21a.html | https://wilds.stanford.edu/ | 非 2024-2026，但其 shift reporting、leaderboard 和 fMoW satellite setting 是 robustness benchmark 设计的重要参照。 |
| Decomposition-based UDA for Remote Sensing Semantic Segmentation | 2024 arXiv | https://arxiv.org/abs/2404.04531 | https://github.com/sstary/SSRS | 代表 2024 segmentation UDA baseline，可纳入 TTA/UDA 对照组。 |
| SegDesicNet: Lightweight Semantic Segmentation with Geo-Coordinate Embeddings for Domain Adaptation | 2025 arXiv | https://arxiv.org/abs/2503.08290 | 待核验 | 将 geo-coordinate embeddings 用于 UDA，适合作为“坐标是帮助泛化还是造成记忆”的对照。 |
| Domain generalization for semantic segmentation of remote sensing images via vision foundation model fine-tuning | 2025 ISPRS JPRS | https://www.sciencedirect.com/science/article/pii/S0924271625003569 | https://github.com/mmmll23/GeoSA-BaSA | 代表 VFM fine-tuning + domain generalization；注意代码是否已发布需二次核验。 |

## 4. Shift taxonomy：建议的 6 类真实偏移

### S1 跨城市 / 跨区域

定义：训练城市和测试城市不同，或训练区域与测试区域在城市形态、建筑密度、道路结构、植被覆盖上不同。  
候选数据：LoveDA urban/rural、Vaihingen/Potsdam、SpaceNet cities、DeepGlobe/LoveDA transfer。  
核心风险：模型学到城市纹理和标注风格，而不是类别本身。  
报告指标：ID mIoU、OOD mIoU、relative drop、per-class drop、spatial calibration。

### S2 跨国家 / 跨气候带

定义：测试区跨国家、洲、气候带或生态区。  
候选数据：PANGAEA 中的全球任务、BigEarthNet/EuroSAT/FMoW-WILDS、作物/土地覆盖全球产品。  
核心风险：欧美或少数区域数据主导训练，热带、干旱区、高纬地区表现不稳。  
报告指标：macro-region 平均、worst-region performance、climate-zone gap、样本量校正后的 gap。

### S3 跨季节 / 跨时间窗口

定义：训练和测试季节、年份或灾害阶段不同。  
候选数据：DynamicEarthNet、作物时间序列、建筑/土地覆盖年度产品、灾害前后影像。  
核心风险：模型把季节颜色变化当类别变化，或把灾害后阴影/烟雾当目标。  
报告指标：seasonal robustness、year-to-year transfer、temporal consistency、change false positive rate。

### S4 跨 GSD / 空间尺度

定义：训练和测试影像的地面采样距离、对象像素大小或 tile 尺寸不同。  
候选数据：PANGAEA 多分辨率任务、DOTA/DIOR/xView/FAIR1M 的跨数据集检测、NAIP vs Sentinel-2/Planet。  
核心风险：小目标在低分辨率下消失，高分辨率下类别内部纹理变复杂。  
报告指标：GSD-binned performance、object-size binned AP/IoU、scale robustness slope。

### S5 跨传感器 / 谱段响应

定义：训练和测试传感器不同，含 band 数量、中心波长、响应函数、辐射处理级别差异。  
候选数据：Sentinel-2/Landsat/HLS，Copernicus-Bench，Prithvi/DOFA/Copernicus-FM 支持的数据。  
核心风险：模型把传感器特有色彩、噪声、云掩膜和分辨率当类别特征。  
报告指标：sensor-pair transfer matrix、missing-band robustness、spectral response sensitivity。

### S6 真实扰动 / 成像质量

定义：云、薄雾、模糊、压缩、旋转、尺度变化、传感器噪声、几何错位。  
候选数据：REOBench。  
核心风险：corruption robustness 不等价于真实 OOD，但能定位模型对低层扰动的脆弱性。  
报告指标：corruption mCE、severity curve、task-specific degradation、clean-vs-corrupt calibration shift。

## 5. 模型比较组

### A. 传统监督模型

用途：判断 GeoFM 是否真正带来 OOD 鲁棒性，而不是只提升 ID 精度。  
候选：UNet、DeepLabV3+、SegFormer、Swin/UPerNet、Faster/Mask R-CNN、YOLO/Oriented R-CNN。  
设置：统一数据增强、统一训练 epoch、统一输入分辨率，避免 GFM 享受额外数据但监督 baseline 不公平。

### B. 通用视觉 foundation model

用途：回答 EarthShift 中提出的关键问题：GeoFM 的鲁棒性是否显著超过 generic VFM。  
候选：DINOv2、MAE/ViT、CLIP/OpenCLIP、SAM features。  
设置：frozen linear probe、full fine-tune、adapter fine-tune 三套。

### C. Geospatial foundation model

用途：主比较对象。  
候选：Prithvi-EO-2.0、SkySense、Clay、SatMAE/SatMAE++、Scale-MAE、DOFA、Copernicus-FM、Galileo/TerraMind/AlphaEarth embeddings（按可得权重和许可选择）。  
设置：linear probe、full fine-tune、LoRA/adapter；同时记录预训练数据覆盖和是否可能与测试区域重叠。

### D. Domain generalization / adaptation / TTA

用途：测试在无标注目标域或少量目标域样本下能否减少 OOD drop。  
候选：GDA SLR adapter、self-training、entropy minimization、BN adaptation、prototype adaptation、test-time augmentation、uncertainty-filtered pseudo-label。  
风险：TTA 可能在目标域类别分布变化时把错误伪标签强化，因此必须报告 failure cases 和置信度校准。

## 6. 实验矩阵

| 维度 | 最小版 | 完整版 | 关键控制 |
|---|---|---|---|
| 任务 | land-cover segmentation + scene classification | segmentation + detection + VQA/caption + crop/change mapping | 每个任务至少 1 个 ID/OOD paired split |
| Shift | cross-city, cross-season, cross-GSD | 6 类 shift 全覆盖 | 一次只改变一个主因素，记录混杂因素 |
| 模型 | UNet/SegFormer + DINOv2 + 2 个 GeoFM | 传统监督 + generic VFM + 6-8 个 GeoFM + TTA | 同一训练预算、同一数据增强、同一输入尺寸 |
| 适配 | frozen linear probe, full fine-tune | LoRA/adapter/TTA/self-training | 记录目标域标签量和未标注数据量 |
| 指标 | ID, OOD, relative drop | effective robustness, worst-group, calibration, efficiency | 报告 per-class/per-region/per-season 分解 |
| 数据审计 | split manifest | STAC/坐标/时间/传感器/哈希/embedding 去重 | 防止地理泄漏和同源瓦片泄漏 |

## 7. 推荐指标

### 基础性能

- 分类：OA、macro-F1、balanced accuracy。
- 语义分割：mIoU、mF1、boundary IoU、per-class IoU。
- 检测：mAP、AP50/75、small-object AP、oriented AP。
- VQA/caption：accuracy、exact match、LLM-as-judge 需人工抽检；若可 grounding，报告证据 IoU。

### 鲁棒性

- Absolute OOD score：直接报告 OOD 指标。
- Relative drop：`(ID - OOD) / ID`。
- Effective robustness：在控制 ID 性能后比较 OOD 表现，参考 WILDS/EarthShift 思路，避免只因 ID 高而看起来鲁棒。
- Worst-group performance：按区域/气候带/季节/GSD bin 取最差组。
- Robustness slope：性能随 GSD、云量、时间间隔、区域距离变化的斜率。

### 可信度

- ECE / adaptive ECE。
- Spatial calibration error：按空间 block 聚合校准误差，避免像素独立假设。
- Abstention AUC：允许模型拒答/拒分割时，性能-覆盖率曲线如何变化。
- Uncertainty-error correlation：不确定性是否真的指向错误区域。

### 效率

- 参数量、训练 FLOPs、推理延迟、显存。
- 每个 OOD split 的适配成本：目标域未标注样本数、目标域标注样本数、TTA 时间。
- 若面向星上/边缘部署，增加 energy proxy 或硬件实测。

## 8. 报告模板

每篇论文/实验建议固定报告以下表格。

### Dataset card

| 字段 | 内容 |
|---|---|
| 数据源 | 卫星/航空/UAV，数据集名称，下载链接 |
| 传感器 | band、GSD、时间范围、处理级别 |
| 地理范围 | 国家/城市/气候带/生态区 |
| 任务 | 分类/分割/检测/VQA/变化 |
| Split | ID train/val/test，OOD test，目标域未标注数据 |
| 泄漏控制 | 坐标 block、时间间隔、哈希/embedding 去重、预训练覆盖声明 |
| 标签体系 | 类别定义、层级、忽略类、跨数据集映射 |

### Result card

| 模型 | 预训练数据 | 适配方式 | ID | OOD | Drop | Worst group | ECE | 成本 | 主要失败 |
|---|---|---|---:|---:|---:|---:|---:|---:|---|
| UNet/SegFormer | 无/监督 | full | | | | | | | |
| DINOv2/CLIP | 自然图像 | linear/full | | | | | | | |
| Prithvi/Clay/SkySense | EO | linear/full/LoRA | | | | | | | |
| GDA/TTA variant | EO + target unlabeled | adapter/TTA | | | | | | | |

### Failure card

| Failure type | 例子 | 可能原因 | 对应修复 |
|---|---|---|---|
| 地理纹理偏差 | 热带城市道路误分为裸土 | 训练区域偏欧美 | climate-balanced sampling |
| 尺度失配 | 低 GSD 小建筑漏检 | object pixel size 过小 | GSD-aware adapter |
| 季节混淆 | 冬季农田误为裸地 | phenology shift | temporal conditioning |
| 传感器色彩偏移 | Landsat/S2 迁移失败 | SRF 不一致 | spectral response conditioning |
| 高置信错误 | OOD 区域置信度过高 | calibration collapse | conformal/uncertainty filtering |

## 9. 可投稿的小方法方案

### 题目草案

GeoShift-Report: A Diagnostic Robustness Suite for Geospatial Foundation Models under Realistic Remote Sensing Distribution Shifts

### 核心假设

GeoFM 的 OOD 失败并不是单一原因导致的；如果把 shift 分解为 geography、climate、season、GSD、sensor 和 corruption，并报告 effective robustness、worst-group 与 calibration，就能比单一 OOD 平均分更准确地定位模型弱点，也能指导 adapter/TTA 方法设计。

### 方法模块

1. Shift manifest：为每个样本记录坐标、时间、GSD、传感器、气候带、数据源、标签体系。
2. Paired ID/OOD split builder：构造一次尽量只改变一个主 shift 的 paired splits。
3. Leakage checker：基于坐标 block、时间间隔、文件哈希、embedding 近邻检测同源瓦片和预训练覆盖风险。
4. Unified evaluator：统一分类、分割、检测和 VLM/grounding 的 OOD 指标。
5. Robustness reporter：输出 result card、failure card、per-shift radar plot 和 cost-robustness curve。
6. Adaptation baseline zoo：传统监督、generic VFM、GeoFM、LoRA/adapter、TTA/self-training。

### 最小实验

1. 任务：LoveDA land-cover segmentation + REOBench corruption segmentation/classification + RWDS detection。
2. 模型：SegFormer/UNet、DINOv2、Prithvi或Clay、SkySense或Copernicus-FM、GDA adapter、一个 TTA baseline。
3. Shift：urban-to-rural、city-to-city、clean-to-corrupt、cross-dataset detection。
4. 指标：mIoU/mAP/OA、relative drop、worst-group、ECE、适配成本。
5. 输出：一个开源 split manifest 和评测脚本，而不只是论文表格。

### 完整实验

扩展到 PANGAEA/Copernicus-Bench/EarthShift 支持的多任务、多传感器、多区域 setting，加入 cross-season、cross-GSD 和 cross-sensor transfer matrix。

## 10. 未来研究方向

1. Shift-aware pretraining：预训练时显式构造跨区域、跨季节、跨 GSD 的正负样本，而不是随机 mask。
2. GSD/climate/sensor conditional adapter：用少量元数据条件化 GeoFM，测试是否提升 OOD 而不是记忆区域。
3. Robustness-cost frontier：比较 full fine-tune、LoRA、TTA、自训练在 OOD 提升和适配成本上的 Pareto 前沿。
4. Spatial conformal prediction：为大范围地图输出具有空间覆盖保证的不确定性。
5. Benchmark contamination audit：把 RS-02 的泄漏检测接进 robustness suite，防止 OOD 其实在预训练中见过。
6. Failure-driven active learning：用 OOD failure map 主动选择新区域标注，评估每小时人工标注带来的 worst-group 提升。
7. Multi-task robustness transfer：研究在 segmentation 上鲁棒的 GeoFM 是否也在 detection/VQA 上鲁棒。
8. Real-vs-synthetic robustness：REOBench 这类 corruption 是否能预测 EarthShift 这类真实 shift，需要系统相关性分析。

## 11. 下一步阅读队列

1. EarthShift 官方论文和代码：确认 5 类 shift 的具体任务列表、模型列表和 effective robustness 公式。
2. REOBench：复现一个 clean/corrupt severity curve，作为扰动维度补充。
3. PANGAEA：抽取可直接接入的全球/多分辨率/多传感器任务。
4. Copernicus-FM/Copernicus-Bench：核查 S1/S2/S3/S5P 中可用的光学/多光谱任务。
5. GDA：复现 SLR adapter 在一个跨域 segmentation split 上的收益。
6. RWDS：补 detection under spatial shift 的 object-level 分析。

## 12. 参考链接

- EarthShift paper: https://arxiv.org/abs/2605.29330
- EarthShift project: https://earthshift.github.io/
- REOBench paper: https://arxiv.org/abs/2505.16793
- REOBench GitHub: https://github.com/lx709/REOBench
- PANGAEA paper: https://arxiv.org/abs/2412.04204
- PANGAEA GitHub: https://github.com/VMarsocci/pangaea-bench
- Copernicus-FM GitHub: https://github.com/zhu-xlab/Copernicus-FM
- GDA paper: https://openaccess.thecvf.com/content/CVPR2024/html/Scheibenreif_Parameter_Efficient_Self-Supervised_Geospatial_Domain_Adaptation_CVPR_2024_paper.html
- GDA GitHub: https://github.com/HSG-AIML/GDA
- LoveDA paper: https://arxiv.org/abs/2110.08733
- LoveDA GitHub: https://github.com/Junjue-Wang/LoveDA
- RWDS paper: https://arxiv.org/abs/2503.19202
- RWDS GitHub: https://github.com/RWGAI/RWDS
- WILDS project: https://wilds.stanford.edu/


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

