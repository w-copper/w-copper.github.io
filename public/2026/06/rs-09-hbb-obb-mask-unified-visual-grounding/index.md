# RS-09 HBB/OBB/Mask Unified Visual Grounding


# RS-09 HBB/OBB/Mask Unified Visual Grounding

## 任务 Prompt

## 执行摘要

- 遥感 visual grounding 的输出正在从单一 HBB 走向 HBB/OBB/mask 统一：HBB 适合粗定位，OBB 适合飞机、船、车辆、跑道等旋转目标，mask 适合建筑、道路、水体、农田等形状复杂目标。
- GeoChat 先把遥感 VLM 带到 grounded dialogue，但主要输出框；GeoGround 进一步把 HBB、OBB、mask 统一成同一套 RS visual grounding 框架，并用 Text-Mask 与 hybrid supervision 对齐三种几何信号。
- RSUniVLM 侧重多粒度任务统一，把 object localization、VQA、semantic segmentation 等都归入 text-only generation；OmniEarth 则把 bbox 和 mask 输出纳入 RSVLM benchmark，强调模型是否真正依赖视觉证据。
- RS2-SAM2 从 referring remote sensing image segmentation 切入：用文本-视觉联合编码生成 dense mask prompt 给 SAM2，代表“语言 grounding -> SAM2 精修 mask”的路线。
- 一个值得做的小课题是：把 VLM/grounding 模型的 HBB/OBB 粗定位，与 SAM2/RS2-SAM2 的 mask prompt 生成、旋转几何约束和密集小目标去粘连机制串起来，构造统一的 `text -> HBB/OBB -> mask` pipeline。

## 问题由来

遥感图像和自然图像的 grounding 差异很硬：

1. **旋转与方向性**：飞机、船、车辆、跑道、桥梁等目标常以任意角度出现。HBB 会包含大量背景，影响后续 mask prompt 和类别判别；OBB 更紧，但训练和评估更复杂。
2. **密集小目标**：港口、机场、停车场中多个实例距离很近。只用文本或 HBB 容易把相邻目标合并；只用 SAM 点/框又容易缺语义。
3. **尺度跨度大**：同一张图里既有小车，也有道路、建筑群、水体。不同目标需要不同输出粒度。
4. **语义和几何割裂**：VLM/CLIP 知道“找哪类对象”，SAM 知道“边界在哪里”，但二者之间缺少稳定的几何对齐。
5. **评测割裂**：HBB 用 Acc@IoU 或 box IoU，OBB 用 rotated IoU，mask 用 mIoU/cIoU。模型可能 HBB 正确但 OBB 方向错，或框正确但 mask 质量差。

因此，真正有价值的问题不是单独“做一个遥感 grounding 模型”，而是研究 **同一个 referring expression 如何在 HBB、OBB、mask 三种几何空间中保持一致**。

## 代表论文与项目

