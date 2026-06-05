---
title: "🛣️ SAM Road - 道路网络图提取"
slug: "sam_road"
description: "CVPRW 2024 最佳论文 - 基于 SAM 的道路网络图提取"
category: "remote-sensing"
style: "academic"
featured: true
weight: 2
---

# 🛣️ SAM Road - 道路网络图提取

**CVPRW 2024 最佳论文** - 基于 Segment Anything Model (SAM) 的道路网络图自动提取

> 📄 [论文链接](https://openaccess.thecvf.com/content/CVPR2024W/SG2RL/papers/Hetang_Segment_Anything_Model_for_Road_Network_Graph_Extraction_CVPRW_2024_paper.pdf) | 🏆 [最佳论文奖](https://sites.google.com/corp/view/sg2rl/)

## 🎯 研究目标

从卫星影像中自动提取道路网络的**拓扑图结构**（节点 + 边），而非传统的像素级分割。

## ✨ 核心创新

1. **SAM 集成**：利用 SAM 的强大分割能力提取道路掩码
2. **图拓扑提取**：从掩码中推导道路交叉点和路段
3. **端到端流程**：从原始影像到图结构的完整 pipeline

## 📊 实验结果

### 数据集
- **CityScale**：20 个城市，2km × 2km 区域
- **SpaceNet**：大规模卫星影像数据集

### 评估指标
- **APLS**：Average Path Length Similarity
- **TOPO**：拓扑准确性指标

### 性能
- 在 CityScale 数据集上达到 SOTA 性能
- 在复杂城市场景中表现优异

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| **模型** | PyTorch + PyTorch Lightning |
| **骨干网络** | SAM ViT-B |
| **训练** | WandB 日志 |
| **推理** | ONNX 导出支持 |

## 📦 预训练模型

| 数据集 | 模型 | 链接 |
|--------|------|------|
| CityScale | ViT-B 512 | [HuggingFace](https://huggingface.co/congrui/sam_road) |
| SpaceNet | ViT-B 256 | [HuggingFace](https://huggingface.co/congrui/sam_road) |

## 🚀 快速开始

```bash
# 安装依赖
pip install torch pytorch-lightning wandb

# 下载预训练模型
# 放置到 sam_ckpts/ 目录

# 推理
python inferencer.py \
  --config=config/toponet_vitb_512_cityscale.yaml \
  --checkpoint=path_to_ckpt

# 评估
cd cityscale_metrics && bash eval_schedule.bash
```

## 📸 Demo

> 预测的道路网络图（2km × 2km 区域）和密集城市区域的道路掩码和图结构

**Demo 图片可访问 GitHub 仓库查看：** [sam_road/imgs](https://github.com/congrui/sam_road/tree/main/imgs)

## 📚 引用

```bibtex
@article{hetang2024segment,
  title={Segment Anything Model for Road Network Graph Extraction},
  author={Hetang, Congrui and Xue, Haoru and Le, Cindy and Yue, Tianwei and Wang, Wenping and He, Yihui},
  journal={arXiv preprint arXiv:2403.16051},
  year={2024}
}
```

## 🔗 相关资源

- 📄 [论文 PDF](https://arxiv.org/pdf/2403.16051.pdf)
- 💻 [GitHub 仓库](https://github.com/congrui/sam_road)
- 🤗 [HuggingFace 模型](https://huggingface.co/congrui/sam_road)
