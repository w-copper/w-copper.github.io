---
title: "RS-46 Synthetic Instruction Data Quality for RS-VLM"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["数据集", "弱监督", "benchmark"]
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# RS-46 Synthetic Instruction Data Quality for RS-VLM

细问题：遥感 VLM 的合成 instruction/caption 数据质量如何评估、过滤和人工抽检？

## 摘要

2024-2026 年遥感 VLM 的核心数据路线可以概括为三类：把已有 caption/VQA/检测/分割数据转成 instruction；用 GPT-4V/通用 VLM/LLM 生成多轮问答、细粒度 caption 或 scene graph；再用人工验证、负样本或 benchmark 协议约束模型幻觉。问题是，遥感图像有小目标、俯视视角、尺度/GSD、地理上下文和类别层级，通用 VLM 生成的数据很容易出现“看不见却说有”“模板句式过强”“类别先验替代图像证据”“地理常识编造”等伪细节。

本方向最值得做的小课题不是再堆一个更大的 instruction 数据集，而是提出一个可复现的 `Synthetic RS-VLM Data Quality Protocol`：对每条 image-instruction-answer 做来源追踪、视觉证据检查、地理/尺度一致性检查、负样本压力测试、人工分层抽检和训练收益验证。

## 问题由来

遥感 VLM 训练数据的难点来自两个冲突：

- 大规模 instruction 数据必须自动化生成，否则成本不可承受。
- 遥感场景又极其依赖证据，自动生成的一句 caption 或 QA 只要错一个小目标、方向、类别层级，就会把模型训练成“会说但不看图”。

2024 年的 RS-LLaVA、SkyEyeGPT、GeoChat、RS-GPT4V、SkySenseGPT、VHM 都在扩充 instruction 数据；2025-2026 年的 GEOBench-VLM、OmniEarth、RSHBench/RADAR 则开始反过来诊断这些数据和模型是否真的可靠。这个演化说明：数据质量本身已经成为遥感 VLM 的研究问题。

## 代表论文与资源