| 工作 | 年份/来源 | 链接 | 代码/数据 | 和 HBB/OBB/mask 统一的关系 |
|---|---:|---|---|---|
| GeoChat: Grounded Large Vision-Language Model for Remote Sensing | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.pdf), [arXiv](https://arxiv.org/abs/2311.15826) | [GitHub](https://github.com/mbzuai-oryx/GeoChat) | 遥感 grounded VLM 代表，支持 grounded description、referring expression、region caption；项目页展示可输出 rotated boxes。 |
| GeoGround: A Unified Large Vision-Language Model for Remote Sensing Visual Grounding | 2024 arXiv | [arXiv](https://arxiv.org/abs/2411.11904) | [GitHub](https://github.com/VisionXLab/GeoGround) | 明确统一 HBB、OBB、mask；提出 Text-Mask、prompt-assisted learning、geometry-guided learning；refGeo 含 161k image-text pairs 和 80k RS images。 |
| RSUniVLM: A Unified Vision Language Model for Remote Sensing via Granularity-oriented MoE | 2024 arXiv | [arXiv](https://arxiv.org/abs/2412.05679), [project](https://rsunivlm.github.io/) | [GitHub](https://github.com/xuliu-cyber/RSUniVLM) | 统一 image-level、region-level、pixel-level 任务；把 object localization、VQA、semantic segmentation 等变成 VLM text generation。 |
| SATGround: A Spatially-Aware Approach for Visual Grounding in Remote Sensing | 2025 arXiv | [arXiv](https://arxiv.org/abs/2512.08881) | 论文页称 code will be released upon acceptance；未核到稳定官方 repo | 用结构化 localization module 与 control tokens 加强 VLM 的空间定位；适合作为“structured grounding head”参考。 |
| OmniEarth: A Benchmark for Evaluating Vision-Language Models in Geospatial Tasks | 2026 arXiv | [arXiv](https://arxiv.org/abs/2603.09471) | [Hugging Face dataset](https://huggingface.co/datasets/sjeeudd/OmniEarth) | Benchmark 层面同时包含 text、bbox、mask 输出；强调 blind test 和 semantic consistency，用于检验 grounding 是否依赖视觉证据。 |
| RS2-SAM2: Customized SAM2 for Referring Remote Sensing Image Segmentation | 2025 arXiv / 2026 AAAI | [arXiv](https://arxiv.org/abs/2503.07266), [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/37828/41790) | Awesome-SAM2 标注为有 code，但本次未核到稳定官方 repo；需后续复查 | 用文本-视觉联合编码、pseudo-mask dense prompt 和 boundary loss 适配 SAM2 到 RRSIS，是 `text -> dense prompt -> mask` 的关键路线。 |
| RRSIS / RefSegRS | 2023 起，2024-2026 仍是基础 benchmark | [arXiv](https://arxiv.org/abs/2306.08625), [TUM page](https://portal.fis.tum.de/en/publications/rrsis-referring-remote-sensing-image-segmentation-2/) | [GitLab](https://gitlab.lrz.de/ai4eo/reasoning/rrsis) | 提供 referring remote sensing image segmentation 的基础定义和 RefSegRS，虽早于 2024，但 2024-2026 方法仍常用。 |
| Grounded SAM 2 | 2024 open-source pipeline | [GitHub](https://github.com/IDEA-Research/Grounded-SAM-2) | 官方 repo | 通用 CV 的 GroundingDINO/Florence-2/DINO-X + SAM2 pipeline，可迁移到遥感作为 open-set grounding-to-mask baseline。 |
| SAM 2 | 2024 Meta | [GitHub](https://github.com/facebookresearch/sam2), [paper](https://arxiv.org/abs/2408.00714) | 官方 repo / checkpoints | 提供 image/video promptable segmentation，适合做 box/mask prompt refinement，但遥感文本理解需要额外适配。 |

## 方法脉络

### 1. HBB grounding：从 referring expression 到粗定位

早期遥感 visual grounding 多以 HBB 为输出，因为 DIOR-RSVG、RSVG 等数据集和 REC 评测较成熟。HBB 的优点是训练简单、能快速定位目标区域；缺点是旋转目标和细长目标背景占比高，密集小目标容易框到邻近实例。

GeoChat 代表了 VLM 化的第一步：用户用自然语言描述目标，模型输出文本与位置。它的价值是把 grounding 嵌入对话和 region reasoning；但从统一几何的角度看，它主要解决“哪里”而不是“精确形状”。

### 2. OBB grounding：解决旋转目标的紧致定位

遥感中的 aircraft、ship、vehicle、harbor object、runway 等经常需要 OBB。OBB 的核心不是单纯把 HBB 换成旋转框，而是让语言表达中的方向、长宽、姿态、上下文关系进入定位过程。GeoChat 项目页展示了 rotated bounding boxes；GeoGround 更系统地把 OBB 纳入统一训练。

难点在于 OBB 与 mask 的关系：OBB 可以提供紧致 prompt，但不能表达复杂边界；mask 可以表达边界，但不天然携带方向。一个统一系统需要让 OBB 约束 mask 的主方向，同时让 mask 反过来纠正 OBB 的尺度和角度。

### 3. Mask grounding：从定位到像素证据

RRSIS、RS2-SAM2、GeoGround 的 mask 分支解决的是“目标到底是哪一片像素”。这对建筑、水体、道路、农田、灾损区域很关键。RS2-SAM2 的思路尤其适合 pipeline 化：文本和图像先联合编码，生成 pseudo-mask dense prompt，再交给 SAM2 精修，并用边界约束提升 mask 质量。

mask 分支的最大风险是语义漂移：SAM/SAM2 可以分出形状，但可能分错类别或把相邻实例粘在一起。因此需要 HBB/OBB 的候选区域、VLM 的语义约束和 mask 的边界质量共同打分。

### 4. 统一范式：多输出不是三个 head，而是一致性问题

GeoGround 给了很好的范式：不是为 HBB、OBB、mask 分别堆三个模型，而是通过 Text-Mask、PAL/GGL 等机制把几何信号对齐。RSUniVLM 则提醒我们：统一模型还要覆盖 image/region/pixel 多粒度任务。OmniEarth 从评测层面补了一刀：只输出文本是不够的，bbox/mask 输出要被纳入 benchmark，且要检查模型是否真正使用图像。

## 可复现实验设计

### 数据集候选

| 数据集/benchmark | 输出类型 | 用途 |
|---|---|---|
| DIOR-RSVG | HBB referring grounding | HBB REC 基础实验，适合和 GeoChat/GeoGround 对齐。 |
| RSVG | HBB referring grounding | 小目标比例高，可测试密集目标与尺度泛化。 |
| GeoChat benchmark | OBB/grounded dialogue | 适合测试 VLM 对旋转目标、grounded caption 和 referring expression 的能力。 |
| refGeo | HBB/OBB/mask | GeoGround 提出的统一 instruction dataset，若可获取，是最直接的统一训练/评测源。 |
| RefSegRS / RRSIS-D / RISORS | Mask referring segmentation | 测试 text-to-mask、SAM2 dense prompt、边界质量。 |
| DOTA / iSAID / DIOR | detection/instance segmentation | 用于补充 OBB、小目标、实例 mask 预训练或转换实验。 |
| OmniEarth | bbox/mask benchmark | 用于检验 VLM 在真实 geospatial task 上的 bbox/mask 输出和语义一致性。 |

### Baseline

1. **GeoChat**：VLM + grounded dialogue，重点测 HBB/rotated box 输出。
2. **GeoGround**：统一 HBB/OBB/mask 的主 baseline。
3. **RSUniVLM**：多粒度统一 VLM baseline。
4. **RS2-SAM2**：text-to-mask / dense prompt SAM2 baseline。
5. **Grounded SAM 2 pipeline**：GroundingDINO/Florence-2/DINO-X + SAM2，作为通用 CV-to-RS 迁移 baseline。
6. **Specialized detectors/segmenters**：DOTA OBB detector、Mask2Former/SegFormer/SAM adapter 等，作为非 VLM 对照。

### 指标

| 输出 | 主指标 | 补充指标 |
|---|---|---|
| HBB | Acc@IoU=0.5/0.75, mean IoU | small-object Acc, phrase-category Acc |
| OBB | Rotated Acc@IoU=0.5/0.75, rotated mIoU | angle error, center error, aspect-ratio error |
| Mask | mIoU, cIoU, gIoU | boundary F-score, instance separation error |
| 统一一致性 | HBB-from-mask IoU, OBB-from-mask rotated IoU | geometry consistency score, text-mask consistency |
| 鲁棒性 | cross-dataset drop | dense-scene drop, small-object drop, GSD split |

建议新增一个 **Geometry Consistency Score (GCS)**：

```text
GCS = mean(
  IoU(HBB_pred, HBB(mask_pred)),
  rIoU(OBB_pred, minAreaRect(mask_pred)),
  semantic_score(text, crop(mask_pred)),
  boundary_score(mask_pred)
)
```

它不替代传统指标，而是用来发现“三个输出分别看起来还行，但互相不一致”的失败样本。

## 提议的 Grounding-to-Mask Pipeline

### 目标

输入一张光学遥感图像和一句 referring expression，例如“the airplane parked diagonally near the lower-left hangar”，输出：

```json
{
  "answer_type": "grounding",
  "hbb": [x1, y1, x2, y2],
  "obb": [cx, cy, w, h, theta],
  "mask": "binary mask",
  "confidence": {
    "semantic": 0.0,
    "geometry": 0.0,
    "boundary": 0.0
  }
}
```

### 模块

1. **Text parsing and target prior**
   - 从 expression 中抽取 object noun、属性、空间关系、方向词和数量。
   - 用 RS-CLIP/GeoRSCLIP 或 VLM embedding 得到类别和上下文候选。

2. **Coarse HBB proposal**
   - 用 GeoGround/GeoChat/SATGround-style grounding head 或 GroundingDINO-style detector 生成 top-K HBB。
   - 加入 small-object prior：对大图采用 dynamic tiling，避免目标被缩放吞掉。

3. **HBB-to-OBB refinement**
   - 对候选 crop 预测 OBB，或者从 segmentation proposal 的 minimum-area rectangle 得到 OBB。
   - 引入 direction-aware loss：角度误差、长宽比、中心偏移。
   - 对船、飞机、车辆、跑道等类别启用 OBB 强约束；对水体、农田等非刚性目标弱化 OBB。

4. **OBB/Semantic-to-mask prompt**
   - 把 HBB、OBB、中心点、长轴端点、负样本点、pseudo-mask 一起作为 SAM2 prompt。
   - 借鉴 RS2-SAM2：用文本-视觉融合生成 dense prompt，而不是只给一个 box。
   - 对密集实例，从 OBB 外扩区域采样负点，压制相邻实例粘连。

5. **Geometry consistency verifier**
   - 从 mask 反算 HBB/OBB，与模型输出比较。
   - 用 VLM/CLIP 对 mask crop 与文本做二次语义打分。
   - 若一致性低，触发 re-prompt：增加负点、缩小 box、或切换到更高分辨率 tile。

6. **Unified output and uncertainty**
   - 输出 HBB/OBB/mask 三者及置信度。
   - 明确标注失败类型：semantic mismatch、angle mismatch、mask leakage、small-object miss、dense-instance merge。

### 训练策略

- **Stage 1: HBB/OBB grounding warm-up**  
  用 DIOR-RSVG、RSVG、GeoChat benchmark、DOTA/DIOR 训练 language-to-box。

- **Stage 2: Mask prompt adaptation**  
  冻结或半冻结 SAM2，训练 pseudo-mask generator / prompt adapter；用 RefSegRS、RRSIS-D、RISORS、iSAID 监督 mask。

- **Stage 3: Hybrid consistency training**  
  使用 refGeo 或自构造三元标签，让同一 expression 的 HBB、OBB、mask 彼此一致；加入 GCS loss。

- **Stage 4: Hard-negative refinement**  
  构造密集机场、港口、停车场、住宅区 hard cases。表达中加入“left of / near / diagonal / smaller / second from”等空间短语。

## 失败模式与诊断

| 失败模式 | 现象 | 诊断方法 | 可能修复 |
|---|---|---|---|
| HBB 背景过多 | mask 分到邻近实例或背景 | HBB IoU 高但 mask mIoU 低 | HBB-to-OBB refinement，负点采样 |
| OBB 角度错 | 目标位置对但方向不对 | rotated IoU 低、angle error 高 | direction-aware loss，旋转增强 |
| 密集实例粘连 | 多架飞机/车辆被合成一个 mask | instance separation error | OBB 外负点、中心点+边界点 prompt |
| 语义错配 | 框/mask 是另一个相似对象 | CLIP/VLM crop score 低 | 二次语义 verifier，hard negative captions |
| 小目标漏检 | VLM 缩放后看不到目标 | small-object Acc 低 | dynamic tiling，高分辨率 re-query |
| mask 超出 OBB | 分割边界泄漏 | mask-derived OBB 与 predicted OBB 不一致 | GCS loss，边界约束 |

## 未来研究方向

1. **Geometry-consistent VLM grounding**  
   让 VLM 同时生成 HBB、OBB、mask token，并通过可微或后验一致性损失约束三者关系。

2. **OBB-aware SAM2 prompt generation**  
   研究如何把 OBB 转成 SAM2 更友好的 prompt：中心点、长轴端点、短轴边界点、外部负点、dense pseudo-mask。

3. **Dense small-object grounding benchmark**  
   专门构造机场、港口、停车场、工业区数据，测试同一句话在密集实例中能否指向唯一目标。

4. **Text-to-mask uncertainty decomposition**  
   把置信度拆成 semantic、localization、orientation、boundary 四部分，方便用户知道错在哪里。

5. **Unified HBB/OBB/mask evaluation toolkit**  
   做一个轻量评测工具：输入三类预测和 GT，输出传统指标、几何一致性、失败类型可视化。

6. **GIS-aware grounding refinement**  
   把道路、建筑 footprint、水系、机场跑道方向等矢量先验作为 OBB/mask refinement 的约束。

## 最小可执行实验

### 实验 A：HBB-to-OBB-to-mask refinement

- 数据：DIOR-RSVG + DOTA/DIOR OBB subset + iSAID mask subset。
- Baseline：GeoGround 或 Grounded SAM2 的 HBB -> SAM2 mask。
- 方法：在 HBB 后增加 OBB refinement，再把 OBB 转成 SAM2 prompt。
- 指标：HBB Acc@0.5、rotated IoU、mask mIoU、GCS、dense-instance merge rate。
- 关键消融：只 HBB、HBB+center point、HBB+OBB、HBB+OBB+negative points、dense prompt。

### 实验 B：同一 expression 的三输出一致性

- 数据：refGeo 或自构造三元标签。
- 方法：训练 unified head 同时输出 HBB、OBB、mask；加入 GCS loss。
- 对照：三任务独立训练。
- 假设：一致性约束会牺牲少量单指标上限，但提升密集小目标和跨数据集泛化。

### 实验 C：VLM 语义 verifier

- 数据：RefSegRS/RRSIS-D/RISORS。
- 方法：候选 mask crop 与 referring expression 做 RS-CLIP/VLM re-ranking。
- 目标：减少相似对象错配，尤其是“near / left of / second / diagonal”等描述。

## 阅读队列

1. [GeoGround arXiv](https://arxiv.org/abs/2411.11904) 与 [GeoGround GitHub](https://github.com/VisionXLab/GeoGround)
2. [GeoChat CVPR 2024 PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Kuckreja_GeoChat_Grounded_Large_Vision-Language_Model_for_Remote_Sensing_CVPR_2024_paper.pdf) 与 [GeoChat GitHub](https://github.com/mbzuai-oryx/GeoChat)
3. [RSUniVLM arXiv](https://arxiv.org/abs/2412.05679) 与 [project](https://rsunivlm.github.io/)
4. [SATGround arXiv](https://arxiv.org/abs/2512.08881)
5. [OmniEarth arXiv](https://arxiv.org/abs/2603.09471) 与 [OmniEarth HF dataset](https://huggingface.co/datasets/sjeeudd/OmniEarth)
6. [RS2-SAM2 arXiv](https://arxiv.org/abs/2503.07266)
7. [RRSIS arXiv](https://arxiv.org/abs/2306.08625) 与 [RRSIS GitLab](https://gitlab.lrz.de/ai4eo/reasoning/rrsis)
8. [Grounded SAM 2 GitHub](https://github.com/IDEA-Research/Grounded-SAM-2)
9. [SAM 2 GitHub](https://github.com/facebookresearch/sam2)

## 适合继续开的更细问题

1. 如何把 OBB 转成一组最优 SAM2 point/box/mask prompts？
2. 如何设计 geometry consistency loss，使 HBB、OBB、mask 三者互相校正？
3. 如何在密集飞机/车辆/船只场景中评估 referring expression 是否定位到唯一实例？
4. 如何用 RS-CLIP/VLM 对 mask crop 做 semantic re-ranking，降低相似目标错配？
5. 如何把地理先验，如跑道方向、道路拓扑、建筑 footprint，引入 OBB/mask refinement？

