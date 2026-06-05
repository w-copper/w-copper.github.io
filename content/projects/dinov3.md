---
title: "🧠 DINOv3 - Meta 视觉基础模型"
slug: "dinov3"
description: "Meta FAIR 最新视觉基础模型，支持卫星图像预训练"
category: "ai-deep-learning"
style: "academic"
weight: 5
---

# 🧠 DINOv3 - Meta 视觉基础模型

**Meta FAIR 最新视觉基础模型家族**，DINOv2 的后继者

> 💻 [GitHub](https://github.com/facebookresearch/dinov3) | 🤗 [HuggingFace](https://huggingface.co/facebook)

## 🎯 模型特点

- 🌍 **通用视觉特征**：强大的图像理解能力
- 🛰️ **卫星图像支持**：SAT-493M 预训练模型
- 🔍 **密集特征**：像素级特征提取
- 📐 **深度估计**：单目深度预测
- 🎯 **目标检测**：零样本目标定位
- 🗣️ **文本对齐**：dino.txt 文本-图像对齐

## 📦 模型变体

| 模型 | 参数量 | 特点 |
|------|--------|------|
| ViT-S | 22M | 轻量级 |
| ViT-B | 86M | 平衡 |
| ViT-L | 304M | 高精度 |
| ViT-H | 632M | 大规模 |
| ViT-7B | 6.7B | 超大规模 |
| ConvNeXt | - | CNN 变体 |

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| **框架** | PyTorch |
| **集成** | HuggingFace Transformers |
| **训练** | 分布式训练 |
| **评估** | 多任务评估 |

## 🚀 快速开始

```python
import torch
from transformers import Dinov3Model, Dinov3Processor

# 加载模型
model = Dinov3Model.from_pretrained("facebook/dinov3-vitl14")
processor = Dinov3Processor.from_pretrained("facebook/dinov3-vitl14")

# 处理图像
inputs = processor(images=image, return_tensors="pt")
outputs = model(**inputs)

# 获取特征
features = outputs.last_hidden_state
```

## 🛰️ 卫星图像应用

DINOv3 提供专门的卫星图像预训练模型（SAT-493M），适用于：

- 🏠 建筑检测
- 🌳 植被分类
- 🚗 车辆计数
- 🌊 水体提取
- 🛣️ 道路提取

## 📚 引用

```bibtex
@article{dinov3,
  title={DINOv3: Self-supervised Vision Transformers at Scale},
  author={Meta FAIR},
  year={2025}
}
```

## 🔗 相关资源

- 💻 [GitHub 仓库](https://github.com/facebookresearch/dinov3)
- 🤗 [HuggingFace 模型](https://huggingface.co/facebook)
- 📓 [Colab Notebooks](https://github.com/facebookresearch/dinov3/tree/main/notebooks)
