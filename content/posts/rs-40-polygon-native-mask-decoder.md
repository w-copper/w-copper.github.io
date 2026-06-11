---
title: "RS-40 Polygon-Native Mask Decoder"
date: 2026-06-07T09:39:00+08:00
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["GIS融合", "矢量先验", "地图生产"]
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# RS-40 Polygon-Native Mask Decoder

## 执行摘要

2024-2026 的矢量化遥感提取正在从“mask -> polygonize -> simplify/regularize”的工程管线，转向“模型原生输出 vertex / edge / ring graph / polygon token”。这个转变的原因很直接：GIS、城市建模、道路导航、地块管理最终需要的是可编辑、拓扑有效、顶点简洁的矢量对象，而 raster mask 的高 IoU 并不保证角点直、边界稳、道路连通、地块不自交。

最值得推进的小课题不是泛泛地“建筑物提取”，而是：**用 SAM/GeoFM 的强视觉特征作为 encoder，同时设计 polygon-native decoder，直接输出多实例、多环、多类别的 GIS-ready 矢量对象，并用边界质量、顶点效率和拓扑有效性作为主指标。**

## 问题由来

传统遥感分割把建筑、道路、农田边界当作像素分类问题，输出 raster mask。这个输出在 mIoU 上可能很好，但在 GIS 里常见四类问题：

1. 建筑边界呈锯齿或圆角，直角、长直边、规则边界被破坏。
2. mask polygonize 后顶点数量过多，需要 Douglas-Peucker、正交化、拓扑修复等经验后处理。
3. 后处理不可微，训练时不能直接优化“顶点少、角点准、拓扑合法”。
4. 道路和地块更关心连通性、闭合性、相邻关系，像素级 IoU 不足以评价产品质量。

2024-2026 的新方法大致分三条路线：

- **SAM/基础模型增强的间接矢量化**：先借助 SAM 或强 segmentation encoder 得到 mask、vertex、boundary，再连接成 polygon，例如 SAMPolyBuild。
- **显式 polygon / graph 序列预测**：把角点坐标、边连接、ring graph 当作 token 或图结构直接预测，例如 Pix2Poly、GeoFormer、P2PFormer、VectorLLM。
- **面向道路/地块的拓扑矢量输出**：道路输出图或道路 outline polygon，农田输出可扩展 field boundary polygon，例如 SAM-Road、LDPoly、FTW/PRUE。

## 代表工作

