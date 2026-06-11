# RS-45 Few-Shot Disaster Building Damage Mapping


# RS-45 Few-Shot Disaster Building Damage Mapping

范围：灾后建筑损毁低样本制图；优先 VHR 光学 pre/post 遥感影像，兼顾 UAV/FloodNet 与 VLM 报告任务；SAR 或地面多视角工作只作为补充参考。

## 1. 问题由来

灾后建筑损毁制图的核心约束是“黄金 72 小时”：需要快速定位受损建筑、判断损毁等级，并把结果交给救援、保险和城市管理流程。但 xBD/xView2 这类主流数据虽然大，仍存在三个长期矛盾：

1. **低样本与跨灾种泛化**：新灾害发生时通常没有本地标注，模型从飓风迁移到地震、火灾、海啸时会因为建筑形态、成像角度、灾害痕迹和背景地貌变化而失效。
2. **建筑实例与损毁证据错位**：像素级变化不一定等于建筑损毁，阴影、季节、火烟、水体、配准误差都会产生伪变化；反过来，屋顶破损、局部坍塌又可能很细微。
3. **可审计输出不足**：应急场景不只要分类标签，还要建筑轮廓、pre/post 证据、损毁理由、置信度和报告文本。VLM 能生成报告，但容易脱离图像证据。

2024-2026 的新变化是，研究开始把 vision foundation model、SAM、VLM、LoRA/adapter、in-context learning 和跨域迁移引入灾害损毁评估，而不是只训练一个 xBD 专用 Siamese CNN。

## 2. 代表论文、数据与代码

