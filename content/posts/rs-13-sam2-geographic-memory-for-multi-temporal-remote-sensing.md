---
title: "RS-13 SAM2 Geographic Memory for Multi-Temporal Remote Sensing"
date: 2026-06-07T09:12:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["SAM", "开放词表分割", "提示式分割"]
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# RS-13 SAM2 Geographic Memory for Multi-Temporal Remote Sensing

细问题：如何把 SAM2 的 video streaming memory 改造成遥感多时相 memory，用于农田边界、灾害水体或施工变化等光学遥感任务。

## 结论摘要

SAM2 的真正新能力不是“又一个更强 SAM”，而是它把交互式分割扩展到视频：给某一帧提示后，模型可以用 streaming memory 在后续帧传播对象 mask。这个机制天然吸引遥感多时相任务，但不能直接把 Sentinel-2/Landsat/航空影像时间序列当作视频来跑。自然视频中的相邻帧通常是秒级连续运动；遥感多时相是天、月、季、年级间隔，存在云影、季节物候、传感器差异、配准误差、GSD 差异和真实地物变化。

因此，值得研究的小问题是：把 SAM2 的“帧序 memory”改为“地理位置/对象/季节/传感器条件化 memory”。换句话说，memory 不应该只问“上一帧这个对象在哪里”，而应该问：

- 这个对象或地块在同一地理坐标下是否应该保持身份？
- 当前影像是否因云、阴影、季节、传感器或配准误差而不适合更新 memory？
- mask 变化是真变化，还是视觉外观变化？
- 对农田边界、水体、建筑施工这三类不同变化速度的对象，memory 更新策略是否应该不同？

## 代表论文与项目

