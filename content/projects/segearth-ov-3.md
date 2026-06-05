---
title: "🌍 SegEarth-OV3 - 遥感开放词汇分割"
slug: "segearth-ov-3-main"
description: "基于 SAM 3 的遥感图像开放词汇语义分割"
category: "remote-sensing"
style: "academic"
featured: true
weight: 3
---

# 🌍 SegEarth-OV3 - 遥感开放词汇分割

**基于 SAM 3 的遥感图像开放词汇语义分割，无需训练**

> 📄 [arXiv](https://arxiv.org/abs/2512.08730) | 💻 [GitHub](https://github.com/earth-insights/SegEarth-OV-3)

## 🎯 研究目标

实现**零训练**的遥感图像开放词汇语义分割，用户只需提供文本提示（如 "building", "road", "water"），模型即可分割对应地物。

## ✨ 核心创新

1. **SAM 3 适配**：将 SAM 3 应用于遥感场景
2. **双头掩码融合**：结合语义头和实例头的优势
3. **存在性引导过滤**：利用存在分数抑制误检
4. **超大图支持**：支持 10k × 10k 以上分辨率

## 📊 支持的数据集

### 语义分割
- OpenEarthMap, LoveDA, iSAID, Potsdam, Vaihingen
- UAVid, UDD5, VDD

### 建筑提取
- WHU Aerial, WHU Sat.Ⅱ, Inria, xBD

### 道路提取
- CHN6-CUG, DeepGlobe, Massachusetts, SpaceNet

### 水体提取
- WBS-SI

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| **模型** | SAM 3 (Segment Anything Model 3) |
| **框架** | mmcv + mmsegmentation |
| **推理** | Python + PyTorch |

## 🚀 快速开始

```bash
# 安装依赖
pip install mmcv mmsegmentation

# 下载 SAM 3 检查点
# 从 HuggingFace 或 ModelScope 下载

# 快速推理
python demo.py

# 评估
python eval.py ./configs/cfg_DATASET.py
```

## 📸 推理效果

> 在超过 10k × 10k 分辨率的遥感图像上的推理结果

## 📚 引用

```bibtex
@article{segearth-ov3,
  title={SegEarth-OV3: Exploring SAM 3 for Open-Vocabulary Semantic Segmentation in Remote Sensing Images},
  author={Li, Kaiyu and Zhang, Shengqi and Deng, Yupeng and Wang, Zhi and Meng, Deyu and Cao, Xiangyong},
  year={2025}
}
```

## 🔗 相关资源

- 📄 [arXiv 论文](https://arxiv.org/abs/2512.08730)
- 💻 [GitHub 仓库](https://github.com/earth-insights/SegEarth-OV-3)
- 🎬 [Demo 脚本](https://github.com/earth-insights/SegEarth-OV-3/blob/main/demo.py)
