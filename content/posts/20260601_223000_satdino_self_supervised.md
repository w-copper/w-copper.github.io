---
title: "SatDINO：当DINO遇上遥感——对比学习在卫星图像预训练中的深度探索"
date: 2026-06-01
categories: ["可提示分割、开放词表与密集预测"]
draft: false
source_repo: "articles"
---

# SatDINO：当DINO遇上遥感——对比学习在卫星图像预训练中的深度探索

> **论文解读** | arXiv 2025 | 2026-06-01

## 📄 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | SatDINO: A Deep Dive into Self-Supervised Pretraining for Remote Sensing |
| **作者** | Jakub Straka et al. |
| **会议** | arXiv 2025 |
| **arXiv** | https://arxiv.org/abs/2508.21402 |
| **GitHub** | https://github.com/strakaj/SatDINO |
| **关键词** | 自监督学习、DINO、对比学习、GSD编码、遥感预训练 |

## 🎯 解决的核心问题

### 问题背景

遥感领域存在一个有趣的现象：**MAE（掩码自编码器）几乎垄断了自监督预训练的天下**。从SatMAE到Scale-MAE，几乎所有主流的遥感基础模型都采用MAE范式——遮住图像的一部分，让模型去重建。

但这里有个根本性的问题被忽视了：

**遥感图像天生就是多尺度的。**

同一场景在不同传感器下，GSD（地面采样距离）可以从0.3米到几十米不等。一个建筑物在高分辨率下是清晰的矩形，在低分辨率下可能只是一个模糊的像素点。

### 现有方法的局限

MAE的核心思路是**重建被遮挡的像素**。这个任务本质上是"填补缺失"，而不是"理解尺度"。具体来说：

1. **MAE的尺度感知是被动的**：Scale-MAE虽然引入了GSD信息作为位置编码，但这只是在输入端"告诉"模型当前图像的尺度，模型并没有主动学习尺度的能力
2. **MAE对GSD元数据有依赖**：如果推理时没有GSD信息，性能会显著下降
3. **MAE的多尺度利用不充分**：虽然可以处理不同分辨率的图像，但训练时并没有显式地利用多尺度信息

### 核心问题提炼

**能否用对比学习（DINO）替代MAE，让模型在预训练阶段就主动学习多尺度表示，而不依赖外部GSD元数据？**

## 💡 解决方案

### 核心洞察：DINO天然适合多尺度

作者的核心洞察非常精妙：

> DINO在训练时会生成**多个不同尺度的视图**（global views + local views），这些视图本身就是多尺度的。这与遥感图像的多尺度特性完美契合。

具体来说，DINO的标准训练流程是：
- **Global views**：覆盖图像25%-100%的区域
- **Local views**：覆盖图像5%-25%的区域

这意味着模型在训练过程中，天然就会看到同一场景在不同"缩放级别"下的样子——这不正是遥感图像多尺度特性的完美模拟吗？

### 创新点1：GSD编码（Ground Sample Distance Encoding）

**设计动机**：

现有的GSD编码方法（如Scale-MAE）将GSD作为位置编码的一部分注入模型。但这种方法有两个致命缺陷：
1. 训练时必须有GSD元数据
2. 推理时如果GSD信息缺失，性能会崩溃

**具体实现**：

SatDINO提出了一种**从图像本身学习GSD**的优雅方案：

```python
# 伪代码
class GSDEncoding(nn.Module):
    def __init__(self, dim):
        # 随机初始化的GSD token
        self.gsd_token = nn.Parameter(torch.randn(1, 1, dim))
        # GSD预测头
        self.gsd_head = nn.Linear(dim, 1)
    
    def forward(self, x):
        # 将GSD token拼接到class token后面
        x = torch.cat([x, self.gsd_token], dim=1)
        # 预测GSD值
        gsd_pred = self.gsd_head(x[:, -1, :])
        return x, gsd_pred
```

**关键细节**：

1. 在ViT的输入序列中，除了标准的`[CLS]` token，额外添加一个**可学习的GSD token**
2. 在这个token上接一个线性回归层，预测图像的GSD值
3. 使用MSE损失监督GSD预测：`L = L_DINO + γ * L_GSD`
4. **只有student网络的GSD预测被优化**，teacher网络不参与GSD学习

**为什么这样做有效？**

- 模型被迫从图像的视觉特征中推断出尺度信息
- 推理时不需要任何外部GSD元数据
- GSD知识被编码到模型的表示中，而不是作为输入条件

### 创新点2：均匀视图采样（Uniform View Sampling）

**设计动机**：

DINO的标准采样策略是随机裁剪不同大小的区域作为local views。但在遥感场景下，我们希望local views能覆盖**更多样的GSD范围**，而不是集中在某个特定尺度。

