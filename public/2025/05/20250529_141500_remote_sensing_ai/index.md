# 2025年遥感AI前沿：两篇顶级会议论文解读


# 2025年遥感AI前沿：两篇顶级会议论文解读

> 发布时间：2025年5月29日
> 关键词：遥感、深度学习、基础模型、Mamba、变化检测、语义分割

---

## 论文一：RemoteSAM - 面向地球观测的分割一切模型

### 1. 论文基本信息

| 项目 | 内容 |
|------|------|
| **标题** | RemoteSAM: Towards Segment Anything for Earth Observation |
| **作者** | Liang Yao, Fan Liu, Delong Chen, Chuanyi Zhang, Yijun Wang, Ziyun Chen, Wei Xu, Shimin Di, Yuhui Zheng |
| **会议** | ACM MM 2025（国际多媒体会议） |
| **论文链接** | https://arxiv.org/abs/2505.18022 |
| **代码仓库** | https://github.com/1e12Leon/RemoteSAM |

### 2. 研究问题

遥感图像解译面临的核心挑战：

- **任务碎片化**：现有方法针对不同任务（分类、检测、分割、定位）使用独立模型，接口不统一
- **语义覆盖有限**：训练数据集的语义类别范围狭窄，难以泛化到未见类别
- **计算效率低下**：基于大语言模型的方法参数量巨大（数十亿），难以处理高分辨率遥感图像

### 3. 解决方案

#### 3.1 自动化数据引擎（Automatic Data Engine）

构建了**RemoteSAM-270K**数据集：
- 包含270K图像-文本-掩码三元组
- 覆盖超过1000种物体类别
- 通过视觉语言模型（VLM）自动生成标注
- 引入层次化遥感语义词汇表RSVocab-1K

#### 3.2 任务统一范式（Task Unification Paradigm）

提出以**引用表达分割（Referring Expression Segmentation, RES）**为核心的统一架构：

```
输入：遥感图像 + 文本描述
    ↓
统一编码器（视觉-语言融合）
    ↓
像素级预测（原子单元）
    ↓
上兼容：区域级、图像级任务
```

**核心优势**：
- 单一模型处理多种任务，无需任务特定头
- 参数量从数十亿降至数百万（一个数量级的缩减）
- 支持高分辨率数据高效处理

### 4. 实验结果

#### 4.1 引用表达分割（RES）

| 数据集 | RemoteSAM | 前SOTA | 提升 |
|--------|-----------|--------|------|
| RRSIS | 67.52% | 64.31% | +3.21% |
| RISBench | 新SOTA | - | 显著提升 |

#### 4.2 零样本分类

在SATIN数据集上，RemoteSAM展现出强大的零样本分类能力，无需微调即可超越专用视觉基础模型。

#### 4.3 多任务性能

- **语义分割**：在Vaihingen等数据集上表现优异
- **目标检测**：在DOTA、DIOR等数据集上取得竞争性结果
- **多标签分类**：相比CLIP基线提升约25%

### 5. 代码使用示例

```shell
# 引用表达分割评估
bash tasks/REF.sh

# 语义分割评估
bash tasks/SEG.sh

# 目标检测评估
bash tasks/DET.sh

# 视觉定位评估
bash tasks/VG.sh

# 多标签分类评估
bash tasks/MLC.sh
```

---

## 论文二：RoMA - 面向遥感的Mamba基础模型扩展框架

### 1. 论文基本信息

| 项目 | 内容 |
|------|------|
| **标题** | RoMA: Scaling up Mamba-based Foundation Models for Remote Sensing |
| **作者** | Fengxiang Wang, Hongzhen Wang, Yulin Wang, Di Wang, Mingshuo Chen, Haiyan Zhao, Yangang Sun, Shuo Wang, Long Lan, Wenjing Yang, Jing Zhang |
| **会议** | NeurIPS 2025（神经信息处理系统大会） |
| **论文链接** | https://arxiv.org/abs/2503.10392 |
| **代码仓库** | https://github.com/MiliLab/RoMA |

### 2. 研究问题

Vision Transformer在遥感基础模型中的局限性：

- **计算复杂度高**：自注意力机制的二次复杂度O(n²)限制了高分辨率图像处理
- **可扩展性差**：大模型和大数据集的训练成本过高
- **现有Mamba应用有限**：仅限于小规模监督任务，缺乏自监督预训练框架

### 3. 解决方案

#### 3.1 RoMA框架概述

RoMA（Rotation-aware Multi-scale Autoregressive learning）是首个面向遥感的Mamba架构自监督预训练框架。

```
核心创新
├── 旋转感知预训练机制
│   ├── 自适应裁剪（Adaptive Cropping）
│   └── 角度嵌入（Angular Embeddings）
└── 多尺度Token预测目标
    └── 解决遥感图像中物体尺度极端变化问题
```

