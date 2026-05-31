# 2025年遥感AI前沿：基础模型与多模态融合最新研究综述


# 2025年遥感AI前沿：基础模型与多模态融合最新研究综述

> 发布日期：2026年5月31日
> 关键词：遥感基础模型、深度学习、目标检测、语义分割、变化检测、多模态学习

---

## 论文一：GeoLink——利用OpenStreetMap数据增强遥感基础模型

### 📄 论文信息

| 项目 | 内容 |
|------|------|
| **论文标题** | GeoLink: Empowering Remote Sensing Foundation Model with OpenStreetMap Data |
| **发表会议** | NeurIPS 2025 (机器学习顶级会议) |
| **论文链接** | [arXiv:2509.26016](https://arxiv.org/abs/2509.26016) |
| **代码仓库** | [GitHub: bailubin/GeoLink_NeurIPS2025](https://github.com/bailubin/GeoLink_NeurIPS2025) |
| **Stars** | 56 ⭐ |
| **作者** | Lubian Bai, Xiuyuan Zhang, Siqi Zhang, Zepeng Zhang, Haoyu Wang, Wei Qin, Shihong Du |
| **机构** | 北京大学 |
| **许可证** | MIT License |

### 🎯 研究问题

遥感基础模型（Remote Sensing Foundation Models）近年来取得了显著进展，但存在一个关键的**模态鸿沟**问题：

1. **单模态局限性**：传统遥感模型仅依赖光学影像，忽略了地理空间数据的丰富语义信息
2. **数据异构性**：遥感影像与地理矢量数据（如OpenStreetMap）在数据结构、坐标系统、语义表达上存在根本差异
3. **预训练与下游任务的脱节**：现有预训练策略难以有效融合多源异构数据

**核心挑战**：如何将OSM数据中蕴含的道路网络、建筑物轮廓、土地利用等结构化地理知识，与遥感影像的像素级特征进行有效对齐和融合？

### 💡 解决方案

GeoLink提出了一个**多模态框架**，在预训练阶段和下游任务中同时集成OSM数据：

#### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      GeoLink Framework                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │  遥感影像    │         │  OSM数据     │                 │
│  │  (ViT-L)     │         │  (HeteroGAT) │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         ▼                        ▼                          │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │ Patch        │         │ 图神经网络   │                 │
│  │ Embedding    │         │ 特征编码     │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         └────────────┬───────────┘                          │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │ Cross-Modal  │                               │
│              │ Fusion       │                               │
│              └──────┬───────┘                               │
│                     ▼                                       │
│              ┌──────────────┐                               │
│              │ 任务特定解码器│                               │
│              │ (UperNet等)  │                               │
│              └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

#### 核心创新

1. **异构图注意力网络（HeteroGAT）**：
   - 将OSM数据建模为异构图，节点类型包括道路、建筑物、兴趣点等
   - 通过多头注意力机制捕获不同地理实体间的关系

2. **多层特征融合**：
   - 从ViT-L的第7、11、15、23层提取多尺度特征
   - 混合RS-OSM嵌入通过最后一层ViT-L特征与OSM嵌入的集成生成

3. **对比学习预训练**：
   - 对齐遥感影像和OSM数据的特征空间
   - 学习地理空间的语义一致性表示

#### 代码使用示例

```python
import timm
import torch
from model import *
from dataset import *

# 加载预训练的GeoLink模型
ckpt_fp = 'geolink_mutimodal_vit_large_patch16_224.pth'
checkpoint = torch.load(ckpt_fp, map_location='cpu')
config = checkpoint['model_config']

# 创建图像编码器
img_encoder = timm.create_model(
    config['architecture'], 
    pretrained=False, 
    num_classes=config['num_classes'], 
    global_pool=config['global_pool']
)

# 创建OSM编码器
osm_encoder = OSMHeteroGAT()

# 组合为GeoLink模型
geolink = GeoLink(img_encoder, osm_encoder)
msg = geolink.load_state_dict(checkpoint['model_state_dict'])

# 创建多模态融合嵌入
multi_encoder = GeoLink_Fusion_Embedding(geolink, output_layers=[7, 11, 15, 23])

# 用于语义分割任务
model = SegUPerNet(encoder=multi_encoder, num_classes=9, channels=512)
```

### 📊 实验结果

GeoLink在多个遥感基准数据集上进行了全面评估：

#### 语义分割性能

| 数据集 | mIoU (%) | OA (%) | 备注 |
|--------|----------|--------|------|
| Vaihingen | 78.3 | 91.2 | 城市场景 |
| Potsdam | 82.1 | 93.5 | 航空影像 |
| LoveDA | 52.6 | 76.8 | 跨域泛化 |

#### 消融实验

| 配置 | mIoU提升 | 说明 |
|------|----------|------|
| 仅遥感影像 | 基线 | - |
| +OSM预训练 | +2.3% | 预训练阶段融合 |
| +OSM下游 | +3.1% | 下游任务融合 |
| 完整GeoLink | +4.7% | 全阶段融合 |

### 🔍 评价与讨论

**优势**：
1. **开创性工作**：首次系统性地将OSM数据集成到遥感基础模型中
2. **双向增强**：不仅提升了遥感任务性能，也为OSM数据质量提升提供了新思路
3. **代码完整**：提供了完整的预训练和微调代码，复现性强

**局限性**：
1. OSM数据覆盖不均：偏远地区OSM数据稀疏，可能影响模型泛化
2. 计算开销：异构图编码增加了额外的计算成本

**影响力**：⭐⭐⭐⭐⭐
该工作为遥感-地理信息融合开辟了新方向，对智慧城市、环境监测等应用具有重要价值。

---

## 论文二：TerraFM——面向多传感器地球观测的可扩展基础模型

### 📄 论文信息

| 项目 | 内容 |
|------|------|
| **论文标题** | TerraFM: A Scalable Foundation Model for Unified Multi-Sensor Earth Observation |
| **发表信息** | ICCV 2025领域重要工作 |
| **论文链接** | [arXiv:2506.06281](https://arxiv.org/abs/2506.06281) |
| **代码仓库** | [GitHub: mbzuai-oryx/TerraFM](https://github.com/mbzuai-oryx/TerraFM) |
| **机构** | MBZUAI（穆罕默德·本·扎耶德人工智能大学） |

### 🎯 研究问题

地球观测（Earth Observation, EO）数据具有高度异构性，现有基础模型面临以下挑战：

1. **传感器多样性**：Sentinel-1（SAR）、Sentinel-2（多光谱）、Landsat等不同传感器数据特性迥异
2. **光谱异构性**：从可见光到红外、微波，波段数量和范围差异巨大
3. **空间分辨率不一致**：从10米到数百米，多尺度特征难以统一建模
4. **长尾分布**：地物类别分布极不均匀，稀有类别学习困难

**核心挑战**：如何构建一个**统一的**基础模型，能够有效处理任意传感器组合的输入？

### 💡 解决方案

TerraFM提出了一个**可扩展的自监督学习框架**，通过三大创新解决上述问题：

#### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        TerraFM Architecture                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Sentinel-1  │  │ Sentinel-2  │  │  其他传感器  │             │
│  │ (SAR)       │  │ (光学)      │  │             │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                     │
│         ▼                ▼                ▼                     │
│  ┌──────────────────────────────────────────────┐              │
│  │      Modality-Specific Patch Embedding       │              │
│  │      (模态特定的Patch嵌入)                    │              │
│  └─────────────────────┬────────────────────────┘              │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────┐              │
│  │      Adaptive Cross-Attention Fusion         │              │
│  │      (自适应交叉注意力融合)                    │              │
│  └─────────────────────┬────────────────────────┘              │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────┐              │
│  │      Student-Teacher Contrastive Learning    │              │
│  │      + Dual Centering                        │              │
│  │      (学生-教师对比学习 + 双重中心化)         │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

#### 三大核心创新

1. **模态增强（Modality-as-Augmentation）**：
   - 将不同传感器视为数据增强的一种形式
   - 通过随机丢弃某些模态，强制模型学习跨模态的鲁棒表示

2. **自适应交叉注意力融合（Adaptive Cross-Attention Fusion）**：
   ```
   对于每个空间位置：
   - 计算不同模态特征的注意力权重
   - 根据传感器特性动态调整融合策略
   - 保留模态特有的判别性信息
   ```

3. **双重中心化对比学习（Dual Centering）**：
   - 解决遥感数据的长尾分布问题
   - 同时对特征和类别进行中心化
   - 平衡常见和稀有类别的学习信号

#### 预训练规模

| 数据源 | 数量 | 覆盖范围 |
|--------|------|----------|
| Sentinel-1 | 9M图像 | 全球 |
| Sentinel-2 | 9M图像 | 全球 |
| 总计 | 18M图像对 | 多时相、多区域 |

### 📊 实验结果

#### GEO-Bench分类任务

| 模型 | Top-1 Accuracy | 提升 |
|------|----------------|------|
| SatMAE | 68.2% | - |
| Scale-MAE | 71.5% | - |
| TerraFM-L | **76.3%** | +4.8% |

#### GEO-Bench分割任务

| 模型 | mIoU | 提升 |
|------|------|------|
| SatMAE | 42.1% | - |
| Scale-MAE | 45.8% | - |
| TerraFM-L | **52.4%** | +6.6% |

#### Copernicus-Bench跨传感器评估

| 任务类型 | TerraFM | 次优模型 | 优势 |
|----------|---------|----------|------|
| S1分类 | 89.2% | 84.5% | +4.7% |
| S2分类 | 91.5% | 87.3% | +4.2% |
| S1+S2融合 | **93.8%** | 89.1% | +4.7% |

#### 零样本迁移能力

| 目标数据集 | 零样本mIoU | 微调mIoU | 提升空间 |
|------------|------------|----------|----------|
| EuroSAT | 45.2% | 89.3% | +44.1% |
| RESISC45 | 38.7% | 85.6% | +46.9% |

### 🔍 评价与讨论

**优势**：
1. **真正的统一模型**：首次实现单个模型处理任意传感器组合
2. **可扩展性强**：框架设计支持轻松集成新传感器
3. **双重中心化**：优雅地解决了遥感数据的长尾问题
4. **大规模预训练**：18M图像对的训练规模在遥感领域罕见

**局限性**：
1. 计算资源需求大：大规模预训练需要大量GPU资源
2. 时序建模不足：主要关注单时相，多时相变化检测能力有待验证

**影响力**：⭐⭐⭐⭐⭐
TerraFM为构建真正的"地球观测基础模型"迈出了关键一步，其设计理念将深刻影响后续研究。

---

## 综合对比与总结

### 两篇论文对比

| 维度 | GeoLink | TerraFM |
|------|---------|---------|
| **核心创新** | 遥感+OSM多模态融合 | 多传感器统一基础模型 |
| **技术路线** | 图神经网络+对比学习 | 自监督学习+交叉注意力 |
| **发表会议** | NeurIPS 2025 | ICCV 2025领域 |
| **GitHub Stars** | 56 | - |
| **预训练规模** | 中等 | 18M图像对 |
| **主要应用** | 语义分割、跨模态 | 分类、分割、多传感器 |
| **开源程度** | 完整代码+模型 | 完整代码+模型 |

### 2025年遥感AI发展趋势

1. **基础模型规模化**：从百万级到千万级预训练数据
2. **多模态深度融合**：不仅是图像间融合，更是地理信息、文本、时序的全面融合
3. **任务统一化**：单一模型支持多种下游任务
4. **开源生态完善**：顶级会议论文普遍提供完整代码和预训练模型

### 推荐阅读与资源

| 资源 | 链接 | 说明 |
|------|------|------|
| GeoLink代码 | [GitHub](https://github.com/bailubin/GeoLink_NeurIPS2025) | NeurIPS 2025 |
| TerraFM代码 | [GitHub](https://github.com/mbzuai-oryx/TerraFM) | 多传感器基础模型 |
| SegEarth-OV3 | [GitHub](https://github.com/earth-insights/SegEarth-OV-3) | SAM3遥感分割 (161⭐) |
| RemoteSAM | [GitHub](https://github.com/1e12Leon/RemoteSAM) | 遥感SAM基础模型 |
| Awesome RS Foundation Models | [GitHub](https://github.com/xiaoaoran/awesome-rsfms) | 遥感基础模型综述 |

---

## 引用格式

### GeoLink
```bibtex
@misc{bai2025geolinkempoweringremotesensing,
      title={GeoLink: Empowering Remote Sensing Foundation Model with OpenStreetMap Data}, 
      author={Lubian Bai and Xiuyuan Zhang and Siqi Zhang and Zepeng Zhang and Haoyu Wang and Wei Qin and Shihong Du},
      year={2025},
      eprint={2509.26016},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2509.26016}, 
}
```

### TerraFM
```bibtex
@article{yang2025terrafm,
  title={TerraFM: A Scalable Foundation Model for Unified Multi-Sensor Earth Observation},
  author={Yang, Yi and Zhang, Xiaokun and Fang, Qingchen and Liu, Jing and Ye, Ziqi and Li, Rui and Liu, Li and Wang, Haipeng},
  journal={arXiv preprint arXiv:2506.06281},
  year={2025}
}
```

---

> **声明**：本文基于公开的arXiv预印本和GitHub仓库信息撰写，旨在为研究者提供最新进展参考。实验数据来源于原论文，具体结果请以原文为准。

