---
title: "SkySense V2：统一多模态遥感基础模型，一个Backbone搞定RGB/SAR/多光谱"
date: 2026-06-01
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "articles"
---

# SkySense V2：统一多模态遥感基础模型，一个Backbone搞定RGB/SAR/多光谱

> **论文解读** | ICCV 2025 | 2026-06-01

## 📄 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | SkySense V2: A Unified Foundation Model for Multi-modal Remote Sensing |
| **作者** | 蚂蚁集团、武汉大学 |
| **会议** | ICCV 2025 |
| **arXiv** | 待确认 |
| **GitHub** | https://github.com/kang-wu/SkySensePlusPlus |
| **关键词** | 遥感基础模型、多模态统一、Transformer、自监督学习、专家混合 |

## 🎯 解决的核心问题

### 问题背景

在遥感领域，我们经常需要处理多种模态的数据：光学图像（RGB）、多光谱图像（MS）、合成孔径雷达（SAR）等。这些不同模态的数据各有优势——光学图像色彩丰富，SAR能穿透云雾，多光谱能捕捉植被健康状况。

### 现有方法的局限

目前的多模态遥感基础模型存在一个尴尬的问题：

1. **参数冗余**：为每种模态训练单独的backbone，导致模型参数量爆炸
2. **效率低下**：不同模态的模型无法共享特征，计算资源浪费严重
3. **语义不一致**：不同模态提取的特征难以对齐，影响下游任务性能

### 核心问题提炼

**如何用一个统一的backbone高效处理多种遥感模态，同时保持各模态的独特特性？**

## 💡 解决方案

### 核心创新点1：统一Transformer骨干网络

**设计动机**：既然不同模态的图像都是2D数据，为什么不共享一个backbone？

**具体实现**：

```
输入层
    │
    ▼
┌─────────────────────────────────────┐
│  统一Transformer Backbone           │
│  ├── Stage 1-2: Swin Transformer    │  ← 局部建模（高分辨率）
│  ├── Stage 3-4: 标准Transformer     │  ← 全局建模（低分辨率）
└─────────────────────────────────────┘
    │
    ▼
输出特征
```

**关键细节**：
- 前两层使用Swin Transformer的窗口注意力，高效处理高分辨率特征
- 后两层使用标准全局注意力，捕捉长距离依赖
- 所有模态共享同一套参数，大幅减少模型大小

### 核心创新点2：自适应块合并（APM）模块

**设计动机**：不同模态的分辨率差异很大（如SAR是10m，光学可能是0.5m），如何统一处理？

**具体实现**：

```python
class AdaptivePatchMerging(nn.Module):
    def __init__(self, dim, modal_type):
        super().__init__()
        self.modal_type = modal_type
        # 根据模态类型选择不同的下采样策略
        if modal_type == 'SAR':
            self.merge = nn.Conv2d(dim, dim*2, kernel_size=2, stride=2)
        elif modal_type == 'MS':
            self.merge = nn.Conv2d(dim, dim*2, kernel_size=3, stride=2, padding=1)
        else:  # RGB
            self.merge = nn.Conv2d(dim, dim*2, kernel_size=4, stride=4)
    
    def forward(self, x, modal_type):
        # 根据模态动态调整下采样
        return self.merge(x)
```

**关键细节**：
- 根据每种模态的具体需求选择性地降低特征分辨率
- 保持各模态的空间信息完整性
- 避免过度下采样导致的信息丢失

### 核心创新点3：模态特定提示标记（Modal-Specific Prompt Tokens）

**设计动机**：虽然共享backbone，但不同模态有独特的特性，如何保留？

**具体实现**：

```
输入特征 x ∈ R^(B×C×H×W)
    │
    ▼
┌─────────────────────────────────────┐
│  模态特定提示标记                    │
│  P_rgb ∈ R^(N×C)                    │
│  P_ms  ∈ R^(N×C)                    │
│  P_sar ∈ R^(N×C)                    │
└─────────────────────────────────────┘
    │
    ▼
交叉注意力：x' = CrossAttn(x, P_modal)
    │
    ▼
增强特征 x'
```

**关键细节**：
- 每种模态有N个可学习的提示标记
- 通过交叉注意力机制，提示标记与图像特征交互
- 增强特征多样性，捕捉每种模态的独特特征

### 核心创新点4：专家混合（MoE）模块

**设计动机**：不同区域可能需要不同的处理策略，如何实现动态适应？

**具体实现**：

```python
class MoELayer(nn.Module):
    def __init__(self, num_experts=8, top_k=2):
        super().__init__()
        self.experts = nn.ModuleList([ExpertFFN() for _ in range(num_experts)])
        self.gate = nn.Linear(dim, num_experts)
        self.top_k = top_k
    
    def forward(self, x):
        # 计算门控分数
        gate_scores = self.gate(x)
        # 选择top-k个专家
        topk_scores, topk_indices = torch.topk(gate_scores, self.top_k)
        # 稀疏激活
        output = sum(score * expert(x) for score, expert in zip(topk_scores, self.experts[topk_indices]))
        return output
```

