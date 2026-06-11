---
title: "RS-33 Hyperspectral Foundation Model Transfer"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["高光谱", "多光谱", "谱段适配"]
source: "research/rs33_hyperspectral_foundation_model_transfer.md"
categories: ["可提示分割、开放词表与密集预测"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-33 Hyperspectral Foundation Model Transfer

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-33` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务：研究高光谱 foundation model 的跨数据集迁移，重点关注 Indian Pines / Pavia / Houston / EnMAP / PRISMA 等小数据与大规模预训练如何衔接，并比较 linear probe、adapter、LoRA、full finetuning 的样本效率与过拟合风险。 1. 核

## 正文

# RS-33 Hyperspectral Foundation Model Transfer

更新时间：2026-06-07  
任务：研究高光谱 foundation model 的跨数据集迁移，重点关注 Indian Pines / Pavia / Houston / EnMAP / PRISMA 等小数据与大规模预训练如何衔接，并比较 linear probe、adapter、LoRA、full fine-tuning 的样本效率与过拟合风险。

## 1. 核心判断

高光谱 foundation model 的迁移问题，本质上不是“有没有预训练模型”，而是“预训练域、传感器谱段、空间分辨率、标注粒度和下游小样本协议是否一致”。2024-2026 的代表性工作已经从单数据集 HSI 分类，推进到 HyperGlobal-450K、SpectralEarth/EnMAP、HyperSeg、HyperFM250K 这类大规模预训练数据。但下游仍常落回 Indian Pines、Pavia University、Houston 2013、Salinas、WHU-Hi 等小数据集，导致两个矛盾：

1. 大模型有谱-空表示能力，但小数据全量微调很容易记住局部空间纹理和 train/test split。
2. 大规模卫星 HSI 与经典机载 HSI 的光谱响应、空间分辨率和地物类别差异很大，简单 fine-tune 不一定是真的 transfer。

最值得做的小论文切口：建立一个 **HSI-FM transfer protocol**，用统一 split、统一预算和统一参数量比较 linear probe、adapter、LoRA、prompt/tuning-free、full fine-tuning，并增加 leave-dataset-out / leave-sensor-out / few-shot 曲线和过拟合诊断。

## 2. 代表论文与资源

| 论文/项目 | 年份/venue | 链接 | 代码/数据 | 和 RS-33 的关系 |
|---|---:|---|---|---|
| SpectralGPT: Spectral Remote Sensing Foundation Model | TPAMI 2024 | [GitHub paper page](https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT) | [GitHub](https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT), [Zenodo](https://zenodo.org/doi/10.5281/zenodo.10533809) | 早期谱域 FM，使用 3D token 和多目标重建，适合做 full fine-tune 与 linear probe 基线。 |
| S2MAE: A Spatial-Spectral Pretraining Foundation Model for Spectral Remote Sensing Data | CVPR 2024 | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Li_S2MAE_A_Spatial-Spectral_Pretraining_Foundation_Model_for_Spectral_Remote_Sensing_CVPR_2024_paper.pdf) | 代码状态需再核验 | 3D masked transformer + 高 mask ratio，适合研究少样本 HSI 分类迁移。 |
| HSIMAE: A Unified Masked Autoencoder with Large-scale Pretraining for Hyperspectral Image Classification | JSTARS 2024 | [GitHub](https://github.com/Ryan21wy/HSIMAE) | [GitHub](https://github.com/Ryan21wy/HSIMAE) | 官方结果覆盖 Salinas、Pavia University、Houston 2013、WHU-Hi-LongKou，并报告 5/10/15/20 samples per class。 |
| HyperSIGMA: Hyperspectral Intelligence Comprehension Foundation Model | TPAMI 2025 | [arXiv](https://arxiv.org/abs/2406.11519) | [GitHub](https://github.com/WHU-Sigma/HyperSIGMA), HyperGlobal-450K | 十亿级 HSI FM，提供 spatial/spectral MAE 权重，覆盖多任务多数据集，是主要迁移基座。 |
| SpectralEarth: Training Hyperspectral Foundation Models at Scale | JSTARS 2025 / arXiv 2024 | [arXiv](https://arxiv.org/abs/2408.08447) | [GitHub](https://github.com/AABNassim/spectral_earth), [DLR dataset](https://c.geoservice.dlr.de/web/datasets/enmap_spectralearth) | 基于 EnMAP 的全球多时相 HSI 预训练集，带 land-cover、crop-type、tree-species 下游数据，适合研究卫星 HSI 到任务数据迁移。 |
| HyperFree: A Channel-adaptive and Tuning-free Foundation Model for HSI | CVPR 2025 | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html) | [Project](https://rsidea.whu.edu.cn/hyperfree.htm), [HF](https://huggingface.co/JingtaoLi/HyperFree) | 0.4-2.5 μm weight dictionary，强调 tuning-free 与变通道适配，是“少/免微调”强基线。 |
| SpecAware: Spectral-content Aware FM for Multi-sensor HSI Mapping | ISPRS JPRS 2026 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271626000754), [arXiv](https://arxiv.org/abs/2510.27219) | GitHub planned | 用 sensor meta-attributes + image semantic features 做统一 embedding，直接对应 cross-sensor transfer。 |
| Cross-Domain Transfer of Hyperspectral Foundation Models | ICPR 2026 / arXiv | [arXiv](https://arxiv.org/abs/2604.26478) | 未见官方代码 | 明确比较 in-domain training、cross-modality transfer 和 cross-domain transfer；为“遥感 HSI FM 迁移到新域”提供研究框架。 |
| SpectralEarth-FM: Bringing Hyperspectral Imagery into Multimodal EO Pretraining | arXiv 2026 | [arXiv](https://arxiv.org/abs/2605.21075) | 待核验 | 将 EnMAP/EMIT/DESIS 与 Sentinel-2、Landsat 等共址，对跨模态/跨传感器迁移很关键。 |
| HyperFM: Efficient HSI FM with Spectral Grouping | CVPR 2026 Findings / arXiv | [arXiv](https://arxiv.org/abs/2604.21127) | 待核验 | 面向 PACE-OCI 等长谱段 HSI，突出 spectral grouping 和高效 transfer。 |
| HyperspectralMAE: Fourier-Encoded Dual-Branch MAE | arXiv 2025 | [arXiv](https://arxiv.org/abs/2505.05710) | 待核验 | 在 Hyperion/EnMAP 预训练后迁移到 Indian Pines，适合放入“classic benchmark transfer”比较。 |

## 3. 问题由来

### 3.1 经典 HSI 数据集太小，容易高估迁移能力

Indian Pines、Pavia University、Houston 2013、Salinas 等经典数据集常用于 HSI classification，但它们通常是单场景、单传感器、空间相邻样本强相关。随机抽样时，训练和测试像素可能来自同一地块或相邻区域，模型可以靠局部纹理和空间平滑拿高分。这会掩盖 foundation model 是否真的学到了可迁移谱-空表示。

更稳妥的设置应包括：

- random pixel split：保留与旧论文对齐，但只作为可比基线。
- spatial block split：减少空间邻近泄漏。
- leave-dataset-out：如用 Pavia + Houston + Salinas 适配，再测 Indian Pines。
- leave-sensor-out：如 EnMAP / Hyperion / PRISMA / DESIS 之间迁移。
- few-shot curve：1/2/5/10/20 samples per class，而不是只报一个 shot。

### 3.2 大规模预训练域和下游域并不天然一致

SpectralEarth 这类 EnMAP 全球数据能提供大规模 HSI 表示，但其 30m 级卫星空间分辨率、202 bands、全球场景分布，与 AVIRIS/ROSIS/CASI 等经典机载数据差异很大。HyperSIGMA 的 HyperGlobal-450K 覆盖 EO-1 和 GF-5B 等全球 HSI，也仍会面对传感器响应、空间尺度、处理级别、噪声和地物体系差异。

因此，transfer 需要拆成两个层面：

- spectral transfer：中心波长、band width、SRF、噪声和缺失 band 能否对齐。
- semantic/spatial transfer：地物类别、空间分辨率、地块尺度和纹理是否可迁移。

### 3.3 迁移策略的公平比较还不充分

很多论文比较“预训练 vs 从头训练”，但没有系统比较：

- 冻结 backbone 的 linear probe 是否已经足够。
- 只调 adapter/LoRA 能否接近 full fine-tuning。
- full fine-tuning 的收益是否来自过拟合。
- tuning-free/prompt-based 方法在不同传感器和不同 shot 下是否稳定。
- 同样训练预算下，哪种方法更省标注、更省显存、更稳。

## 4. 方法路线比较

| 迁移策略 | 做法 | 优点 | 风险 | 适合数据 |
|---|---|---|---|---|
| Linear probe | 冻结 HSI-FM，只训练分类头或浅层 decoder | 最能测表示质量，低过拟合，便宜 | 不能修正传感器/类别差异；对小数据上限有限 | Indian Pines/Pavia/Houston few-shot baseline |
| Adapter | 在 backbone block 中插入小模块 | 参数少，可适配新域 | adapter 位置、瓶颈维度、初始化影响大 | cross-dataset、cross-sensor 小样本 |
| LoRA | 对 attention/MLP 权重加低秩更新 | 参数效率高，便于多域保存 | rank 选择敏感，可能仍过拟合空间 split | 多数据集多任务微调 |
| Prompt / tuning-free | 类似 HyperFree，用 prompt 或动态 embedding 直接适配 | 训练成本低，适合变 band | 对类别定义和 prompt 质量敏感 | 快速迁移、无标注/极少标注 |
| Full fine-tuning | 全模型更新 | 上限高 | 小数据最容易过拟合，算力和存储重 | 有足够标签、严格 spatial split |
| Cross-domain pre-adaptation | 先在目标传感器未标注数据上 SSL/TTA，再少样本监督 | 可缓解传感器 shift | 训练流程复杂，可能引入伪标签偏差 | EnMAP/PRISMA/Hyperion 到本地任务 |

## 5. 推荐实验协议

### 5.1 模型候选

- SpectralGPT：早期 TPAMI 谱域 FM，作为大模型 generative pretraining baseline。
- S2MAE / HSIMAE：MAE 系 spectral-spatial baseline。
- HyperSIGMA：强 HSI FM 主基线，分别测试 spatial MAE、spectral MAE 与融合特征。
- SpectralEarth pretrained models：卫星 EnMAP 预训练基线。
- HyperFree：tuning-free/channel-adaptive 强基线。
- 如果可得：SpecAware、SpectralEarth-FM、HyperFM。

### 5.2 数据集分层

经典小数据：

- Indian Pines：农业场景，小图、类别不平衡、空间相关强。
- Pavia University / Pavia Center：城市区域，ROSIS 数据，类别较少但空间结构明显。
- Houston 2013：城市 HSI，多类地物，常用于分类。
- Salinas：农业场景，类别相对规整。

较大或更现实数据：

- WHU-Hi 系列：大尺度机载 HSI，可测试空间泛化。
- SpectralEarth downstream：EnMAP-CORINE、EnMAP-NLCD、EnMAP-CDL、EnMAP-BD Foret 等。
- PRISMA / EnMAP / DESIS / Hyperion 公开片区：用于 leave-sensor-out。

### 5.3 Split 与 shot 设置

建议每个数据集至少跑 4 组：

1. Random pixel split：和旧工作对齐。
2. Spatial block split：按空间块划分，防止相邻像素泄漏。
3. Few-shot class-balanced：1/2/5/10/20 samples per class。
4. Leave-dataset-out / leave-sensor-out：源域若干数据集训练，目标域只 linear probe 或 few-shot adapter。

### 5.4 指标

分类指标：

- OA / AA / Kappa。
- macro-F1，避免大类主导。
- per-class F1，重点看少样本和长尾类别。

迁移与稳健性指标：

- transfer gain：相对从头训练的提升。
- few-shot AUC：shot 数从 1 到 20 的曲线面积。
- overfit gap：train vs validation/test，尤其 spatial split。
- parameter efficiency：可训练参数比例、显存、训练时间。
- sensor shift drop：同模型从 source sensor 到 target sensor 的性能下降。

## 6. 可投稿研究方案

### 标题草案

**How Should Hyperspectral Foundation Models Transfer? A Parameter-Efficient and Leakage-Aware Protocol for Cross-Dataset HSI Adaptation**

### 核心假设

在经典 HSI 小数据上，full fine-tuning 的表观优势很大一部分来自空间泄漏和过拟合；在 spatial split / leave-dataset-out 设置下，adapter 或 LoRA 可以以更少参数获得更稳定的跨数据集迁移，而 linear probe 是最可信的表示质量下界。

### 方法模块

1. **统一 HSI 输入适配**：把不同数据集 band 信息标准化为 wavelength metadata；对缺失/不匹配 band 用 interpolation 或 learned band projection。
2. **迁移策略套件**：linear probe、adapter、LoRA、full fine-tuning、HyperFree-style tuning-free。
3. **泄漏感知 split**：实现 random、spatial block、leave-dataset-out、leave-sensor-out。
4. **过拟合诊断**：记录 train/test gap、feature CKA、类别混淆、空间错误热力图。
5. **样本效率曲线**：按 shot 数和可训练参数量画 performance-cost frontier。

### 最小可行实验

第一阶段：

- 数据：Indian Pines、Pavia University、Houston 2013、Salinas。
- 模型：HSIMAE、SpectralGPT、HyperSIGMA。
- 策略：linear probe、LoRA、full fine-tune。
- 目标：验证 full fine-tune 在 random split 上更强，但在 spatial split 下 gap 缩小或不稳定。

第二阶段：

- 加入 SpectralEarth downstream 或 WHU-Hi。
- 加入 adapter 与 HyperFree。
- 做 leave-dataset-out。

第三阶段：

- 加入 EnMAP/PRISMA/DESIS/Hyperion 传感器迁移。
- 测 missing band 和 spectral response mismatch。

## 7. 风险与规避

| 风险 | 表现 | 规避 |
|---|---|---|
| 数据 split 泄漏 | random split 分数虚高 | 强制 spatial block split，报告地理距离 |
| 代码不可复现 | 权重或数据不可下载 | 先选 HyperSIGMA、SpectralGPT、HSIMAE、SpectralEarth 这类开源项目 |
| band 对齐不公平 | 不同模型输入 band 数不一致 | 统一记录 band subset、插值方式和 wavelength metadata |
| full fine-tune 过拟合 | 小数据高 train acc、低 OOD | early stopping、weight decay、冻结层对照、重复 seed |
| 计算成本高 | 大模型多 split 难跑 | 先 ViT-B/小模型，LoRA rank 4/8/16，减少全参微调 |
| 旧 benchmark 结论不稳 | 不同论文 split 不同 | 发布 split 文件和脚本，重复 5 seeds |

## 8. 推荐阅读顺序

1. [HyperSIGMA GitHub](https://github.com/WHU-Sigma/HyperSIGMA)：先确认模型权重、任务脚本和 HyperGlobal-450K 说明。
2. [SpectralEarth arXiv](https://arxiv.org/abs/2408.08447) 与 [DLR dataset page](https://c.geoservice.dlr.de/web/datasets/enmap_spectralearth)：理解大规模 EnMAP 预训练与下游任务。
3. [HyperFree CVPR 2025](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html)：作为 tuning-free / channel-adaptive 迁移路线。
4. [Cross-Domain Transfer of Hyperspectral Foundation Models](https://arxiv.org/abs/2604.26478)：直接对应跨域迁移问题。
5. [HSIMAE GitHub](https://github.com/Ryan21wy/HSIMAE)：借用 5/10/15/20 samples per class 的小样本协议。
6. [SpectralGPT GitHub](https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT)：作为 TPAMI 2024 谱域 FM 基线。

## 9. 最终建议

RS-33 不建议做“我又提出一个 HSI 分类网络”。更好的论文形态是：提出一个 **迁移评测协议 + 参数高效适配方法 + 泄漏/过拟合诊断**。如果方法部分要有明确创新，可以做一个 **Wavelength-aware LoRA/Adapter**：LoRA rank 或 adapter gate 由 band metadata、sensor id 和目标域少量统计量动态调节。这样问题足够细，又能连接 HyperSIGMA/SpectralEarth/HyperFree/SpecAware 这条 2024-2026 的主线。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
