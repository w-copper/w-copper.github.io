---
title: "RS-15 Taxonomy-Aware Mask Selection"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["SAM", "开放词表分割", "提示式分割"]
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# RS-15 Taxonomy-Aware Mask Selection

## 1. 问题由来

开放词表遥感分割通常把问题拆成两步：先用 SAM/SAM3 或分割骨干产生候选 mask，再用 CLIP/RemoteCLIP/RS-CLIP/VLM 对 mask 和类别文本打分。这个范式解决了“类别不固定”的问题，但在遥感里很快遇到层级标签冲突：

- `building` 是父类，`residential building`、`industrial building`、`damaged building` 是子类或属性组合。预测父类未必是错，但用 flat mIoU 会被当成全错。
- `road`、`highway`、`runway` 在俯视图中都可能是细长硬质铺装面；CLIP 文本 embedding 很容易被纹理和形状牵着走。
- `crop`、`field`、`rice`、`farmland` 混合了土地覆盖、土地利用、作物类型和地块对象，跨数据集 label 定义不一致。
- 同一个 mask 可能同时属于多个层级：一片 `impervious surface` 里面包含 road、parking lot、building roof；一个 `water` mask 可能是 river、lake、pond 或 flood water。

因此，RS-15 的研究对象不是泛泛的“遥感语义分割”，而是一个更窄的问题：**当候选 mask 和开放词表类别已经给出时，如何利用层级 taxonomy、语义相似度、地理/几何先验和父子一致性来选择最终 mask label，并用更合理的指标评价预测？**

## 2. 代表论文与项目