**具体实现**：

```python
def uniform_view_sampling(image_size, num_local_views):
    # 标准DINO：随机采样local view的尺度
    # scale = uniform(0.05, 0.25)  # 每次都是独立随机
    
    # SatDINO：均匀分割尺度范围
    scale_range = (0.05, 0.25)
    scales = np.linspace(scale_range[0], scale_range[1], num_local_views)
    # 确保每个local view覆盖不同的GSD
    return scales
```

**关键细节**：

- 将local view的尺度范围[5%, 25%]均匀分成N份
- 每个local view从对应的子区间采样
- 确保训练时能看到从细粒度到粗粒度的完整GSD谱

### 整体架构

```
输入图像
    │
    ├── Global Views (25%-100%)
    │       │
    │       ▼
    │   [ViT Encoder]
    │       │
    │       ├── [CLS] token → DINO loss
    │       └── GSD token → GSD loss
    │
    └── Local Views (5%-25%, 均匀采样)
            │
            ▼
        [ViT Encoder]
            │
            ├── [CLS] token → DINO loss
            └── GSD token → GSD loss
            
Teacher-Student 架构：
- Student：接收所有views，优化DINO loss + GSD loss
- Teacher：接收global views，使用EMA更新，不优化GSD loss
```

## 🔬 实验验证

### 实验设置

**预训练数据集**：
- fMoW-RGB：412,965张图像，62个类别，GSD范围0.307-1.705米

**下游任务**：
- **分类**：EuroSAT、RESISC45、UC Merced、WHU-RS19、RS-C11、SIRI-WHU
- **语义分割**：Potsdam、Vaihingen、LoveDA

**基线方法**：
- SatMAE：标准的MAE预训练
- Scale-MAE：引入GSD编码的MAE

### 核心结果

**分类任务（kNN评估）**：

| 数据集 | SatDINO (8 views) | SatDINO (16 views) | Scale-MAE | SatMAE |
|--------|-------------------|-------------------|-----------|--------|
| EuroSAT | **87.72** | 85.96 | 85.42 | 81.43 |
| RESISC45 | **85.29** | 82.32 | 79.96 | 65.96 |
| UC Merced | **94.82** | 93.21 | 84.58 | 78.45 |
| WHU-RS19 | **98.18** | 97.82 | 89.32 | 86.41 |
| RS-C11 | **96.91** | 96.61 | 93.03 | 83.96 |

**关键发现**：
- SatDINO在所有分类数据集上都显著超越MAE方法
- 在UC Merced上，SatDINO比Scale-MAE高出**10.24%**
- 在RESISC45上，SatDINO比Scale-MAE高出**5.33%**

**语义分割任务（mIoU）**：

| 模型 | Potsdam 224 | Potsdam 512 | Vaihingen 224 | Vaihingen 512 | LoveDA 224 | LoveDA 512 |
|------|-------------|-------------|---------------|---------------|------------|------------|
| SatMAE | 67.88 | 70.39 | 64.81 | 69.13 | 46.28 | 52.28 |
| Scale-MAE | 69.74 | **72.21** | 67.97 | **71.65** | **49.37** | **53.70** |
| SatDINO (8 views) | **70.71** | 71.45 | **68.69** | 67.71 | 47.53 | 50.20 |
| SatDINO (16 views) | 67.93 | 71.80 | 63.38 | 68.32 | 44.77 | 49.65 |

**关键发现**：
- 在小尺度输入（224）下，SatDINO在Potsdam和Vaihingen上表现更好
- 在大尺度输入（512）下，Scale-MAE仍有优势
- 这表明DINO和MAE在不同场景下各有优势

### 消融实验

**1. Local Views数量的影响**：

| Local Views数量 | kNN | Top-1 | Top-5 |
|-----------------|-----|-------|-------|
| 4 | 67.2 | 70.1 | 91.2 |
| 8 | 68.5 | 71.4 | 91.8 |
| 12 | 68.8 | 71.6 | 91.9 |
| 16 | 68.9 | 71.7 | 92.0 |

**结论**：更多的local views能提升性能，但收益递减。8个views是效率和性能的良好平衡点。

**2. GSD编码的效果**：

| 配置 | fMoW kNN | 下游分类平均 |
|------|----------|-------------|
| Baseline | 68.5 | 89.2 |
| + 均匀采样 | 69.1 | 88.9 |
| + GSD编码 | 68.2 | 90.1 |
| + 两者结合 | 68.9 | 90.5 |

**关键发现**：
- 均匀采样主要提升预训练数据集性能
- GSD编码主要提升下游任务性能
- **两者结合能同时获得提升**

**3. GSD损失权重γ的影响**：

