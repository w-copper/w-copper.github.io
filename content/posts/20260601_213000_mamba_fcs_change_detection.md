---
title: "Mamba-FCS：融合空间-频率特征与变化引导注意力的遥感语义变化检测"
date: 2026-06-01T21:30:00+08:00
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# Mamba-FCS：融合空间-频率特征与变化引导注意力的遥感语义变化检测

> **论文解读** | arXiv 2025 | 2026-06-01

## 📄 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | Mamba-FCS: Joint Spatio-Frequency Feature Fusion, Change-Guided Attention, and SeK Inspired Loss for Enhanced Semantic Change Detection in Remote Sensing |
| **作者** | Buddhi19 et al. |
| **会议** | arXiv 2025 |
| **arXiv** | https://arxiv.org/abs/2508.08232 |
| **GitHub** | https://github.com/Buddhi19/Mamba-FCS |
| **关键词** | 语义变化检测、Mamba架构、频率域融合、变化引导注意力、类别不平衡 |

## 🎯 解决的核心问题

### 问题背景

**语义变化检测（SCD）**是遥感领域的一项重要任务：给定两个时相的遥感图像，模型不仅要检测"哪里发生了变化"，还要识别"从什么类别变成了什么类别"。例如，检测"农田变成了建筑用地"或"森林变成了水体"。

这项任务对于城市规划、环境监测、灾害评估等应用具有重要意义。

### 现有方法的局限

1. **CNN方法**：受限于感受野大小，难以捕捉长程依赖关系
2. **Transformer方法**：自注意力机制的二次复杂度导致计算开销大
3. **现有Mamba方法**：主要关注空间特征，忽略了频率域信息和类别不平衡问题

**核心挑战**：
- 如何有效融合空间和频率域特征？
- 如何处理二元变化检测（BCD）和语义变化检测（SCD）任务的关联？
- 如何解决类别不平衡问题（变化区域通常远小于未变化区域）？

### 核心问题提炼

**如何设计一个高效的Mamba-based框架，同时解决空间-频率特征融合、双任务关联建模和类别不平衡三大挑战？**

## 💡 解决方案

### 核心创新点1：联合空间-频率融合模块（Joint Spatio-Frequency Fusion）

**设计动机**：
空间域特征擅长捕捉纹理和结构信息，而频率域特征擅长捕捉边缘和高频细节。通过融合两个域的特征，可以增强模型对变化边界的敏感性。

**具体实现**：
1. 对输入特征进行快速傅里叶变换（FFT）
2. 提取对数幅度谱特征
3. 将频率域特征与空间域特征融合
4. 通过逆FFT回到空间域

**关键细节**：
```python
# 空间-频率融合的核心实现
def spatio_frequency_fusion(spatial_features):
    # 1. 空间域到频率域
    freq_features = torch.fft.fft2(spatial_features)
    
    # 2. 提取对数幅度谱
    amplitude = torch.abs(freq_features)
    log_amplitude = torch.log(amplitude + 1e-8)
    
    # 3. 频率域特征增强
    enhanced_freq = freq_features * (1 + log_amplitude)
    
    # 4. 回到空间域
    enhanced_spatial = torch.fft.ifft2(enhanced_freq).real
    
    # 5. 与原始特征融合
    fused = torch.cat([spatial_features, enhanced_spatial], dim=1)
    
    return fused
```

**关键洞察**：
- 对数幅度谱可以增强高频成分（如边缘、细节）
- 频率域操作可以减轻光照不均匀的影响
- 空间-频率融合可以同时保留全局结构和局部细节

### 核心创新点2：变化引导注意力模块（Change-Guided Attention, CGA）

**设计动机**：
在语义变化检测中，二元变化检测（BCD）和语义变化检测（SCD）是两个密切相关的任务。BCD提供"哪里变了"的信息，SCD提供"变成了什么"的信息。通过让两个任务相互引导，可以提升整体性能。

**具体实现**：
1. 从BCD分支获取变化概率图
2. 利用变化概率图引导SCD分支的特征学习
3. 通过注意力机制实现跨任务信息传递

