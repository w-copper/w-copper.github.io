---
title: "RS-12 Training-Free Open-Vocabulary Remote Sensing Segmentation"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["SAM", "开放词表分割", "提示式分割"]
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# RS-12 Training-Free Open-Vocabulary Remote Sensing Segmentation

范围：光学/航空/卫星遥感为主；关注 training-free 或接近 training-free 的 open-vocabulary semantic segmentation (OVSS/OVRSS/OVRSIS)，并比较 CLIP token、SAM mask、DINO feature、上下文推理的组合方式。

## 1. 问题由来

遥感语义分割长期依赖封闭类别：训练集里有 `building/road/water/crop`，测试时也只能预测这些类。但真实地理应用经常要临时查询新类别，比如“洪水淹没道路”“停车场”“光伏板”“裸土中的采矿坑”。重新标注像素级数据成本很高，于是 open-vocabulary segmentation 变得很诱人。

把自然图像 OVSS 直接搬到遥感会遇到三个硬问题：

- 遥感目标方向任意、尺度跨度大。自然图像里的 CLIP patch similarity 在遥感小目标、旋转目标上容易粗糙。
- 遥感影像通常是大场景，独立 tile 预测会破坏道路、水体、农田等空间连续性。
- 类别语义层级复杂。`impervious surface/road/runway/building`、`field/crop/rice`、`water/river/lake/flood` 之间存在父子和重叠关系，简单 prompt matching 会产生类别漂移。

因此 2024-2026 的主线不是“重新训练一个遥感分割网络”，而是把已有 foundation model 的能力组合起来：CLIP/RS-CLIP 提供文本语义，SAM 提供候选 mask 和边界，DINO/DINOv3 提供更强 patch feature，上下文推理负责跨 tile 或跨 region 一致性。

## 2. 代表论文与代码

