---
title: "RS-32 Spectral Configuration Shift"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["高光谱", "多光谱", "谱段适配"]
source: "research/rs32_spectral_configuration_shift.md"
categories: ["多源数据融合、效率部署与应用落地"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-32 Spectral Configuration Shift

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-32` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 摘要 Spectral configuration shift 指训练和测试时的谱段数量、中心波长、带宽、spectral response function、预处理级别或缺失模式不同。它是高光谱/多光谱基础模型落地的硬问题：模型不是只要“能吃很多 band”，而是要知道不同传感器的 band 不是同一个物理观测。20242026

## 正文

# RS-32 Spectral Configuration Shift

更新时间：2026-06-07

## 摘要

Spectral configuration shift 指训练和测试时的谱段数量、中心波长、带宽、spectral response function、预处理级别或缺失模式不同。它是高光谱/多光谱基础模型落地的硬问题：模型不是只要“能吃很多 band”，而是要知道不同传感器的 band 不是同一个物理观测。2024-2026 的代表路线包括 SpectralGPT、S2MAE、DOFA、HyperSIGMA、HyperFree、Panopticon、SpecAware、LESSViT、Any-Optical-Model 和 SpectralEarth-FM。

## 问题由来

RGB 模型默认通道固定；遥感中 Sentinel-2、Landsat/HLS、Planet、NAIP、EnMAP、PACE、AVIRIS 等传感器的谱段配置差异很大。高光谱数据还会遇到坏 band、噪声 band、不同大气校正链和空间分辨率差异。若模型只记住通道序号，到了未见传感器或缺 band 输入时就会退化。

## 代表论文与项目

| 工作 | 年份 | 链接 | 核心机制 |
|---|---:|---|---|
| SpectralGPT | 2024 TPAMI | [arXiv](https://arxiv.org/abs/2311.07113), [GitHub](https://github.com/danfenghong/IEEE_TPAMI_SpectralGPT) | 3D token 与多目标重建，强调空间-光谱耦合。 |
| S2MAE | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Li_S2MAE_A_Spatial-Spectral_Pretraining_Foundation_Model_for_Spectral_Remote_Sensing_CVPR_2024_paper.pdf) | spatial-spectral masked pretraining。 |
| DOFA | 2024 | [arXiv](https://arxiv.org/abs/2403.15356), [GitHub](https://github.com/zhu-xlab/DOFA) | 通过 wavelength-conditioned hypernetwork 处理多传感器输入。 |
| HyperSIGMA | 2025 TPAMI | [Project](https://whu-sigma.github.io/HyperSIGMA/), [GitHub](https://github.com/WHU-Sigma/HyperSIGMA) | 大规模高光谱 foundation model，覆盖多任务。 |
| HyperFree | 2025 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html), [Project](https://rsidea.whu.edu.cn/hyperfree.htm) | channel-adaptive、tuning-free，高光谱变波段输入。 |
| Panopticon | 2025 CVPRW | [arXiv](https://arxiv.org/abs/2503.10845), [GitHub](https://github.com/Panopticon-FM/panopticon) | wavelength encoding、channel subsampling、channel cross-attention。 |
| SpecAware | 2025/2026 ISPRS JPRS | [arXiv](https://arxiv.org/abs/2510.27219) | sensor meta-attributes + image content 条件化。 |
| LESSViT | 2026 | [arXiv](https://arxiv.org/abs/2605.18541) | 明确针对 spectral configuration shift 的鲁棒 HSI 表征。 |
| Any-Optical-Model | 2026 AAAI | [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/37583/41545) | spectrum-independent tokenizer，测试 missing/cross-sensor/cross-resolution。 |
| SpectralEarth-FM | 2026 | [arXiv](https://arxiv.org/abs/2605.21075) | 将高光谱带入多模态 EO 预训练。 |

## 方法比较

1. 固定通道模型：训练稳定，但无法自然处理未见传感器。
2. band id / wavelength embedding：简单，但中心波长不足以表示完整 SRF。
3. hypernetwork tokenizer：由 wavelength 或 sensor metadata 生成输入投影，跨传感器更灵活。
4. channel cross-attention：将 band 作为 token，让模型学习谱段间关系。
5. spectral grouping：先按物理连续性或传感器响应分组，降低 HSI token 爆炸。

## 当前问题

- 很多 benchmark 的 missing band 是人工 mask，不等价于真实传感器缺测。
- cross-sensor 测试常同时混入地理区域、季节和空间分辨率差异，因果不干净。
- 中心波长被过度使用，完整 SRF、带宽和辐射定标很少进入模型。
- HSI 数据集小而碎，预训练数据与下游标签分布差异很大。
- 缺少统一 leave-sensor-out protocol。

## 可执行研究方案

题目：SRF-Aware Evaluation for Spectral Configuration Shift

实验设计：

1. 收集 Sentinel-2、Landsat/HLS、EnMAP/EMIT 或公开 HSI 数据。
2. 构造四种 shift：band dropout、band reorder、leave-sensor-out、SRF perturbation。
3. 比较固定 tokenizer、wavelength embedding、DOFA-style hypernetwork、Panopticon-style channel attention、LESSViT。
4. 评估分类、分割和 regression 三类下游任务。

指标：

- task metric：OA/F1/mIoU/RMSE。
- spectral robustness curve：丢 band 比例 vs 性能。
- leave-sensor generalization gap。
- spectral attribution consistency：重要 band 是否符合物理常识。

## 未来方向

1. 用完整 SRF 曲线而不是中心波长条件化 tokenizer。
2. 构造真实 cross-sensor paired benchmark。
3. missing-band dropout 与 sensor metadata adapter 联合预训练。
4. 将光谱指数保持约束加入自监督重建。
5. 把 spectral shift 与 spatial/GSD shift 解耦评测。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
