# RS-19 Change Caption Evidence Grounding 调研


# RS-19 Change Caption Evidence Grounding 调研

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-19` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 对应 prompt：RS19 Change Caption Evidence Grounding 核心问题 遥感 change captioning 的目标是输入同一区域的双时相或多时相影像，输出自然语言变化描述，例如“新建了几栋建筑”“农田变成裸地”“洪水淹没了道路和建筑”。这个任务比普通变化检测更接近人类解释，但也更容易出现一

## 正文

# RS-19 Change Caption Evidence Grounding 调研

更新时间：2026-06-07  
对应 prompt：`RS-19 Change Caption Evidence Grounding`

## 核心问题

遥感 change captioning 的目标是输入同一区域的双时相或多时相影像，输出自然语言变化描述，例如“新建了几栋建筑”“农田变成裸地”“洪水淹没了道路和建筑”。这个任务比普通变化检测更接近人类解释，但也更容易出现一种危险失败：句子读起来合理，BLEU/CIDEr 也不低，却没有被变化区域真正支撑。

RS-19 的细问题是：**如何判断 change caption 中每个变化短语是否有 bbox/mask 级证据支撑**。例如 caption 说“two buildings were destroyed and surrounding roads were flooded”，评估不应只看文本相似度，而要拆成：

- 对象：building、road、water/flood。
- 属性：destroyed、flooded、newly built、removed、expanded。
- 数量：two、several、large area。
- 位置关系：surrounding、near、north of、along the road。
- 时间关系：pre-event 存在、post-event 消失/受损/出现。
- 证据区域：对象变化 mask、损毁建筑 bbox、洪水区域 mask、道路变化线状 mask。

一个好的 evidence-grounded change caption 评测，应区分四类结果：

1. 文本正确且证据正确。
2. 文本正确但证据区域错。
3. 证据区域覆盖真实变化，但文本属性/数量错。
4. 文本和证据都错，或对 no-change 图像产生幻觉变化。

## 代表论文与资源

| 工作 | 年份/来源 | 链接 | 官方代码/数据 | 和 evidence grounding 的关系 |
|---|---:|---|---|---|
| RSICCFormer / LEVIR-CC | 2022 TGRS | [论文 PDF](https://levir.buaa.edu.cn/static/pdfs/2022_chenyang_liu_remote_dataset.pdf) | LEVIR-CC 数据集 | 早期核心基准；每对图像有多条变化描述，但主要按文本指标评估，缺少 phrase-to-region 证据。 |
| PromptCC | 2023 TGRS | [GitHub](https://github.com/Chen-Yang-Liu/PromptCC) | [GitHub](https://github.com/Chen-Yang-Liu/PromptCC) | 用 prompt learning 和预训练语言模型做 RSICC；代码中包含 LEVIR-CC 训练、推理、指标脚本，可作为复现实验基线。 |
| Chg2Cap | 2023/2024 | [arXiv](https://arxiv.org/abs/2304.01091) | [GitHub](https://github.com/ShizhenChang/Chg2Cap) | 用 attentive decoder 定位 change-related features，再生成 caption；注意力可作为弱证据，但不是显式 bbox/mask 证据。 |
| Semantic-CC | 2024 arXiv | [arXiv](https://arxiv.org/abs/2407.14032) | 未稳定确认官方代码 | 用 foundation knowledge 与 change detection pixel-level semantic guidance 联合训练，直接把 CD mask/语义引入 caption，是 RS-19 最重要的 baseline 之一。 |
| VRSBench | 2024 NeurIPS Datasets & Benchmarks | [arXiv](https://arxiv.org/abs/2406.12384), [GitHub](https://github.com/lx709/VRSBench) | [GitHub](https://github.com/lx709/VRSBench) | 包含 caption、object references、QA 和 visual grounding。虽不是 change caption 专门数据，但提供 phrase/object grounding 数据构造范式。 |
| SAT-Cap | 2025 arXiv | [arXiv](https://arxiv.org/abs/2501.08114) | 论文称代码/模型将发布 | 单阶段 Transformer change caption，强调低复杂度和细节提取；适合作为文本强基线，但证据约束仍弱。 |
| SECOND-CC / MModalCC | 2025 arXiv / JSTARS 关联 | [arXiv](https://arxiv.org/abs/2501.10075), [GitHub](https://github.com/ChangeCapsInRS/SecondCC) | [GitHub](https://github.com/ChangeCapsInRS/SecondCC) | 提供 6,041 对高分 RGB 双时相图、语义分割图和 30,205 条句子；语义图可直接用于 phrase-to-mask evidence score。 |
| DeltaVLM / ChangeChat-105k | 2025 arXiv/HF | [HF paper](https://huggingface.co/papers/2507.22346), [GitHub](https://github.com/hanlinwu/DeltaVLM) | [GitHub](https://github.com/hanlinwu/DeltaVLM), [HF dataset](https://huggingface.co/datasets/hlwu/changechat-105k) | 将 change caption、classification、quantification、localization、open QA、多轮对话统一成 interactive change analysis。localization 子任务可直接补证据监督。 |
| ChangeIMTI / ChangeVG | 2025 arXiv | [arXiv 摘要线索](https://arxiv.org/abs/2509.23105) | 论文称 GitHub 公开 | 构造包含 change captioning、binary classification、counting、localization 的交互式多任务数据集；和 RS-19 的“caption 句子必须对齐定位”高度相关。 |
| RSCC disaster change caption dataset | 2025 NeurIPS D&B | [NeurIPS PDF](https://papers.neurips.cc/paper_files/paper/2025/file/62867024377cac4233195949b9db0ebd-Paper-Datasets_and_Benchmarks_Track.pdf), [GitHub](https://github.com/Bili-Sakura/RSCC) | [GitHub](https://github.com/Bili-Sakura/RSCC) | 62,351 对灾前/灾后影像，使用 xBD/EBD 等灾害标签生成并人工核验 caption；建筑损毁框/等级可用作证据监督。 |
| HiSem | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.15024) | 论文称代码将发布 | 提出层级语义解耦：先区分 changed/no-change，再对 changed 样本做 token-level MoE。问题意识很接近 RS-19，但仍主要报告 BLEU/CIDEr 等文本指标。 |
| OmniCD | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.30168) | 论文页线索 | 用 multimodal semantics 引导变化检测 foundation framework。可作为 mask/semantic evidence 生成器，给 caption 评测提供候选变化证据。 |
| OmniEarth | 2026 arXiv | [arXiv](https://arxiv.org/abs/2603.09471) | 数据/评测线索 | 覆盖文本、bbox、mask 等输出形态，可借鉴其多输出一致性评测思想，迁移到 change caption。 |

## 问题由来

### 1. 传统指标只评价句子相似，不评价证据

RSICC 早期主要沿用 BLEU、METEOR、ROUGE-L、CIDEr、SPICE 等 caption 指标。这些指标适合快速比较模型，但对遥感 change caption 有三个缺陷：

- 同一个真实变化可以有多种等价表述，文本指标会惩罚合理改写。
- 模型可能生成高频模板句，例如“some buildings appeared”，获得不差分数，却没有定位依据。
- 句子中最关键的变化属性，如“destroyed”“flooded”“removed”，如果没有落到真实变化区域，文本指标也不一定能发现。

### 2. Change caption 天然需要“时序证据”

普通 image caption 只需说明一张图有什么；change caption 必须说明 `t1 -> t2` 的差分。一个短语是否有证据，需要同时检查：

- t1 中对象是否存在。
- t2 中对象是否存在或属性是否改变。
- 差分区域是否与句子描述一致。
- 变化是否真实，而不是光照、阴影、季节、配准误差。

这也是 HiSem 强调 changed/unchanged 样本具有不同语义粒度的原因：no-change 样本只需判断“没有显著变化”，changed 样本才需要细粒度对象和属性描述。

### 3. 新数据集开始提供 mask/语义/定位线索

SECOND-CC 提供语义分割图，RSCC 从 xBD/EBD 灾害标签提取建筑损毁信息，DeltaVLM/ChangeChat-105k 和 ChangeIMTI 把 localization/counting 与 caption 放进同一任务体系。这说明 RS-19 的 evidence score 已经具备数据基础：不必重新标完整数据集，可以用已有 mask/box/semantic labels 构建 phrase-level 证据评测子集。

## 方法脉络

### A. Text-only change caption

代表：RSICCFormer、PromptCC、SAT-Cap、Chg2Cap。  
特点：输入双时相图像，输出文本；训练和评估主要依赖 caption loss 与文本指标。

优点：复现简单，已有 LEVIR-CC、Dubai-CCD、WHU-CDC 等基准。  
不足：注意力热图不等于证据；无法判断“句子里的建筑/道路/水体变化”是否真的落到正确区域。

### B. CD-guided / semantic-guided caption

代表：Semantic-CC、MModalCC、OmniCD 可迁移。  
特点：引入 change detection mask、semantic segmentation map 或多任务 decoder，让 caption decoder 接收像素级变化先验。

优点：天然适合 evidence grounding；可把 mask 作为监督或评测对象。  
不足：如果 CD mask 本身错，caption 会被错误证据牵着走；文本中的属性和关系仍需额外解析。

### C. Interactive change understanding

代表：DeltaVLM、ChangeVG/ChangeIMTI、RSCC disaster caption benchmark。  
特点：把 caption、分类、计数、定位、QA、多轮对话合并；模型不仅描述，还能回答“哪里变化了”“多少建筑受损”“哪个区域被淹”。

优点：可以用 localization/counting 子任务反向验证 caption。  
不足：很多 instruction 数据由规则或 GPT 辅助生成，仍需检查语言幻觉和视觉证据一致性。

### D. 通用 VLM caption grounding 迁移

VRSBench、OmniEarth、GEOBench-VLM、RSHBench/RADAR 等不是专门 change caption，但提供了 object reference、visual grounding、bbox/mask 输出和幻觉诊断思路。RS-19 可以把这些思想迁移到双时相：

- 把 caption 解析成结构化事件。
- 对每个事件生成或匹配 evidence region。
- 用 bbox/mask IoU、类别一致性、数量一致性、时序一致性联合评分。

## 建议的 Evidence Score

### 1. Caption 结构化

把生成 caption 和参考 caption 都解析为事件集合：

```json
{
  "events": [
    {
      "object": "building",
      "change_type": "destroyed",
      "count": 2,
      "attributes": ["severe damage"],
      "spatial_relation": "near road",
      "evidence_required": ["pre_object", "post_damage", "change_mask"]
    },
    {
      "object": "road",
      "change_type": "flooded",
      "count": null,
      "attributes": ["surrounding"],
      "evidence_required": ["post_water_mask", "road_overlap"]
    }
  ]
}
```

结构化可用三种方式实现：

- 规则 + 地物词表：适合 LEVIR-CC、SECOND-CC、RSCC 的高频类别。
- LLM parser：把 caption 转为 JSON，但必须人工抽检。
- 数据集标签反推：xBD damage label、semantic map、CD mask 可直接生成事件。

### 2. Phrase-to-region 匹配

对每个事件匹配证据：

- `object_evidence`: object bbox/mask 是否覆盖对应地物。
- `change_evidence`: changed pixels 是否与该对象或区域重叠。
- `temporal_evidence`: t1/t2 状态是否满足出现、消失、扩张、损毁、淹没。
- `relation_evidence`: 空间关系是否成立，如道路附近、建筑周围、水体覆盖。

### 3. 指标定义

建议主指标命名为 `Change Caption Grounding Score (CCGS)`：

```text
CCGS = mean_event(
  w_obj * ObjectMatch
  + w_change * ChangeIoU
  + w_attr * AttributeConsistency
  + w_count * CountConsistency
  + w_rel * RelationConsistency
  + w_time * TemporalConsistency
)
```

具体分量：

- `ObjectMatch`: 生成事件 object 是否能在 GT semantic/bbox/mask 中找到匹配，类别可用 taxonomy-aware mapping。
- `ChangeIoU`: 事件对应变化区域与 GT change mask 的 IoU / mIoU。
- `AttributeConsistency`: destroyed/flooded/newly-built/removed/expanded 等属性是否与标签或变化模式一致。
- `CountConsistency`: 对建筑、车辆等实例目标，用 count error 或 F1。
- `RelationConsistency`: 根据 mask/bbox 几何关系计算 near/inside/around/along。
- `TemporalConsistency`: 检查 pre/post 状态是否符合 change_type。
- `No-change Hallucination Rate`: no-change 样本中生成变化事件的比例。

文本指标仍保留，但作为辅助：

```text
final_report = {
  text_metrics: BLEU/METEOR/ROUGE/CIDEr/SPICE/BERTScore,
  grounding_metrics: CCGS, ChangeIoU, AttributeConsistency,
  hallucination_metrics: NoChangeHallucination, UnsupportedPhraseRate,
  calibration: confidence-ECE if model outputs confidence
}
```

## 实验矩阵

| 维度 | 推荐设置 |
|---|---|
| 数据集 | LEVIR-CC、WHU-CDC、Dubai-CCD、SECOND-CC、RSCC disaster、ChangeChat-105k/ChangeIMTI 子集 |
| 证据来源 | GT change mask、semantic map、xBD building damage bbox、SAM/OmniCD 伪 mask、人工抽检子集 |
| Baseline caption 模型 | PromptCC、Chg2Cap、SAT-Cap、Semantic-CC、MModalCC、DeltaVLM |
| Evidence baseline | attention heatmap threshold、Grad-CAM、CD model mask、SAM mask + text matching、OmniCD mask |
| 文本指标 | BLEU-4、METEOR、ROUGE-L、CIDEr、SPICE、BERTScore |
| 证据指标 | CCGS、event-level F1、phrase grounding IoU、unsupported phrase rate、no-change hallucination rate |
| 分层报告 | changed/no-change、建筑/道路/水体/植被、实例目标/区域目标、灾害/非灾害、配准误差/阴影/季节扰动 |

### 最小可复现实验

1. 选 SECOND-CC，因为它同时有 image pair、caption 和 semantic segmentation maps。
2. 选 PromptCC 或 Chg2Cap 作为 text-only baseline，选 Semantic-CC/MModalCC 作为 semantic-guided baseline。
3. 用规则词表解析 caption 中的 object/change_type。
4. 将 semantic map 或 change mask 转为 evidence mask。
5. 计算传统文本指标 + CCGS。
6. 人工抽检 100-200 个样本，验证 CCGS 是否比 CIDEr 更能暴露幻觉变化。

### 扩展实验

1. 在 RSCC disaster 上利用 xBD building damage boxes，评估 destroyed/minor/major damage 等属性的一致性。
2. 在 LEVIR-CC/WHU-CDC 上使用 OmniCD 或强 CD 模型生成伪 evidence，比较 GT evidence 与 pseudo evidence 的相关性。
3. 让 DeltaVLM/ChangeVG 输出 caption + localization，再评估它是否比 text-only 模型更低 unsupported phrase rate。
4. 对 no-change pairs 专门测试 false change hallucination。

## 可投稿的小方法方案

### 题目草案

`Grounded Change Captioning for Remote Sensing: Event-Level Evidence Scoring with Mask and Temporal Consistency`

### 方法模块

1. `Event Parser`: 把 change caption 解析成 object、change_type、attribute、count、relation。
2. `Evidence Retriever`: 从 GT mask、CD model、SAM、semantic segmentation 或 xBD damage labels 中获得候选证据区域。
3. `Temporal Verifier`: 检查 pre/post 状态是否支持事件。
4. `Grounding Score`: 计算 CCGS 和 unsupported phrase rate。
5. `Feedback Training`: 可选，把 CCGS 作为 reward 或 reranker，训练 caption 模型减少无证据短语。

### 预期贡献

- 提出 RSICC 的 phrase/event-level evidence grounding 评测，不再只依赖文本相似度。
- 构建一个小型人工核验 benchmark，标注每个 change phrase 的 bbox/mask 证据。
- 系统比较 text-only、semantic-guided、interactive VLM 三类模型的证据一致性。
- 提供可复现实验脚本和错误类型 taxonomy。

## 未来研究方向

1. **Caption-to-mask 反向监督**：让模型在生成每个变化短语时同步输出 mask，用 mask loss 约束语言。
2. **No-change 拒答机制**：对无变化或仅有光照/季节变化的样本，要求模型输出无显著变化并给出低变化置信度。
3. **事件级不确定性**：不是整句一个 confidence，而是每个事件一个 confidence；对不确定区域提示人工核验。
4. **长尾变化类别**：针对灾害、违建、农田轮作、临时设施等长尾事件，评估 CCGS 是否能发现模板化错误。
5. **跨数据集证据迁移**：在 SECOND-CC 用语义图开发指标，在 RSCC/xBD 用建筑损毁框验证，在 LEVIR-CC 用伪 mask 迁移。
6. **地理关系 grounding**：把 near/along/inside/surrounding 等空间关系纳入指标，而不只看对象 IoU。
7. **LLM-as-parser 风险控制**：结构化解析如果用 LLM，需要稳定 schema、置信度和人工抽检，否则会把 parser 错误当模型错误。

## 推荐阅读顺序

1. [RSICCFormer / LEVIR-CC 原始 TGRS 论文](https://levir.buaa.edu.cn/static/pdfs/2022_chenyang_liu_remote_dataset.pdf)
2. [PromptCC GitHub](https://github.com/Chen-Yang-Liu/PromptCC)
3. [Chg2Cap arXiv](https://arxiv.org/abs/2304.01091) 和 [GitHub](https://github.com/ShizhenChang/Chg2Cap)
4. [Semantic-CC](https://arxiv.org/abs/2407.14032)
5. [SECOND-CC / MModalCC](https://arxiv.org/abs/2501.10075) 和 [GitHub](https://github.com/ChangeCapsInRS/SecondCC)
6. [DeltaVLM / ChangeChat-105k](https://huggingface.co/papers/2507.22346) 和 [GitHub](https://github.com/hanlinwu/DeltaVLM)
7. [RSCC NeurIPS 2025 D&B PDF](https://papers.neurips.cc/paper_files/paper/2025/file/62867024377cac4233195949b9db0ebd-Paper-Datasets_and_Benchmarks_Track.pdf)
8. [HiSem](https://arxiv.org/abs/2605.15024)
9. [OmniCD](https://arxiv.org/abs/2605.30168)
10. [VRSBench](https://arxiv.org/abs/2406.12384) 和 [GitHub](https://github.com/lx709/VRSBench)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