| 方向 | 论文/项目 | 年份/来源 | 链接 | 代码/数据 | 关键贡献 |
|---|---|---:|---|---|---|
| 强基线与泛化诊断 | A simple, strong baseline for building damage detection on the xBD dataset | 2024 arXiv | [paper](https://arxiv.org/abs/2401.17271) | [GitHub](https://github.com/PaulBorneP/Xview2_Strong_Baseline) | 从 xView2 复杂冠军方案中剥离出简单强基线，并重新划分 unseen-location 测试，指出模型和数据分布都会导致跨地点泛化失败。 |
| Foundation model 变化检测 | Generalizable Disaster Damage Assessment via Change Detection with Vision Foundation Model / DAVI | 2024 arXiv, 2025 revision | [paper](https://arxiv.org/abs/2406.08020) | 未确认官方代码 | 结合源域任务模型和 segmentation foundation model，在目标区域无 GT 标签时生成损毁伪标签，并做 pixel/image 两阶段 refinement。 |
| SAM 视觉提示 | Visual Prompt Learning of Foundation Models for Post-Disaster Damage Evaluation / ViPDE | 2025 Remote Sensing | [paper](https://www.mdpi.com/2072-4292/17/10/1664) | 未见官方代码 | 用 SAM 嵌入知识和 pre/post 图像对做 contrastive visual prompt learning，面向建筑损毁评价。 |
| VLM 灾害数据 | DisasterM3: A Remote Sensing Vision-Language Dataset for Disaster Damage Assessment and Response | 2025 NeurIPS | [paper](https://arxiv.org/abs/2505.21089) | [GitHub](https://github.com/Junjue-Wang/DisasterM3) | 26,988 bi-temporal images、123k instruction pairs、36 个灾害事件、9 类任务；包含多传感器，SAR 内容需在光学主线中标记为 mixed-modality。 |
| 多模态基准 | DisasterInsight: A Multimodal Benchmark for Function-Aware and Grounded Disaster Assessment | 2026 arXiv | [paper](https://arxiv.org/abs/2601.18493) | 待确认 | 将 xBD 重构为约 112K building-centered instances，支持功能分类、损毁等级、灾害类型、计数和结构化报告；DI-Chat 用 LoRA 做灾害指令适配。 |
| 智能迁移 | Smart Transfer: Leveraging Vision Foundation Model for Rapid Building Damage Mapping with Post-Earthquake VHR Imagery | 2026 arXiv | [paper](https://arxiv.org/abs/2604.02627) | [GitHub](https://github.com/ai4city-hkust/SmartTransfer) | 面向震后 VHR 单灾害快速迁移，提出 Pixel-wise Clustering 和 Distance-Penalized Triplet，做 LODO/SSDC 跨区域实验。 |
| VLM 推理 | Instruct-ICL: Instruction-Guided In-Context Learning for Post-Disaster Damage Assessment | 2026 arXiv | [paper](https://arxiv.org/abs/2605.11439) | FloodNet 依赖 [GitHub](https://github.com/BinaLab/FloodNet-Challenge-EARTHVISION2021) | 用一个 MLLM 生成任务指令/CoT 指导另一个 MLLM，在 FloodNet post-disaster VQA 上研究 prompt/ICL 稳定性。 |
| SAM + temporal VLM | Integrating segmentation and vision-language model for automated and interpretable building damage assessment from satellite imagery / BDAChat | 2026 Automation in Construction | [paper](https://www.sciencedirect.com/science/article/pii/S1474034626000121) | [GitHub](https://github.com/WangYong921/BDAChat) | 三阶段框架：改进 SAM 分割、时空配对、BDAChat temporal VLM 做对象级损毁推理和解释。 |
| 工程基线 | Microsoft building damage assessment toolkit | 持续维护 | [GitHub](https://github.com/microsoft/building-damage-assessment), [CNN Siamese](https://github.com/microsoft/building-damage-assessment-cnn-siamese) | GitHub | 提供 xBD 类别、推理/可视化 workflow，可作为工程 baseline 与部署参考。 |
| 经典对象级变化 | ChangeOS | 2021 RSE, 仍是重要基线 | [GitHub](https://github.com/Z-Zheng/ChangeOS) | GitHub | 深度对象级语义变化检测框架，适合作为非 foundation model 的强对照。 |
| 数据 | xBD / xView2 | 2019- | [paper](https://arxiv.org/abs/1911.09296), [dataset index](https://fmi-data-index.github.io/xbd.html), [EOTDL](https://www.eotdl.com/datasets/xView2) | [baseline](https://github.com/diux-xview/xview2-baseline) | 主流建筑损毁数据，四级损毁标签：no damage、minor、major、destroyed；仍是少样本和跨灾种实验的核心数据。 |
| UAV/VQA 补充 | FloodNet Challenge | 2021- | [GitHub](https://github.com/BinaLab/FloodNet-Challenge-EARTHVISION2021) | GitHub | 高分辨率 UAV 洪灾图像，含分类、半监督分割和 VQA，适合验证 Instruct-ICL/VLM 的灾害问答路线。 |

## 3. 方法脉络

### 3.1 xBD 专用模型到跨地点强基线

2024 的 xBD simple strong baseline 很重要，因为它不只是给一个模型，而是指出原 competition split 可能高估泛化能力。它把测试位置设置为训练未见区域后，复杂模型和简化模型都明显暴露跨地点弱点。这说明 RS-45 不能只做随机 split 上的 F1，而必须做 leave-event-out、leave-region-out、leave-disaster-type-out。

### 3.2 Foundation model + 伪标签/迁移

DAVI 和 Smart Transfer 是这个方向最贴近“低样本”的两条线：

- DAVI：在目标灾区没有 GT 标签时，用源域损毁模型和 segmentation foundation model 生成目标伪标签，再做 pixel/image refinement。它更像 unsupervised domain adaptation。
- Smart Transfer：用 vision foundation model feature 做震后 VHR 建筑损毁迁移，通过 pixel-wise clustering 和 distance-penalized triplet 处理跨区域特征对齐。它更像 few-shot/transfer learning 的方法论文雏形。

### 3.3 SAM/实例分割 + 损毁推理

建筑损毁不是普通变化检测，必须先把“建筑实例”稳定分出来，再判断该实例在 post-event 中是否损毁。ViPDE 和 BDAChat 都体现了这个趋势：SAM 或改进 SAM 用来得到对象边界，后续模块处理 pre/post 对齐和损毁语义。

关键细问题是：SAM mask 是否对应同一建筑？pre/post misregistration 会不会让 mask evidence 错位？如果 SAM 只看 post-event，倒塌建筑可能轮廓消失；如果只看 pre-event，post-event 证据需要精确投影。

### 3.4 VLM/指令数据 + 可解释报告

DisasterM3、DisasterInsight、Instruct-ICL、BDAChat 把任务从标签预测扩展到 VQA 和结构化报告。这个方向的研究价值在于：把灾害响应中的自然语言问题转成可验证输出。但风险也很明显：VLM 可能根据灾害类型和常识猜测损毁，未必看到了建筑证据。

## 4. 当前主要问题

1. **低样本定义混乱**：few-shot 可以指每个灾害几张图、每类几个建筑、每个区域少量标注、或者只给文本/视觉 prompt。必须在论文中明确标注成本。
2. **损毁等级长尾**：minor/major/destroyed 的分布不均，minor 与 no-damage 视觉差异小，destroyed 又常受遮挡和背景影响。
3. **pre/post 配准误差**：像素级差分对 VHR 灾后场景非常敏感，尤其地震、火灾、洪水中的阴影、水体、烟雾会制造伪变化。
4. **跨灾种外观差异**：火灾是烧蚀/烟熏，洪水是水淹/泥沙，地震是坍塌/碎片，飓风是屋顶破损；统一损毁标签掩盖了机制差异。
5. **证据评估缺失**：只看 building-level F1 不知道模型是否定位到真实损毁区域；VLM 报告尤其需要 evidence mask 或 attention/grounding 约束。
6. **光学可观测性限制**：灾后云、烟、夜间、遮挡会让纯光学影像失败。本文主线仍以光学为主，但方法设计应报告“不可判定/低置信”状态，而不是强行分类。

## 5. 推荐小课题：FEAD-BDA

题名候选：**Few-Shot Evidence-Aware Disaster Adapter for Building Damage Mapping**

### 5.1 研究假设

少量目标灾区建筑级标注 + foundation model 特征 + SAM 建筑实例证据，比纯 xBD 源域模型或纯 VLM zero-shot 更能跨灾种泛化；如果同时约束损毁预测必须对应 pre/post evidence mask，可以减少“答对但证据错”的不可审计结果。

### 5.2 方法模块

1. **建筑实例锚定**：用 pre-event 建筑 footprint、SAM/改进 SAM、xBD polygon 或 OSM footprint 得到候选建筑实例。
2. **双时相特征编码**：用 DINOv2/SAM image encoder/遥感 VFM 提取 pre/post object crop、mask pooled feature 和 local context feature。
3. **few-shot adapter**：每个目标灾区只标注 K 个 building instances，训练 LoRA/adapter/prototype head；对比 Smart Transfer 的 Pixel-wise Clustering 和 DPT。
4. **证据 mask 约束**：输出 damage class 的同时输出 changed evidence mask；损失由 building-level CE、mask consistency、pre/post contrastive loss 和 uncertainty regularization 组成。
5. **VLM 报告头**：可选接入 BDAChat/DI-Chat 风格报告，但要求报告引用模型输出的 evidence mask，不允许只生成自由文本。

### 5.3 数据与划分

| 数据 | 用途 | 备注 |
|---|---|---|
| xBD/xView2 | 主实验 | 做 leave-disaster-type-out、leave-event-out、leave-region-out；四级损毁和 building polygon。 |
| Smart Transfer 数据 | 震后 VHR 迁移 | 用于验证 post-earthquake VHR 场景和代码复现。 |
| DisasterInsight | VLM/report 扩展 | building-centered instances，可做 damage-level + report generation。 |
| DisasterM3 | 多灾害 VLM 补充 | mixed modality，光学子集优先，SAR 样本单独报告。 |
| FloodNet | UAV/VQA 补充 | 不完全是建筑损毁制图，但适合验证灾害 VQA/ICL。 |

### 5.4 Baseline

- xBD simple strong baseline / xView2 baseline。
- ChangeOS 或 SNUNet-CD/BIT/ChangeFormer 类变化检测。
- DAVI：无目标标签的 foundation model change detection。
- Smart Transfer：VFM + PC + DPT 跨区域迁移。
- SAM/ViPDE/BDAChat：实例分割或 VLM 解释路线。
- Zero-shot VLM / Instruct-ICL：只用 prompt/ICL 做 damage QA 或 damage classification。

### 5.5 指标

| 层面 | 指标 |
|---|---|
| 建筑定位 | building IoU、polygon F1、mask boundary F-score |
| 损毁分类 | macro-F1、per-class F1、balanced accuracy、minor/major/destroyed confusion |
| 变化证据 | evidence mask IoU、changed-area precision/recall、evidence-class consistency |
| 低样本效率 | K-shot curve、annotation minutes per F1 point、support set sensitivity |
| 泛化 | leave-event-out、leave-region-out、leave-disaster-type-out、cross-year |
| 可信度 | ECE、selective risk、abstention accuracy、uncertainty-error correlation |
| 报告质量 | structured field accuracy、grounded report score、human audit pass rate |

## 6. 最小可复现实验矩阵

| 实验 | 目标 | 设置 |
|---|---|---|
| E1 | 确认强基线 | 复现 xBD simple strong baseline；random split vs unseen-location split。 |
| E2 | few-shot 曲线 | 每个目标灾害 K=1/5/10/25/50 buildings，训练 prototype/LoRA/adapter。 |
| E3 | SAM 证据价值 | with/without SAM building mask；pre-mask、post-mask、union/intersection 三种证据池化。 |
| E4 | 跨灾种 | train wildfire+hurricane，test earthquake/tsunami/flood；反向也做。 |
| E5 | 配准扰动 | 对 post 图做 1-8 pixel shift，测试 damage F1 和 evidence IoU 下降。 |
| E6 | VLM 报告 | 对同一建筑输出 damage label + evidence + report，与 DI-Chat/BDAChat 或 zero-shot VLM 比较。 |
| E7 | 不确定拒判 | 允许模型输出 uncertain/unobservable，评价 selective risk 和人工复核比例。 |

## 7. 风险与规避

- **数据许可和下载门槛**：xBD/xView2 可能需要注册；DisasterM3 有 academic-only 限制。规避：先用公开 baseline repo 和小样本 subset 建最小 pipeline。
- **VFM 不一定适合 VHR 灾害细节**：自然图像 foundation model 或粗分辨率 GeoFM 可能看不到屋顶细节。规避：比较 DINOv2/SAM encoder/VHR 遥感模型，不只用一个 backbone。
- **VLM 幻觉**：报告生成会显得“聪明”但不可审计。规避：强制引用 evidence mask 和结构化字段，先评估字段再评估文本。
- **minor damage 标注主观**：轻微损毁视觉证据弱。规避：报告 per-class F1 和人工复核 disagreement，不只看总体 F1。

## 8. 下一步阅读队列

1. [A simple, strong baseline for building damage detection on the xBD dataset](https://arxiv.org/abs/2401.17271)
2. [Generalizable Disaster Damage Assessment via Change Detection with Vision Foundation Model](https://arxiv.org/abs/2406.08020)
3. [Visual Prompt Learning of Foundation Models for Post-Disaster Damage Evaluation](https://www.mdpi.com/2072-4292/17/10/1664)
4. [DisasterM3](https://arxiv.org/abs/2505.21089) and [GitHub](https://github.com/Junjue-Wang/DisasterM3)
5. [DisasterInsight](https://arxiv.org/abs/2601.18493)
6. [Smart Transfer](https://arxiv.org/abs/2604.02627) and [GitHub](https://github.com/ai4city-hkust/SmartTransfer)
7. [Instruct-ICL](https://arxiv.org/abs/2605.11439)
8. [BDAChat GitHub](https://github.com/WangYong921/BDAChat)
9. [FloodNet Challenge](https://github.com/BinaLab/FloodNet-Challenge-EARTHVISION2021)
10. [Microsoft building-damage-assessment-cnn-siamese](https://github.com/microsoft/building-damage-assessment-cnn-siamese)

