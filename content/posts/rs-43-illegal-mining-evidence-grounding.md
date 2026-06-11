---
title: "RS-43 Illegal Mining Evidence Grounding"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感应用", "农业生态灾害", "方法化"]
source: "research/rs43_illegal_mining_evidence_grounding.md"
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-43 Illegal Mining Evidence Grounding

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-43` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务：以 illegal mining / deforestation 监测为场景，研究 VLM / GeoFM 如何输出可审计证据区域；调研 ELDOR、Amazon Mining Watch、change detection / VQA / change caption 论文，提出 evidencegrounded detec

## 正文

# RS-43 Illegal Mining Evidence Grounding

更新时间：2026-06-07  
任务：以 illegal mining / deforestation 监测为场景，研究 VLM / GeoFM 如何输出可审计证据区域；调研 ELDOR、Amazon Mining Watch、change detection / VQA / change caption 论文，提出 evidence-grounded detection / change caption 方案。

## 1. 方向概述

非法采矿，尤其是亚马逊和加纳等地区的 artisanal and small-scale gold mining，具有几个典型遥感难点：目标尺度小、形态变化快、常沿河流和道路扩散、裸土/采坑/尾矿池/临时道路/简易机场之间存在强上下文关系，同时又经常受云、阴影、季节水位和成像分辨率影响。传统做法多是二分类或语义分割：给出“这里是矿区”。但执法、新闻调查、生态评估和社区沟通需要的不只是一个 mask，而是可审计证据：模型为什么认为这里是非法采矿，变化发生在何处，相关证据是否来自裸土扩张、河道浑浊、植被损失、道路/机场/机械痕迹，答案有没有定位支撑。

因此这个细方向可以定义为：面向非法采矿/森林破坏的 evidence-grounded remote sensing interpretation。输出不只是 detection / segmentation / change mask，还包括：

- 证据区域：bbox、mask、polygon 或 georeferenced tile。
- 证据类型：裸土采坑、尾矿池、浑浊水体、临时道路、营地、机场、森林清除边界等。
- 时间证据：pre/post 或多时相变化描述。
- 置信度与不确定性：是否可能是合法矿区、自然裸地、农业开垦、河道季节变化。
- 可复核产物：地图图层、caption、QA、变化报告和失败案例。

## 2. 代表论文、数据与项目

| 名称 | 年份/来源 | 链接 | 代码/数据 | 对 RS-43 的价值 |
|---|---:|---|---|---|
| ELDOR: A Dataset and Benchmark for Illegal Gold Mining in the Amazon Rainforest | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.15397) | 论文提到 interactive explorer，官方代码需继续跟踪 | 目前最贴近本题的 benchmark：UAV orthomosaic、像素级 mining/ecological labels、语义分割、recognition、VLM class-presence 任务。 |
| Amazon Mining Watch | 2026 数据平台/产品 | [platform](https://amazonminingwatch.org/es), [Source Cooperative data](https://source.coop/earthgenome/amazon-mining-watch) | [GitHub: mining-detector](https://github.com/earthrise-media/mining-detector) | Sentinel-2 泛亚马逊矿区检测产品；GitHub 说明使用 SSL4EO DINO ViT 特征 + 小型 ensemble classifier；适合做真实部署基线和地理范围评测。 |
| SmallMinesDS: A Multimodal Dataset for Mapping Artisanal and Small-Scale Gold Mines | 2025 IEEE GRSL | [TUM page](https://portal.fis.tum.de/en/publications/smallminesds-a-multimodal-dataset-for-mapping-artisanal-and-small/) | [HF dataset](https://huggingface.co/datasets/ellaampy/SmallMinesDS) | Ghana 小规模金矿，多时相/多传感器；适合测试跨区域、跨传感器和小目标矿区分割。 |
| EuroMineNet: A Multitemporal Sentinel-2 Benchmark for Spatiotemporal Mining Footprint Analysis | 2026 ISPRS JPRS / 2025 arXiv | [arXiv](https://arxiv.org/abs/2510.14661), [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S092427162600225X) | [GitHub](https://github.com/EricYu97/EuroMineNet) | 虽非“非法”主线，但提供 2015-2024 年度 mining footprint，多时相变化和 footprint tracking protocol 可迁移。 |
| Remote Sensing Capabilities of Detecting Spatio-Temporal Dynamics in Unregulated Gold Mining Hotspots in Ecuador | 2026 EGUsphere preprint | [EGUsphere](https://egusphere.copernicus.org/preprints/2026/egusphere-2026-1854/) | 使用公开数据，含 Amazon Mining Watch 引用 | 对“unregulated mining”真实场景评估 Sentinel / Planet / embedding 数据能力，适合做案例与验证区域。 |
| MineCam: Segmentation and Change Detection of Mining Areas | 2024 Remote Sensing | [MDPI](https://www.mdpi.com/2072-4292/16/6/955) | 未见官方代码 | 传统 segmentation + change detection baseline，可作为 VLM 证据化方案的对照。 |
| Global High-Resolution Mining Footprints | 数据产品 | [GEE Community Catalog](https://gee-community-catalog.org/projects/global-mining/) | GEE 数据 | 全球矿区 footprint 先验，可作为弱标签、负样本过滤或合法/历史矿区背景层。 |
| GeoChat: Grounded Large Vision-Language Model for Remote Sensing | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.html) | [GitHub](https://github.com/mbzuai-oryx/GeoChat) | 遥感 grounded dialogue 基线，可迁移到“指出证据区域并解释为什么像矿区”。 |
| LHRS-Bot | 2024 ECCV | [project](https://pumpkin-co.github.io/publication/2024-01) | 项目页含 GitHub | VGI-enhanced 遥感 MLLM，适合探索 OSM/POI/地名/道路先验辅助但需防止文本幻觉。 |
| Change-Agent | 2024 arXiv | [HF paper](https://huggingface.co/papers/2403.19646) | [GitHub](https://github.com/Chen-Yang-Liu/Change-Agent) | 交互式变化解释：change detection、caption、counting、cause analysis；适合迁移到矿区扩张解释。 |
| CDChat | 2024/2025 IGARSS | [GitHub](https://github.com/techmn/cdchat) | GitHub | 遥感变化描述 MLLM；可作为 change caption baseline。 |
| SECOND-CC / MModalCC | 2025 arXiv | [HF paper](https://huggingface.co/papers/2501.10075) | [GitHub planned](https://github.com/ChangeCapsInRS/SecondCC) | change captioning 数据与模型，适合借鉴多模态 change caption 数据构造。 |
| DeltaVLM | 2025 arXiv | [HF paper](https://huggingface.co/papers/2507.22346) | 需继续核验 | instruction-guided difference perception，把双时相变化分析做成可交互 VLM。 |
| HiSem | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.15024) | [GitHub planned](https://github.com/Man-Wang-star/HiSem) | 层级语义解耦 change caption，可迁移到“森林损失 -> 采坑/道路/水体污染”等分层描述。 |
| Vision-Language Agents for Interactive Forest Change Analysis | 2026 arXiv | [HF paper](https://huggingface.co/papers/2601.04497) | 需继续核验 | 直接面向 forest change 的交互式 VLM agent；适合迁移到 deforestation + mining 证据问答。 |
| LISAT: Language-Instructed Segmentation Assistant for Satellite Imagery | 2025 arXiv | [HF paper](https://huggingface.co/papers/2505.02829) | HF page links project/GitHub | reasoning segmentation 能力可迁移到“segment mining scars / tailing ponds / disturbed riverbank”。 |

## 3. 问题由来：为什么需要 evidence grounding

### 3.1 从“检测矿区”到“证明矿区”

Amazon Mining Watch 这类系统已经能做大范围筛查，但现实使用者往往需要回答更细的问题：

- 这个区域为什么被模型标为 mining scar？
- 证据是裸土、采坑、尾矿池，还是沿河的浑浊水体？
- 与上季度相比，扩张发生在什么方向？
- 是否可能只是河滩、农业裸地、道路施工或合法矿场？
- 哪些像素/多边形应该优先人工核查？

这些问题天然对应 VLM/GeoFM 的强项，但直接让 VLM“解释”会带来幻觉风险。因此 evidence grounding 应当把解释绑定到可检查的 mask、bbox、时间差异和地图先验。

### 3.2 采矿目标的遥感特征复杂

非法采矿不是一个单一视觉类别，而是一组空间-时间过程：

- 初期：森林清除、小块裸土、临时道路或河岸扰动。
- 扩张：裸地增大，采坑、尾矿池、泥水水体、堆料区出现。
- 运输：道路、河道、简易机场、营地增强。
- 后期：废弃矿坑、恢复植被、浑浊水体和地形痕迹长期存在。

ELDOR 的价值在于它把 mining-related activities 和 surrounding ecological structures 放到同一套像素级标注中；这比单纯“mine / non-mine”更适合做 evidence taxonomy。

### 3.3 分辨率与尺度冲突

Sentinel-2 适合泛区域、长期监测，但 10m 分辨率可能漏掉小采坑、临时设施和窄道路。UAV/Planet/VHR 能看到细节，但覆盖成本高。一个合理系统应当是 coarse-to-fine：Sentinel-2 / GeoFM embedding 做候选区域，VHR/UAV 或高分辨率切片做证据验证，VLM 输出可审计说明。

## 4. 方法比较：可迁移路线

| 路线 | 输入 | 输出 | 优点 | 风险 |
|---|---|---|---|---|
| 传统分割/变化检测 | 单时相或双时相 Sentinel/Planet/UAV | mining mask / change mask | 稳定、易量化 | 缺少自然语言解释，难表达证据类型 |
| GeoFM embedding + 轻量分类器 | Sentinel-2 多时相 + SSL/GeoFM 特征 | mine probability / candidate tiles | Amazon Mining Watch 已证明可部署 | 解释性弱，模型版本变化会影响年份对比 |
| VLM class-presence | 图像 tile + 问题 | 是否存在 mining evidence | 适合快速筛查和专家交互 | 容易语言先验幻觉；需要证据区域约束 |
| Grounded VLM / referring segmentation | 图像 + 文本 prompt | bbox/mask + answer | 可以把“为什么”落到区域 | 遥感小目标和类别层级难，开放词表不稳定 |
| Change caption / change VQA | pre/post 图像 | 自然语言变化描述 + evidence mask | 适合报告化和审计 | caption 可能描述不完整或没有证据 |
| GIS/规则后验 | mask + hydrography/roads/protected areas/legal mining boundaries | risk score / illegal-likelihood | 贴近治理场景 | 合法性不是纯视觉事实，边界数据可能过时 |

## 5. Proposed Direction: MineEvidence-VLM

### 5.1 研究问题

能否构造一个面向非法采矿/森林破坏的 evidence-grounded VLM，使其在输出“是否存在 mining / deforestation risk”的同时，必须给出对应证据区域、证据类型和变化描述，并在没有足够证据时拒答或标记不确定？

### 5.2 核心假设

1. 如果把 mining evidence 拆成一组可定位的细粒度视觉证据，VLM 的 hallucination 会低于只做 image-level QA。
2. Sentinel-2 / Amazon Mining Watch 候选区域 + UAV/VHR 证据验证的 coarse-to-fine 方案，比单一分辨率模型更适合真实监测。
3. 将 change mask、semantic evidence mask 和 caption 绑定训练/评估，可以让变化描述更可审计。

### 5.3 Evidence taxonomy

建议从 8 类证据开始，避免类别过细导致标注成本爆炸：

1. fresh bare soil / exposed mining scar
2. mining pit / excavation
3. tailings pond / sediment pond
4. turbid water / river plume near mining
5. access road / trail
6. camp / equipment / built structure
7. clandestine airstrip or landing strip
8. forest clearing boundary / recent vegetation loss

同时保留 confounder 类别：

- natural sandbar / exposed riverbank
- agriculture / pasture clearing
- legal industrial mine
- road construction
- seasonal water-level change
- cloud/shadow/artifact

### 5.4 模型方案

```text
Input:
  T0/T1 Sentinel-2 or Planet/VHR tile
  optional: Amazon Mining Watch candidate mask, protected-area/legal-mining boundary, river/road vector
  prompt: "Find evidence of illegal mining expansion and explain it."

