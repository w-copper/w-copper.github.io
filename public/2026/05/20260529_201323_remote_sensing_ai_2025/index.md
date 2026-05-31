# 2025年遥感AI前沿论文解读：开放词汇分割与全景场景分割


# 2025年遥感AI前沿论文解读：开放词汇分割与全景场景分割

> 搜索日期：2026年5月29日 | 搜索关键词：arxiv remote sensing deep learning 2025, remote sensing object detection transformer 2025, remote sensing segmentation foundation model 2025, remote sensing change detection 2025, github remote sensing paper with code 2025

---

## 一、论文一：SegEarth-OV3——基于SAM 3的遥感开放词汇语义分割

### 1.1 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images |
| **作者** | Kaiyu Li, Shengqi Zhang, Yupeng Deng, Zhi Wang, Deyu Meng, Xiangyong Cao（通讯作者） |
| **机构** | 西安交通大学、中国科学院 |
| **发表** | arXiv:2512.08730 (2025年12月) |
| **代码** | [GitHub: earth-insights/SegEarth-OV-3](https://github.com/earth-insights/SegEarth-OV-3)（⭐ 161 Stars） |
| **任务** | 开放词汇语义分割 (Open-Vocabulary Semantic Segmentation, OVSS) |

### 1.2 研究问题

遥感图像的开放词汇语义分割（OVSS）是当前遥感智能解译领域的核心挑战之一。传统监督分割模型受限于预定义类别，在面对推理阶段出现的新类别（unseen classes）时往往失效。此外，获取大规模逐像素标注数据代价高昂、费时费力。

现有OVSS方法大多基于CLIP模型，虽然取得了一定进展，但在以下方面存在明显不足：

- **精确定位困难**：CLIP模型的全局图文对齐能力虽强，但在遥感场景中密集小目标的像素级定位上表现欠佳。
- **复杂管线设计**：现有方法往往需要组合多个独立模块（如分割头、分类头、后处理），管线复杂且冗余。
- **遥感特殊性**：遥感图像与自然图像存在显著差异——目标尺度变化大、朝向多样、场景复杂，且存在大量密集分布的小目标，直接迁移自然图像的OVSS方法效果有限。

### 1.3 解决方案

SegEarth-OV3 提出了一种**无需训练**（training-free）的创新方案，首次将最新的 **Segment Anything Model 3 (SAM 3)** 应用于遥感开放词汇任务。SAM 3 是一个统一的可提示分割与识别框架，基于 DETR 和 MaskFormer 架构，采用查询式 Transformer 设计，包含三个关键输出头：

1. **存在性头（Presence Head）**：预测给定概念在图像中存在的概率。
2. **Transformer 解码头（Instance Head）**：生成离散实例的精确掩码。
3. **语义分割头（Semantic Head）**：生成连续语义区域的分割图。

SegEarth-OV3 的核心策略包括：

#### （1）双头掩码融合（Dual-Head Mask Fusion）

将 SAM 3 的语义分割头和实例头的输出进行融合。实例头擅长捕获细粒度的目标边界，而语义头提供更完整的区域覆盖。通过取两者逐像素最大值（element-wise maximum），结合两者优势，实现更准确的地物覆盖分割。

#### （2）存在性分数过滤（Presence-Guided Filtering）

利用存在性头输出的分数过滤掉场景中不存在的类别。在遥感场景中，由于词汇量极大（vast vocabulary sizes）且采用 patch 级处理，容易产生大量误检。存在性分数过滤机制可有效抑制这些假阳性结果。

### 1.4 实验与评估

#### 评估范围

SegEarth-OV3 在**大规模**遥感数据集上进行了全面评估：

| 任务类别 | 数据集数量 | 具体数据集 |
|----------|-----------|------------|
| 语义分割 | 20个 | iSAID, DLRSD, OpenEarthMap, UDD5, VDD 等 |
| 变化检测 | 3个 | 建筑变化检测数据集 |
| 3D语义分割 | 1个 | 点云语义分割数据集 |
| 建筑提取 | — | WHU, Inria, xBD 等 |
| 道路提取 | — | CHN6-CUG, DeepGlobe, Massachusetts 等 |
| 水体提取 | — | WBS-SI 等 |

#### 核心发现

- SegEarth-OV3 作为**无需额外训练**的简单适配方案，在多个遥感基准数据集上取得了有竞争力的性能。
- 验证了 SAM 3 在遥感开放词汇任务中的巨大潜力，为后续研究提供了强有力的基线。
- 掩码融合策略和存在性过滤机制协同工作，显著减少了因词汇量膨胀和 patch 级处理导致的误检。

#### 方法优势

| 特性 | 说明 |
|------|------|
| **零训练** | 无需在遥感数据上进行任何微调或训练 |
| **统一框架** | 一套方法同时处理分割、变化检测、3D分割等多种任务 |
| **高分辨率支持** | 可处理超过 10000×10000 分辨率的遥感影像 |
| **轻量级** | 仅需简单的后处理策略，无需复杂管线 |

---

## 二、论文二：REST——端到端全景遥感语义分割框架

### 2.1 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | REST: Holistic Learning for End-to-End Semantic Segmentation of Whole-Scene Remote Sensing Imagery |
| **作者** | Wei Chen, Lorenzo Bruzzone, Bo Dang, Yuan Gao, Youming Deng, Jin-Gang Yu, Liangqi Yuan, Yansheng Li（通讯作者） |
| **机构** | 武汉大学遥感信息工程学院 |
| **发表** | IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI), 2025（CCF-A，顶级期刊） |
| **代码** | [GitHub: weichenrs/REST_code](https://github.com/weichenrs/REST_code) |
| **任务** | 全景遥感影像端到端语义分割 |

### 2.2 研究问题

遥感影像通常具有极高的空间分辨率（可达数万×数万像素），这对深度学习语义分割模型提出了严峻挑战：

- **GPU显存瓶颈**：全景遥感影像（Whole-scene Remote Sensing Imagery, WRI）尺寸巨大，直接输入现有分割网络会导致显存溢出。
- **裁剪策略的缺陷**：现有主流方法采用裁剪（cropping）策略，将大图切成小块分别推理再拼接。但这种"分而治之"的方式**丢失了全局上下文信息**，导致分割结果在图块边界处出现不一致。
- **融合策略的局限**：另一类方法采用多尺度融合策略，但计算开销大、推理速度慢，且无法真正解决全局依赖问题。
- **端到端的缺失**：目前没有一个真正意义上的端到端框架能直接处理全景遥感影像，无需裁剪或额外融合即可获得高质量分割结果。

### 2.3 解决方案

REST 是**首个真正意义上的端到端全景遥感影像语义分割框架**，提出了空间并行交互机制（Spatial Parallel Interaction Mechanism, SPIM），通过高效的并行计算和分治策略实现全景处理。

#### 核心架构

```
全景遥感影像 → SPIM空间并行交互 → 多尺度特征聚合 → 端到端语义分割输出
```

#### 关心创新

| 技术模块 | 功能描述 |
|----------|----------|
| **SPIM** | 空间并行交互机制，将全景影像分块并行处理，同时通过交互层保持全局上下文一致性 |
| **分治策略** | 并行计算各子区域特征，同时通过跨区域注意力机制捕获全局依赖 |
| **全局上下文保持** | 不同于传统裁剪方法完全隔离各子区域，REST在并行处理中保留子区域间的语义关联 |
| **端到端训练** | 支持对全景影像直接进行端到端训练和推理 |

### 2.4 实验与评估

#### 评估数据集

| 数据集 | 类型 | 规模 |
|--------|------|------|
| **Five-Billion-Pixels** | 土地覆盖分类 | 大规模高分辨率 |
| **GLH-Water** | 水体提取 | 全景遥感 |
| **WHU-OHS** | 高光谱分类 | 超高光谱维度 |
| **UAVid** | 无人机城市场景 | 城市级全景 |

#### 核心结果

| 方法 | 数据集 | Backbone | mIoU |
|------|--------|----------|------|
| Baseline | Five-Billion-Pixels | Swin-Large | 69.68 |
| **REST** | Five-Billion-Pixels | Swin-Large | **72.95** |

REST 在 Five-Billion-Pixels 数据集上取得了 **72.95% mIoU** 的优异成绩，相比基线方法提升 **+3.27%**，验证了端到端全景处理策略的有效性。

#### 模型优势

| 特性 | 说明 |
|------|------|
| **真正的端到端** | 首个无需裁剪即可处理全景遥感影像的内在端到端框架 |
| **全局上下文** | 通过SPIM机制在并行处理中保持全局语义一致性 |
| **高性能** | 在多个基准数据集上取得SOTA结果 |
| **灵活部署** | 已发布预训练权重（GLH-Water、Five-Billion-Pixels），提供Web推理界面 |

---

## 三、2025年遥感AI研究趋势总结

### 3.1 基础模型持续引领

2025年遥感AI领域呈现出明显的**基础模型（Foundation Model）范式**趋势：

| 方向 | 代表工作 | 亮点 |
|------|----------|------|
| **多模态基础模型** | TerraMind (14.7B参数), RingMoE | 首次实现any-to-any生成式多模态遥感模型 |
| **SAM系列适配** | SegEarth-OV3, TASAM, RemoteSAM | 将SAM/SAM 3成功迁移到遥感领域 |
| **传感器无关基础模型** | Panopticon (CVPR 2025 Best Paper), SMARTIES, RAMEN | 统一处理多源异构传感器数据 |
| **自监督预训练** | S5, DeepAndes, MAESTRO | 大规模无标注数据利用 |

### 3.2 关键技术突破

1. **开放词汇理解**：从固定类别向开放世界感知转变（GSNet/AAAI 2025, SegEarth-OV3）
2. **统一架构设计**：一个模型支持多种任务（分类、检测、分割、变化检测等）
3. **大规模预训练**：百万级遥感图像预训练成为常态（S5的RS4P-1M, TerraMind的500M数据）
4. **混合专家架构**：MoE（Mixture of Experts）被广泛引入处理多模态异构数据（RingMoE, SM3Det）
5. **时序建模**：多时相遥感分析需求增长（MAESTRO, Change3D, TSSUN）

### 3.3 顶会论文速览

| 论文 | 会议/期刊 | 核心贡献 | GitHub |
|------|-----------|----------|--------|
| Panopticon | CVPR 2025 (Best Paper) | 任意传感器基础模型 | ✅ 44⭐ |
| GSNet | AAAI 2025 | 开放词汇遥感分割 | ✅ 85⭐ |
| REST | IEEE TPAMI 2025 | 全景端到端分割 | ✅ |
| SegEarth-OV3 | arXiv 2025 | SAM 3零训练适配 | ✅ 161⭐ |
| DeepAndes | IEEE JSTARS 2025 | 多光谱自监督基础模型 | ✅ 10⭐ |
| RemoteSAM | arXiv 2025 | 统一视觉基础模型 | ✅ |
| Mamba-FCS | arXiv 2025 | Mamba变化检测 | ✅ |
| UniChange | arXiv 2025 | MLLM统一变化检测 | ✅ |

---

## 四、参考文献

1. Li, K., Zhang, S., Deng, Y., Wang, Z., Meng, D., & Cao, X. (2025). SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images. *arXiv:2512.08730*.

2. Chen, W., Bruzzone, L., Dang, B., Gao, Y., Deng, Y., Yu, J.-G., Yuan, L., & Li, Y. (2025). REST: Holistic Learning for End-to-End Semantic Segmentation of Whole-Scene Remote Sensing Imagery. *IEEE Transactions on Pattern Analysis and Machine Intelligence (TPAMI)*.

3. Waldmann, L., & Shah, A. et al. (2025). Panopticon: Advancing Any-Sensor Foundation Models for Earth Observation. *CVPR 2025 EarthVision Workshop (Best Paper)*.

4. Ye, C., Zhuge, Y., & Zhang, P. (2025). Towards Open-Vocabulary Remote Sensing Image Semantic Segmentation. *AAAI 2025*.

5. Jakubik, J. et al. (2025). TerraMind: Large-Scale Generative Multimodality for Earth Observation. *arXiv:2504.11171*.

---

*本文基于2025年最新公开的遥感AI论文整理，涵盖基础模型、开放词汇分割、全景语义分割等前沿方向。所有引用论文均提供GitHub开源代码。*

