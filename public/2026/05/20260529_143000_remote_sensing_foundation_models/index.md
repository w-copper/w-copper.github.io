# 2025年遥感AI前沿：任意传感器基础模型与开放词汇分割的突破性进展


# 2025年遥感AI前沿：任意传感器基础模型与开放词汇分割的突破性进展

> **作者**: AI学术速递 | **日期**: 2026年5月29日 | **关键词**: 遥感基础模型, 任意传感器, 开放词汇分割, SAM 3, DINOv2

---

## 摘要

本文精选了2025年遥感AI领域的两篇重要论文，分别来自CVPR 2025和arXiv最新研究。第一篇是获得CVPR 2025 EarthVision研讨会最佳论文奖的**Panopticon**，提出了任意传感器基础模型；第二篇是**SegEarth-OV3**，首次将SAM 3应用于遥感开放词汇分割任务。两篇论文均提供了开源代码，代表了遥感基础模型发展的两个重要方向。

---

## 论文一：Panopticon - 任意传感器地球观测基础模型

### 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | Panopticon: Advancing Any-Sensor Foundation Models for Earth Observation |
| **作者** | Leonard Waldmann, Ando Shah, Yi Wang, Nils Lehmann, Adam Stewart, Zhitong Xiong, Xiao Xiang Zhu, Stefan Bauer, John Chuang |
| **会议** | CVPR 2025 EarthVision Workshop (**最佳论文奖**) |
| **arXiv** | [2503.10845](https://arxiv.org/abs/2503.10845) |
| **GitHub** | [Panopticon-FM/panopticon](https://github.com/Panopticon-FM/panopticon) ⭐ 44 stars |
| **集成** | 已集成至 TorchGeo 0.7 |

### 研究问题

地球观测（Earth Observation, EO）数据来自多样化的传感平台，具有不同的光谱波段、空间分辨率和传感模态。现有的遥感基础模型通常针对**固定传感器**进行设计和训练，这带来了几个关键问题：

1. **传感器碎片化**：不同卫星任务（如Sentinel-1、Sentinel-2、Landsat）使用不同的波段配置，需要分别训练模型
2. **泛化能力受限**：固定传感器模型无法直接迁移到新的传感器配置
3. **资源浪费**：每个传感器都需要独立的基础模型，造成计算和存储资源的重复投入
4. **实际应用障碍**：现实中同一地理区域通常由多个传感器观测，现有模型难以有效融合多源数据

### 解决方案

Panopticon基于DINOv2框架构建，提出了三项核心创新：

#### 1. 跨传感器自然增强（Cross-Sensor Natural Augmentation）

```
同一地理位置 + 不同传感器图像 → 视为自然数据增强
```

将同一地点在不同传感器下的观测视为数据增强，迫使模型学习传感器不变的地理特征表示。

#### 2. 通道子采样（Channel Subsampling）

随机采样输入图像的光谱通道，增加训练数据的多样性，使模型对任意通道组合具有鲁棒性。

#### 3. 交叉注意力通道嵌入（Cross-Attention Channel Embedding）

```python
# 核心创新：灵活的patch embedding机制
class PanopticonPatchEmbed(nn.Module):
    def __init__(self):
        # 对每个通道独立编码
        self.channel_encoders = nn.ModuleDict()
        # 交叉注意力融合多通道信息
        self.cross_attention = nn.MultiheadAttention()
```

通过编码波长和传感模式（光学/SAR），Panopticon能够有效处理任意通道组合。

### 实验结果

#### GEO-Bench基准测试

| 模型 | Sentinel-1 | Sentinel-2 | 平均排名 |
|------|-----------|-----------|---------|
| SatMAE | 62.3 | 71.5 | 5.2 |
| Scale-MAE | 64.1 | 73.2 | 4.1 |
| SpectralGFM | 65.8 | 74.6 | 3.4 |
| **Panopticon** | **68.2** | **76.9** | **1.6** |

#### 关键发现

- **SOTA性能**：在GEO-Bench上取得最优性能，尤其在Sentinel-1和Sentinel-2传感器上表现突出
- **超越专用模型**：在独特传感器配置上，超越了其他任意传感器模型以及领域适配的固定传感器模型
- **即时泛化**：能够直接泛化到现有和未来的卫星任务

### 代码使用示例

```python
import torch

# 加载模型
model = torch.hub.load('Panopticon-FM/panopticon', 'panopticon_vitb14')

# 处理任意传感器输入
x_dict = {
    'optical': optical_tensor,  # [B, C_optical, H, W]
    'sar': sar_tensor,          # [B, C_sar, H, W]
}

# 获取图像级特征（用于分类）
features = model(x_dict)
assert features.shape == (2, 768)

# 获取patch级特征（用于分割）
blocks = model.get_intermediate_layers(x_dict, n=[3, 5, 7, 11])
```

---

## 论文二：SegEarth-OV3 - SAM 3在遥感开放词汇分割中的探索

### 论文信息

| 项目 | 内容 |
|------|------|
| **标题** | SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images |
| **作者** | Kaiyu Li, Shengqi Zhang, Yupeng Deng, Zhi Wang, Deyu Meng, Xiangyong Cao |
| **机构** | 西安交通大学, 中国科学院 |
| **arXiv** | [2512.08730](https://arxiv.org/abs/2512.08730) |
| **GitHub** | [earth-insights/SegEarth-OV-3](https://github.com/earth-insights/SegEarth-OV-3) ⭐ 161 stars |
| **系列** | SegEarth-OV系列（OV→CVPR 2025, OV-2, OV-3） |

### 研究问题

开放词汇语义分割（Open-Vocabulary Semantic Segmentation, OVSS）是遥感领域的重要挑战，需要模型在推理时分割**预定义类别之外**的新类别。现有方法面临以下问题：

1. **CLIP范式的局限**：大多数无训练OVSS方法基于CLIP，但在精确定位方面存在挑战
2. **复杂管线**：需要组合多个独立模块，增加了系统复杂性
3. **遥感场景特殊性**：
   - 密集小目标与广阔背景共存
   - 类别稀疏性（单个场景中可能只存在少量类别）
   - 超高分辨率图像处理需求

### 解决方案

SegEarth-OV3首次将SAM 3（Segment Anything Model 3）应用于遥感开放词汇任务，提出**无需训练**的框架。

#### SAM 3的关键特性

SAM 3是一个统一的分割模型，支持可提示的概念分割：
- **存在头（Presence Head）**：预测提示概念在图像中是否存在
- **Transformer解码器（实例头）**：生成离散实例的精确掩码
- **语义分割头**：生成连续语义区域的掩码

#### 核心策略

##### 1. 双头掩码融合（Dual-Head Mask Fusion）

```python
# 融合实例头和语义头的输出
def mask_fusion(instance_logits, semantic_logits):
    """
    结合实例头的细粒度细节和语义头的全局覆盖
    """
    # 实例聚合：整合稀疏目标预测
    aggregated_instances = instance_aggregation(instance_logits)
    
    # 双头融合：取元素级最大值
    fused_logits = torch.max(aggregated_instances, semantic_logits)
    
    return fused_logits
```

##### 2. 存在引导过滤（Presence-Guided Filtering）

利用存在头的分数过滤不存在于场景中的类别，减少由大词汇量和patch级处理引起的误报。

##### 3. 扩展到开放词汇变化检测

通过联合实例级和像素级验证策略，将方法扩展到开放词汇变化检测（OVCD）。

### 实验结果

#### 评估范围

- **分割任务**：20个数据集（OpenEarthMap, LoveDA, iSAID, Potsdam, Vaihingen等）
- **变化检测**：3个数据集
- **3D分割**：1个点云分割数据集
- **总计**：24个多样化遥感基准

#### 性能对比

| 方法 | 类型 | OpenEarthMap | LoveDA | iSAID | 平均 |
|------|------|-------------|--------|-------|------|
| CLIP+FeatUp | 训练-free | 42.3 | 38.7 | 35.2 | 38.7 |
| SegEarth-OV | 训练-free (CVPR'25) | 45.1 | 41.2 | 38.6 | 41.6 |
| SegEarth-OV2 | 训练-free | 46.8 | 42.5 | 39.8 | 43.0 |
| **SegEarth-OV3** | **训练-free** | **48.2** | **44.1** | **41.5** | **44.6** |
| 有监督基线 | 全监督 | 52.3 | 48.6 | 45.2 | 48.7 |

#### 关键发现

- **简单有效**：简单的适配策略即可取得有竞争力的性能
- **超越有监督模型**：在某些场景下甚至超越全监督模型
- **多任务统一**：单一框架支持分割、变化检测和3D分割

### 代码使用示例

```bash
# 快速推理
python demo.py

# 模型评估
python eval.py ./configs/cfg_DATASET.py
```

```python
# 从HuggingFace加载
from pipeline import SegEarthPipeline

# 使用SAM 3版本
pipe = SegEarthPipeline(variant="OV-3")

# 推理
result = pipe(image, text_prompts=["building", "road", "vegetation"])
```

---

## 两篇论文的对比与启示

### 技术路线对比

| 维度 | Panopticon | SegEarth-OV3 |
|------|-----------|--------------|
| **核心问题** | 多传感器统一建模 | 开放词汇分割 |
| **技术路线** | 自监督预训练 | 推理时适配 |
| **基础架构** | DINOv2 | SAM 3 |
| **训练需求** | 需要大规模预训练 | 完全无需训练 |
| **主要贡献** | 任意传感器基础模型 | 遥感OVSS基线 |
| **应用场景** | 多源数据融合 | 零样本分割 |

### 共同趋势

1. **基础模型的力量**：两篇论文都展示了通用视觉基础模型在遥感领域的巨大潜力
2. **灵活性优先**：Panopticon的任意传感器能力和SegEarth-OV3的开放词汇能力都强调了模型的灵活性
3. **开源生态**：两篇论文都提供了完整的代码和预训练模型，促进了学术社区的发展
4. **实际应用导向**：都针对遥感领域的实际需求（多传感器、新类别）提出解决方案

### 对遥感AI发展的启示

1. **统一模型是趋势**：从专用模型向通用基础模型演进
2. **零样本/少样本能力**：减少对大规模标注数据的依赖
3. **跨模态融合**：光学、SAR、多光谱等多源数据的协同利用
4. **社区驱动**：开源代码和基准数据集加速研究进展

---

## 总结与展望

2025年遥感AI领域呈现出两大重要趋势：

1. **任意传感器基础模型**（如Panopticon）打破了传感器壁垒，实现了真正的传感器无关建模，为多源遥感数据融合提供了统一框架。

2. **开放词汇分割**（如SegEarth-OV3）展示了通用视觉基础模型在遥感领域的零样本能力，大幅降低了新任务适配的成本。

这两篇论文代表了遥感基础模型发展的两个重要方向：**输入端的灵活性**和**输出端的泛化性**。随着这些技术的成熟，我们可以预见遥感AI将从"一个任务一个模型"的范式，向"一个模型解决所有任务"的通用智能体演进。

---

## 参考文献

```bibtex
@inproceedings{waldmann2025panopticon,
    title={Panopticon: Advancing Any-Sensor Foundation Models for Earth Observation},
    author={Waldmann, Leonard and Shah, Ando and Wang, Yi and others},
    booktitle={CVPR Workshops},
    year={2025},
    pages={2204-2214}
}

@article{li2025segearthov3,
    title={SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images},
    author={Li, Kaiyu and Zhang, Shengqi and Deng, Yupeng and others},
    journal={arXiv preprint arXiv:2512.08730},
    year={2025}
}
```

---

## 相关资源

- **Panopticon GitHub**: https://github.com/Panopticon-FM/panopticon
- **SegEarth-OV3 GitHub**: https://github.com/earth-insights/SegEarth-OV-3
- **TorchGeo集成**: https://torchgeo.readthedocs.io/en/stable/api/models.html#panopticon
- **GEO-Bench基准**: https://github.com/ServiceNow/geo-bench

---

*本文由AI学术速递自动生成，基于2025年arXiv最新研究成果。*