| 论文/项目 | 年份/venue | 链接 | 代码/项目 | 与 RS-15 的关系 |
|---|---:|---|---|---|
| SegEarth-OV: Towards Training-Free Open-Vocabulary Segmentation for Remote Sensing Images | 2024 arXiv / 2025 CVPR | [arXiv](https://arxiv.org/abs/2410.01768), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Li_SegEarth-OV_Towards_Training-Free_Open-Vocabulary_Segmentation_for_Remote_Sensing_Images_CVPR_2025_paper.pdf), [project](https://earth-insights.github.io/SegEarth-OV) | 项目页称代码释放 | 训练自由遥感 OVSS 基线；证明 CLIP patch token 与低分辨率边界在 RS 中不稳，可作为 taxonomy-aware mask selection 的底座。 |
| ReSeg-CLIP: Open-Vocabulary Semantic Segmentation in Remote Sensing via Hierarchical Attention Masking and Model Composition | 2026 arXiv | [arXiv](https://arxiv.org/abs/2602.23869) | 未检索到稳定官方代码 | 用 SAM mask 做 hierarchical attention masking；“hierarchical”主要是 mask/attention 多尺度，不是语义 taxonomy，但方法结构很适合接入 taxonomy 约束。 |
| ConInfer: Context-Aware Inference for Training-Free Open-Vocabulary Remote Sensing Segmentation | 2026 arXiv / CVPR 2026 Findings | [arXiv](https://arxiv.org/abs/2603.29271), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2026F/papers/Chen_ConInfer_Context-Aware_Inference_for_Training-Free_Open-Vocabulary_Remote_Sensing_Segmentation_CVPRF_2026_paper.pdf) | [GitHub](https://github.com/Dog-Yang/ConInfer) | 从独立 patch 推理转向上下文联合推理；可扩展为“区域间 label 层级一致性/互斥性”推理。 |
| HG-RSOVSSeg: Hierarchical Guidance Open-Vocabulary Semantic Segmentation Framework of High-Resolution Remote Sensing Images | 2026 Remote Sensing | [MDPI](https://www.mdpi.com/2072-4292/18/2/213) | 文中给出 [GitHub](https://github.com/HuangWBill/HG-RSOVSSeg) | 直接以 hierarchical guidance 命名；重点是文本引导高分辨率 decoder，可作为层级文本特征构造参考。 |
| Reducing Semantic Ambiguity in Open-Vocabulary Remote Sensing Image Segmentation via Knowledge Graph-Enhanced Class Representations | 2025 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271625004666) | 未见稳定官方代码 | 最贴近 RS-15：用 knowledge graph 缓解开放词表 RS segmentation 的语义歧义。适合作为 taxonomy-aware text embedding 的直接对照。 |
| DGSeg: Dual Guidance with Textual Priors and Structural Awareness for Open-Vocabulary Remote Sensing Segmentation | 2026 Computers & Geosciences | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0098300426000798) | [GitHub](https://github.com/Funny0101/DGSeg) | 同时处理文本语义和结构边界，适合比较“文本先验 + 几何结构”与 taxonomy-aware mask selection 的互补性。 |
| Towards Open-Vocabulary Semantic Segmentation for Remote Sensing Images / ROSS | 2026 Pattern Recognition | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S003132032600083X) | 未见稳定官方代码 | 强调旋转、领域知识、多尺度融合，说明遥感 OVSS 的语义混淆和空间边界需要同时处理。 |
| Effective SAM Combination for Open-Vocabulary Semantic Segmentation / ESC-Net | 2024 arXiv / 2025 CVPR | [arXiv](https://arxiv.org/abs/2411.14723), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Lee_Effective_SAM_Combination_for_Open-Vocabulary_Semantic_Segmentation_CVPR_2025_paper.pdf) | 未见稳定官方代码 | CV 侧 SAM+CLIP 组合路线，可迁移到 RS：用图文相关生成 pseudo prompt，减少两阶段高成本。 |
| Open-World Semantic Segmentation Including Class Similarity | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Sodano_Open-World_Semantic_Segmentation_Including_Class_Similarity_CVPR_2024_paper.html) | 论文页有补充材料 | 不是遥感，但提出“未知类与已知类相似度”思想；可转成 hierarchy-aware / semantic-distance metric。 |
| Flattening the Parent Bias: Hierarchical Semantic Segmentation in the Poincare Ball | 2024 CVPR | [CVPR poster](https://cvpr.thecvf.com/virtual/2024/poster/31551) | 论文页 PDF | 提醒不要迷信层级结构：如果父类 bias 处理不好，层级监督可能反而伤害跨域泛化。 |
| Fusion of Hierarchical Class Graphs for Remote Sensing Semantic Segmentation | 2024 Information Fusion | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1566253524001878) | 未见稳定官方代码 | 遥感固定类分割里的 class hierarchy graph，可迁移为开放词表 mask selection 的 taxonomy graph。 |
| SHiNe: Semantic Hierarchy Nexus for Open-Vocabulary Object Detection | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Liu_SHiNe_Semantic_Hierarchy_Nexus_for_Open-vocabulary_Object_Detection_CVPR_2024_paper.pdf) | 需进一步查证 | 检测方向的层级语义建模，可借鉴文本类别图和父子节点融合方式。 |

## 3. 方法比较：当前路线缺什么

| 路线 | 典型方法 | 优点 | 对 RS-15 的缺口 |
|---|---|---|---|
| CLIP patch scoring | SegEarth-OV, DGSeg, ROSS | 训练自由或少训练，开放词表灵活 | 类别词平面化，`road/highway/runway` 这种近义/层级冲突难解 |
| SAM mask proposal + CLIP classification | ReSeg-CLIP, ESC-Net, OVSAM 类方法 | mask 边界好，能避免纯 patch 噪声 | 一个 mask 可能对应父类和子类，缺少父子一致性约束 |
| 上下文联合推理 | ConInfer | 缓解大图 patch 独立预测导致的类别漂移 | 上下文通常是空间/语义相关，未显式建模 taxonomy graph |
| 知识图谱/层级文本增强 | KG-OVRSeg, HG-RSOVSSeg, SHiNe | 能显式利用类别关系和同义词 | 需要解决遥感 taxonomy 不统一、图谱噪声和跨数据集 label 映射 |
| 层级语义分割指标 | Flattening Parent Bias, Open-world class similarity | 能缓解父子类误判被 flat mIoU 惩罚过重 | 需要为遥感 land-cover/object/use 混合标签定义语义距离 |

关键空白：**目前遥感 OVSS 多数方法把类别列表当成 flat vocabulary；即便方法名里有 hierarchical，也常指 feature/mask hierarchy，而不是语义 taxonomy。** RS-15 可以把贡献落在“后处理/推理层”的 taxonomy-aware mask selection 上，避免重新训练大模型，研究成本相对可控。

## 4. Proposed Method: Taxonomy-Aware Mask Selection

### 4.1 输入与输出

输入：

- 图像或大图 tile。
- 候选 mask 集合 `M = {m_i}`，来自 SAM/SAM2/SAM3、SegEarth-OV、ReSeg-CLIP 或其他 OVSS。
- 类别词表 `C`，包含父类、子类、属性类和同义词，例如 `impervious surface > road > highway/runway`。
- taxonomy graph `G = (C, E)`，边包括 `is-a`、`part-of`、`mutually-exclusive`、`co-occurs`、`alias-of`。

输出：

- 每个 mask 的最终标签或多标签：`label(m_i)`。
- 父子一致的 pixel map。
- 每个预测的 taxonomy confidence 和 conflict score。

### 4.2 核心打分

基础语义分数：

```text
s_clip(m, c) = cosine( image_embed(mask_crop_or_mask_pool(m)), text_embed(prompt(c)) )
```

层级平滑分数：

```text
s_tax(m, c) =
  s_clip(m, c)
  + alpha * mean_{a in ancestors(c)} s_clip(m, a)
  - beta  * max_{e in exclusive(c)} s_clip(m, e)
  + gamma * geo_prior(m, c)
  + delta * context_prior(m, c)
```

其中：

- `ancestors(c)`：父类或上位类，如 `residential building -> building -> impervious surface`。
- `exclusive(c)`：互斥类，如 `runway` 与 `cropland`，`river` 与 `building`。
- `geo_prior`：几何和尺度先验，例如 road/runway 细长，building 面积/矩形度，crop field 大块规则纹理。
- `context_prior`：邻接/共现先验，例如 runway 周围常有 airport apron，residential building 常和 road/vegetation 混合。

mask 选择：

```text
label(m) = argmax_c s_tax(m, c)
```

冲突修正：

- 若子类得分高但父类得分极低，降级到父类或标记为 uncertain。
- 若多个兄弟类接近，输出父类，例如 `highway` 与 `runway` 难分时输出 `impervious linear surface` 或 `road-like paved surface`。
- 若一个大 mask 同时高分于父类和多个子类，尝试拆分 mask 或允许父类多标签。

### 4.3 为什么它可能有效

遥感中的很多错误不是边界错误，而是**语义粒度错误**。例如模型把 runway 预测成 road，从 land-cover 角度是“铺装线状物”相近；从 airport inventory 角度却是严重错误。Taxonomy-aware selection 能让模型在不同任务粒度下自适应：

- 粗粒度 land cover：允许 `runway -> impervious surface` 获得部分信用。
- 细粒度 object mapping：要求 `runway` 与 `road` 分开，并报告兄弟类混淆。
- 灾害场景：`building -> damaged building` 是属性细化，不应和 `vegetation` 类错误同等惩罚。

## 5. 评价指标设计

### 5.1 Flat 指标仍保留

- mIoU, mAcc, F1, OA。
- open-vocabulary hIoU / seen-unseen harmonic mean。
- 每类 IoU，特别关注 road/runway/building/crop/water。

### 5.2 Hierarchy-Aware IoU

令 `d(p, y)` 是预测类 `p` 与真值类 `y` 在 taxonomy graph 上的最短语义距离，`sim(p,y)=exp(-lambda*d(p,y))`。像素级信用：

```text
credit(p, y) =
  1.0                      if p == y
  rho_parent               if p is ancestor(y) or y is ancestor(p)
  sim(p, y)                if p and y share ancestor
  0.0                      otherwise
```

Hierarchy-aware intersection：

```text
hIntersection_c = sum_pixels 1[y in subtree(c)] * credit(p, y)
hIoU_c = hIntersection_c / union_c
```

建议同时报告：

- `Leaf-mIoU`：严格子类精度。
- `Parent-mIoU`：把标签映射到父类后的 mIoU。
- `Semantic-distance error`：平均 taxonomy distance。
- `Ancestor-consistency rate`：预测子类时父类是否也合理。
- `Sibling-confusion rate`：兄弟类混淆比例，例如 road/runway/highway。
- `Granularity downgrade rate`：模型被迫降级到父类的比例。

### 5.3 Mask Selection 诊断指标

- `Mask-label conflict score`：同一 mask 对互斥类同时高分的程度。
- `Boundary-correct but semantic-wrong rate`：mask IoU 高但 taxonomy distance 大。
- `Semantic-correct but boundary-wrong rate`：类别层级对但 mask 边界差。
- `Prompt synonym variance`：`road/highway/street` 等同义 prompt 导致的分数方差。

## 6. 实验矩阵

| 组件 | 选择 |
|---|---|
| 候选 mask | SAM ViT-H, SAM2, SegEarth-OV masks, ReSeg-CLIP masks |
| 语义打分 | CLIP, RemoteCLIP, GeoRSCLIP/RS5M, SigLIP/通用 VLM 可选 |
| taxonomy 来源 | 手工遥感层级、WordNet/ConceptNet、OSM tag hierarchy、KG-OVRSeg-style knowledge graph |
| 数据集 | OpenEarthMap, LoveDA, iSAID, Potsdam, Vaihingen, UAVid, DeepGlobe Road, Massachusetts Roads |
| 类别冲突组 | building family, road/runway/highway, crop/field/rice, water/river/lake/flood, impervious surface subtypes |
| baselines | flat CLIP scoring, SegEarth-OV, ReSeg-CLIP, ConInfer, HG-RSOVSSeg/KG-OVRSeg if code available |
| 指标 | flat mIoU, parent mIoU, hierarchy-aware IoU, semantic-distance error, conflict rate |

### 最小可复现实验

1. 选 2 个数据集：Potsdam/Vaihingen 用 urban hierarchy，LoveDA/OpenEarthMap 用 land-cover hierarchy。
2. 用 SAM 或 SegEarth-OV 产生候选 mask。
3. 用 RemoteCLIP/GeoRSCLIP 对每个 mask 与类别 prompt 打分。
4. 构造 3 层 taxonomy：
   - level 0: background / natural / built-up / agriculture / water。
   - level 1: building / road-like / vegetation / crop / waterbody。
   - level 2: residential building / industrial building / road / highway / runway / field / rice / river / lake。
5. 比较 flat argmax 与 taxonomy-aware selection。
6. 报告 leaf mIoU、parent mIoU、hIoU、semantic-distance error 和冲突组 case study。

## 7. 未来研究方向

1. **Taxonomy-aware prompt ensemble**：不是简单用 `a satellite image of {class}`，而是为每个节点生成父类、同义词、属性、地理上下文 prompt，并学习节点权重。
2. **Mask graph + taxonomy graph 双图推理**：mask 之间有空间邻接/包含关系，类别之间有父子/互斥/共现关系，二者联合做 belief propagation 或 GNN 推理。
3. **可降级开放词表分割**：当细类不确定时输出父类，并把不确定性显式报告；适合制图产品。
4. **Hierarchy-aware benchmark adapter**：把 LoveDA、OpenEarthMap、iSAID、Potsdam 的 label 映射到一个统一层级，专门评测跨数据集 OVSS。
5. **遥感知识图谱增强文本 embedding**：吸收 OSM tag、CORINE/ESA WorldCover/NLCD 分类体系，减少 `field/crop/farmland` 这类语义漂移。
6. **从评价指标反推训练目标**：把 hierarchy-aware IoU 或 semantic-distance loss 用作 adapter 训练目标，微调小型 mask scorer。

## 8. 论文方案草案

题目暂定：**Taxonomy-Aware Mask Selection for Open-Vocabulary Remote Sensing Segmentation**

核心假设：在开放词表遥感分割中，许多错误来自标签粒度与语义层级不一致，而不是视觉边界失败。将 CLIP/SAM mask scoring 与遥感 taxonomy graph 结合，可以减少兄弟类混淆、降低不存在细类误报，并提供更符合制图需求的评价。

方法模块：

1. SAM/SegEarth/ReSeg 生成候选 mask。
2. RemoteCLIP/GeoRSCLIP 产生 mask-text score。
3. Taxonomy graph 构造父子、同义、互斥、共现关系。
4. Taxonomy-aware score 重排 mask label。
5. Hierarchy-aware metrics 评价。

预期贡献：

- 一个轻量、训练自由或少训练的 taxonomy-aware mask selector。
- 一个遥感 OVSS 类别层级和跨数据集 label mapping。
- 一组新的 hierarchy-aware 评价指标。
- 对 `road/runway/highway`、`building/damaged building`、`crop/field/rice` 等冲突组的系统误差分析。

风险：

- 手工 taxonomy 可能带主观性；需要报告不同 taxonomy 版本的敏感性。
- 公开数据集未必有足够细类；可先做 coarse/fine remapping 和 synthetic fine-label evaluation。
- CLIP/RemoteCLIP 对小 mask embedding 噪声大；需要 mask crop、masked pooling、上下文 crop 三种输入做 ablation。

## 9. 下一步执行清单

1. 拉取并跑通 SegEarth-OV 或使用其输出作为 baseline。
2. 构造 `taxonomy.yaml`，先覆盖 20-30 个常见遥感类。
3. 实现 `mask_text_score.py`：对 mask crop、masked image、context crop 分别打分。
4. 实现 `taxonomy_selector.py`：父子平滑、互斥惩罚、几何先验。
5. 实现 `hierarchy_metrics.py`：parent mIoU、hIoU、semantic distance、conflict rate。
6. 在 Potsdam/Vaihingen/LoveDA/OpenEarthMap 上做最小实验。

## 参考链接

- [SegEarth-OV arXiv](https://arxiv.org/abs/2410.01768), [project](https://earth-insights.github.io/SegEarth-OV), [CVPR 2025 PDF](https://openaccess.thecvf.com/content/CVPR2025/papers/Li_SegEarth-OV_Towards_Training-Free_Open-Vocabulary_Segmentation_for_Remote_Sensing_Images_CVPR_2025_paper.pdf)
- [ReSeg-CLIP arXiv](https://arxiv.org/abs/2602.23869)
- [ConInfer arXiv](https://arxiv.org/abs/2603.29271), [GitHub](https://github.com/Dog-Yang/ConInfer)
- [HG-RSOVSSeg](https://www.mdpi.com/2072-4292/18/2/213), [GitHub](https://github.com/HuangWBill/HG-RSOVSSeg)
- [KG-OVRSeg / semantic ambiguity via knowledge graph](https://www.sciencedirect.com/science/article/pii/S0924271625004666)
- [DGSeg](https://www.sciencedirect.com/science/article/pii/S0098300426000798), [GitHub](https://github.com/Funny0101/DGSeg)
- [ROSS / Towards OVSS for RS](https://www.sciencedirect.com/science/article/pii/S003132032600083X)
- [Effective SAM Combination / ESC-Net](https://arxiv.org/abs/2411.14723)
- [Open-World Semantic Segmentation Including Class Similarity, CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/html/Sodano_Open-World_Semantic_Segmentation_Including_Class_Similarity_CVPR_2024_paper.html)
- [Flattening the Parent Bias, CVPR 2024 poster](https://cvpr.thecvf.com/virtual/2024/poster/31551)
- [Fusion of Hierarchical Class Graphs for Remote Sensing Semantic Segmentation](https://www.sciencedirect.com/science/article/pii/S1566253524001878)
- [SHiNe, CVPR 2024 PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Liu_SHiNe_Semantic_Hierarchy_Nexus_for_Open-vocabulary_Object_Detection_CVPR_2024_paper.pdf)
