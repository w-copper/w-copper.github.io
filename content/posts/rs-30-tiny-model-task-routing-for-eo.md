---
title: "RS-30 Tiny Model Task Routing for EO"
date: 2026-06-07T09:29:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["高效推理", "大幅面遥感", "星上部署"]
categories: ["多源数据融合、效率部署与应用落地"]
draft: false
---

# RS-30 Tiny Model Task Routing for EO

范围：星上或边缘端的光学/多光谱遥感任务路由。核心问题是：先用轻量 cloud mask、saliency、tiny detector 或低分辨率模型判断是否调用大模型、是否下传图像、是否触发灾害回退机制，从而节省能耗和带宽，同时控制漏检风险。

## 1. 方向概述

星上 AI 的早期目标通常是“把一个小模型塞进 CubeSat/边缘硬件”。但 2024-2026 的趋势正在变成“级联式任务路由”：轻量模型先做快速筛选，大模型或下传链路只处理高价值、高风险或不确定样本。这样的问题比单纯模型压缩更像一个决策系统：

- **输入端**：低分辨率 quick-look、压缩预览、云量估计、saliency map、tiny detector、元数据、任务优先级。
- **路由端**：决定丢弃、压缩下传、调用中等模型、调用大模型、或触发灾害/异常回退。
- **输出端**：省电、省带宽、低延迟，同时保证云、洪水、火点、船只、道路损毁等关键事件不被漏掉。

这个方向的研究价值在于：真实星上/边缘约束不是一个静态 FLOPs 约束，而是动态的电量、热、存储、下传窗口、任务优先级和风险预算。一个可投稿的小题可以围绕“风险感知 tiny-to-large cascade for EO”展开。

## 2. 代表论文与项目