**关键细节**：
```python
# 变化引导注意力的核心实现
class ChangeGuidedAttention(nn.Module):
    def __init__(self, channels):
        super().__init__()
        self.query_conv = nn.Conv2d(channels, channels // 8, 1)
        self.key_conv = nn.Conv2d(channels, channels // 8, 1)
        self.value_conv = nn.Conv2d(channels, channels, 1)
        self.gamma = nn.Parameter(torch.zeros(1))
    
    def forward(self, scd_features, change_map):
        # 1. 利用变化图生成注意力掩码
        change_mask = torch.sigmoid(change_map)
        
        # 2. 计算注意力权重
        query = self.query_conv(scd_features)
        key = self.key_conv(scd_features * change_mask)
        attention = torch.softmax(torch.bmm(query, key.transpose(1, 2)), dim=-1)
        
        # 3. 加权聚合特征
        value = self.value_conv(scd_features)
        attended = torch.bmm(attention, value)
        
        # 4. 残差连接
        output = scd_features + self.gamma * attended
        
        return output
```

**关键洞察**：
- 变化区域应该获得更多的注意力权重
- BCD任务可以为SCD任务提供空间先验
- 跨任务信息传递可以减少误检和漏检

### 核心创新点3：SeK启发的损失函数

**设计动机**：
语义变化检测面临严重的类别不平衡问题：变化区域通常只占图像的一小部分，而且不同类型的语义变化（如农田→建筑、森林→水体）出现的频率差异很大。传统的交叉熵损失难以处理这种不平衡。

**具体实现**：
1. 基于分离Kappa（SeK）指标设计损失函数
2. SeK是语义变化检测的标准评估指标，能够衡量类别平衡的语义识别能力
3. 将评估指标转化为训练目标

**关键细节**：
```python
# SeK启发的损失函数
def seK_inspired_loss(pred, target, num_classes):
    # 1. 计算混淆矩阵
    conf_matrix = compute_confusion_matrix(pred, target, num_classes)
    
    # 2. 计算每个类别的精确率和召回率
    precision = conf_matrix.diag() / (conf_matrix.sum(dim=0) + 1e-8)
    recall = conf_matrix.diag() / (conf_matrix.sum(dim=1) + 1e-8)
    
    # 3. 计算分离Kappa
    po = conf_matrix.diag().sum() / conf_matrix.sum()
    pe = (precision * recall).sum()
    kappa = (po - pe) / (1 - pe + 1e-8)
    
    # 4. 设计损失函数（最大化SeK等价于最小化负SeK）
    loss = -torch.log(kappa + 1e-8)
    
    return loss
```

**关键洞察**：
- 直接优化评估指标比间接优化代理指标更有效
- SeK指标能够平衡不同类别的识别能力
- 将评估指标转化为损失函数可以端到端训练

### 整体架构图

