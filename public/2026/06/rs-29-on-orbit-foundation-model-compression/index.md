# RS-29 On-Orbit Foundation Model Compression


# RS-29 On-Orbit Foundation Model Compression

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-29` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务来源：research/50threadprompts.md 中 RS29 OnOrbit Foundation Model Compression 范围：面向星上/边缘部署的光学/多光谱 GeoFM 压缩实验。默认不以 SARonly 任务为主；混合模态论文只取其中对光学/多光谱 foundation model 压缩有价值

## 正文

# RS-29 On-Orbit Foundation Model Compression

更新时间：2026-06-07  
任务来源：`research/50_thread_prompts.md` 中 `RS-29 On-Orbit Foundation Model Compression`  
范围：面向星上/边缘部署的光学/多光谱 GeoFM 压缩实验。默认不以 SAR-only 任务为主；混合模态论文只取其中对光学/多光谱 foundation model 压缩有价值的部分。

## 1. 研究问题

这个方向的核心问题不是“把模型做小”这么简单，而是：在星上或边缘设备的功耗、内存、延迟、抗辐照、通信和实时决策约束下，如何把 Prithvi/SkySense/Clay/多模态遥感 VLM 等大模型能力压缩成可靠可运行的任务系统。

典型场景包括：

- 云检测、洪水检测、火点/烧毁区、非法采矿、灾后损毁等事件触发式任务。
- 星上预筛选：只下传有价值 tile 或事件摘要，减少带宽。
- 边缘无人机/小卫星实时推理：低延迟、低功耗、可失败回退。
- 小模型先路由，大模型按需调用：tiny detector/cloud mask/saliency 先判断是否值得使用 GeoFM。

最适合作为论文切口的问题是：**GeoFM 压缩后的 accuracy-latency-energy-OOD trade-off 如何被系统评估，并且能否通过 adapter、量化、剪枝、蒸馏和任务路由组合，让压缩模型在真实分布偏移下仍可靠。**

## 2. 问题由来

遥感 foundation model 的规模在 2024-2026 快速变大：SkySense、Prithvi-EO-2.0、Clay、Galileo、TerraMind、AlphaEarth 等都在扩大数据、任务和模态覆盖。但星上部署的约束反过来很硬：

1. **算力约束**：星载 CPU/FPGA/低功耗 GPU/NPU 通常远弱于地面训练集群。
2. **内存约束**：大 ViT/VLM 的 attention token 和中间激活会超过星上设备内存。
3. **功耗约束**：能耗比 FLOPs 更关键，太阳能、热控和任务 duty cycle 都会限制推理频率。
4. **带宽约束**：星上 AI 的价值经常不是最终高精度制图，而是减少无效下传。
5. **可靠性约束**：辐射、温度、压缩伪影、云雾、传感器漂移和 OOD 会放大量化/剪枝误差。

NASA 2026 关于 Prithvi 的在轨报道和 2025 arXiv 的在轨演示论文说明，这个方向已经从概念验证进入系统工程阶段：压缩版 foundation model 被部署到 Kanyini 卫星和 ISS IMAGIN-e 平台，用于云与洪水相关检测。这给研究带来一个很好的窗口：现在可以围绕“模型压缩 + 在轨约束 + 任务可靠性”做方法论文，而不是只做工程展示。

## 3. 代表论文与项目

| 论文/项目 | 年份/来源 | 链接 | 代码/模型 | 与 RS-29 的关系 |
|---|---:|---|---|---|
| NASA: Prithvi Geospatial Foundation Model in Orbit | 2026 NASA | [NASA official](https://science.nasa.gov/science-research/ai-foundation-model-in-orbit/) | [Prithvi-EO-2.0 GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) | 官方在轨故事线：压缩版 Prithvi 在 Kanyini/ISS IMAGIN-e 做云与洪水检测，是本方向的强动机来源。 |
| First On-Orbit Demonstration of the Applications of Geospatial Foundation Models | 2025 arXiv | [arXiv](https://arxiv.org/abs/2512.01181) | 论文页/项目线索 | 直接讨论 GeoFM 在轨应用，适合作为实验设计和系统指标参考。 |
| Prithvi-EO-2.0 | 2024 IBM/NASA | [arXiv](https://arxiv.org/abs/2412.02732), [HF paper](https://huggingface.co/papers/2412.02732) | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0) | GeoFM 压缩对象之一；多时相 HLS/Sentinel-Landsat 语义强，适合做云/洪水/火灾 adapter。 |
| TinyRS-R1: Compact Multimodal Language Model for Remote Sensing | 2025 arXiv | [arXiv](https://arxiv.org/abs/2505.12099) | 论文页线索 | 遥感小型多模态模型方向，适合作为 tiny VLM 或路由模型 baseline。 |
| Optimizing Deep Learning Models for On-Orbit Deployment Through NAS | 2025 Scientific Reports | [Nature](https://www.nature.com/articles/s41598-025-21467-8) | 论文页线索 | 面向在轨部署的硬件感知 NAS，给出模型大小、延迟、精度 Pareto 思路。 |
| When LVLM Meets Large Remote Sensing Imagery: Coarse-to-Fine Text-Guided Token Pruning | 2025 ICCV | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Luo_When_Large_Vision-Language_Model_Meets_Large_Remote_Sensing_Imagery_Coarse-to-Fine_ICCV_2025_paper.html) | [LRS-VQA GitHub](https://github.com/VisionXLab/LRS-VQA) | 大幅面遥感 VLM 的动态金字塔和文本引导 token pruning，可迁移到星上“只看关键 tile”。 |
| Parameter Efficient Self-Supervised Geospatial Domain Adaptation | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Scheibenreif_Parameter_Efficient_Self-Supervised_Geospatial_Domain_Adaptation_CVPR_2024_paper.html) | 论文页 | SLR adapters 只训练少量参数，适合作为星上/边缘小样本适配和低存储更新 baseline。 |
| RS-vHeat: Heat Conduction Guided Efficient Remote Sensing Foundation Model | 2025 ICCV | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Hu_RS-vHeat_Heat_Conduction_Guided_Efficient_Remote_Sensing_Foundation_Model_ICCV_2025_paper.html) | [vHeat](https://github.com/MzeroMiko/vHeat) | 高效 backbone 路线，可作为“从源头设计小模型”而非后压缩的对照。 |
| DynamicVis: Efficient Visual Foundation Model for RS Understanding | 2025 arXiv | [arXiv](https://arxiv.org/abs/2503.16426) | [GitHub](https://github.com/KyanChen/DynamicVis), [HF](https://huggingface.co/KyanChen/DynamicVis) | 动态区域感知和高效推理，适合作为大图边缘部署对照。 |
| RS-Mamba for Large Remote Sensing Image Dense Prediction | 2024 TGRS/arXiv | [arXiv](https://arxiv.org/abs/2404.02668) | [GitHub](https://github.com/walking-shadow/Official_Remote_Sensing_Mamba) | 线性复杂度骨干，作为压缩 ViT 的结构替代路线。 |
| RoMA: Scaling up Mamba-based Foundation Models for RS | 2025 NeurIPS | [OpenReview](https://openreview.net/forum?id=QwY1vk67T3) | [GitHub](https://github.com/MiliLab/RoMA) | 高效 foundation backbone，对比“压缩已有 ViT”和“训练高效 SSM FM”。 |
| LearnPruner | 2026 ICLR | [OpenReview](https://openreview.net/forum?id=Dxb6gBJHby) | 论文页 | 通用 VLM token pruning，可迁移为遥感 VQA/grounding 的中层剪枝 baseline。 |
| MetaCompress | 2026 arXiv | [arXiv](https://arxiv.org/abs/2603.21701) | [GitHub](https://github.com/MArSha1147/MetaCompress) | 通用 VLM token compression；适合比较遥感专用剪枝是否真的需要地理/小目标先验。 |

## 4. 方法路线比较

| 路线 | 适合压缩什么 | 优点 | 风险 | 推荐实验角色 |
|---|---|---|---|---|
| 量化 | backbone、adapter、decoder、MLP | 部署收益直接，可做 INT8/INT4/混合精度 | 光谱细节、小目标边界和置信度校准可能退化 | 必选 baseline |
| 结构化剪枝 | attention head、MLP channel、ViT block | 可减少实际延迟和内存 | 不同硬件收益不一致，可能破坏跨域鲁棒性 | 与量化组合 |
| Token pruning / dynamic tiling | 大图 VLM、ViT encoder | 对万级像素遥感图最有价值 | 剪掉小目标/罕见目标会造成不可恢复漏检 | 研究主线之一 |
| 蒸馏 | 大 GeoFM 到小 ViT/Mamba/ConvNeXt | 可保留 teacher 语义 | teacher 的地理偏差和幻觉会被继承 | 作为压缩质量核心 |
| LoRA/adapter | 下游任务和区域适配 | 存储小、可快速更新 | backbone 仍大；量化后 adapter 交互需测 | 适合星上任务包 |
| NAS | 从头搜索部署友好模型 | 硬件感知强，Pareto 明确 | 搜索成本高，迁移到新任务需重做 | 可作为系统上界 |
| Tiny-to-large routing | 任务系统 | 省能耗/带宽，便于回退 | 路由漏检会压低上限 | 很适合论文创新 |
| 高效骨干替代 | RS-Mamba/RoMA/RS-vHeat/DynamicVis | 结构上减少复杂度 | 与强 GeoFM teacher 的语义差距需验证 | 对照路线 |

## 5. 可投稿实验设计

题目草案：**Risk-Calibrated Compression of Geospatial Foundation Models for On-Orbit Optical Remote Sensing**

### 5.1 核心假设

1. 仅用 accuracy 压缩 GeoFM 会高估星上可用性；必须同时评估 latency、energy、memory、downlink saving 和 OOD robustness。
2. 对遥感大图，最危险的压缩不是权重量化，而是 tile/token pruning 导致的不可恢复漏检。
3. 用不确定性和小目标/云/变化先验约束的 dynamic routing，可以在相同能耗下比静态压缩模型更可靠。

### 5.2 模型候选

Teacher:

- Prithvi-EO-2.0 300M/600M。
- SkySense 或 Clay 作为开源/半开源对照。
- 对 VLM 任务可选 LRS-VQA 相关 LVLM 或 TinyRS-R1 teacher/student 组合。

Student:

- MobileViT/ConvNeXt-T/ViT-Tiny/Mamba-tiny/RS-vHeat-small。
- Prithvi encoder + LoRA/adapter + small decoder。
- tiny cloud/event router + compressed GeoFM cascade。

压缩配置：

- FP16 baseline。
- INT8 post-training quantization。
- INT4/混合精度量化。
- 结构化 pruning 25/50/75%。
- token pruning 25/50/75%，带风险校准。
- teacher-student distillation：feature distillation、logit distillation、mask distillation。
- LoRA rank 4/8/16，adapter bottleneck 32/64/128。

### 5.3 任务与数据集

优先选择光学/多光谱，并覆盖“星上有实际价值”的事件任务：

| 任务 | 数据集候选 | 指标 |
|---|---|---|
| 云检测 | HLS/Sentinel-2 cloud mask、Prithvi demo 相关数据、S2 cloud datasets | mIoU、F1、cloud false negative rate |
| 洪水/水体 | Sen1Floods11 中光学分支、WorldFloods、Sentinel-2 flood scenes | IoU、recall、event-level miss rate |
| 火灾/烧毁区 | Burned area Sentinel-2/Landsat 数据、Fire scars datasets | IoU、F1、OOD by region |
| 土地覆盖 | Chesapeake/EuroSAT/BigEarthNet/PhilEO/PANGAEA tasks | accuracy、mIoU、spatial OOD |
| 大图 VQA/事件路由 | LRS-VQA 或自建大幅面 tile task | answer acc、evidence recall、token saving |

说明：如果使用 Sen1Floods11 这类混合模态数据，实验应明确只使用光学输入或把 SAR 设为额外低优先对照，避免偏离当前任务范围。

### 5.4 硬件指标

论文中应报告两类指标：算法指标和部署指标。

算法指标：

- accuracy、mIoU、F1、AP、AUROC。
- OOD drop：跨地区、跨季节、跨传感器、跨 GSD。
- calibration：ECE、Brier score、risk-coverage curve。
- small-object/event recall：星上任务最怕漏检。

部署指标：

- 模型大小：MB，参数量。
- 峰值内存：MB。
- 推理延迟：ms/tile、s/scene。
- 能耗：J/tile、J/scene，或功耗 x 延迟近似。
- 吞吐：km2/s 或 tiles/s。
- 下传节省：需要下传 tile 比例、事件触发准确率。
- duty cycle：单位轨道周期可处理图像数。
- 回退率：router 不确定时调用大模型或下传原图的比例。

硬件建议：

- 地面模拟：Jetson Orin Nano/NX、Raspberry Pi + Coral、Intel/ARM CPU。
- 更接近星载：RISC-V/FPGA/NPU 模拟环境，或使用公开 on-board AI benchmark 的等价功耗设置。
- 若没有真实硬件，至少使用 ONNX Runtime/TensorRT 的延迟与峰值内存，并报告测量环境。

## 6. 失败模式

1. **漏检比误检更致命**：cloud/flood/fire/event routing 中，压缩模型漏掉关键区域会导致无法下传原始数据。
2. **小目标被 token pruning 剪掉**：飞机、船、窄水体、局部火点、建筑损毁很容易在粗分辨率 overview 中消失。
3. **量化破坏置信度校准**：accuracy 下降不大，但 uncertainty 失真，无法可靠触发回退。
4. **蒸馏继承 teacher 偏差**：teacher 在某气候带或城市形态下错，student 会更自信地错。
5. **压缩模型 OOD drop 更大**：新地区、新传感器、新季节下压缩误差被放大。
6. **FLOPs 不等于能耗**：非结构化剪枝在真实硬件上可能无收益，memory bandwidth 反而成为瓶颈。
7. **星上环境缺少人工修复**：模型输出需要 watchdog、fallback 和可追踪日志。

## 7. 最小实现路线

### 阶段 A：地面可复现 baseline

1. 选 Prithvi-EO-2.0 或 Clay encoder。
2. 选择云检测或洪水检测作为第一个任务。
3. 建立 FP16 baseline：linear probe / small decoder / LoRA adapter。
4. 添加 INT8 和 INT4 量化。
5. 添加 small student distillation。
6. 在同一数据划分上报告 accuracy、mIoU、latency、memory。

### 阶段 B：风险感知压缩

1. 对大图引入 dynamic tiling/token pruning。
2. 对每个 tile 输出 risk score：uncertainty、saliency、小目标先验、cloud/event likelihood。
3. 设计 fallback：高风险 tile 不剪枝或调用 teacher。
4. 报告 risk-coverage-energy 曲线。

### 阶段 C：星上任务系统模拟

1. 模拟轨道批处理：输入一批时序影像 tile。
2. tiny router 先判断 cloud/event/no-interest。
3. compressed GeoFM 处理疑似事件 tile。
4. 只有高价值 tile 下传。
5. 输出 downlink saving、event miss rate、energy per detected event。

## 8. 推荐实验矩阵

| 组别 | 模型 | 压缩 | 路由 | 主要验证 |
|---|---|---|---|---|
| B0 | Prithvi/Clay FP16 | 无 | 无 | teacher 上界 |
| B1 | Prithvi/Clay | INT8 | 无 | 基础部署收益 |
| B2 | Prithvi/Clay | INT4/mixed | 无 | 极限量化风险 |
| B3 | Small ViT/Mamba | distillation | 无 | student 能力 |
| B4 | Prithvi/Clay + LoRA | INT8 + LoRA | 无 | 少参数任务包 |
| B5 | B1/B3 | token pruning | 无 | 大图加速 |
| B6 | B1/B3 | token pruning | uncertainty fallback | 风险感知剪枝 |
| B7 | tiny router + B6 | cascade | 有 | 星上系统收益 |
| B8 | NAS small model | searched | 有/无 | 硬件感知上界 |

核心图表：

- accuracy-latency-energy Pareto。
- OOD drop vs compression ratio。
- event recall vs downlink saving。
- calibration curve before/after quantization。
- small-object recall vs token pruning ratio。

## 9. 可能的创新点

1. **Risk-calibrated token pruning**：剪枝模块不仅输出保留 token，还输出漏检风险；风险高则保留高分辨率 tile 或触发回退。
2. **Quantization-aware geospatial adapter**：只让少量 adapter 保持 FP16/BF16，backbone INT8/INT4，保护光谱/时序细节。
3. **Teacher-student-router 三元蒸馏**：teacher 教 student 特征，teacher 同时教 router 判断何时不该压缩。
4. **On-orbit evaluation protocol**：把 event miss rate、downlink saving、J/event、OOD drop 和 calibration 纳入统一 benchmark。
5. **Failure replay buffer**：星上保存高不确定/疑似失败 tile，下传后用于地面再训练 adapter。

## 10. 推荐论文方案

论文标题候选：

- Risk-Calibrated Compression of Geospatial Foundation Models for On-Orbit Optical Remote Sensing
- Tiny-to-Reliable: Energy-Aware GeoFM Compression with Uncertainty Fallback for Satellite Edge Inference
- Beyond FLOPs: Evaluating Compressed Earth Observation Foundation Models under On-Orbit Constraints

方法模块：

1. Compressed GeoFM backbone：Prithvi/Clay + INT8/INT4 + LoRA。
2. Distilled student：small ViT/Mamba/RS-vHeat。
3. Risk-aware tile/token selector：uncertainty + saliency + small-object prior。
4. Tiny router：cloud/event/no-interest triage。
5. Fallback policy：high-risk tile uses teacher or downlinks raw patch.

预期贡献：

- 一个面向星上约束的 GeoFM 压缩 benchmark protocol。
- 一个风险感知压缩和回退方法。
- 一组比单纯 accuracy/FLOPs 更真实的部署指标。
- 对 Prithvi/Clay 等公开模型的可复现实验脚本。

## 11. 下一步阅读队列

1. [NASA: Prithvi Geospatial Foundation Model in Orbit](https://science.nasa.gov/science-research/ai-foundation-model-in-orbit/)
2. [First On-Orbit Demonstration of the Applications of Geospatial Foundation Models](https://arxiv.org/abs/2512.01181)
3. [Prithvi-EO-2.0 GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
4. [TinyRS-R1](https://arxiv.org/abs/2505.12099)
5. [Optimizing Deep Learning Models for On-Orbit Deployment Through NAS](https://www.nature.com/articles/s41598-025-21467-8)
6. [LRS-VQA / Coarse-to-Fine Text-Guided Token Pruning](https://openaccess.thecvf.com/content/ICCV2025/html/Luo_When_Large_Vision-Language_Model_Meets_Large_Remote_Sensing_Imagery_Coarse-to-Fine_ICCV_2025_paper.html)
7. [Parameter Efficient Self-Supervised Geospatial Domain Adaptation](https://openaccess.thecvf.com/content/CVPR2024/html/Scheibenreif_Parameter_Efficient_Self-Supervised_Geospatial_Domain_Adaptation_CVPR_2024_paper.html)
8. [RS-vHeat](https://openaccess.thecvf.com/content/ICCV2025/html/Hu_RS-vHeat_Heat_Conduction_Guided_Efficient_Remote_Sensing_Foundation_Model_ICCV_2025_paper.html)
9. [DynamicVis](https://arxiv.org/abs/2503.16426)
10. [MetaCompress](https://arxiv.org/abs/2603.21701)

## 12. 结论

RS-29 最值得继续推进的不是单点压缩技巧，而是**风险感知的星上 GeoFM 任务系统**：用压缩 GeoFM 提供语义能力，用 tiny router 和 uncertainty fallback 控制漏检风险，用 energy/downlink/OOD/calibration 指标替代只看 FLOPs 的评价。这个切口足够细，也贴近 2026 已经出现的 Prithvi in Orbit 趋势，具备 TGRS、ISPRS JPRS、CVPR/ICCV workshop 或应用型顶刊的投稿潜力。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