| 标题/项目 | 年份/venue | 链接 | 代码/模型 | 与 RS-30 的关系 |
|---|---:|---|---|---|
| NASA's Prithvi Becomes First AI Geospatial Foundation Model In Orbit | 2026 NASA | [NASA Science](https://science.nasa.gov/science-research/ai-foundation-model-in-orbit/) | [Prithvi-EO-2.0 GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) | 压缩版 Prithvi 已在 Kanyini 与 ISS IMAGIN-e 上测试云/洪水检测，说明“压缩 FM 上轨 + 任务触发”已进入实证阶段。 |
| Prithvi-EO-2.0 | 2024 arXiv / NASA-IBM | [arXiv](https://arxiv.org/abs/2412.02732) | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0), [HF](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M) | 可作为大模型分支或 teacher；300M/600M 版本适合研究压缩、LoRA、蒸馏。 |
| Φsat-2 | 2024 ESA mission | [ESA mission](https://www.esa.int/Applications/Observing_the_Earth/Phsat-2), [Introducing Φsat-2](https://www.esa.int/Applications/Observing_the_Earth/Phsat-2/Introducing_Phsat-2) | [PhiSat-2 GitHub org](https://github.com/PhiSat-2) | 6U CubeSat，星上运行 cloud detection、vessel detection、wildfire、marine anomaly、compression 等应用，是任务路由系统的现实原型。 |
| Φsat-2 gets two new AI apps | 2024 ESA | [ESA](https://www.esa.int/Applications/Observing_the_Earth/Phsat-2/Phsat-2_gets_two_new_AI_apps) | mission apps | 明确提出云去除、应急街图、船只检测、海洋污染、野火检测等多 app 场景，适合抽象成 onboard scheduler。 |
| Optimizing Deep Learning Models for On-Orbit Deployment Through Neural Architecture Search | 2025 Scientific Reports | [Nature](https://www.nature.com/articles/s41598-025-21467-8) | 未见官方代码 | 硬件/任务约束下的 NAS，给级联系统里的 tiny/mid 模型选型提供方法基础。 |
| Efficient FPGA-accelerated CNNs for Cloud Detection on CubeSats | 2025 arXiv | [arXiv](https://arxiv.org/abs/2504.03891) | 未见官方代码 | 云检测是最自然的第一级路由器；论文报告在 Zynq UltraScale+ MPSoC 上用 FPGA/DPU 实现实时云检测。 |
| TinyRS-R1: Compact Multimodal Language Model for Remote Sensing | 2025 arXiv | [arXiv](https://arxiv.org/abs/2505.12099) | 未确认官方代码 | 2B 遥感多模态小模型，可作为边缘端“轻量语义解释/任务确认”分支，而不是直接调用 7B/13B VLM。 |
| Lightweight Remote Sensing Scene Classification on Edge Devices via Knowledge Distillation and Early-exit | 2025 arXiv | [arXiv](https://arxiv.org/abs/2507.20623) | 未见官方代码 | early-exit 和蒸馏适合做“简单样本早停，困难样本路由到大模型”。 |
| SatReg: Regression-based NAS for Lightweight Satellite Image Segmentation | 2026 arXiv | [arXiv](https://arxiv.org/abs/2604.10306) | GitHub 未核验 | 在 Jetson Orin Nano 上拟合 mIoU、latency、power surrogate，适合作为级联系统硬件 cost model。 |
| TA-YOLO | 2024 Complex & Intelligent Systems | [Springer](https://link.springer.com/article/10.1007/s40747-024-01448-6) | 未见官方代码 | 轻量小目标检测，可作为第一级 tiny detector 候选。 |
| LEGNet | 2025 arXiv | [arXiv](https://arxiv.org/abs/2503.14012) | 未见官方代码 | 针对低质量遥感图像的轻量目标检测，适合评估噪声/低分辨率 quick-look 下的路由鲁棒性。 |
| MEANet | 2024 Expert Systems with Applications | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0957417423022807) | 未见官方代码 | 轻量光学遥感 saliency detection，可用于“是否值得下传/是否调用大模型”的 saliency gate。 |
| Lightweight Semantic- and Graph-Guided Network for ORSI-SOD | 2025 Remote Sensing | [MDPI](https://www.mdpi.com/2072-4292/17/5/861) | 未见官方代码 | 低计算成本 saliency，强调边缘和语义引导，可作为异常/目标候选区域路由器。 |
| IEAM for Remote Sensing Salient Object Detection | 2025 Remote Sensing | [MDPI](https://www.mdpi.com/2072-4292/17/12/2053) | 未见官方代码 | 兼顾边界、注意力和效率，适合与 tiny detector/cloud mask 组合。 |
| LightEMNet | 2025 TGRS | [CoLab/IEEE record](https://colab.ws/articles/10.1109%2Ftgrs.2025.3587287) | 未见官方代码 | 弱监督轻量 Mamba-fusion SOD，论文记录显示仅 4.81M 参数，适合 onboard saliency gate。 |
| E4: Energy-Efficient DNN Inference via Early-Exit and DVFS | 2025 arXiv | [arXiv](https://arxiv.org/abs/2503.04865) | 未核验 | 通用边缘视频分析方法，可迁移到星上 EO：根据模型置信度和芯片频率动态控制能耗。 |
| SCTNet-NAS for Cloud-Edge Collaborative Perception | 2025 Complex & Intelligent Systems | [Springer](https://link.springer.com/article/10.1007/s40747-025-01996-5) | 未见官方代码 | 通用 cloud-edge 协同分割框架，可迁移为“星上初筛 + 地面/大模型精处理”。 |

## 3. 问题由来

### 3.1 星上/边缘不是单模型问题

单个轻量模型可以降低延迟，但真实 EO 系统还要决定：

- 这张图云太多，是否不下传？
- quick-look 中疑似洪水/火点/船只，是否立刻调用大模型？
- 小模型置信度低但灾害风险高，是否宁可多耗电也进入大模型？
- 当前电量、热状态、存储和下传窗口是否允许继续计算？
- 如果大模型失败或超时，是否用规则/传统指数模型回退？

因此 RS-30 的核心不是“tiny detector 做得更准”，而是**把小模型的不确定性转化为任务路由决策**。

### 3.2 云检测是最自然的第一级 gate

云会直接决定影像是否有下传价值，也会影响洪水、作物、火点等任务。Φsat-2 和 FPGA cloud detection 工作都说明云检测适合星上实时运行。一个强 baseline 是：

1. tiny cloud classifier / cloud segmentation 估计云量和可用区域；
2. 对低云量图像运行 saliency/tiny detector；
3. 对高价值或高不确定图像调用大模型或压缩下传；
4. 对高云但灾害高风险区域保留 quick-look 和元数据，而不是直接丢弃。

### 3.3 Saliency/tiny detector 可以做“价值估计”

云量低不代表值得下传。saliency、vessel/fire/flood/building-damage tiny detector 可以估计是否包含目标或异常。与普通检测不同，这里第一阶段不需要完美 box/mask，而要高召回、低漏检、可校准。

### 3.4 大模型分支应该是稀缺资源

Prithvi in orbit 证明压缩 GeoFM 能上轨，但 foundation model 仍然比 tiny CNN/YOLO/SOD 更昂贵。合理的系统应把大模型当作稀缺专家：

- 只处理高风险或高价值样本；
- 只处理候选 tile，而不是整幅影像；
- 被 tiny model 的不确定性、任务优先级和灾害先验触发；
- 输出更高质量 mask/语义解释/不确定性，指导是否下传。

## 4. 方法比较

| 路线 | 输入 | 决策粒度 | 优点 | 风险 | 适合的第一实验 |
|---|---|---|---|---|---|
| Cloud-first gate | quick-look 或低分辨率多光谱 | 整图/大 tile | 最容易解释，直接节省下传 | 灾害被云遮挡时可能误丢 | cloud mask + flood/fire fallback |
| Saliency gate | RGB/多光谱 tile | tile/region | 无需固定类别，适合异常候选 | saliency 对背景纹理敏感 | ORSSD/EORSSD + downstream target recall |
| Tiny detector gate | 目标类别明确，如船、火、洪水、建筑损毁 | box/tile | 可直接控制召回 | 长尾类和跨域退化 | DOTA/DIOR/xBD/flood 数据 |
| Early-exit classifier | 分类/场景任务 | sample | 简单样本省计算 | dense prediction 不直接适用 | RSSCN7/AID/EuroSAT |
| Teacher-student cascade | tiny student + GeoFM/VLM teacher | sample/tile | 容易复现，能做蒸馏 | teacher 错误会传染 | Prithvi/SegFormer teacher + MobileNet/YOLO student |
| Cost-aware NAS | 硬件 profile + surrogate | model level | 贴近真实功耗/延迟 | 搜索空间可能窄 | Jetson Orin Nano 或 Raspberry Pi |
| Policy routing | 多个模型/动作 | action | 可同时优化能耗、带宽、漏检 | 训练和评估复杂 | 离线仿真先做 bandit/RL |

## 5. 可投稿研究方案：Risk-Aware Tiny-to-Large Routing for EO

### 5.1 问题定义

给定星上或边缘端输入影像 `x`、任务上下文 `c`（区域、灾害预警、任务优先级、剩余电量、下传窗口），系统在动作集合中选择：

- `drop`：不处理/不下传；
- `downlink_preview`：只下传压缩预览；
- `run_tiny`：只运行轻量模型并输出；
- `run_large_roi`：只对候选 ROI 调用大模型；
- `downlink_full`：完整下传；
- `emergency_fallback`：灾害高风险时触发保守策略。

目标不是最大化单一 mIoU，而是优化：

`Utility = task_quality - lambda_energy * energy - lambda_bandwidth * bandwidth - lambda_latency * latency - lambda_miss * critical_miss`

其中 `critical_miss` 对灾害、船只、火点等关键目标赋予更高惩罚。

### 5.2 模型结构

1. **Quick-look encoder**：低分辨率图像或压缩预览，MobileNetV3/EfficientNet-Lite/TinyViT。
2. **Cloud gate**：输出云量、可用像素比例、云边缘不确定性。
3. **Saliency/tiny detector gate**：输出候选 ROI、目标存在概率、异常分数。
4. **Risk calibrator**：用温度缩放、conformal prediction 或 ensemble 估计漏检风险。
5. **Router policy**：基于风险、任务优先级、硬件状态选择动作。
6. **Large branch**：Prithvi-EO-2.0/SegFormer/SAM/VLM，只对候选 ROI 或关键样本运行。
7. **Fallback rules**：灾害预警区域、历史火点/洪水区域、云边缘区域启用保守策略。

### 5.3 候选数据集

| 子任务 | 数据集 | 用法 |
|---|---|---|
| 云检测 | 38-Cloud, CloudSEN12 的光学部分, Sentinel-2 cloud mask 数据 | 训练 cloud gate；评估云量估计和可用像素 |
| 洪水/水体 | Sen1Flood11 的 Sentinel-2 光学样本、FloodNet/公开 flood optical subsets | 灾害高风险回退与大模型分支 |
| 火点/烧毁 | xBD/fire subsets、CalFireSeg-50、burn scar datasets | 高风险漏检惩罚 |
| 船只/车辆/飞机 | DOTA、DIOR、xView 的光学目标 | tiny detector gate 高召回评估 |
| Saliency | ORSSD、EORSSD | saliency gate 与 ROI 选择 |
| 边缘硬件 | Jetson Orin Nano/Raspberry Pi/FPGA profile | 真实延迟、功耗、吞吐测量 |

### 5.4 评价指标

- **任务质量**：mIoU、F1、AP、Recall@K、critical-object recall。
- **路由效率**：平均能耗、平均延迟、平均下传 MB、large-branch call rate。
- **风险指标**：critical miss rate、false drop rate、cloudy-but-critical recall。
- **校准指标**：ECE、Brier score、risk-coverage curve、selective risk。
- **系统指标**：utility、Pareto front、mission budget satisfaction rate。

## 6. 实验矩阵

| 实验 | Tiny gate | Large branch | Router | 主要问题 |
|---|---|---|---|---|
| E1 baseline-all-large | 无 | Prithvi/SegFormer/SAM 全图 | 全部调用 | 质量上限，成本最高 |
| E2 cloud-only | cloud classifier/seg | large on low-cloud images | threshold | 云 gate 节省多少下传，漏掉多少灾害 |
| E3 saliency-only | ORSI-SOD | large on salient ROI | top-K | saliency 是否能保住关键目标召回 |
| E4 detector-only | tiny YOLO/RT-DETR-nano | large on detected ROI | confidence | 小目标任务下 detector gate 是否足够可靠 |
| E5 uncertainty routing | cloud + detector | large on uncertain/high-risk ROI | calibrated threshold | 校准是否降低 false drop |
| E6 context-aware routing | cloud + saliency + metadata | large/downlink/fallback | cost-aware policy | 加入任务优先级、电量、下传窗口是否改善 utility |
| E7 disaster fallback | E6 | large + forced downlink in risk zones | conservative policy | 高风险场景是否牺牲成本换召回 |
| E8 hardware-aware | E6 | compressed GeoFM | NAS/profile policy | Jetson/FPGA 上真实能耗延迟是否符合离线估计 |

## 7. 未来研究方向

1. **漏检风险建模**：把 tiny model 的低置信度、云边缘、历史风险区和任务重要性合成一个可解释的 miss-risk score。
2. **ROI-only GeoFM inference**：不要让大模型看整图，而是由 tiny gate 提供候选 ROI，再用 Prithvi/SAM/VLM 精处理。
3. **云遮挡下的保守回退**：高云量图像不能简单丢弃；灾害预警区域应下传压缩预览或触发多时相补采。
4. **硬件感知训练**：用 SatReg/NAS 思路，为不同硬件学习 latency-power-quality surrogate。
5. **任务级 bandit/RL scheduler**：把星上动作选择建模为 budgeted decision making，而不是固定阈值。
6. **不确定性与下传策略联动**：不仅输出 mask/box，还输出“是否值得下传给地面复核”。
7. **多卫星协同**：一个卫星的 tiny gate 发现异常后，调度其他卫星或下一轨次做高分辨率复访。

## 8. 最小可复现实验

建议先做一个不需要真实卫星硬件的离线仿真：

1. 数据：选择 DOTA/DIOR 的目标检测任务，加上 38-Cloud 或 CloudSEN12 光学云 mask，构造“云量 + 目标存在”的混合场景。
2. Tiny gate：MobileNetV3 cloud classifier + YOLOv8n/RT-DETR-tiny detector。
3. Large branch：YOLOv8x/ViTDet/SAM 或 Prithvi feature + decoder。
4. Router：固定阈值、uncertainty threshold、cost-aware policy 三种。
5. 预算：假设每张图下传成本、tiny 推理成本、大模型推理成本，做 Pareto 曲线。
6. 指标：critical recall、false drop rate、large-call rate、模拟能耗、模拟下传量。

如果第一阶段结果显示在 large-call rate 降低 50% 以上时 critical recall 仍能保持 95% 以上，就值得进入第二阶段：真实 Jetson/FPGA profile 和灾害数据集。

## 9. 推荐阅读顺序

1. [NASA Prithvi in Orbit](https://science.nasa.gov/science-research/ai-foundation-model-in-orbit/)：确认星上 GeoFM 的现实背景。
2. [Φsat-2 mission](https://www.esa.int/Applications/Observing_the_Earth/Phsat-2)：理解星上多 app 场景。
3. [Efficient FPGA-accelerated CNNs for Cloud Detection on CubeSats](https://arxiv.org/abs/2504.03891)：第一级 cloud gate。
4. [Optimizing Deep Learning Models for On-Orbit Deployment Through NAS](https://www.nature.com/articles/s41598-025-21467-8)：硬件感知模型选择。
5. [TinyRS-R1](https://arxiv.org/abs/2505.12099)：轻量遥感 MLLM 分支。
6. [SatReg](https://arxiv.org/abs/2604.10306)：用真实边缘硬件 profile 构建 cost surrogate。

## 10. 结论

RS-30 最值得做的不是再提出一个轻量 YOLO 或云检测网络，而是提出一个**风险感知的 EO 任务路由框架**：用 cloud mask、saliency/tiny detector 和不确定性估计做第一级决策，把大模型、完整下传和灾害回退当作稀缺资源。这个题能同时连接 2024-2026 的三个趋势：Φsat-2/Prithvi 的星上 AI 实证、遥感 foundation model 的压缩部署、以及边缘端 dynamic inference/cascade routing。