| 方法 | 年份/来源 | 训练需求 | 关键组件 | 官方链接 | 核心贡献 |
|---|---:|---|---|---|---|
| OVRS / Open-Vocabulary Remote Sensing Image Semantic Segmentation | 2024 arXiv | 需要方法训练/基准构造 | CLIP similarity、rotation aggregation、multi-scale refinement | [arXiv](https://arxiv.org/abs/2409.07683), [GitHub](https://github.com/caoql98/OVRS) | 面向遥感 OVS 的早期系统框架；提出旋转聚合相似度和尺度感知上采样，并开源 4 个遥感数据集基准。 |
| SegEarth-OV | 2025 CVPR Oral | 推理主流程 training-free；SimFeatUp 有预训练组件 | CLIP patch token、CLS subtraction、SimFeatUp | [Project](https://likyoo.github.io/SegEarth-OV/), [CVPR PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Li_SegEarth-OV_Towards_Training-Free_Open-Vocabulary_Segmentation_for_Remote_Sensing_Images_CVPR_2025_paper.pdf), [GitHub](https://github.com/likyoo/SegEarth-OV) | 观察 CLIP local patch token 受 global CLS bias 干扰，用 CLS token subtraction 缓解全局偏置，用 SimFeatUp 恢复空间细节；在 17 个遥感数据集上覆盖语义分割、建筑、道路、水体/洪水。 |
| AerOSeg | 2025 CVPRW EarthVision | 有方法组件/可能轻训练 | SAM-guided OVS、旋转增强图文相关特征 | [CVPRW PDF](https://www.openaccess.thecvf.com/content/CVPR2025W/EarthVision/papers/Dutta_AerOSeg_Harnessing_SAM_for_Open-Vocabulary_Segmentation_in_Remote_Sensing_Images_CVPRW_2025_paper.pdf) | 使用 SAM 边界/空间先验增强开放词表遥感分割，强调遥感旋转和空间 refinement。 |
| ReSeg-CLIP | 2026 arXiv | training-free | SAM hierarchical masks、RS-CLIP model composition | [arXiv](https://arxiv.org/abs/2602.23869) | 用 SAM 多尺度 mask 限制 CLIP self-attention 交互，并组合多个遥感 CLIP 变体；目标是无需额外训练提升 OVSS。 |
| Enabling Training-Free Text-Based Remote Sensing Segmentation | 2026 CVPRW EarthVision | 完全 zero-shot 或轻量 LoRA | CLIP mask selector、SAM grid masks、GPT/Qwen-VL click prompts | [CVF](https://openaccess.thecvf.com/content/CVPR2026W/EarthVision/html/Sosa_Enabling_Training-Free_Text-Based_Remote_Sensing_Segmentation_CVPRW_2026_paper.html), [arXiv](https://arxiv.org/abs/2602.17799), [GitHub](https://github.com/josesosajs/trainfree-rs-segmentation) | 训练自由地把 CLIP 用作 SAM grid mask selector；同时用生成式 VLM 产生 click prompts，覆盖 OVSS、referring 和 reasoning segmentation。 |
| ConInfer | 2026 CVPR Findings | inference-only framework | context-aware joint inference、inter-unit semantic dependencies | [arXiv](https://arxiv.org/abs/2603.29271), [CVPR PDF](https://openaccess.thecvf.com/content/CVPR2026F/papers/Chen_ConInfer_Context-Aware_Inference_for_Training-Free_Open-Vocabulary_Remote_Sensing_Segmentation_CVPRF_2026_paper.pdf), [GitHub](https://github.com/Dog-Yang/ConInfer) | 指出 patch 独立预测与遥感大场景空间语义相关性不匹配；通过多空间单元联合预测提升一致性和泛化。 |
| Towards Realistic OVRS Segmentation / Pi-Seg | 2026 arXiv | 需要训练 baseline，但贡献在 benchmark | OVRSISBenchV2、OVRSIS95K、positive-incentive noise | [arXiv](https://arxiv.org/abs/2604.15652), [GitHub](https://github.com/LiBingyu01/RSKT-Seg_and_Pi-Seg/tree/Pi-Seg) | 构建更真实的大规模 OVRSIS benchmark：约 170K images、128 categories，并加入建筑、道路、洪水等应用协议。 |
| DINO Soars / CAFe-DINO | 2026 arXiv | 主干不做遥感 fine-tuning；在 RS-targeted COCO-Stuff 子集微调 | DINOv3/DINO.txt、cost aggregation、feature upsampling | [arXiv](https://arxiv.org/abs/2605.03175), [GitHub](https://github.com/rfaulk/DINO_Soars) | 利用 DINOv3 的 dense feature 和 DINO.txt 的开放词表能力，强调比 CLIP-style dense similarity 更适合遥感 OVSS。 |
| dinov3.seg | 2026 arXiv, CV 通用 | 非遥感专用 | DINOv3 local/global alignment、early/late refinement、sliding-window aggregation | [arXiv](https://arxiv.org/abs/2603.19531) | 通用 OVSS 方向的重要可迁移方法；其 high-resolution local-global inference 对遥感大图有直接借鉴价值。 |

## 3. 方法脉络比较

### 3.1 CLIP Token 路线

代表：OVRS、SegEarth-OV、ReSeg-CLIP、CVPRW 2026 text-based segmentation。

核心做法是把类别文本 prompt 映射为 text embedding，再与图像 patch/local feature 计算相似度。遥感难点在于 CLIP 训练目标偏全局图文对齐，local patch feature 往往带有 `[CLS]` 全局偏置，导致 mask 边界粗、细目标漏检。SegEarth-OV 的关键观察是 local patch token 对 `[CLS]` token 有异常响应，因此用 token subtraction 减轻全局偏置，再用 SimFeatUp 做 training-free 空间细节恢复。

优点：实现简单，类别扩展方便，可直接适配 text prompt。  
缺点：patch 级特征空间分辨率低，类别 prompt 敏感，容易把地物上下文当目标本体。

### 3.2 SAM Mask 路线

代表：ReSeg-CLIP、CVPRW 2026 text-based segmentation、AerOSeg。

SAM 的优势是边界和候选 mask，短板是不知道语义类别。常见组合方式有两种：

- 先用 SAM 生成 grid masks，再用 CLIP/RS-CLIP 选择最匹配类别的 mask。
- 用 VLM 生成 click prompts，再让 SAM 输出 mask，从而处理 referring/reasoning segmentation。

优点：边界通常比纯 CLIP heatmap 好，适合建筑、道路、水体等边界清楚的目标。  
缺点：SAM 候选 mask 可能过分割/欠分割；CLIP 选 mask 时容易被背景、上下文和类别同义词误导。

### 3.3 DINO Feature 路线

代表：DINO Soars / CAFe-DINO、dinov3.seg。

DINOv3/DINO.txt 的新趋势是把开放词表能力从 CLIP 的全局图文对齐，转向更强的 dense visual feature。CAFe-DINO 用 cost aggregation 和 training-free upsampling 强化 DINOv3 text-image similarity，对遥感领域尤其重要，因为遥感类别往往靠纹理、形状和上下文，而不是自然图像中的局部物体外观。

优点：dense feature 更强，可能减少 CLIP patch 粗糙问题。  
缺点：DINOv3 生态较新，遥感复现实验还少；若使用 RS-targeted COCO-Stuff 子集微调，需要明确是否仍称为 training-free。

### 3.4 上下文推理路线

代表：ConInfer、dinov3.seg 的 local-global inference，可与 SegEarth-OV/ReSeg-CLIP 组合。

遥感图像的空间单元之间有强相关：道路连续、水体连通、建筑群成片、农田地块规则。独立 tile 预测会导致同一对象跨 tile 类别不一致。ConInfer 的贡献在于把多个空间单元进行 joint prediction，显式建模 inter-unit semantic dependencies。

优点：解决大图拼接不一致和 patch-level 孤立预测。  
缺点：需要定义 region graph 或空间单元关系；推理成本增加；错误上下文可能放大局部误判。

## 4. 当前问题

1. 训练自由的边界还不清楚。SegEarth-OV 的主推理是 training-free，但 SimFeatUp 本身是训练出来的；DINO Soars 使用 RS-targeted COCO-Stuff 子集微调。论文比较时要区分 zero-shot inference、pretrained auxiliary module、lightweight tuning、full training。
2. prompt 词表不稳定。同一类别用 `building`、`house`、`residential building`、`impervious surface` 会触发不同 mask，开放词表评价需要 prompt ensemble 和同义词控制。
3. 类别层级冲突严重。土地覆盖类、目标类和应用类混用时，mIoU 可能惩罚合理预测，例如把 `flooded road` 同时归入 `water` 和 `road`。
4. SAM mask selection 缺少可靠置信度。CLIP 可能因为上下文选中错误 mask，尤其是停车场、跑道、裸土、河岸等语义靠场景判断的类别。
5. 大图上下文与局部细节难兼得。缩小整图会丢小目标，切 tile 会丢全局语义；ConInfer 类方法是一个补救方向，但尚需更细的 cost/benefit 分析。
6. benchmark 仍在快速变化。OVRS 的 4 数据集基准、SegEarth-OV 的 17 数据集、CVPRW 2026 的 19 benchmark、OVRSISBenchV2 的 170K images/128 categories 覆盖范围不同，直接横向比较容易不公平。

## 5. 最小可复现实验矩阵

目标：建立一个不太重、能快速判断新想法是否有效的 OVRS 实验包。

### 5.1 数据集组合

| 任务 | 数据集候选 | 原因 |
|---|---|---|
| 通用语义分割 | OpenEarthMap, LoveDA, iSAID, Potsdam, Vaihingen | 类别覆盖较广，适合比较 OVSS 与 supervised segmentation |
| 建筑提取 | WHU Aerial, WHU Satellite II, Inria, xBD pre-event | 边界清楚，适合测试 SAM mask selection |
| 道路提取 | DeepGlobe Road, Massachusetts Roads, SpaceNet Roads | 连通性强，适合测试上下文一致性 |
| 水体/洪水 | WBS-SI, flood-related subsets | 类别与背景/季节强相关，适合测 prompt 和上下文偏差 |

### 5.2 Baseline

| Baseline | 组件 | 目的 |
|---|---|---|
| CLIP heatmap | CLIP/RemoteCLIP + text prompts + upsampling | 最弱但必要的零样本基线 |
| SegEarth-OV | CLIP token subtraction + SimFeatUp | 检验 token-level bias correction |
| ReSeg-CLIP | SAM hierarchical masks + RS-CLIP composition | 检验 SAM mask 对 CLIP dense prediction 的约束 |
| TrainFree RS Segmentation | CLIP mask selector + SAM grid masks | 检验“mask proposal + text selection”的完全 zero-shot 能力 |
| ConInfer on top | 任一 per-tile prediction + context joint inference | 检验跨 tile/跨 region 上下文收益 |
| DINO Soars / CAFe-DINO | DINOv3/DINO.txt + cost aggregation/upampling | 检验 DINO dense feature 是否优于 CLIP dense similarity |

### 5.3 指标

- `mIoU`、`F1`、`precision/recall`：基础分割质量。
- `boundary F1`：建筑、道路、水体边界是否改善。
- `small-object IoU`：飞机、车辆、小建筑等是否被上采样或 SAM proposal 保留。
- `cross-tile consistency`：同一大图相邻 tile 的类别一致性，可用边界附近类别冲突率或 connected component 断裂率。
- `prompt sensitivity`：同义词 prompt ensemble 的方差。
- `zero-shot purity`：明确记录是否使用目标数据训练、是否使用 RS-targeted tuning、是否只做推理。

### 5.4 实验顺序

1. 固定类别词表和 prompt templates，在 2 个语义分割数据集上跑 CLIP heatmap、SegEarth-OV、SAM mask selector。
2. 加入建筑/道路/水体三个 extraction 任务，观察 SAM mask 对边界类是否明显受益。
3. 在大图上测试 ConInfer 或自定义 region graph，记录 cross-tile consistency。
4. 加入 DINO Soars/CAFe-DINO，与 CLIP token 路线比较小目标、边界和 prompt sensitivity。
5. 做 ablation：无 prompt ensemble、无 SimFeatUp、无 SAM masks、无 context inference、不同 RS-CLIP 变体。

## 6. 可投稿的小研究方向

### 6.1 Context-Calibrated SAM Mask Selection

问题：CLIP 选 SAM mask 时常被局部背景和场景上下文误导。  
想法：为每个 SAM mask 同时计算 mask 内语义、mask 边界邻域语义、所在 tile/global scene 语义，然后用一个训练自由的 consistency score 做校准。  
最小实验：在 building/road/water extraction 上比较 CLIP mask selector、SegEarth-OV、ReSeg-CLIP、加入 context calibration 的版本。  
风险：如果上下文本身有偏，会强化错误；需要设计负样本和同义词 prompt。

### 6.2 Taxonomy-Aware OVRS Evaluation

问题：开放词表遥感类别层级混乱，传统 mIoU 无法区分“合理上位类”和“完全错误类”。  
想法：建立 land-cover/object/application 三层 taxonomy，设计 hierarchy-aware IoU 和 semantic distance。  
最小实验：用 LoveDA/OpenEarthMap/iSAID 的类别映射构造层级词表，比较 CLIP、SegEarth-OV、ReSeg-CLIP 的错误类型。  
风险：taxonomy 主观，需要公开映射表并做敏感性分析。

### 6.3 DINO-SAM-CLIP Triangulation

问题：CLIP 有语义但边界粗，SAM 有边界但无语义，DINO 有 dense feature 但文本对齐仍新。  
想法：对每个候选 region 同时计算 CLIP text score、DINO dense consistency、SAM mask stability，用三方一致性筛选 mask。  
最小实验：在建筑/道路/水体/小目标上验证是否能减少 hallucinated masks 和边界错配。  
风险：三模型推理成本较高；需要缓存 feature 和 mask proposal。

### 6.4 Prompt Sensitivity Benchmark for OVRS

问题：论文常用固定 prompt，但真实用户会输入同义词、上位词、属性词和组合词。  
想法：为每类构造 5-10 个 prompt variants，测 mIoU 方差、最坏 prompt、prompt ensemble 收益。  
最小实验：OpenEarthMap/LoveDA/iSAID + SegEarth-OV/ReSeg-CLIP/DINO Soars。  
风险：prompt 列表需要人工审校，避免把类别定义改掉。

## 7. 推荐下一步

优先做一个“小而硬”的实验：`SegEarth-OV + SAM mask selector + ConInfer-style context calibration`。它的价值在于不需要重新训练大模型，能直接回应 training-free OVRS 的核心问题：局部语义、边界和大图上下文如何统一。

建议文件结构：

```text
research/rs12_training_free_open_vocabulary_rs_segmentation.md
experiments/rs12_ovrs/
  README.md
  prompts/
    class_prompts.json
  configs/
    segearth_ov.yaml
    sam_mask_selector.yaml
    context_calibration.yaml
  scripts/
    prepare_datasets.md
    run_eval.md
```

最小可发表假设：在不训练新 backbone 的条件下，通过“mask-level context calibration + prompt sensitivity control”，可以显著降低 training-free OVRS 的类别漂移和跨 tile 不一致，同时保持 SegEarth-OV/ReSeg-CLIP 的开放词表能力。