#### 3.2 旋转感知预训练

针对遥感图像中物体任意方向分布的特点：
- **自适应裁剪**：根据物体方向动态调整裁剪策略
- **角度嵌入**：编码物体旋转信息，增强方向感知能力

#### 3.3 多尺度预测策略

解决遥感场景中物体尺度变化剧烈的问题：
- 从车辆级别（几米）到体育场级别（数百米）
- 多尺度Token预测捕获不同粒度的语义信息

### 4. 实验结果

#### 4.1 场景分类

| 方法 | 骨干网络 | 参数量 | AID (OA%) | UCM (OA%) |
|------|----------|--------|-----------|-----------|
| MAE | ViT-B | 86M | 84.21 | 52.75 |
| SatMAE++ | ViT-L | 307M | 85.98 | 55.72 |
| **RoMA** | Mamba-B | 85M | **87.36** | **59.45** |

#### 4.2 变化检测

| 方法 | 骨干网络 | OSCD (F1%) |
|------|----------|------------|
| ARM | Mamba-B | 47.28 |
| **RoMA** | Mamba-B | **55.63** |

#### 4.3 语义分割

| 方法 | 骨干网络 | SpaceNetv1 (mF1%) |
|------|----------|-------------------|
| SatMAE++ | ViT-L | 79.21 |
| **RoMA** | Mamba-B | **79.50** |

#### 4.4 扩展性验证

**数据规模扩展**：
- 从62.5K到4M样本，性能持续提升
- 无明显性能瓶颈

**模型规模扩展**：
- Tiny → Small → Base → Large
- 性能随参数量增加而稳定提升

#### 4.5 计算效率对比

| 指标 | Mamba-B vs ViT-B |
|------|------------------|
| 推理速度 | 1.56× 更快 |
| GPU内存占用 | 降低78.9% |
| 输入分辨率 | 1248×1248 |

### 5. 代码使用示例

```python
# 预训练
python pretrain.py --config configs/pretrain_mamba_base.yaml

# 场景分类微调
python finetune.py --task classification --dataset AID

# 变化检测
python finetune.py --task change_detection --dataset OSCD

# 语义分割
python finetune.py --task segmentation --dataset SpaceNetv1
```

---

## 两篇论文的对比分析

| 维度 | RemoteSAM | RoMA |
|------|-----------|------|
| **核心任务** | 多任务统一（分割、检测、分类） | 基础模型预训练 |
| **技术路线** | 引用表达分割 + 任务统一 | Mamba + 自监督学习 |
| **骨干网络** | 视觉-语言融合编码器 | Mamba（状态空间模型） |
| **数据策略** | 270K图像-文本-掩码三元组 | 400万无标注遥感图像 |
| **创新点** | 自动化数据引擎 + 任务统一范式 | 旋转感知 + 多尺度预测 |
| **会议级别** | ACM MM 2025 | NeurIPS 2025 |
| **开源状态** | ✅ 已开源 | ✅ 已开源 |

---

## 研究趋势总结

### 2025年遥感AI的三大趋势

1. **基础模型崛起**
   - 从任务特定模型转向通用基础模型
   - 自监督预训练成为主流范式

2. **架构创新**
   - Mamba（状态空间模型）挑战Transformer霸主地位
   - 线性复杂度带来计算效率质的飞跃

3. **数据驱动**
   - 大规模高质量数据集成为关键
   - 自动化标注引擎降低人工成本

### 未来展望

- **多模态融合**：光学、SAR、高光谱数据的统一建模
- **时序分析**：多时相遥感数据的动态理解
- **轻量化部署**：边缘设备上的实时推理

---

## 参考文献

```bibtex
@misc{yao2025RemoteSAM,
      title={RemoteSAM: Towards Segment Anything for Earth Observation}, 
      author={Liang Yao and Fan Liu and Delong Chen and Chuanyi Zhang and Yijun Wang and Ziyun Chen and Wei Xu and Shimin Di and Yuhui Zheng},
      year={2025},
      eprint={2505.18022},
      archivePrefix={arXiv},
      primaryClass={cs.CV},
      url={https://arxiv.org/abs/2505.18022}, 
}

@article{wang2025RoMA,
      title={RoMA: Scaling up Mamba-based Foundation Models for Remote Sensing},
      author={Fengxiang Wang and Hongzhen Wang and Yulin Wang and Di Wang and Mingshuo Chen and Haiyan Zhao and Yangang Sun and Shuo Wang and Long Lan and Wenjing Yang and Jing Zhang},
      year={2025},
      eprint={2503.10392},
      archivePrefix={arXiv},
      url={https://arxiv.org/abs/2503.10392}
}
```

---

*本文由AI助手自动生成，基于arXiv 2025年最新遥感深度学习论文整理。*