Stage A: Candidate discovery
  GeoFM/SSL feature encoder + light classifier
  optional baseline: Amazon Mining Watch style SSL4EO DINO + MLP ensemble

Stage B: Evidence segmentation
  segmentation backbone or SAM/LISAT-style language-instructed segmentation
  output evidence masks for mining scars, water disturbance, roads, etc.

Stage C: Change reasoning
  bi-temporal difference encoder + change mask
  produce structured facts: object, location, direction, area change, confidence

Stage D: Grounded explanation
  VLM receives image crops + evidence masks + structured facts
  output caption / QA:
    answer
    evidence regions
    evidence type
    uncertainty
    possible confounders
```

关键设计：VLM 不直接凭图说话，而是被 evidence mask 和 change facts 约束。最终报告必须引用 mask id，例如 `E1: exposed soil expansion`, `E2: new sediment pond`, `E3: road extension`。

## 6. 实验矩阵

| 实验 | 数据 | Baseline | 指标 | 目的 |
|---|---|---|---|---|
| E1 semantic evidence segmentation | ELDOR UAV orthomosaic | U-Net/DeepLab/SegFormer/SAM-assisted/VFM segmentation | mIoU, F1, rare-class IoU, boundary F1 | 验证细粒度 evidence mask 是否可学 |
| E2 class-presence VLM | ELDOR VLM class-presence task | GeoChat/LISAT/general VLM/RS-VLM | accuracy, F1, hallucination rate | 测 image-level VLM 是否可靠 |
| E3 grounded class-presence | ELDOR + generated evidence boxes/masks | VLM answer-only vs answer+evidence | answer acc, evidence IoU, answer-evidence consistency | 验证 grounding 是否减少幻觉 |
| E4 Sentinel-2 candidate discovery | Amazon Mining Watch / SmallMinesDS | SSL4EO DINO + MLP, Prithvi/Clay/AlphaEarth embeddings | AUROC, precision@k, recall@k, spatial false positives | 做泛区域候选矿区筛查 |
| E5 change caption | EuroMineNet / AMW annual detections / custom pre-post pairs | Change-Agent, CDChat, HiSem, DeltaVLM | BLEU/CIDEr + evidence IoU + human audit score | 验证变化描述是否可审计 |
| E6 confounder robustness | river sandbars, agriculture clearing, legal mines, clouds | detection/VLM baselines | false positive rate by confounder | 防止把所有裸地都说成非法矿 |
| E7 GIS legality/risk layer | protected areas, legal mining concessions, rivers/roads | vision-only vs vision+GIS | risk ranking precision, expert review time | 区分“视觉上像矿”与“治理上高风险” |

## 7. 评价指标

### 7.1 Detection / segmentation

- mIoU / F1 / boundary F1
- rare evidence class F1
- precision@k candidate tiles
- area error and polygon overlap

### 7.2 Evidence grounding

- Evidence IoU：模型引用证据区域与人工证据 mask 的重叠。
- Answer-evidence consistency：回答中提到的证据类别是否真的在 mask 中出现。
- Unsupported claim rate：caption/QA 中没有对应证据区域支撑的陈述比例。
- Confounder false-positive rate：把自然裸地、农业清理、季节河滩误判为采矿的比例。

### 7.3 Change explanation

- Change mask IoU
- evidence-aware caption score：传统 caption 指标 + 证据区域匹配
- temporal direction accuracy：是否正确描述扩张/恢复/无变化
- human audit time：专家确认一个告警所需时间

## 8. 推荐基线

### 视觉/分割

- SegFormer / U-Net / DeepLabV3+
- SAM / SAM2 with prompt
- LISAT or language-instructed segmentation if weights available
- GeoFM features + simple decoder: Prithvi, Clay, SSL4EO DINO, AlphaEarth embeddings if accessible

### 变化理解

- ChangeFormer / BIT / CDMaskFormer
- Change-Agent
- CDChat
- SECOND-CC / MModalCC
- HiSem
- DeltaVLM

### 检索/候选区域

- Amazon Mining Watch mining-detector
- SSL4EO DINO + MLP ensemble
- Prithvi/Clay/AlphaEarth embedding + linear probe
- RemoteCLIP/GeoRSCLIP for zero-shot semantic retrieval

## 9. 可能的论文贡献点

### 9.1 Evidence-grounded illegal mining benchmark

基于 ELDOR + Amazon Mining Watch + SmallMinesDS 构造统一任务：给定图像或双时相图像，输出 mining risk answer、evidence mask、evidence type 和 caption。贡献不在“又做一个检测器”，而在把证据定位、解释和不确定性作为主指标。

### 9.2 Coarse-to-fine mine evidence agent

大范围 Sentinel-2 候选筛查，触发高分辨率证据验证，再由 VLM 生成报告。适合真实应用，也能自然引入 human-in-the-loop。

### 9.3 Confounder-aware mining VLM

专门构造 hard negatives：自然河滩、农业裸地、道路施工、合法矿区、云阴影、季节水位。训练或评测 VLM 是否能说“证据不足”。

### 9.4 GIS-constrained legality reasoning

视觉模型只能判断 mining-like disturbance，不能直接判断“非法”。把 protected area、indigenous territory、legal concessions、river buffers、roads 纳入后验 risk reasoning，输出“suspected illegal / needs verification”而不是过度断言。

## 10. 最小可行实验

1. 选择 ELDOR 或 SmallMinesDS 作为细粒度 evidence segmentation 数据。
2. 训练/评估 SegFormer + SAM-assisted mask refinement。
3. 用人工模板生成 500-1000 条 evidence-grounded QA：
   - Q: Is there evidence of mining-related disturbance?
   - A: Yes, evidence includes exposed soil and sediment ponds.
   - Evidence: mask ids / boxes.
4. 比较 answer-only VLM 与 evidence-constrained VLM。
5. 构造 3 类 confounder hard negatives。
6. 报告：answer accuracy、evidence IoU、unsupported claim rate、confounder FPR。

这个实验规模小，但能直接验证“让模型必须给证据区域”是否比单纯 VQA 更可靠。

## 11. 风险与注意事项

- 合法性不是纯视觉标签：论文表述建议用 suspected / mining-like / risk，而不是直接宣称 illegal。
- 高分辨率数据可能敏感：涉及 Indigenous territories 或执法行动时，需要谨慎处理坐标公开。
- VLM 容易过度解释：必须设置 unsupported claim rate 和 refusal/uncertainty 机制。
- 数据集之间尺度差异大：UAV ELDOR 与 Sentinel-2 AMW 不能直接混训，建议 coarse-to-fine 或 domain adaptation。
- 多时相对比要控制季节和水位：否则河滩/泥水变化可能被误解释成采矿。

## 12. 下一步阅读队列

1. [ELDOR arXiv](https://arxiv.org/abs/2605.15397)
2. [Amazon Mining Watch Source Cooperative data](https://source.coop/earthgenome/amazon-mining-watch)
3. [Amazon Mining Watch mining-detector GitHub](https://github.com/earthrise-media/mining-detector)
4. [SmallMinesDS HF dataset](https://huggingface.co/datasets/ellaampy/SmallMinesDS)
5. [EuroMineNet GitHub](https://github.com/EricYu97/EuroMineNet)
6. [Change-Agent GitHub](https://github.com/Chen-Yang-Liu/Change-Agent)
7. [CDChat GitHub](https://github.com/techmn/cdchat)
8. [HiSem arXiv](https://arxiv.org/abs/2605.15024)
9. [GeoChat CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/html/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.html)
10. [LISAT HF paper page](https://huggingface.co/papers/2505.02829)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