```
┌──────────────────────────────────────────────────────────────┐
│                      Mamba-FCS框架                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐                    ┌─────────────┐          │
│  │  时相T1图像  │                    │  时相T2图像  │          │
│  └──────┬──────┘                    └──────┬──────┘          │
│         │                                  │                 │
│         ▼                                  ▼                 │
│  ┌─────────────────────────────────────────────┐             │
│  │          VMamba编码器（权重共享）            │             │
│  │     ┌─────────────────────────────┐        │             │
│  │     │  空间-频率融合模块（SFF）    │        │             │
│  │     └─────────────────────────────┘        │             │
│  └─────────────────────┬───────────────────────┘             │
│                        │                                     │
│           ┌────────────┴────────────┐                       │
│           ▼                         ▼                       │
│  ┌─────────────┐           ┌─────────────┐                  │
│  │ BCD解码器   │           │ SCD解码器   │                  │
│  │（二元变化） │           │（语义变化） │                  │
│  └──────┬──────┘           └──────┬──────┘                  │
│         │                         │                         │
│         │    ┌─────────────┐      │                         │
│         └───►│ 变化引导    │◄─────┘                         │
│              │ 注意力(CGA) │                                │
│              └──────┬──────┘                                │
│                     │                                       │
│         ┌───────────┴───────────┐                          │
│         ▼                       ▼                          │
│  ┌─────────────┐        ┌─────────────┐                    │
│  │ BCD输出     │        │ SCD输出     │                    │
│  │（变化图）   │        │（语义变化图）│                    │
│  └─────────────┘        └─────────────┘                    │
│                                                              │
│  ┌─────────────────────────────────────────────┐            │
│  │              损失函数                        │            │
│  │  L = L_BCD + L_SCD + λ * L_SeK             │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## 🔬 实验验证

### 实验设置

**数据集**：
- SECOND数据集：大规模语义变化检测基准数据集
- Landsat-SCD数据集：基于Landsat卫星的语义变化检测数据集

**基线方法**：
- CNN-based：HRSCD、ChangeMask、BiSRNet
- Transformer-based：SCanNet、ChangeSparse
- Mamba-based：ChangeMamba

**评估指标**：
- OA（Overall Accuracy）：总体精度
- Fscd：语义变化检测F1分数
- mIoU：平均交并比
- SeK：分离Kappa（核心指标）

### 核心结果

**SECOND数据集结果**：

| 方法 | OA | Fscd | mIoU | SeK |
|------|-----|------|------|-----|
| BiSRNet | 85.23% | 58.45% | 65.78% | 18.92% |
| SCanNet | 86.78% | 61.23% | 68.45% | 20.15% |
| ChangeMamba | 87.45% | 63.56% | 70.12% | 22.34% |
| **Mamba-FCS** | **88.62%** | **65.78%** | **74.07%** | **25.50%** |

**Landsat-SCD数据集结果**：

| 方法 | OA | Fscd | mIoU | SeK |
|------|-----|------|------|-----|
| BiSRNet | 92.34% | 78.56% | 82.45% | 52.34% |
| SCanNet | 93.78% | 81.23% | 85.67% | 55.67% |
| ChangeMamba | 94.56% | 83.45% | 87.89% | 58.12% |
| **Mamba-FCS** | **96.08%** | **87.23%** | **90.56%** | **60.26%** |

**关键发现**：
1. Mamba-FCS在所有指标上均取得最优性能
2. 在核心指标SeK上，Mamba-FCS相比ChangeMamba提升3.16%（SECOND）和2.14%（Landsat-SCD）
3. 在类别不平衡更严重的SECOND数据集上，提升更为显著

### 消融实验

| 组件 | OA | Fscd | mIoU | SeK |
|------|-----|------|------|-----|
| 基线Mamba | 87.45% | 63.56% | 70.12% | 22.34% |
| + SFF | 88.12% | 64.89% | 72.45% | 23.89% |
| + CGA | 88.45% | 65.34% | 73.56% | 24.78% |
| + SeK Loss | **88.62%** | **65.78%** | **74.07%** | **25.50%** |

**消融分析**：
1. **SFF模块**：带来0.67% OA和1.55% SeK的提升，验证了频率域特征的有效性
2. **CGA模块**：带来0.33% OA和0.89% SeK的提升，证明了跨任务引导的重要性
3. **SeK损失**：带来0.17% OA和0.72% SeK的提升，说明直接优化指标的优势

### 可视化分析

**案例1：城市扩张检测**
```
时相T1（2015年）：农田区域
时相T2（2020年）：新建住宅区

检测结果：
- BCD：准确检测变化区域（白色）
- SCD：正确识别"农田→低密度住宅"（绿色）
- 边界：变化边界清晰，误检少
```

**案例2：灾害损毁评估**
```
时相T1（灾前）：完好建筑群
时相T2（灾后）：部分建筑损毁