| 工作 | 年份/来源 | 对象 | 输出形式 | 代码/资源 | 关键贡献 |
|---|---:|---|---|---|---|
| SAMPolyBuild | 2024 ISPRS JPRS | 建筑 | mask + vertex/boundary/offset -> polygon | [paper](https://www.sciencedirect.com/science/article/pii/S0924271624003563), [GitHub](https://github.com/wchh-2000/SAMPolyBuild) | 适配 SAM 做 polygonal building extraction；额外预测 Gaussian vertex、offset、boundary map，并支持自动 bbox 和交互 prompt。 |
| P2PFormer | 2024 arXiv | 建筑 | geometric primitives + sequence | [arXiv](https://arxiv.org/abs/2406.02930) | 先分割 vertex/line/corner 等几何 primitive，再预测连接顺序，构造规则建筑轮廓。 |
| GeoFormer | 2024 BMVC | 多 polygon | auto-regressive multi-polygon | [arXiv](https://arxiv.org/abs/2411.16616), [GitHub](https://github.com/pihalf/GeoFormer) | 将自回归 transformer 用于遥感多 polygon 预测，是直接多边形生成路线的代表。 |
| Pix2Poly | 2025 WACV | 建筑，也扩展到道路 | ring graph vertex tokens + matching | [CVF PDF](https://openaccess.thecvf.com/content/WACV2025/papers/Adimoolam_Pix2Poly_A_Sequence_Prediction_Method_for_End-to-End_Polygonal_Building_Footprint_WACV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2412.07899), [GitHub](https://github.com/yeshwanth95/Pix2Poly) | 端到端 differentiable transformer，直接生成高质量 building footprint ring graph，用 optimal matching 学顶点连接。 |
| SAM-Road | 2024 CVPRW | 道路网络 | graph vertices + edges | [arXiv](https://arxiv.org/abs/2403.16051), [GitHub](https://github.com/htcr/sam_road) | 将 SAM 适配到大范围道路图提取；SAM embedding 预测道路/交叉口 mask，再用轻量 graph transformer 估计边。 |
| LDPoly | 2025 arXiv | 道路 outline | road mask + vertex heatmap -> polygon | [arXiv](https://arxiv.org/abs/2504.20645) | 面向 polygonal road outline extraction，提出 dual-latent diffusion，同时生成 road masks 和 vertex heatmaps，并设计 polygon simplicity / boundary smoothness 指标。 |
| VectorLLM | 2025 arXiv | 建筑轮廓，可泛化到其他目标 | corner-by-corner regression | [arXiv](https://arxiv.org/abs/2507.04664) | 用 MLLM 模拟人工标注员逐角点绘制建筑轮廓；报告在 WHU、WHU-Mix、CrowdAI 上超过前 SOTA，并有零样本对象潜力。 |
| FTW / PRUE | 2025-2026 benchmark + CVPR 2026 | 农田地块边界 | segmentation -> polygons at scale | [Fields of The World](https://fieldsofthe.world/), [PRUE arXiv](https://arxiv.org/abs/2603.27101), [GitHub](https://github.com/fieldsoftheworld/ftw-prue) | 提供全球 field boundary 生态，FTW 覆盖 2024/2025 的十亿级 polygons；PRUE 强调 scalable field boundary segmentation 和可部署管线。 |

## 方法谱系

### 1. Mask 后处理管线

典型流程是 `segmentation mask -> connected components -> contour extraction -> simplify -> regularize -> topology repair`。优点是工程成熟、容易接入 U-Net、DeepLab、SAM、GeoFM feature；缺点是不可微，后处理参数对区域、GSD 和建筑风格敏感。

适合当 baseline：SAM/UNet + marching squares + Douglas-Peucker + orthogonal regularization + Shapely validity repair。

### 2. SAM 增强的 polygon extraction

SAMPolyBuild 代表“基础模型强特征 + 额外几何头”的路线。它不是纯 polygon-native decoder，但很适合作为过渡：SAM 负责泛化性和 promptability，额外 vertex/boundary/offset 头弥补 SAM mask 不支持规则矢量轮廓的问题。论文页明确指出，SAM 本身不直接支持 regular vector contour extraction，因此需要 vertex prediction 辅助 polygon extraction。

研究机会：把 SAMPolyBuild 的 pixel-based vertex map 改成 set/sequence vertex decoder，减少 NMS 和连接规则；或把 box/point prompt 转成 polygon prompt，让模型输出 exterior ring 和 holes。

### 3. 显式 vertex/edge/ring graph decoder

Pix2Poly 是最贴近“polygon-native”的代表：用 transformer 预测 vertex coordinate token，再用 optimal matching network 学每个角点之间的连接关系，直接输出 ring graph。它的意义在于：训练目标不再绕回 raster mask，而是把角点和边作为一等公民。

GeoFormer 则把多 polygon 预测做成自回归问题，更接近“一个 image encoder + 一个 polygon language decoder”。VectorLLM 更进一步，尝试让 MLLM 按人工标注过程逐角点回归，这条线很适合和遥感 VLM、指令微调、坐标 token 结合。

主要瓶颈：坐标量化误差、长序列稳定性、实例顺序歧义、多建筑拥挤时的 ring assignment、holes 和 multi-part geometry 表示。

### 4. 道路/地块的 topology-first decoder

道路和农田地块不能简单照搬建筑 polygon：道路有分叉、交叉、连通性；地块有相邻边界、长边、弱纹理和季节变化。SAM-Road 把道路图拆成 vertex/edge 图学习；LDPoly 关注 road outline polygon，并引入 polygon simplicity 与 boundary smoothness；FTW/PRUE 则强调大规模 field boundary 的可部署可靠性。

研究机会：用统一 decoder 输出不同 vector primitive：building exterior ring、road centerline graph、road outline polygon、field parcel polygon，并用任务类型 token 控制几何约束。

## 当前问题

1. **指标错位**：mIoU 高不等于 polygon 好。实际 GIS 更关心 corner precision、边界直线度、顶点数量、拓扑合法性、是否自交、是否有 sliver polygons。
2. **后处理不可复现**：不同 polygonize/simplify/regularize 参数可能让结果差很多，论文间很难公平比较。
3. **实例顺序和顶点顺序难监督**：同一个 polygon 可以从任意顶点开始，顺时针/逆时针等价，多实例排列也等价。
4. **复杂 geometry 表示不足**：holes、multi-polygons、相邻地块共享边、道路分叉/环岛很难用简单 vertex sequence 表达。
5. **跨区域泛化弱**：建筑形态、屋顶材质、道路宽度、农田纹理随地区变化大，polygon decoder 容易学到局部几何偏置。
6. **基础模型和矢量 decoder 尚未深度融合**：SAM/GeoFM 特征强，但大多仍输出 mask；polygon decoder 强调结构，但常缺少 foundation model 的泛化。

## 推荐研究题：GeoPolySAM Decoder

### 假设

在遥感建筑/道路/地块提取中，使用 SAM/GeoFM encoder 提供强视觉特征，再用 polygon-native decoder 直接预测 vertex、edge 和 ring topology，可在相近 mask IoU 下显著提升 GIS-ready 质量：更少顶点、更高角点精度、更低自交率、更好道路/地块拓扑。

### 方法草图

1. **Encoder**：使用 SAM image encoder、Prithvi/Clay/SkySense feature 或 ConvNeXt/Swin baseline。输入支持 RGB/VHR，也预留多光谱 adapter。
2. **Prompt / proposal branch**：支持三种输入：无 prompt 自动提取、box/point prompt、已有 OSM/field boundary 弱先验。
3. **Polygon query decoder**：每个实例一个 query，输出 objectness、class、exterior ring token、optional holes token。
4. **Vertex-edge joint head**：顶点坐标用连续 regression 或高分辨率 coordinate token；边连接用 matching / pointer network；道路任务额外输出 graph edge probability。
5. **Differentiable raster consistency**：训练时把 polygon rasterize 为 soft mask，与 GT mask 做 Dice/Boundary loss，兼顾 mask coverage。
6. **Geometry validity loss**：加入 self-intersection penalty、angle regularity、edge straightness、vertex sparsity、shared-boundary consistency。
7. **Task-conditioned constraints**：建筑偏正交/闭合，路网偏连通，地块偏共享边界与少 sliver。

### 与现有工作的差别

- 相比 SAMPolyBuild：减少 pixel vertex heatmap + heuristic connection，改成显式 polygon token / graph matching。
- 相比 Pix2Poly：引入 SAM/GeoFM encoder 和 promptability，并扩展到建筑/道路/地块多任务。
- 相比 SAM-Road：不只输出道路 centerline graph，也输出 road outline polygon，并统一边界/拓扑指标。
- 相比 PRUE：不只做 scalable field boundary segmentation，而是把 field boundary 的 polygon validity 纳入训练目标。

## 实验设计

### 数据集

| 类别 | 数据集 | 用途 |
|---|---|---|
| 建筑 | WHU Building, CrowdAI Mapping Challenge, INRIA Aerial, SpaceNet Buildings | 建筑 polygon/ring graph 主实验和跨区域泛化 |
| 道路 | City-Scale, SpaceNet Roads, Map2ImLas | 道路 graph / road outline polygon |
| 地块 | Fields of The World, FTW PRUE release, Sentinel-2 field boundary subsets | 农田地块 polygon、共享边界和大规模部署 |

### Baselines

1. Mask 后处理：U-Net/Swin/SAM mask + contour + Douglas-Peucker + orthogonalization。
2. SAMPolyBuild：SAM-based building polygon extraction。
3. Pix2Poly：sequence / ring graph direct polygon baseline。
4. GeoFormer / P2PFormer：自回归或 primitive-to-polygon building contour baseline。
5. SAM-Road：道路图提取 baseline。
6. LDPoly：道路 outline polygon diffusion baseline。
7. PRUE：field boundary scalable segmentation baseline。

### 指标

**像素覆盖**
- IoU / mIoU
- Dice / F1
- Boundary IoU
- Boundary F1

**矢量几何**
- Corner precision / recall / F1
- Mean corner localization error
- PoLiS distance
- Hausdorff / Chamfer distance
- Angle error / orthogonality error
- Vertex count ratio / vertex efficiency
- Polygon simplicity score
- Boundary smoothness

**拓扑与 GIS 可用性**
- Valid polygon rate
- Self-intersection rate
- Ring closure error
- Sliver polygon rate
- Hole correctness
- Road connectivity / APLS / graph edit distance
- Field shared-boundary consistency

**泛化与效率**
- Leave-city-out / leave-country-out
- Cross-GSD
- Latency per km2
- Post-processing time
- Manual correction time

## 最小可行实验

1. 先选建筑任务，使用 WHU + CrowdAI，比较 `SAM mask + polygonize`、SAMPolyBuild、Pix2Poly 和一个轻量 GeoPolySAM prototype。
2. 只做 exterior ring，不处理 holes；坐标 token 先量化到 256 或 512 bins。
3. 训练目标包括 vertex CE/L1、edge matching loss、soft raster Dice、self-intersection penalty。
4. 主要报告：IoU、Corner F1、PoLiS、valid polygon rate、vertex count ratio。
5. 扩展实验再加入道路 City-Scale/SpaceNet 和 FTW field boundary。

## 风险

- Polygon decoder 训练不稳定，尤其多实例和长序列。
- 坐标 token 量化会伤害精细边界，连续回归又可能排序不稳。
- 不同数据集 polygon annotation 风格差异大，角点密度和简化程度不一致。
- 建筑规则性先验迁移到道路/地块时可能变成错误约束。
- 公开代码和 checkpoint 不完全一致，复现时需要明确记录版本。

## 未来研究方向

1. **Promptable polygon decoder**：用户给 box/point/coarse mask，模型直接输出可编辑 polygon。
2. **Polygon-language model**：把 polygon ring 表示为 token 序列，借鉴 VLM/LLM 的指令微调和偏好优化。
3. **Shared-boundary field decoder**：地块相邻边界共享，不能逐实例独立预测；可用 planar graph 表示。
4. **Topology-aware SAM adapter**：在 SAM mask decoder 后接 graph/polygon head，让基础模型保持 promptability。
5. **GIS-product evaluation**：把人工修图时间、拓扑修复次数、矢量文件大小纳入论文指标。
6. **Cross-object vector extraction**：同一 decoder 支持建筑、道路、水体、油罐、飞机、农田地块，测试 VectorLLM 提到的零样本潜力。

## 阅读队列

1. [SAMPolyBuild: Adapting the Segment Anything Model for polygonal building extraction](https://www.sciencedirect.com/science/article/pii/S0924271624003563)
2. [SAMPolyBuild GitHub](https://github.com/wchh-2000/SAMPolyBuild)
3. [Pix2Poly: WACV 2025 paper](https://openaccess.thecvf.com/content/WACV2025/papers/Adimoolam_Pix2Poly_A_Sequence_Prediction_Method_for_End-to-End_Polygonal_Building_Footprint_WACV_2025_paper.pdf)
4. [Pix2Poly GitHub](https://github.com/yeshwanth95/Pix2Poly)
5. [GeoFormer: A Multi-Polygon Segmentation Transformer](https://arxiv.org/abs/2411.16616)
6. [GeoFormer GitHub](https://github.com/pihalf/GeoFormer)
7. [P2PFormer](https://arxiv.org/abs/2406.02930)
8. [SAM-Road](https://arxiv.org/abs/2403.16051)
9. [SAM-Road GitHub](https://github.com/htcr/sam_road)
10. [LDPoly](https://arxiv.org/abs/2504.20645)
11. [VectorLLM](https://arxiv.org/abs/2507.04664)
12. [Fields of The World](https://fieldsofthe.world/)
13. [PRUE](https://arxiv.org/abs/2603.27101)
14. [FTW PRUE GitHub](https://github.com/fieldsoftheworld/ftw-prue)
