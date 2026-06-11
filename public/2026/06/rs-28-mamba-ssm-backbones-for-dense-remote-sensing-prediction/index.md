# RS-28 Mamba/SSM Backbones for Dense Remote Sensing Prediction


# RS-28 Mamba/SSM Backbones for Dense Remote Sensing Prediction

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-28` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 范围：20242026 光学/航空/卫星遥感 dense prediction，重点是语义分割、二值/语义变化检测、大幅面高分辨率理解；不把 SARonly 作为主线。 1. 方向概述 Mamba/SSM 在遥感 dense prediction 中兴起的直接原因，是高分辨率遥感图像同时需要“全局上下文”和“可承受的长序列计算”。

## 正文

# RS-28 Mamba/SSM Backbones for Dense Remote Sensing Prediction

更新时间：2026-06-07  
范围：2024-2026 光学/航空/卫星遥感 dense prediction，重点是语义分割、二值/语义变化检测、大幅面高分辨率理解；不把 SAR-only 作为主线。

## 1. 方向概述

Mamba/SSM 在遥感 dense prediction 中兴起的直接原因，是高分辨率遥感图像同时需要“全局上下文”和“可承受的长序列计算”。CNN 的局部感受野不够，ViT/Transformer 的全局注意力又在万级像素或大 patch 序列上成本很高；遥感影像还存在俯视方向任意、目标尺度差异大、背景占比高、小目标稀疏等问题。2024 年 Vim 和 VMamba 把选择性状态空间模型迁移到视觉，随后 Samba、RS3Mamba、RS-Mamba、ChangeMamba 几乎在同一时间把 SSM 带进遥感分割和变化检测。

这个方向的研究重点已经从“把 Mamba 换进 backbone”逐步变成三个更细的问题：

- 扫描方向：遥感目标没有固定上/下/左/右语义，2D/多方向/全向扫描是否真的必要，何时比普通 bidirectional scan 更好。
- 全局-局部平衡：Mamba 擅长长程建模，但 dense prediction 需要边界、纹理和小目标细节，很多新方法开始重新引入 CNN、多尺度金字塔、频域和局部卷积。
- 任务结构：语义分割是单时相 dense labeling，变化检测还要建模双时相/多时相交互，不能只把两张图分别编码后相减。

## 2. 代表论文与代码

| 方向 | 论文/项目 | 年份/来源 | 链接 | 代码/资源 | 核心贡献 |
|---|---|---:|---|---|---|
| 通用视觉 SSM | Vision Mamba (Vim) | 2024 arXiv/ICML 方向 | [arXiv](https://arxiv.org/abs/2401.09417) | [GitHub](https://github.com/hustvl/Vim) | 用 bidirectional Mamba blocks 处理图像序列，是遥感 Mamba 的重要通用基座。 |
| 通用视觉 SSM | VMamba: Visual State Space Model | 2024 NeurIPS spotlight | [arXiv](https://arxiv.org/abs/2401.10166) | [GitHub](https://github.com/MzeroMiko/VMamba) | 提出 SS2D，用四条扫描路线连接 1D selective scan 与 2D 图像结构，后续 ChangeMamba/M-CD 等直接基于它。 |
| RS 语义分割 | Samba: Semantic Segmentation of Remotely Sensed Images with State Space Model | 2024 arXiv / Heliyon | [arXiv](https://arxiv.org/abs/2404.01705) | [GitHub](https://github.com/zhuqinfeng1999/Samba) | Encoder-decoder + Samba blocks + UperNet，在 LoveDA、Vaihingen、Potsdam 上验证 SSM 做高分遥感分割。 |
| RS 语义分割 | RS3Mamba | 2024 arXiv/GRSL | [arXiv](https://arxiv.org/abs/2404.02457) | [GitHub](https://github.com/sstary/SSRS) | 双分支结构：CNN 主分支保局部细节，VSS 辅助分支补全局信息，CCM 融合两类特征。 |
| RS dense prediction | RS-Mamba for Large Remote Sensing Image Dense Prediction | 2024 arXiv/TGRS | [arXiv](https://arxiv.org/abs/2404.02668) | [GitHub](https://github.com/NJU-LHRS/Official_Remote_Sensing_Mamba) | 面向大幅面 VHR 图像，提出 omnidirectional selective scan；同一框架覆盖语义分割和变化检测。 |
| RS 语义分割 | PyramidMamba | 2024 arXiv | [arXiv](https://arxiv.org/abs/2406.10828) | [GeoSeg](https://github.com/WangLibo1995/GeoSeg) | 用 selective state space model 重做金字塔特征融合，缓解多尺度特征语义冗余。 |
| RS 语义分割 | MF-Mamba | 2025 TGRS | [DLR entry](https://elib.dlr.de/215790/) | [GitHub](https://github.com/Mango-Mars/MF-Mamba) | CNN encoder + Mamba decoder，GLSS 八方向扫描 + 多核卷积，强调 global-local 和多尺度融合。 |
| RS 语义分割 | UrbanSSF | 2025 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S0924271625000176) | 未核验到官方代码 | FSI-Mamba 建模不同 feature state 的序列关系，面向 VHR 城市场景分割和应用落地。 |
| RS foundation model | RoMA | 2025 NeurIPS | [arXiv](https://arxiv.org/abs/2503.10392), [OpenReview](https://openreview.net/forum?id=QwY1vk67T3) | [GitHub](https://github.com/MiliLab/RoMA) | 系统验证 Mamba 在遥感预训练中的 data/parameter scaling law；覆盖分类、检测、分割。 |
| RS foundation model | DynamicVis | 2025 arXiv | [arXiv](https://arxiv.org/abs/2503.16426) | [GitHub](https://github.com/KyanChen/DynamicVis) | selective region-aware SSM + MIL meta-embedding，面向高分大图和跨任务 foundation model。 |
| 变化检测 | ChangeMamba | 2024 TGRS | [arXiv](https://arxiv.org/abs/2404.03425) | [GitHub](https://github.com/ChenHongruixuan/ChangeMamba) | 基于 VMamba，分别给 BCD/SCD/BDA 设计 MambaBCD/MambaSCD/MambaBDA，重点是时空交互建模。 |
| 变化检测 | CDMamba | 2024/2025 arXiv | [arXiv](https://arxiv.org/abs/2406.04207) | [GitHub](https://github.com/zmoka-zht/CDMamba) | 指出纯扫描改造忽略局部细节，提出 Scaled Residual ConvMamba 和双时相 global-local guided fusion。 |
| 变化检测 | A Mamba-Based Siamese Network for Remote Sensing Change Detection | 2025 WACV | [CVF PDF](https://openaccess.thecvf.com/content/WACV2025/papers/Paranjape_A_Mamba-Based_Siamese_Network_for_Remote_Sensing_Change_Detection_WACV_2025_paper.pdf), [arXiv](https://arxiv.org/abs/2407.06839) | [GitHub](https://github.com/JayParanjape/M-CD) | Siamese VMamba encoder + difference module + Mamba decoder，在 4 个变化检测数据集上验证。 |
| 语义变化检测 | GSTM-SCD | 2025 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271625003557) | [GitHub](https://github.com/liuxuanguang/GSTM-SCD) | Graph-enhanced spatio-temporal Mamba，支持 bi-temporal 和 time-series SCD，并加入时序拓扑一致性。 |
| 语义变化检测 | Mamba-FCS | 2025 arXiv / 2026 JSTARS 方向 | [arXiv](https://arxiv.org/abs/2508.08232) | [GitHub](https://github.com/Buddhi19/MambaFCS) | 将频域特征、change-guided attention 和 SeK-inspired loss 融入 Mamba SCD。 |

## 3. 方法脉络比较

### 3.1 扫描策略

- Vim：把图像 token 当序列，使用双向 Mamba；优点是简单、通用，缺点是 2D 空间结构依赖展开顺序。
- VMamba：SS2D 四方向扫描，是多数遥感变化检测 Mamba 的通用底座。
- RS-Mamba：针对遥感俯视方向任意，提出全向/多方向 selective scan，强调大幅面全局上下文。
- MF-Mamba：进一步使用八方向扫描，并配合多核卷积补局部纹理。
- GSTM-SCD：把扫描扩展到多时相语义变化，加入双向三维变化扫描和图关系。

判断：扫描方向不是越多越好。多方向扫描提升上下文覆盖，但也带来实现复杂度、显存和重复语义。真正值得做的实验是“方向数量/方向选择是否与目标形态、场景结构、GSD 和任务类型相关”。

### 3.2 全局-局部融合

- Samba 更像“直接把 Mamba 作为高效 encoder”。
- RS3Mamba 使用 CNN + VSS 双分支，明确承认 dense prediction 需要局部纹理。
- CDMamba 用 ConvMamba 修复 Mamba 细节不足，是变化检测里很清晰的局部增强路线。
- PyramidMamba/MF-Mamba/UrbanSSF 都在多尺度、局部卷积和 feature state interaction 上做文章。

判断：遥感 dense prediction 的边界和小目标通常不是纯全局上下文能解决的。Mamba 的论文创新点要避免只改 scan，最好把“局部细节在哪里丢失、如何可测量地补回来”讲清楚。

### 3.3 任务结构

- 单时相分割：重点是大图上下文、多尺度、边界、小目标。
- BCD：重点是双时相局部差异和伪变化抑制。
- SCD/MT-SCD：重点是语义类别转移、时序链一致性和类别不平衡。
- Foundation model：重点是跨任务可迁移和 scaling law，不再只报告单数据集 mIoU。

## 4. 当前问题

1. “Mamba 优势”常被过度归因。很多提升可能来自 decoder、多尺度 fusion、训练设置或数据增强，而不是 selective scan 本身。
2. 扫描方向缺少可解释评测。遥感论文常报告四方向/八方向有效，但很少分析道路、建筑、水体、农田等不同形态是否需要不同扫描。
3. 局部细节仍是短板。CDMamba、MF-Mamba 等都在补局部信息，说明纯 SSM 容易在边界、小目标和细碎地物上吃亏。
4. 公平效率比较不够。许多论文只报 FLOPs/params，却不报真实吞吐、峰值显存、tile size、输入尺寸扩展曲线和 GPU/CPU/edge 设备延迟。
5. 大图评测仍不充分。很多结果在 512 或 1024 patch 上完成，不能完全证明模型能处理真实正射影像或超大 VHR mosaics。
6. 变化检测中的配准误差和季节差异处理不足。Mamba 建模长程依赖，不等于天然区分真实变化、几何错位和物候变化。
7. 预训练路线刚开始。RoMA/DynamicVis 展示了 foundation model 化潜力，但下游 dense prediction 的 adapter、冻结策略和跨域泛化还没有定论。

## 5. 可投稿的小创新方向

### 方向 A：Shape-Adaptive Selective Scan for VHR Segmentation

核心问题：固定四/八方向扫描不能适配遥感地物形态。道路/河流是细长连通结构，建筑是块状边界结构，农田是大面状规则结构，小车/飞机是稀疏小目标。

方法草案：

- 先用轻量形态估计头预测每个区域的 dominant orientation、elongation、objectness 和 scale。
- 根据区域属性选择 scan route mixture，而不是全图统一四/八方向。
- 对细长目标偏向沿 skeleton/主方向扫描，对块状目标偏向闭合边界扫描，对大面状地物降低方向冗余。
- 加入 route sparsity loss 和 route diversity loss，避免所有区域退化为同一扫描。

最小验证：

- 数据：LoveDA、Vaihingen、Potsdam、OpenEarthMap。
- Baseline：Samba、RS3Mamba、RS-Mamba、PyramidMamba、SegFormer/Swin-UNet。
- 指标：mIoU、Boundary F1、small-object IoU、class-wise IoU、FPS/peak memory。
- 消融：固定四方向、固定八方向、随机方向、形态自适应方向。

### 方向 B：Local Detail Retention Benchmark for Mamba Dense Prediction

核心问题：当前论文缺少专门评测 Mamba 是否丢局部细节的协议。

方法草案：

- 构建局部细节 stress test：细道路、窄河道、小建筑、密集车辆、建筑边界、林地-草地细粒度边界。
- 在不同输入尺寸和 patch overlap 下测试 CNN、Transformer、Mamba。
- 指标不只 mIoU，还包括 Boundary F1、thin-structure IoU、connected-component correctness、small-object recall。

贡献形态：可以作为 TGRS/ISPRS 方法论文中的 benchmark + diagnostic module，也可以支撑一个新模型。

### 方向 C：Registration-Aware Spatio-Temporal Mamba for Change Detection

核心问题：ChangeMamba/CDMamba/M-CD 多数假设双时相较好配准，但真实遥感变化检测常有亚像素/多像素错位。

方法草案：

- 在 Mamba temporal interaction 前加入 deformable alignment 或 correlation-based local matching。
- 将 scan state 分成 stable state 和 change state，stable state 用于抑制错位伪变化，change state 用于增强真实变化。
- 用 temporal consistency loss 与 edge-aware alignment loss 区分错位边缘和真实变化边界。

数据与指标：

- LEVIR-CD、WHU-CD、CDD、S2Looking、SECOND/xBD。
- 加入人工平移/旋转/尺度扰动测试。
- 指标：F1、IoU、false alarm rate on unchanged boundaries、robustness curve。

### 方向 D：RoMA/DynamicVis Adapter for Dense Prediction Under Limited Labels

核心问题：Mamba foundation model 的下游 dense prediction 适配方式还不清楚。

方法草案：

- 比较 frozen backbone + linear head、LoRA、adapter、partial fine-tune、full fine-tune。
- 对分割、检测、变化检测分别做 1%、5%、10%、100% 标注曲线。
- 研究是否需要 task-specific scan route adapter。

## 6. 推荐实验矩阵

| 目标 | 数据集 | 任务 | Baselines | 主要指标 | 关键消融 |
|---|---|---|---|---|---|
| 单时相分割 | LoveDA, Vaihingen, Potsdam, OpenEarthMap | semantic segmentation | DeepLabV3+, UperNet, SegFormer, Swin-UNet, Samba, RS3Mamba, RS-Mamba, PyramidMamba | mIoU, F1, Boundary F1, FPS, memory | scan direction, local conv, feature pyramid |
| 大图扩展性 | WHDLD, large VHR tiles, OpenEarthMap large crops | dense segmentation | RS-Mamba, DynamicVis, SegFormer, ViT/Swin | mIoU vs input size, latency, peak memory | tile size, overlap, global context |
| 二值变化检测 | LEVIR-CD, WHU-CD, CDD, S2Looking | BCD | BIT, ChangeFormer, SNUNet, ChangeMamba, CDMamba, M-CD | F1, IoU, precision/recall | temporal fusion, alignment, local detail |
| 语义变化检测 | SECOND, Landsat-SCD, DynamicEarthNet, WUSU | SCD/MT-SCD | ChangeMamba, GSTM-SCD, Mamba-FCS, ChangeFormer variants | SeK, mIoU, temporal consistency | graph module, 3D scan, class imbalance loss |
| 少标注适配 | LoveDA, OpenEarthMap, xBD | segmentation/change | RoMA, DynamicVis, ViT/MAE, Prithvi/Clay where applicable | label-efficiency curve | frozen vs LoRA vs adapter |

## 7. 复现优先级

1. 先复现 Samba 或 RS3Mamba：安装和任务最接近单时相分割，适合作为代码基线。
2. 再复现 RS-Mamba：同时覆盖 segmentation 和 change detection，可直接研究扫描方向。
3. 变化检测侧复现 ChangeMamba 或 M-CD：一个是 TGRS 强基线，一个是 WACV CVF 版本，便于写 CV-to-RS 讨论。
4. 如果算力允许，再看 RoMA/DynamicVis：它们更偏 foundation model，适合做低标注/跨任务适配，而不是短期 baseline。

## 8. 论文 proposal 草案

题目候选：**Shape-Adaptive State Space Scanning for Detail-Preserving Dense Prediction in Very-High-Resolution Remote Sensing Images**

核心假设：遥感地物的形态和尺度决定了长程依赖的有效方向；固定四/八方向扫描会浪费计算并引入冗余，而形态自适应 scan mixture 能在同等或更低计算下提升细长结构、小目标和边界质量。

方法模块：

- Morphology cue head：预测区域尺度、方向、细长程度和边界复杂度。
- Adaptive scan router：为每个区域选择少量 scan routes 或 route weights。
- Detail-preserving local branch：轻量 CNN/edge branch 保留局部边界。
- Route regularization：约束 route 稀疏、多样和跨尺度一致。

预期贡献：

- 不是再堆一个 Mamba variant，而是回答“遥感图像到底需要怎样扫描”。
- 给出方向选择可解释性和局部细节 stress test。
- 在 LoveDA/Vaihingen/Potsdam/OpenEarthMap 与变化检测扩展上验证。

主要风险：

- 自适应 router 可能带来不稳定训练。
- 提升可能集中在少数类别，整体 mIoU 不明显。
- Mamba CUDA/依赖复现成本较高，Windows 环境可能不友好；建议 Linux + CUDA 环境复现。

## 9. 下一步阅读队列

1. [VMamba](https://arxiv.org/abs/2401.10166) 和 [Vision Mamba](https://arxiv.org/abs/2401.09417)：理解视觉 SSM 基座。
2. [RS-Mamba](https://arxiv.org/abs/2404.02668) 与 [官方代码](https://github.com/NJU-LHRS/Official_Remote_Sensing_Mamba)：扫描方向与大图 dense prediction 主线。
3. [Samba](https://arxiv.org/abs/2404.01705) 与 [代码](https://github.com/zhuqinfeng1999/Samba)：最直接的语义分割复现入口。
4. [ChangeMamba](https://arxiv.org/abs/2404.03425) 与 [代码](https://github.com/ChenHongruixuan/ChangeMamba)：双时相/语义变化检测强基线。
5. [CDMamba](https://arxiv.org/abs/2406.04207)：理解为什么局部 clues 对 Mamba CD 必要。
6. [RoMA](https://arxiv.org/abs/2503.10392) 与 [代码](https://github.com/MiliLab/RoMA)：Mamba foundation model scaling。
7. [DynamicVis](https://arxiv.org/abs/2503.16426) 与 [代码](https://github.com/KyanChen/DynamicVis)：高效大图和跨任务 foundation model。
8. [GSTM-SCD](https://www.sciencedirect.com/science/article/pii/S0924271625003557)：多时相语义变化检测与图增强时空 Mamba。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

