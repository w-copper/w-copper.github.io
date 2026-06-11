---
title: "RS-34 Missing-Band Reconstruction vs Robust Adaptation"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["高光谱", "多光谱", "谱段适配"]
categories: ["时序变化、跨域泛化与可信评测"]
draft: false
---

# RS-34 Missing-Band Reconstruction vs Robust Adaptation

## 摘要

遥感模型遇到缺失 band 有两条路线：先重建缺失 band 再做下游任务，或让模型直接对缺失 band 鲁棒。2024-2026 的光谱 foundation model、masked spectral modeling 和扩散式 band repair 让这个问题重新变得有研究价值。核心判断是：如果下游任务需要物理可解释的光谱曲线，重建路线更强；如果目标是分类/分割泛化，鲁棒适配可能更简单、更稳。

## 问题由来

真实遥感输入经常不完整：传感器原生 band 不同、云和质量控制屏蔽部分波段、不同产品处理级别不一致、商业卫星只提供少数通道。直接补零或丢弃样本会造成信息浪费；但盲目重建 band 也可能生成光谱上好看、下游却有害的伪信号。

## 代表论文与项目

| 工作 | 年份 | 链接 | 相关性 |
|---|---:|---|---|
| SatMAE++ | 2024 | [arXiv](https://arxiv.org/abs/2403.05419), [GitHub](https://github.com/techmn/satmae_pp) | masked pretraining 的固定/多光谱基线。 |
| DOFA | 2024 | [arXiv](https://arxiv.org/abs/2403.15356), [GitHub](https://github.com/zhu-xlab/DOFA) | 动态适配不同观测通道。 |
| SpectralEarth | 2025 | [arXiv](https://arxiv.org/abs/2408.08447), [GitHub](https://github.com/AABNassim/spectral_earth) | 大规模 EnMAP 高光谱预训练数据和基准。 |
| HyperFree | 2025 | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html) | channel-adaptive/tuning-free，适合作为直接鲁棒适配基线。 |
| Multispectral to Hyperspectral using Pretrained FM | 2025 | [arXiv](https://arxiv.org/abs/2502.19451) | MSI 到 HSI 重建路线代表。 |
| AnyBand-Diff | 2026 | [arXiv](https://arxiv.org/abs/2605.14341) | spectral-prior-guided diffusion band repair。 |
| Any-Optical-Model | 2026 | [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/37583/41545) | 直接评估 missing bands、cross-sensor、cross-resolution 鲁棒性。 |
| SpectralEarth-FM | 2026 | [arXiv](https://arxiv.org/abs/2605.21075) | 多模态 EO 预训练中接入 HSI。 |

## 两条路线

### 先重建再推理

优点：输出完整光谱，适合光谱指数、物理反演、材料识别和可解释分析。  
缺点：重建误差会传播到下游；生成模型可能产生看似合理但物理不真实的 band。

### 直接鲁棒适配

优点：训练目标直接对下游任务负责，不必保证每个 band 重建精确。  
缺点：对需要完整光谱曲线的任务不够透明，也难以解释缺 band 时模型到底依赖什么。

## 当前问题

- 论文常只用随机 band dropout，缺少真实传感器不可观测 band 的设置。
- reconstruction metric，如 SAM/PSNR/RMSE，不一定预测下游 mIoU/F1。
- 缺少不确定性输出：重建 band 应告诉用户哪些波段不可靠。
- 多分辨率 band 的缺失和重建常被简化成同分辨率 cube。

## 可执行研究方案

题目：When Should We Reconstruct Missing Bands?

数据：

- Sentinel-2/Landsat-HLS paired scenes。
- EnMAP/EMIT 与 Sentinel-2 对齐样本。
- SpectralEarth 或公开 HSI classification datasets。

方法：

1. Zero-fill / mean-fill / spectral interpolation。
2. MAE reconstruction。
3. diffusion band repair，如 AnyBand-Diff 思路。
4. robust adaptation，如 HyperFree/Any-Optical-Model。
5. hybrid：先重建并把 reconstruction uncertainty 作为下游输入。

指标：

- 光谱指标：SAM、RMSE、index preservation。
- 下游指标：classification F1、segmentation mIoU、change detection F1。
- uncertainty calibration：重建误差与下游错误相关性。
- compute cost。

最小实验：

在 Sentinel-2 13 band 上模拟丢失 NIR/SWIR，与真实 Landsat/HLS band 差异对照，比较“重建后分割”和“缺 band 鲁棒分割”。

## 未来方向

1. 真实 paired sensor missing-band benchmark。
2. 物理一致 diffusion repair，保留 NDVI/NDWI/NDBI。
3. reconstruction uncertainty-aware downstream adapter。
4. 多分辨率 band repair，不先强制重采样。
5. 针对任务选择是否重建的 routing policy。