| γ | fMoW kNY | 下游分类平均 |
|---|----------|-------------|
| 0.01 | 69.2 | 89.5 |
| 0.1 | 68.9 | 90.5 |
| 0.5 | 67.8 | 90.8 |
| 1.0 | 66.5 | 90.3 |

**结论**：γ=0.1是最佳平衡点，过大的GSD损失权重会干扰DINO学习。

### 可视化分析

论文展示了不同方法在多尺度下的kNN准确率：

```
尺度变化下的鲁棒性（kNN准确率%）：
Scale     SatDINO    Scale-MAE    SatMAE
1.0       85.3       79.96        65.96
0.5       83.1       76.2         61.3
0.25      79.8       71.5         55.8
0.125     74.2       64.3         48.9
```

**观察**：SatDINO在所有尺度下都保持更高的准确率，且性能下降更平缓，说明其学到的表示对尺度变化更鲁棒。

## 💭 深度评价

### 核心洞察

这篇论文最深刻的洞察是：

> **预训练范式的选择应该与数据的内在特性相匹配。**

遥感图像的多尺度特性与DINO的多视图训练天然契合，这是一个被忽视的设计原则。作者没有盲目跟随MAE的主流，而是从数据特性出发，重新审视了对比学习的潜力。

### 技术贡献层次

1. **范式层面**：证明了对比学习在遥感预训练中可以与MAE媲美甚至超越
2. **方法层面**：提出了GSD编码和均匀视图采样两个即插即用的改进
3. **工程层面**：提供了完整的代码和预训练模型，可直接使用

### 优点

1. **不依赖GSD元数据**：GSD编码让模型从图像本身学习尺度信息，这在实际应用中非常重要——很多遥感图像并没有精确的GSD标注

2. **全面的消融实验**：论文对每个组件都进行了详尽的实验，包括local views数量、GSD损失权重、采样策略等，这种实验设计值得学习

3. **多尺度评估**：论文不仅在标准benchmark上评估，还测试了模型在不同输入尺度下的鲁棒性，这更符合实际应用需求

### 局限性

1. **语义分割优势不明显**：在大规模语义分割任务上，SatDINO并未显著超越Scale-MAE，甚至在某些配置下表现更弱。这可能是因为DINO的全局特征学习更适合分类，而MAE的像素级重建更适合密集预测

2. **预训练效率问题**：DINO需要同时维护teacher和student网络，且需要生成多个views，计算开销比MAE更大。论文没有详细讨论训练时间对比

3. **仅限RGB数据**：论文只在fMoW-RGB上预训练，没有探索多光谱、SAR等其他遥感数据模态

### 未来方向

1. **DINO + MAE混合**：能否结合两者的优势？用DINO学习全局语义，用MAE学习局部细节？

2. **多模态扩展**：将GSD编码思想扩展到多光谱、SAR、时序数据

3. **更大数据集**：在更大规模的遥感数据集上预训练，探索SatDINO的scaling law

4. **下游任务适配**：针对不同的下游任务（检测、分割、变化检测），设计更合适的预训练策略

## 📝 总结

SatDINO是一篇"逆流而上"的工作。在MAE主导的遥感自监督预训练领域，作者重新审视了对比学习的价值，并给出了令人信服的答案。

论文的核心贡献不是某个复杂的架构设计，而是对一个基本问题的深入思考：**什么样的预训练任务最适合遥感数据？** 通过分析遥感图像的多尺度特性，作者发现DINO的多视图训练天然适合这种数据，并提出了两个简单而有效的改进：GSD编码和均匀视图采样。

实验结果表明，SatDINO在分类任务上显著超越MAE方法，在语义分割上也能与之媲美。更重要的是，SatDINO学到的表示对尺度变化更鲁棒，且不依赖外部GSD元数据——这在实际应用中非常有价值。

这篇论文给我们的启示是：**不要盲目跟随主流，要从数据本身的特性出发思考问题。** 有时候，被忽视的方法可能正是最适合的选择。

## 参考文献

1. Straka, J. et al. "SatDINO: A Deep Dive into Self-Supervised Pretraining for Remote Sensing." arXiv:2508.21402, 2025.
2. He, K. et al. "Masked Autoencoders Are Scalable Vision Learners." CVPR 2022.
3. Caron, M. et al. "Emerging Properties in Self-Supervised Vision Transformers." ICCV 2021.
4. Reed, C. J. et al. "Scale-MAE: A Scale-Aware Masked Autoencoder for Multiscale Geospatial Representation Learning." ICCV 2023.
5. Cong, Y. et al. "SatMAE: Pre-training Transformers for Temporal and Multi-Spectral Satellite Imagery." NeurIPS 2022.
