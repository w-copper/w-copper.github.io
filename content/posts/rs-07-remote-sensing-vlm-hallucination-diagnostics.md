---
title: "RS-07 Remote Sensing VLM Hallucination Diagnostics"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["遥感VLM", "视觉语言", "地理空间推理"]
source: "research/rs-07-vlm-hallucination-diagnostics.md"
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-07 Remote Sensing VLM Hallucination Diagnostics

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-07` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 委托条目：research/50threadprompts.md 中 RS07 Remote Sensing VLM Hallucination Diagnostics 研究问题：遥感 VLM/MLLM 为什么会在不存在目标、相似地物、尺度、空间关系和语言先验上产生幻觉；如何构造 hardnegative QA 与自动评测指标。 

## 正文

# RS-07 Remote Sensing VLM Hallucination Diagnostics

更新时间：2026-06-07  
委托条目：`research/50_thread_prompts.md` 中 `RS-07 Remote Sensing VLM Hallucination Diagnostics`  
研究问题：遥感 VLM/MLLM 为什么会在不存在目标、相似地物、尺度、空间关系和语言先验上产生幻觉；如何构造 hard-negative QA 与自动评测指标。

## 1. 问题由来

遥感 VLM 的幻觉比自然图像 VLM 更尖锐，原因不是模型“不会说话”，而是视觉证据更难被可靠读取：

- 俯视视角导致自然图像中常见的物体外观先验失效，例如车辆、飞机、船、储罐都可能变成很小的纹理块。
- 大幅面遥感影像常被切成 patch，VLM 看到的是局部切片或低分辨率缩略图，容易把上下文补全成语言常识。
- 许多地物是相似纹理和尺度组合，例如 parking lot、impervious surface、road、runway、roof、container yard，语言类别边界不清。
- 遥感问题经常要求空间关系、数量、尺度和存在性判断，例如“机场旁是否有大型停机坪”“河道北侧是否出现采矿裸地”。这些问题只答文本不够，必须有证据区域。
- 2024 年后大量 RS-VLM 数据由 GPT-4V、模板、检测标签、caption 扩展得到；如果没有 hard negative 和事实核验，训练集会鼓励模型给出“看起来合理”的肯定回答。

因此，本方向的核心不只是降低 hallucination rate，而是把幻觉拆成可诊断、可复现、可定位的错误类型。

## 2. 代表论文与资源

| 工作 | 年份/venue | 资源链接 | 与幻觉诊断的关系 |
|---|---:|---|---|
| VHM: Versatile and Honest Vision Language Model for Remote Sensing Image Analysis | 2024 arXiv / 2025 AAAI | [arXiv](https://arxiv.org/abs/2403.20213), [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/32683/34838), [GitHub](https://github.com/opendatalab/VHM) | 引入 VersaD 详细 caption 和 HnstD honest instruction，包含 factual 与 deceptive questions，用“不存在目标”训练模型避免无脑肯定。 |
| DDFAV / RSPOPE: Remote Sensing LVLM Dataset and Evaluation Benchmark | 2024 arXiv / 2025 Remote Sensing | [arXiv](https://arxiv.org/abs/2411.02733), [MDPI](https://www.mdpi.com/2072-4292/17/4/719), [GitHub](https://github.com/HaodongLi2024/rspope), [HF mirror](https://huggingface.co/datasets/isaaccorley/DDFAV) | 面向遥感 LVLM 的 hallucination evaluation，借鉴 POPE 式二元存在性问答，适合做 object-existence hallucination 基线。 |
| Seeing Clearly without Training / RSHBench / RADAR | 2026 arXiv | [arXiv](https://arxiv.org/abs/2603.02754), [GitHub placeholder/承诺](https://github.com/MiliLab/RADAR) | 将 RS-VQA 幻觉细分为 factual 与 logical hallucinations；RADAR 用 attention 驱动 progressive localization 和 local reasoning，训练自由。需注意：截至本次检索，官方代码/数据可能仍未完整释放。 |
| OmniEarth: A Benchmark for Evaluating VLMs in Geospatial Tasks | 2026 arXiv | [arXiv](https://arxiv.org/abs/2603.09471), [HF dataset](https://huggingface.co/datasets/sjeeudd/OmniEarth) | 支持 multiple-choice 和 open-ended VQA；采用 blind test 与 semantic consistency 来降低语言偏置，适合作为综合评测框架。 |
| GEOBench-VLM | 2025 ICCV | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2411.19325), [GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM) | 覆盖计数、定位、细粒度分类、分割、时序等 geospatial tasks，可用于把“幻觉”扩展到空间定位、数量和几何错误。 |
| RS-GPT4V | 2024 arXiv | [arXiv](https://arxiv.org/abs/2406.12479), [HF paper page](https://huggingface.co/papers/2406.12479), [GitHub](https://github.com/GeoX-Lab/RS-GPT4V) | GPT-4V 构造多模态 instruction-following 数据，适合分析合成数据中的伪细节、语言模板和肯定偏置。 |
| SkySenseGPT / FIT-RS | 2024 arXiv | [arXiv](https://arxiv.org/abs/2406.10100), [HF paper page](https://huggingface.co/papers/2406.10100), [GitHub](https://github.com/Luo-Z13/SkySenseGPT) | 强调 fine-grained relation comprehension 和 scene graph，可用于空间关系幻觉诊断；也要检查复杂关系样本是否由模板和裁剪策略带来偏差。 |
| GeoChat | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.html), [Project](https://mbzuai-oryx.github.io/GeoChat/), [GitHub](https://github.com/mbzuai-oryx/GeoChat) | 遥感 grounded dialogue 代表；可作为 evidence-grounded answer 的模型基线。 |
| HallusionBench | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Guan_HallusionBench_An_Advanced_Diagnostic_Suite_for_Entangled_Language_Hallucination_and_CVPR_2024_paper.pdf), [GitHub](https://github.com/tianyi-lab/HallusionBench) | 通用 VLM 幻觉诊断，可迁移其“视觉错觉 + 语言幻觉纠缠”的题型设计到遥感相似地物和尺度误判。 |
| M-HalDetect | 2024 AAAI | [AAAI](https://ojs.aaai.org/index.php/AAAI/article/view/29771), [GitHub](https://github.com/hendryx-scale/mhal-detect) | 通用 LVLM hallucination detection/prevention 数据，可借鉴 reward model 或 detector 作为自动评测器。 |
| GROUNDHOG | 2024 CVPR | [Project](https://groundhog-mllm.github.io/index.html), [CVPR poster](https://cvpr.thecvf.com/virtual/2024/poster/30796) | 将 grounding 变成 segmentation entity selection；可迁移到“回答必须绑定 mask/entity”的遥感 VQA。 |

## 3. 方法脉络

### 3.1 从“存在性二元问答”开始

VHM/HnstD 与 DDFAV/RSPOPE 都抓住了一个很小但很关键的问题：当问题问“图中是否有 X”时，如果 X 并不存在，RS-VLM 是否会因为遥感场景常识或训练集肯定偏置回答“有”。这类题容易自动评测，适合建立第一版 hallucination rate：

- Positive QA：图中确实有目标或地物。
- Random negative QA：从类别词表随机采不存在类别。
- Popular negative QA：采常见但不存在类别，测语言先验。
- Adversarial negative QA：采视觉相似类别，例如 ship/barge，road/runway，greenhouse/roof，parking lot/impervious surface。

局限：二元存在性只能测 object hallucination，不能测空间关系、数量、尺度、证据定位和 open-ended 生成中的伪细节。

### 3.2 走向 fine-grained diagnosis

RSHBench/RADAR 的价值在于把错误拆成 factual hallucination 与 logical hallucination，并尝试用局部证据推理缓解。对遥感来说，建议进一步拆成 5 类：

| 类别 | 典型问题 | 需要的标注 |
|---|---|---|
| Object existence | “图中是否有飞机/储罐/温室？” | 类别存在标签、bbox/mask 可选 |
| Attribute hallucination | “建筑是否受损/屋顶是否红色？” | 属性标签、证据区域 |
| Spatial relation | “港口是否位于河流东侧？” | 对象位置、方向关系 |
| Count/scale | “停车场中是否超过 50 辆车？” | 计数、GSD 或尺寸先验 |
| Contextual false premise | “机场跑道旁的飞机是什么颜色？”但图中无机场/飞机 | false-premise 问题模板、拒答标签 |

### 3.3 从答案评测到证据评测

GEOBench-VLM、OmniEarth 和 GeoChat 的共同启发是：遥感 VLM 的幻觉诊断不能只看最终文本。一个更可靠的评测应要求模型输出：

```text
answer: yes/no/open answer
evidence: bbox / mask / point / tile id
confidence: calibrated probability
rationale: short explanation grounded in evidence
```

这样可以区分四种情况：

- 答案正确、证据正确：真正通过。
- 答案正确、证据错误：语言猜对，仍是风险。
- 答案错误、证据正确：推理/类别映射错。
- 答案错误、证据错误：视觉 grounding 失败。

### 3.4 合成 instruction 数据的风险

RS-GPT4V 和 SkySenseGPT 代表了 2024 年遥感 instruction 数据扩展路线。它们提升了任务覆盖和复杂关系理解，但对幻觉诊断有两类风险：

- 生成式 caption/QA 可能包含不可见细节，尤其是过度描述场景功能、经济活动、地物用途。
- 复杂关系题如果来自模板或检测框规则，模型可能学习语言模式，而不是学习视觉证据。

所以 RS-07 的 benchmark 应把数据来源标记为：人工确认、模型生成后人工确认、纯模板生成、纯模型生成，并分别报告 hallucination rate。

## 4. Hard-Negative QA 设计

### 4.1 题型模板

| 题型 | 示例 | 目标幻觉 |
|---|---|---|
| 不存在目标 | “图中是否有飞机？”实际为停车场 | object hallucination |
| 相似地物 | “这条线性结构是跑道吗？”实际为道路/堤坝 | fine-grained category confusion |
| 尺度误判 | “这些车辆是否是大型货船？”实际为小型屋顶/车 | scale hallucination |
| 空间关系 | “桥是否位于河流北侧？”实际桥在南侧或不存在 | relation hallucination |
| false premise | “机场旁的停机坪有几架飞机？”实际无机场 | presupposition hallucination |
| 语言先验 | “港口区域是否一定有船只？”实际港口空置 | prior over evidence |
| 局部证据缺失 | 低分辨率缩略图看不清，要求模型拒答或请求高分辨率 crop | overconfident answer |

### 4.2 类别对抗词表

建议先做 12 组遥感相似类别：

- road / runway / bridge / dam
- parking lot / impervious surface / roof
- airplane / vehicle / ship / container
- greenhouse / building / solar panel
- river / canal / shadow / road
- bare soil / construction site / mining area
- crop field / grassland / wetland
- storage tank / roundabout / circular building
- port / industrial area / container yard
- residential building / warehouse / factory
- cloud / snow / bright roof
- damaged building / construction debris / bare ground

### 4.3 样本构造流程

1. 选数据源：DIOR、DOTA、xView、FAIR1M、iSAID、LoveDA、Vaihingen/Potsdam、RSVG、GeoChat data、VRSBench、GEOBench-VLM、OmniEarth。
2. 统一地物词表：把 object 类、land-cover 类、scene 类分层，不混在同一个 negative pool。
3. 自动生成候选 QA：根据标注和相似类别词表生成 positive、random negative、popular negative、adversarial negative、false-premise。
4. 证据绑定：每道题至少绑定 bbox/mask/tile id；如果没有精确证据，标为 image-level only，不进入 grounding 指标。
5. 人工抽检：每类题至少抽检 5%-10%，重点查相似地物和 false-premise。
6. Blind split：按地理块/城市/传感器/时间划分，避免同区域瓦片泄漏。

## 5. 自动评测指标

### 5.1 基础指标

- Yes/No accuracy：二元问题准确率。
- Hallucination Rate：negative QA 中被模型回答为存在/肯定的比例。
- Refusal Accuracy：false-premise 或证据不足题中，模型是否正确拒答。
- Open-ended factuality：由规则、LLM judge 和 evidence check 共同评估。

### 5.2 证据指标

- Evidence IoU：模型 bbox/mask 与标注证据区域 IoU。
- Answer-Evidence Consistency：答案涉及的对象类别是否出现在证据区域。
- Grounded Hallucination Rate：答案肯定但证据 IoU 低于阈值的比例。
- Tile Recall for Large Images：大图场景中，模型是否选择包含目标的高分辨率 tile。

### 5.3 可靠性指标

- Confidence ECE：把 yes/no 置信度做 calibration。
- Selective Risk：允许模型拒答时，在不同 coverage 下的 hallucination risk。
- Category-Group Hallucination：按相似类别组统计，例如 road/runway 组。
- Scale-Binned Error：按 GSD、目标像素面积、目标真实尺寸分桶。
- Geography-Binned Error：按城市/国家/生态区分桶，检查地域偏差。

## 6. 可复现实验设计

### 6.1 Baseline 模型

闭源强基线：GPT-4o / Gemini / Claude 视觉模型，用于上限评估。  
通用开源：LLaVA-OneVision、Qwen2.5-VL、InternVL、CogVLM2。  
遥感模型：GeoChat、VHM、SkySenseGPT、RSGPT、RSUniVLM、EarthDial，如果权重可得则加入。  
检索/证据辅助：RemoteCLIP/GeoRSCLIP 检索 + SAM/GroundingDINO 证据区域。

### 6.2 三个实验层级

**Level 1：RSPOPE-style existence benchmark**

- 只测 yes/no。
- 数据：DOTA/DIOR/iSAID/RSVG/VRSBench 中有类别标注的图像。
- 指标：accuracy、hallucination rate、negative type breakdown。

**Level 2：Evidence-grounded hard negatives**

- 模型必须输出答案和证据框/mask。
- 数据：含 bbox/mask 的目标检测/分割数据 + 手工/规则生成关系题。
- 指标：answer accuracy、evidence IoU、grounded hallucination rate。

**Level 3：Large-scene and relation hallucination**

- 输入大图或多 tile，问题包含空间关系、数量、尺度和 false premise。
- 数据：GEOBench-VLM、OmniEarth、LRS-VQA 风格大图任务，可加自建 split。
- 指标：tile recall、relation accuracy、scale-binned hallucination、selective risk。

### 6.3 Ablation

- 是否提供 GSD/尺度信息。
- 是否允许模型先定位再回答。
- 是否使用 high-resolution crop。
- 是否加入 negative examples few-shot prompt。
- 是否使用 VHM/RADAR 式诚实或主动推理策略。
- 是否用 SAM/GroundingDINO/CLIP 作为外部证据验证器。

## 7. 可投稿的小方法方案

### 题目草案

GeoHalluBench: Evidence-Calibrated Hallucination Diagnostics for Remote Sensing Vision-Language Models

### 核心贡献

1. 一个遥感 hallucination taxonomy：存在性、属性、空间关系、数量/尺度、false premise。
2. 一个 hard-negative QA 生成器：结合类别层级、相似地物、GSD、bbox/mask 和地理 split。
3. 一个 answer-evidence 联合评测：不仅看答案，还看证据 IoU、tile recall、选择性拒答和置信度校准。
4. 一个 mitigation baseline：先由 VLM 提答案，再用 CLIP/SAM/GroundingDINO 或模型 attention 生成证据，最后做 consistency check 和 abstention。

### 最小实现

- 数据：DIOR + iSAID + RSVG + OmniEarth 子集。
- 模型：GeoChat、VHM、Qwen2.5-VL、LLaVA-OneVision、GPT-4o。
- 输出：`answer`, `evidence_bbox`, `confidence`, `rationale`。
- 指标：negative hallucination rate、answer accuracy、evidence IoU、grounded hallucination rate、ECE、selective risk。
- 首个实验问题：在不存在目标和相似地物 hard negatives 上，证据约束是否能显著降低肯定幻觉，同时不牺牲 positive QA accuracy。

## 8. 风险与注意事项

- 遥感类别词表容易混层级：object、land cover、scene 不能混为一个 negative pool。
- 很多 2026 工作仍在 arXiv 阶段，代码/数据承诺可能尚未完全兑现；例如 RADAR 仓库需再次核验可用性。
- LLM judge 对遥感术语可能不稳，建议规则评测优先，LLM judge 只评 open-ended rationale。
- 若使用闭源模型做数据生成，需要记录模型版本、prompt、温度和人工审核比例。
- 对大图 VLM，若先缩放再答题，幻觉可能来自信息丢失而非模型推理错误；应单独报告输入分辨率和 tile 策略。

## 9. 下一步清单

1. 下载/抽取 DDFAV-RSPOPE、OmniEarth、GEOBench-VLM 的样本结构，确认字段和许可。
2. 选 8-12 组相似地物类别，建立 `hard_negative_taxonomy.yaml`。
3. 从 DIOR/iSAID/RSVG 生成第一版 1k 道 yes/no + evidence QA。
4. 跑 3 个模型的 smoke test：一个通用 VLM、一个遥感 VLM、一个闭源强模型。
5. 写评测脚本：answer parser、bbox IoU、negative hallucination rate、selective risk。

## 参考链接

- VHM: https://arxiv.org/abs/2403.20213, https://github.com/opendatalab/VHM
- DDFAV/RSPOPE: https://arxiv.org/abs/2411.02733, https://github.com/HaodongLi2024/rspope
- RSHBench/RADAR: https://arxiv.org/abs/2603.02754, https://github.com/MiliLab/RADAR
- OmniEarth: https://arxiv.org/abs/2603.09471, https://huggingface.co/datasets/sjeeudd/OmniEarth
- GEOBench-VLM: https://arxiv.org/abs/2411.19325, https://github.com/The-AI-Alliance/GEO-Bench-VLM
- RS-GPT4V: https://arxiv.org/abs/2406.12479, https://github.com/GeoX-Lab/RS-GPT4V
- SkySenseGPT: https://arxiv.org/abs/2406.10100, https://github.com/Luo-Z13/SkySenseGPT
- GeoChat: https://openaccess.thecvf.com/content/CVPR2024/html/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.html, https://github.com/mbzuai-oryx/GeoChat
- HallusionBench: https://openaccess.thecvf.com/content/CVPR2024/papers/Guan_HallusionBench_An_Advanced_Diagnostic_Suite_for_Entangled_Language_Hallucination_and_CVPR_2024_paper.pdf, https://github.com/tianyi-lab/HallusionBench
- M-HalDetect: https://ojs.aaai.org/index.php/AAAI/article/view/29771, https://github.com/hendryx-scale/mhal-detect


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