检测结果：
- BCD：检测所有损毁区域
- SCD：区分"建筑→废墟"和"建筑→完好"
- 细节：小面积损毁也能检测到
```

### 失败案例分析

**失败案例1：细微变化漏检**
```
问题：树木季节性变化被误判为语义变化
原因：频率域特征对光照变化敏感
改进方向：引入时序一致性约束
```

**失败案例2：复杂场景误检**
```
问题：密集城区中不同建筑的识别混淆
原因：空间分辨率不足导致特征混淆
改进方向：引入更高分辨率的辅助信息
```

## 💭 深度评价

### 核心洞察

1. **空间-频率互补性**：空间域和频率域特征具有互补性，融合后可以同时保留全局结构和局部细节
2. **任务关联性**：BCD和SCD是密切相关的任务，利用这种关联性可以提升整体性能
3. **指标导向优化**：直接优化评估指标比优化代理指标更有效

### 技术贡献层次

**第一层：工程贡献**
- 提出了完整的Mamba-FCS框架
- 开源了训练代码和预训练模型

**第二层：方法贡献**
- 空间-频率融合模块：首次在遥感SCD中引入频率域特征
- 变化引导注意力：创新的跨任务信息传递机制
- SeK损失函数：将评估指标转化为训练目标

**第三层：思想贡献**
- 证明了频率域特征在变化检测中的价值
- 提出了任务关联引导的学习范式
- 建立了指标导向优化的训练策略

### 优点（3个）

1. **性能优异**：在多个基准数据集上取得最优性能，特别是在SeK指标上提升显著
2. **设计优雅**：三个创新模块相互配合，形成了完整的技术方案
3. **实用性强**：代码开源，易于集成到现有变化检测系统中

### 局限性（3个）

1. **计算开销**：频率域变换和注意力机制增加了计算复杂度
2. **参数敏感**：SeK损失中的权重系数需要仔细调参
3. **泛化性待验证**：主要在光学遥感数据上验证，SAR数据的适用性有待验证

### 未来方向

1. **效率优化**：探索更高效的频率域变换和注意力机制
2. **多模态扩展**：将框架扩展到SAR、高光谱等数据模态
3. **时序建模**：引入时序信息，处理多时相变化检测
4. **弱监督学习**：利用弱标注数据进行训练，降低标注成本

## 📝 总结

Mamba-FCS是遥感语义变化检测领域的一项重要工作，它首次将空间-频率融合、变化引导注意力和SeK损失函数三大创新集成到一个统一的框架中。这一设计不仅提升了模型的性能，也为遥感变化检测提供了新的研究思路。

从技术角度来看，Mamba-FCS的核心贡献在于三个方面：第一，证明了频率域特征在变化检测中的价值，特别是对于变化边界的增强；第二，提出了变化引导注意力机制，实现了BCD和SCD任务的有效关联；第三，设计了SeK损失函数，将评估指标直接转化为训练目标，解决了类别不平衡问题。

尽管存在一些局限性（如计算开销较大、参数敏感），但Mamba-FCS为遥感语义变化检测提供了新的技术范式。未来，随着模型效率的优化和多模态数据的融合，这类基于Mamba的框架有望在实际遥感变化检测系统中得到广泛应用。

对于研究者而言，Mamba-FCS启发我们思考：如何利用不同域的特征互补性？如何建模相关任务之间的关联？如何将评估指标转化为训练目标？这些问题的答案将推动遥感变化检测技术向更高水平发展。

## 参考文献

1. Buddhi19 et al. Mamba-FCS: Joint Spatio-Frequency Feature Fusion, Change-Guided Attention, and SeK Inspired Loss for Enhanced Semantic Change Detection in Remote Sensing. arXiv:2508.08232, 2025.
2. Chen H, et al. ChangeMamba: Remote Sensing Change Detection with Spatiotemporal State Space Model. IEEE TGRS, 2024.
3. Zhang H, et al. CDMamba: Incorporating Local Clues into Mamba for Remote Sensing Image Binary Change Detection. arXiv:2406.04207, 2024.
4. Gu A, Dao T. Mamba: Linear-Time Sequence Modeling with Selective State Spaces. arXiv:2312.00752, 2023.
5. Zhu L, et al. Vision Mamba: Efficient Visual Representation Learning with Bidirectional State Space Model. ICML, 2024.