| 工作 | 年份/venue | 数据构造方式 | 与数据质量相关的贡献 | 主要风险/可借鉴点 | 链接 |
|---|---:|---|---|---|---|
| RS-LLaVA | 2024 Remote Sensing | 将 caption 和 VQA 数据混合成 RS-instructions | 早期 LLaVA-style RS caption+VQA 指令数据 | 多来自既有数据集，任务覆盖窄，容易继承原数据集偏差 | [paper](https://www.mdpi.com/2072-4292/16/9/1477), [GitHub](https://github.com/BigData-KSU/RS-LLaVA) |
| SkyEyeGPT | 2024 arXiv / 2025 ISPRS JPRS | 构造 SkyEye-968k，单任务和多任务 instruction | 统一多种 RS vision-language 任务 | 模板化和任务格式转换质量需要审计 | [arXiv](https://arxiv.org/abs/2401.09712), [GitHub](https://github.com/ZhanYang-nwpu/SkyEyeGPT) |
| GeoChat | 2024 CVPR | 构造 grounded RS instruction，包含 region dialogue / grounding | 强调遥感 grounded conversation，开源代码、模型、数据和评测 | grounding 数据能缓解纯语言幻觉，但 bbox/region 与答案一致性仍需检查 | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.html), [GitHub](https://github.com/mbzuai-oryx/GeoChat) |
| VHM | 2024 arXiv / 2025 AAAI | VersaD rich captions + HnstD honest/deceptive questions | 引入详细 caption 和不存在目标的欺骗性问题，直接针对“诚实性” | 很适合作为 RS-VLM 数据负样本构造模板 | [arXiv](https://arxiv.org/abs/2403.20213), [GitHub](https://github.com/opendatalab/VHM) |
| RS-GPT4V | 2024 arXiv | 用 GPT-4V 构造统一多模态 instruction-following 数据 | 代表 GPT-4V 生成遥感指令数据路线 | 需要系统验证 GPT-4V 生成细节是否有图像证据 | [arXiv](https://arxiv.org/abs/2406.12479), [GitHub](https://github.com/GeoX-Lab/RS-GPT4V) |
| SkySenseGPT / FIT-RS | 2024 arXiv | FIT-RS，约 1.8M instruction，含关系推理、scene graph | 关注复杂语义关系和细粒度理解 | 大规模合成/转换数据必须检查关系三元组是否可见 | [arXiv](https://arxiv.org/abs/2406.10100), [GitHub](https://github.com/Luo-Z13/SkySenseGPT) |
| VRSBench | 2024 NeurIPS Datasets & Benchmarks | 高质量 RS vision-language benchmark，caption/object reference/VQA | 将 benchmark 从简单问答扩展到多任务 | 可作为抽检协议和人工验证标准参考 | [paper](https://arxiv.org/abs/2406.12384), [GitHub](https://github.com/lx709/VRSBench) |
| RSUniVLM | 2024 arXiv | 图像级、区域级、像素级、多图输入统一 | 粒度 MoE 让 instruction 覆盖多粒度任务 | 需要检查不同粒度标签互相是否一致 | [arXiv](https://arxiv.org/abs/2412.05679), [project](https://rsunivlm.github.io/) |
| GeoGround | 2024 arXiv | 用 HBB/OBB/mask 支持遥感视觉 grounding | 提供更细的视觉证据约束 | 可用于过滤“有答案但无定位证据”的样本 | [arXiv](https://arxiv.org/abs/2411.11904), [GitHub](https://github.com/zytx121/GeoGround) |
| GEOBench-VLM | 2025 ICCV | 多任务 geospatial VLM benchmark，包含自动与人工验证标注 | 用 MCQ 降低 open-ended 评估偏差，覆盖计数、定位、时序、关系等 | 可借鉴其任务 taxonomy 和人工核验方式 | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf), [GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM) |
| OmniEarth | 2026 arXiv | 44,210 manually verified instructions，含 MCQ/open-ended、bbox/mask | blind test + semantic consistency，用于检验是否依赖视觉证据 | 很适合作为“数据质量目标函数”的 benchmark | [arXiv](https://arxiv.org/abs/2603.09471), [HF dataset](https://huggingface.co/datasets/sjeeudd/OmniEarth) |
| RSHBench/RADAR | 2026 arXiv | 细粒度诊断 RS-VQA 事实/逻辑幻觉 | 把幻觉归因到 grounding failure 和小目标误读 | 可直接用于合成数据负样本和失败模式分类 | [arXiv](https://arxiv.org/abs/2603.02754), [GitHub](https://github.com/MiliLab/RADAR) |
| Cambrian-1 | 2024 NeurIPS | 通用 MLLM 数据策展和分布平衡 | 强调高质量视觉指令数据、数据源平衡、视觉中心 benchmark | 可迁移为 RS-VLM 数据混合比例和质量审计原则 | [NeurIPS](https://papers.nips.cc/paper_files/paper/2024/hash/9ee3a664ccfeabc0da16ac6f1f1cfe59-Abstract-Conference.html), [GitHub](https://github.com/cambrian-mllm/cambrian) |
| What matters when building VLMs? | 2024 NeurIPS | 通用 VLM 构建消融 | 讨论训练混合、数据重复、合成 caption 对 VLM 的影响 | 可作为 RS 合成 caption 是否真正增益的消融模板 | [paper](https://proceedings.neurips.cc/paper_files/paper/2024/file/a03037317560b8c5f2fb4b6466d4c439-Paper-Conference.pdf) |

## 数据构造路线对比

| 路线 | 典型做法 | 优点 | 质量风险 | 建议检查 |
|---|---|---|---|---|
| 既有数据集转 instruction | 将 caption/VQA/detection/segmentation 标签包装为自然语言 QA | 成本低、可复现 | 模板化强，问题答案分布单一，继承旧数据标签噪声 | 模板多样性、答案分布、同图多问一致性 |
| GPT-4V/通用 VLM 生成 | 给图像生成 caption、多轮 QA、关系描述 | 规模大，语言自然 | 小目标、尺度、类别和空间关系幻觉 | 视觉证据核验、负样本、人工抽检 |
| LLM 基于标签生成 | 用已有 bbox/mask/class 让 LLM 生成问答 | 语义可控，便于批量生成 | 答案可能只来自标签而不是图像；语言先验强 | bbox/mask-answer 一致性、图像可见性 |
| detector/SAM/VLM 联合自动标注 | GroundingDINO/SAM/CLIP/VLM 产生区域和描述 | 有区域证据，适合 grounding | detector 漏检、SAM 类别无关、CLIP 类别混淆 | 多模型一致性、mask stability、类别置信度 |
| 人工验证 benchmark | 人工校验 instruction、答案和证据 | 可信度高，适合评测 | 成本高，覆盖有限 | 分层抽样、双人标注、一致性统计 |
| hard negative / deceptive QA | 问不存在对象、相似类别、空间关系陷阱 | 直接抑制幻觉 | 构造不自然会让模型学到模板捷径 | 负样本自然度、与正样本配对、难度分层 |

## 质量问题分类

1. 伪细节幻觉：caption 里出现图像中没有的飞机、船、道路、建筑损毁等。
2. 小目标误读：把 tiny vehicle、storage tank、greenhouse、ship 等当成纹理或相似类别。
3. 空间关系错误：left/right、near、inside、parallel、surrounded by 在俯视图中容易错。
4. 尺度/GSD 错误：把球场、停车场、房屋屋顶等按自然图像尺度理解。
5. 类别层级混乱：land cover 与 object label 混用，例如 impervious surface/road/runway/building。
6. 模板偏置：模型靠问题句式猜答案，而不是看图。
7. 答案分布偏置：yes/no、选项位置、常见类别过度集中。
8. 地理常识编造：根据地区名、典型场景或语言先验推断不可见信息。
9. 多粒度不一致：同一图像的 image-level caption、region QA、mask label 互相矛盾。
10. 训练-测试污染：合成数据来自公开 benchmark 或同一区域瓦片，导致评测虚高。

## 可执行的数据过滤协议

### Stage 0: 数据血缘记录

每条样本保存：

- `image_id`
- `source_dataset`
- `geo_bbox`
- `timestamp`
- `sensor`
- `gsd`
- `label_source`: human / GPT-4V / LLM-from-label / detector / SAM / mixed
- `generator_model`
- `prompt_template_id`
- `evidence_type`: none / bbox / obb / mask / point / polygon
- `verification_status`: unchecked / auto_pass / human_pass / human_revised / reject

### Stage 1: 自动一致性检查

| 检查 | 方法 | 拒绝或降权条件 |
|---|---|---|
| 图像-文本匹配 | RS-CLIP/RemoteCLIP/GeoRSCLIP similarity | 低相似度 caption 或 QA 降权 |
| 答案-证据一致 | answer 中对象必须落在 bbox/mask/class evidence | 答案对象无证据拒绝 |
| 多问一致性 | 同一图像不同 QA 对同一事实不能矛盾 | 互斥答案拒绝 |
| 负样本一致 | 不存在对象问题应有 hard visual negative | 只有模板否定、无相似干扰降权 |
| 类别 taxonomy | 映射到统一层级词表 | 无法映射或层级冲突标记 |
| 地理/尺度 | GSD 与目标尺寸范围约束 | 目标尺寸明显不合理标记 |
| 重复污染 | perceptual hash + embedding + geo/time overlap | near-duplicate 进入隔离池 |

### Stage 2: 分层人工抽检

建议每轮训练数据发布前，按以下维度分层抽检，而不是随机抽样：

- 任务：caption、VQA、counting、grounding、relation、change、segmentation。
- 来源：GPT-4V 直接生成、LLM from labels、human、detector/SAM。
- 场景：urban、agriculture、water、forest、industrial、disaster。
- 难度：小目标、密集目标、相似类别、低分辨率、遮挡/云影。
- 地理：不同国家/气候带/城市形态。
- 类别频率：head、medium、tail classes。

推荐抽检字段：

| 字段 | 取值 |
|---|---|
| visual evidence | pass / partial / fail |
| answer correctness | pass / ambiguous / fail |
| spatial relation | pass / not_applicable / fail |
| scale consistency | pass / ambiguous / fail |
| hallucination type | none / nonexistent_object / wrong_attribute / wrong_count / wrong_relation / geo_prior |
| action | keep / revise / reject / need_second_annotator |

### Stage 3: 训练收益验证

过滤协议不能只报告“通过率”，还要验证是否改善模型：

- 固定 base model，比较 raw synthetic、filtered synthetic、human-verified subset、mixed data。
- 下游评测覆盖 GEOBench-VLM、OmniEarth、VRSBench、RSHBench/RADAR 和一个 held-out 私有或新区域测试集。
- 同时报告 open-ended accuracy、MCQ accuracy、grounding IoU、mask IoU、hallucination rate、calibration、跨区域性能。
- 记录每类过滤规则移除多少样本，以及对应性能变化，避免过度过滤导致长尾类别消失。

## 实验矩阵

| 实验 | 目的 | 数据 | 模型 | 指标 |
|---|---|---|---|---|
| E1 raw vs filtered | 验证过滤协议是否有效 | RS-GPT4V/FIT-RS 风格合成子集 | LLaVA-style RS-VLM | VQA acc、caption score、hallucination rate |
| E2 negative QA ablation | 验证 deceptive/hard negative 对诚实性影响 | HnstD 风格负样本 + 普通 QA | GeoChat/VHM-style model | false-positive rate、RSHBench score |
| E3 evidence filtering | 验证 bbox/mask 证据是否减少幻觉 | GeoChat/GeoGround/OmniEarth-style samples | RS-VLM + grounding head | answer-evidence consistency、IoU |
| E4 taxonomy cleaning | 验证类别层级归一化效果 | land cover/object 混合数据 | RS-VLM | hierarchy-aware accuracy、confusion reduction |
| E5 distribution balancing | 验证数据混合比例 | caption/VQA/grounding/relation/change | 统一模型 | 各任务平均分与最差任务分 |
| E6 contamination audit | 验证地理/图像去重影响 | pretrain + benchmark splits | 同一模型两套 split | SOTA drop、near-duplicate rate |

## 一个可投稿的小方法方案

题目草案：`TrustFIT-RS: Evidence-Calibrated Filtering for Synthetic Instruction Data in Remote Sensing Vision-Language Models`

核心假设：遥感 VLM 的合成 instruction 数据中，真正损害泛化的不是语言质量低，而是“语言断言缺少可见证据”。如果把 evidence consistency、hard negatives、taxonomy consistency 和 geo/scale sanity check 加入数据过滤，就能在不增加大量人工标注的情况下减少幻觉并提升跨区域评测。

方法模块：

1. 数据血缘记录器：对每条样本记录来源、生成模型、prompt 模板、地理时间元数据和证据类型。
2. Evidence verifier：用 detector/SAM/grounding/VLM 交叉验证 answer 中对象是否有 bbox/mask/region 支撑。
3. Geo-scale verifier：基于 GSD 和类别尺寸先验过滤不合理描述。
4. Taxonomy normalizer：把自由文本类别映射到统一遥感层级词表。
5. Hard-negative generator：为每个正样本生成相似但不存在的对象/关系问题。
6. Human audit sampler：按任务、来源、场景、难度和长尾类别分层抽检。

最小实验：

- 数据：从 RS-GPT4V、SkySenseGPT/FIT-RS、GeoChat 数据格式中抽取 50k-200k 样本，构造 raw、auto-filtered、human-audited 三个版本。
- 模型：选择一个开源 LLaVA-style RS-VLM 或 GeoChat/SkyEyeGPT 兼容框架。
- 评测：GEOBench-VLM、VRSBench、OmniEarth、RSHBench/RADAR；若资源有限，先做 VQA + grounding + honest QA 三项。
- Baseline：随机过滤、CLIP similarity 过滤、只按 generator confidence 过滤、人工小样本过滤。
- 预期贡献：不是新模型，而是 RS-VLM instruction 数据的质量控制协议和可复现过滤器。

## 风险

- 很多遥感 VLM 数据集并非完全开放，可能需要用公开子集或复刻格式。
- GPT-4V 生成数据的原始 prompt 和中间输出不一定公开，难以完整复现。
- 自动 evidence verifier 自身会犯错，尤其对小目标和密集目标。
- 过滤过强可能移除难样本和长尾样本，提升短期准确率但损害泛化。
- 人工抽检需要遥感知识，普通众包可能无法判断细粒度地物。

## 下一步阅读队列

1. [RS-GPT4V](https://arxiv.org/abs/2406.12479) 与 [SkySenseGPT/FIT-RS](https://arxiv.org/abs/2406.10100)：重点看生成 prompt、任务类型和数据清洗。
2. [VHM](https://arxiv.org/abs/2403.20213)：重点看 HnstD 欺骗性问题如何定义。
3. [GEOBench-VLM](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf) 与 [OmniEarth](https://arxiv.org/abs/2603.09471)：重点看人工验证和语义一致性。
4. [RSHBench/RADAR](https://arxiv.org/abs/2603.02754)：重点看 hallucination taxonomy。
5. [Cambrian-1](https://papers.nips.cc/paper_files/paper/2024/hash/9ee3a664ccfeabc0da16ac6f1f1cfe59-Abstract-Conference.html) 与 [What matters when building VLMs?](https://proceedings.neurips.cc/paper_files/paper/2024/file/a03037317560b8c5f2fb4b6466d4c439-Paper-Conference.pdf)：迁移通用 MLLM 数据策展消融到遥感。