| 论文/项目 | 年份/来源 | 链接 | 代码/资源 | 与本细问题的关系 |
|---|---:|---|---|---|
| SAM 2: Segment Anything in Images and Videos | 2024 arXiv / ICLR 2025 | [arXiv](https://arxiv.org/abs/2408.00714), [Meta page](https://ai.meta.com/research/sam2/) | [facebookresearch/sam2](https://github.com/facebookresearch/segment-anything-2) | 提供 streaming memory、promptable video segmentation 和 image/video unified architecture，是“多时相 memory”灵感来源。 |
| Grounded SAM 2 | 2024 GitHub project | [GitHub](https://github.com/IDEA-Research/Grounded-SAM-2) | 同链接 | 将 Grounding DINO/Florence-2/DINO-X 与 SAM2 结合，实现 text grounding + video tracking；可迁移为遥感“文本提示 + 时序 mask 传播”基线。 |
| RS2-SAM2: Customized SAM2 for Referring Remote Sensing Image Segmentation | 2025 arXiv / AAAI 2026 | [arXiv](https://arxiv.org/abs/2503.07266), [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/37828/41790) | 未核验到稳定官方 GitHub | 面向遥感 referring segmentation，提出 union encoder、层级融合、pseudo-mask dense prompt、text-guided boundary loss；可作为“语义提示生成器”接入多时相 SAM2。 |
| RSRefSeg 2 | 2025 arXiv | [arXiv](https://arxiv.org/abs/2507.06231) | [KyanChen/RSRefSeg2](https://github.com/KyanChen/RSRefSeg2) | 用 CLIP 做粗定位、SAM 做精分割，说明遥感文本/区域提示与 SAM 协作是可行路线。 |
| SAM2-CD: Remote Sensing Image Change Detection with SAM2 | 2025 IEEE JSTARS | [DOI summary](https://colab.ws/articles/10.1109%2Fjstars.2025.3610156) | 未核验到官方 GitHub | 直接把 SAM2 适配到变化检测，指出 vanilla SAM2 在 RS-CD 中受 single-image bias 和 contextual granularity mismatch 限制。 |
| Remote SAMsing | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.00256) | 论文称 open-source pipeline，需进一步核验仓库 | 关注 SAM2 在大幅面遥感中的 coverage-quality trade-off 与 tile fragmentation；对多时相大图 memory 的 tile 合并很关键。 |
| SAM2-ARAFNet | 2026 Scientific Reports | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13031478/) | 未核验到官方代码 | 将 SAM2-Hiera 与 adapter/ASPP/蒸馏结合做高分遥感语义分割；说明 SAM2 encoder 可作为遥感密集预测基座。 |
| Adaptive SAM2 for Planted Field Segmentation | 2026 IJDE | [Taylor & Francis](https://www.tandfonline.com/doi/full/10.1080/17538947.2026.2645885) | 未核验到官方代码 | 使用 SAM2 prompt 做种植地块分割，明确提到生长季多时相影像有助于区分作物纹理/光谱差异。 |
| SegTS: Subseries-driven Temporo-Spatial Learning with SAM | 2026 Computers and Electronics in Agriculture | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0168169926002218) | 未核验到官方代码 | 不是 SAM2，但它把 SAM-derived temporo-spatial knowledge 用于 SITS crop segmentation，并处理云过滤和子序列建模，是“遥感时间不是自然视频”的重要参照。 |
| SAMWS: SAM-based Weakly Supervised Crop Mapping using Sentinel-2 Time Series | 2024 IJAEOG | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1569843224004394) | [Nick0317Sun/SAMWS](https://github.com/Nick0317Sun/SAMWS) | 用 SAM 与弱监督构造 Sentinel-2 time series crop mapping 管线，适合作为低标注农业实验基线。 |
| fabSAM / FieldSeg / Field Boundary SAM 系列 | 2025-2026 arXiv/ScienceDirect | [fabSAM arXiv](https://arxiv.org/abs/2501.12487), [FieldSeg](https://www.sciencedirect.com/science/article/pii/S0168169925001929) | 需逐篇核验 | 农田边界是最适合“地理记忆”的对象：边界较稳定，但内部作物纹理随季节变化。 |
| OmniCD / TERRA-CD / Changen2 / AnyTime-CD | 2024-2026 arXiv/RSE | [OmniCD](https://arxiv.org/abs/2605.30168), [TERRA-CD](https://arxiv.org/abs/2605.14651), [Changen2](https://arxiv.org/abs/2406.17998), [AnyTime-CD](https://www.sciencedirect.com/science/article/pii/S003442572600009X) | 部分代码待核验 | 这些是传统或新型多时相/变化检测强基线，必须和 SAM2 memory 路线公平比较。 |

## 问题由来

### SAM2 的 memory 假设

SAM2 将图像看成单帧视频，并为视频分割引入 streaming memory。自然视频里的 memory 主要解决对象跨帧传播：对象身份大致连续，外观变化平滑，帧间位移可由视觉相似性和短期记忆处理。

遥感多时相不满足这些假设：

- 时间间隔不连续：Sentinel-2 五天重访也常因云导致有效观测间隔变成数周；Google Earth/航空影像可能跨年。
- 外观非平滑：农田在播种、抽穗、收割、裸土阶段可能完全不同；水体受季节、雨洪和阴影影响；建筑施工从裸地到楼体变化剧烈。
- 地理坐标强约束：对象不是随镜头运动，而是固定在地表坐标；配准误差比“运动”更重要。
- 真变化与伪变化混合：memory 如果强制保持对象，会压制真实变化；如果过快更新，又会把云影/季节误当成新状态。

### 为什么不直接做变化检测

传统变化检测擅长输出变化 mask，但通常不具备 promptable object-level interaction。SAM2 的价值在于：

- 可以由一个点/框/mask/文本生成初始对象；
- 可以跨时相传播同一对象或地块；
- 可以用人工少量交互修正 memory；
- 可以与 VLM/CLIP/GroundingDINO 结合，让“目标是什么”进入分割。

所以更合理的定位是：SAM2 geographic memory 不是替代所有变化检测，而是服务于需要对象身份、交互修正和边界高质量的时序制图任务。

## 方法比较

| 方法族 | 输入 | Memory/时序机制 | 优点 | 主要风险 |
|---|---|---|---|---|
| Vanilla SAM2 video predictor | 初始点/框/mask + 时间序列影像 | 按帧 streaming memory | 最小实现成本，能测出 SAM2 直接迁移能力 | 把季节/云/配准误差当运动；真实变化可能被旧 mask 锁死 |
| Reset-per-date SAM2 | 每期单独提示或自动提示 | 无跨期 memory | 不会把旧错传下去 | 无对象身份一致性，人工成本高 |
| Grounded SAM2 / RS2-SAM2 + SAM2 | 文本/框/伪 mask + 时间序列 | 文本生成初始或周期性 prompt，再由 memory 传播 | 语义更强，能指定“施工区/水体/农田边界” | 文本 grounding 在遥感中易受尺度和语言先验影响 |
| SAM2-CD 类变化检测 | 双时相或多时相影像 | SAM2 特征/提示适配到变化模块 | 更贴近 CD 任务 | 可能丢失交互式 object tracking 优势 |
| SegTS/SAMWS/FieldSeg 类农业管线 | Sentinel-2/SITS + SAM/SAM2 | 显式时间序列或子序列编码 | 适合物候与云过滤 | 依赖作物场景，泛化到灾害/施工需重设 |
| 传统 CD / 时序 foundation model | 双时相/长时序 | Siamese/Transformer/SSM/生成式变化先验 | 强监督基线成熟 | 缺少 promptable refinement 和交互式对象记忆 |

## 可投稿方法方案：GeoMemory-SAM2

### 核心假设

如果把 SAM2 的 video memory 改成由地理坐标、对象实例、季节阶段、传感器元数据和观测质量共同控制的 memory bank，那么它可以在多时相遥感中同时做到：

1. 保持稳定对象边界，如农田、道路、水系、建筑轮廓；
2. 允许真实变化发生，如洪水扩张、建筑施工、农田轮作；
3. 抑制云影、配准误差和季节外观造成的伪更新；
4. 减少人工 prompt 次数。

### 模块设计

1. Geo-keyed memory bank  
   将 memory item 的 key 从 video frame index 扩展为 `(object_id, geometry, timestamp, sensor, GSD, season, cloud_score, registration_quality)`。对象可以来自初始 SAM2 mask、RS2-SAM2 文本 prompt、地块 polygon 或变化检测候选。

2. Observation-quality gate  
   在更新 memory 前判断当前时相是否可信。门控信号包括云/阴影 mask、图像清晰度、配准残差、光谱异常、mask stability、与历史 mask 的形状差异。

3. Change-aware update rule  
   将更新分为三类：
   - preserve：边界稳定，仅更新外观 token；
   - adapt：允许缓慢形变，如作物边界微调、水体季节涨落；
   - reset/change：检测到真实结构变化时新建 memory branch，保留旧状态用于 change mask。

4. Seasonal memory slots  
   对农业任务，为同一地块维护 bare soil、growth、peak vegetation、harvest 等季节槽，避免把物候变化误认为对象身份丢失。

5. Prompt recovery loop  
   当 memory confidence 低时，触发自动提示恢复：从变化候选、边界不确定点、RS2-SAM2 dense pseudo-mask 或人工点击中生成新 prompt。

### 训练与推理

最小可行版本不需要训练 SAM2 backbone：

- 冻结 SAM2；
- 用规则或轻量 MLP 学习 memory update gate；
- 用少量标注学习 quality/change classifier；
- 对不同任务切换 memory policy。

增强版可以训练 adapter：

- 在 SAM2 image encoder 或 memory attention 中加入 LoRA/adapter；
- 将季节、传感器、GSD、时间差编码为 condition token；
- 对 mask decoder 加入 boundary consistency 和 temporal consistency loss。

## 实验矩阵

### 任务 A：农田边界/作物地块

目标：边界应长期稳定，但内部纹理和 NDVI 随季节变化。

候选数据：

- AI4Boundaries、AI4SmallFarms：用于 field boundary 和 smallholder agriculture。
- Sentinel-2 time series crop mapping 数据，可参考 SAMWS、SegTS、FieldSeg 的设置。
- 如果需要更大规模实例边界，可加入 FBIS-22M / Delineate Anything 相关数据。

Baselines：

- SAM2 reset-per-date；
- vanilla SAM2 video predictor，把时间序列当视频；
- SAMWS / SegTS / FieldSeg / fabSAM；
- U-Net/DeepLab/SegFormer + temporal aggregation；
- GeoMemory-SAM2。

指标：

- mIoU、F1、Boundary F1、Hausdorff distance；
- field-level completeness/correctness；
- temporal boundary jitter；
- prompt clicks per field；
- cloud/season robustness。

### 任务 B：灾害水体/洪水范围

目标：水体边界可快速变化，需要区分真实洪水扩张与云影、阴影、潮湿土壤。

候选数据：

- 光学 flood/water datasets；如使用混合 SAR 数据，需单独标注 modality risk。
- xBD 可用于灾害前后建筑/灾损，但不是纯水体数据。
- Landsat/Sentinel-2 water extent time series 可自建弱标签。

Baselines：

- NDWI/Otsu 或传统水体指数；
- ChangeFormer/BIT/AnyTime-CD；
- SAM2 first-frame water prompt；
- GeoMemory-SAM2 with change-aware reset。

指标：

- flood IoU/F1；
- false flood under cloud/shadow；
- missed expansion；
- memory over-preservation rate：真实扩张被旧 memory 压制的比例；
- human correction clicks。

### 任务 C：建筑施工/城市变化

目标：施工区从裸地到建筑物，属于结构性真实变化；不能强制保持旧 mask。

候选数据：

- LEVIR-CD、WHU-CD、S2Looking、SYSU-CD、SECOND；
- xBD 用于灾害建筑损毁；
- SpaceNet 7/8 或城市多时相 building footprint 数据。

Baselines：

- ChangeFormer/BIT/ChangeMamba/RS-Mamba；
- SAM2-CD；
- Grounded SAM2 with text prompt "new building/construction site";
- RS2-SAM2 dense prompt + SAM2 propagation；
- GeoMemory-SAM2 with branch/reset policy。

指标：

- binary change F1/IoU；
- semantic change mIoU；
- boundary F1；
- object-level construction event detection；
- temporal event delay：变化发生后几期被检测到。

## Ablation 设计

| Ablation | 目的 | 预期观察 |
|---|---|---|
| No memory | 测单期 SAM2 能力 | 边界可能好，但时序一致性差 |
| Vanilla video memory | 测直接迁移 | 在短间隔/少云时有效，跨季节和真变化时失败 |
| + geo key | 测地理坐标和对象 ID | 降低跨 tile/跨期身份漂移 |
| + cloud/registration gate | 测观测质量门控 | 减少云影和配准误差造成的错误更新 |
| + seasonal slots | 测农业物候 | 农田时序稳定性提高 |
| + change-aware branch | 测真实变化 | 降低旧 memory 锁死新变化 |
| + RS2-SAM2 dense prompt | 测文本/语义提示 | 对施工、水体、特定作物类别更好 |
| + human recovery clicks | 测交互效率 | 少量点击可恢复长时序错误 |

## 失败模式清单

- Memory lock-in：早期 mask 错误会被连续传播。
- Change suppression：真实建筑/水体变化被旧 mask 约束掉。
- Seasonal drift：农田外观变化导致对象身份丢失。
- Cloud overwrite：云影或薄云 mask 被写入 memory。
- Registration ghosting：配准偏移使边界周期性抖动。
- Sensor conflict：不同传感器/GSD 导致边界和纹理尺度不一致。
- Tile boundary fragmentation：大图切片后对象跨 tile 不一致，Remote SAMsing 的 tile merge 思路可借鉴。

## 最小复现实验路线

1. 先选一个最稳任务：农田边界。
2. 用 SAM2 官方仓库跑 reset-per-date 与 video predictor 两个 baseline。
3. 将时间序列排序为 pseudo-video，记录每期 mask confidence、IoU、Boundary F1、jitter。
4. 加入 cloud/registration gate：低质量时相不更新 memory。
5. 加入 simple change-aware rule：mask 面积/边界/光谱指数变化超过阈值时分支或重提示。
6. 与 SAMWS/SegTS/fabSAM/FieldSeg 或普通 temporal segmentation 模型比较。
7. 再迁移到水体或建筑变化，验证策略是否只是农业特化。

## 未来研究方向

1. Geographic memory transformer  
   将 SAM2 memory token 与时空元数据 token 融合，显式学习“对象在地表坐标中保持身份”的规则。

2. Prompt-efficient temporal annotation  
   研究每个对象只在第一期点一次，后续自动传播和少量纠错，计算 annotation cost curve。

3. Change-aware memory branching  
   不把变化视为 tracking failure，而是在 memory 中保留 before/after 两个状态，直接输出 change mask。

4. Foundation-model ensemble  
   用 RS2-SAM2 或 Grounded SAM2 负责语义提示，用 SAM2 负责边界和传播，用 OmniCD/AnyTime-CD 负责变化候选。

5. Robustness benchmark  
   构造专门测试 SAM2 多时相 memory 的 benchmark：云、配准误差、季节变化、传感器切换、真实变化分别独立控制。

## 推荐阅读队列

1. [SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714)
2. [facebookresearch/sam2](https://github.com/facebookresearch/segment-anything-2)
3. [Grounded SAM 2](https://github.com/IDEA-Research/Grounded-SAM-2)
4. [RS2-SAM2](https://arxiv.org/abs/2503.07266)
5. [RSRefSeg 2](https://arxiv.org/abs/2507.06231)
6. [SAM2-CD](https://colab.ws/articles/10.1109%2Fjstars.2025.3610156)
7. [SegTS](https://www.sciencedirect.com/science/article/abs/pii/S0168169926002218)
8. [SAMWS](https://www.sciencedirect.com/science/article/pii/S1569843224004394)
9. [OmniCD](https://arxiv.org/abs/2605.30168)
10. [AnyTime-CD](https://www.sciencedirect.com/science/article/pii/S003442572600009X)