**关键细节**：
- 稀疏前馈层（专家）为每个token进行预训练
- 门控机制动态选择最相关的专家
- 减少计算量，提升模型容量

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    SkySense V2 整体架构                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  输入：RGB / MS / SAR 图像                                       │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │  Patch Embed  │  ← 模态特定嵌入                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────┐                       │
│  │     统一Transformer Backbone         │                       │
│  │  ┌────────────────────────────────┐  │                       │
│  │  │  Stage 1-2: Swin Transformer   │  │                       │
│  │  │  + 模态特定提示标记              │  │                       │
│  │  └────────────────────────────────┘  │                       │
│  │  ┌────────────────────────────────┐  │                       │
│  │  │  Stage 3-4: 标准Transformer    │  │                       │
│  │  │  + MoE模块                      │  │                       │
│  │  └────────────────────────────────┘  │                       │
│  └──────────────────────────────────────┘                       │
│         │                                                       │
│         ▼                                                       │
│  输出：多模态统一特征                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔬 实验验证

### 实验设置

- **数据集**：包含多种模态的遥感数据集（光学、多光谱、SAR）
- **基线方法**：SkySense（前身）、GFM、SatLas、Scale-MAE等
- **评估指标**：分类精度、分割mIoU、检测mAP等

### 核心结果

| 方法 | 模态 | 分割mIoU | 分类Acc | 检测mAP |
|------|------|----------|---------|---------|
| SkySense | 多模态 | 72.3 | 89.5 | 45.2 |
| SkySense V2 | 统一 | **74.1** | **91.2** | **47.8** |
| 提升 | - | +1.8 | +1.7 | +2.6 |

### 消融实验

| 组件 | 移除后性能 | 性能下降 |
|------|------------|----------|
| 统一Backbone | 71.5 | -2.6 |
| APM模块 | 72.8 | -1.3 |
| 提示标记 | 73.2 | -0.9 |
| MoE模块 | 73.5 | -0.6 |

### 可视化分析

- **特征可视化**：统一backbone提取的特征在不同模态间保持一致性
- **注意力图**：提示标记能有效捕捉模态特定信息
- **错误案例**：在复杂场景下仍存在一定混淆

## 💭 深度评价

### 核心洞察

1. **统一的力量**：用一个backbone处理多种模态，不仅节省参数，还能促进跨模态特征学习
2. **保留个性**：通过提示标记和MoE，统一模型仍能保留各模态的独特特性
3. **规模效应**：更大的模型和更多的数据能持续提升性能

### 技术贡献层次

| 层次 | 贡献 | 影响 |
|------|------|------|
| 架构层 | 统一Transformer + 提示标记 | 开创性 |
| 训练层 | QSACL + MGCL + ITA | 重要 |
| 工程层 | APM + MoE | 实用 |

### 优点（2-3个）

1. **参数高效**：相比为每种模态单独训练backbone，参数量大幅减少
2. **性能提升**：在所有任务上平均提升1.8个百分点
3. **灵活扩展**：易于添加新模态，只需学习新的提示标记

### 局限性（2-3个）

1. **计算开销**：统一backbone的训练成本仍然较高
2. **模态冲突**：在某些极端情况下，不同模态的梯度可能冲突
3. **数据依赖**：需要大规模多模态数据集进行预训练

### 未来方向

1. **更高效的统一架构**：探索更轻量级的统一backbone
2. **动态模态融合**：根据任务需求动态调整模态权重
3. **零样本迁移**：提升模型在新模态上的零样本能力

## 📝 总结

SkySense V2提出了一个优雅的解决方案来解决多模态遥感基础模型的效率问题。通过统一的Transformer骨干网络，配合模态特定提示标记和专家混合模块，实现了"一个backbone处理所有模态"的目标。这不仅大幅减少了模型参数，还通过跨模态特征共享提升了性能。

该工作的核心洞察是：**不同模态的遥感数据虽然有差异，但底层的视觉特征是共通的**。通过精心设计的架构，我们可以在保持模态特性的同时，实现高效的参数共享。这对于遥感领域的实际应用具有重要意义——部署一个模型就能处理多种传感器数据，大大降低了系统复杂度和计算成本。

从技术演进的角度看，SkySense V2代表了遥感基础模型从"单模态专用"向"多模态统一"的重要转变。随着遥感数据源的不断丰富，这种统一架构将变得越来越重要。

## 参考文献

1. SkySense: A Multi-Modal Remote Sensing Foundation Model Towards Universal Interpretation for Earth Observation Imagery, CVPR 2024
2. GeoLink: Empowering Remote Sensing Foundation Model with OpenStreetMap Data, NeurIPS 2025
3. Panopticon: Advancing Any-Sensor Foundation Models for Earth Observation, CVPR 2025
4. RoMA: Scaling up Mamba-based Foundation Models for Remote Sensing, NeurIPS 2025
