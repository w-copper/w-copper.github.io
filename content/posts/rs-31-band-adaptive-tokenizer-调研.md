---
title: "RS-31 Band-Adaptive Tokenizer 调研"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["高光谱", "多光谱", "谱段适配"]
source: "research/rs31_band_adaptive_tokenizer.md"
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-31 Band-Adaptive Tokenizer 调研

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-31` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：当输入可能来自 Sentinel2、Landsat/HLS、NAIP、Planet 或高光谱 cube 时，如何把不同 band 数量、中心波长、带宽、响应函数和空间分辨率映射到统一 token，使同一个遥感基础模型能跨传感器、缺失 band 和未见谱段泛化。 摘要 Bandadaptive tokenizer 是 202

## 正文

# RS-31 Band-Adaptive Tokenizer 调研

更新时间：2026-06-07  
细问题：当输入可能来自 Sentinel-2、Landsat/HLS、NAIP、Planet 或高光谱 cube 时，如何把不同 band 数量、中心波长、带宽、响应函数和空间分辨率映射到统一 token，使同一个遥感基础模型能跨传感器、缺失 band 和未见谱段泛化。

## 摘要

Band-adaptive tokenizer 是 2024-2026 遥感 foundation model 里很值得做“小而硬”的方向。它解决的不是“Transformer 怎么更大”，而是更底层的输入表示问题：遥感影像不是自然图像的 RGB 三通道，不同传感器的 band 数、中心波长、带宽、响应函数、GSD 和辐射处理链都不同。如果 patch embedding 固定在某个传感器上，模型在跨传感器、缺失 band、任意波段组合和高光谱输入时就会出现结构性失配。

当前方法大致分成五类：

1. 固定多光谱 tokenizer：如 SatMAE++、Prithvi-EO-2.0，更适合固定 HLS/Sentinel-2/Landsat 配置。
2. 波长条件化动态 embedding：如 DOFA、Clay、Panopticon、Any-Optical-Model，把 band identity 或 wavelength 注入 tokenizer。
3. 高光谱变长通道 tokenizer：如 HyperFree、SpectralEarth、LESSViT、SpecAware，关注几十到数百 band 的高光谱 cube。
4. 物理/光谱指数引导 tokenizer：如 PhySwin、SIGMAE，把辐射约束、NDVI/NDWI/NDBI 或 spectral response 作为先验。
5. 跨传感器融合 tokenizer：如 SpectralEarth-FM，把高光谱、多光谱和其他 EO 观测映射到共享层级编码器。

我认为最有潜力的小论文切口是：**SRF-aware band-adaptive tokenizer**。现有多数方法只用中心波长或 band id，较少完整使用 spectral response function（SRF）。可以把每个 band 的响应曲线压缩成少量 basis coefficients，再由 hypernetwork 生成通道投影权重，使 tokenizer 同时支持 Sentinel-2/Landsat/HLS/NAIP/Planet/EnMAP，并在 missing-band、leave-sensor-out 和 cross-resolution 设置下评测。

## 问题由来

自然图像模型默认输入为 RGB，patch embedding 通常是固定的 `Conv2d(3, D, kernel_size=P, stride=P)`。遥感中这个假设很脆：

- Sentinel-2 有 13 个 band，且 10m/20m/60m 空间分辨率混合。
- Landsat/HLS 与 Sentinel-2 有相近但不完全一致的 band，中心波长和响应函数不同。
- NAIP 常是 RGB/NIR，Planet/商业卫星有自己的 band 定义。
- 高光谱传感器可能有几十到数百个 band，band 数和 wavelength sampling 因传感器而异。
- 实际输入可能缺 band、云污染、质量 mask 不一致、不同处理级别 L1/L2 混用。

因此，band-adaptive tokenizer 的核心目标是：让输入层不再绑定固定通道顺序，而是让每个 band 带着自己的物理身份进入模型。

## 代表论文与项目

| 方法 | 年份/来源 | Tokenizer/输入适配机制 | 代码/资源 | 对 RS-31 的启发 |
|---|---:|---|---|---|
| S2MAE | CVPR 2024 | 3D/cube 风格 spatial-spectral masked pretraining，显式学习空间-光谱局部结构 | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Li_S2MAE_A_Spatial-Spectral_Pretraining_Foundation_Model_for_Spectral_Remote_Sensing_CVPR_2024_paper.pdf) | 强调 spectral-spatial reconstruction，但对任意传感器 tokenization 的支持有限。 |
| SatMAE++ | CVPR 2024 | 多尺度 MAE 预训练，适配 RGB 和多光谱卫星影像 | [arXiv](https://arxiv.org/abs/2403.05419), [GitHub](https://github.com/techmn/satmae_pp) | 是强基线，但更像固定/半固定 band 配置下的多尺度 tokenizer。 |
| DOFA | arXiv 2024 | Dynamic One-For-All：用动态 hypernetwork 适配多模态/多传感器 EO 输入 | [arXiv](https://arxiv.org/abs/2403.15356), [GitHub](https://github.com/zhu-xlab/DOFA), [HF](https://huggingface.co/papers/2403.15356) | band-adaptive 的关键参考：输入层权重由条件动态生成。 |
| Prithvi-EO-2.0 | arXiv 2024 / IBM-NASA | 面向 HLS 多时相多光谱的固定传感器配置，强在时序和任务迁移 | [arXiv](https://arxiv.org/abs/2412.02732), [HF](https://huggingface.co/ibm-nasa-geospatial/Prithvi-EO-2.0-300M-TL) | 适合作为固定 HLS tokenizer 强基线，检验 band-adaptive 是否值得。 |
| Clay v1.5 | 2024-2025 open model | dynamic embedding block，可使用 sensor metadata/wavelength/time/latlon | [Docs](https://clay-foundation.github.io/model/release-notes/specification.html), [GitHub](https://github.com/Clay-foundation/model) | 工程上很实用；支持新增传感器时定义 band/wavelength/normalization。 |
| Panopticon | CVPRW EarthVision 2025 | 扩展 DINOv2：channel subsampling、wavelength/mode encoding、channel cross-attention | [arXiv](https://arxiv.org/abs/2503.10845), [GitHub](https://github.com/Panopticon-FM/panopticon), [CVF PDF](https://openaccess.thecvf.com/content/CVPR2025W/EarthVision/papers/Waldmann_Panopticon_Advancing_Any-Sensor_Foundation_Models_for_Earth_Observation_CVPRW_2025_paper.pdf) | 任意通道组合的直接参考；channel cross-attention 比简单 band embedding 更灵活。 |
| HyperFree | CVPR 2025 | 覆盖 0.4-2.5 μm 的 learned weight dictionary，动态构建 embedding layer | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html), [arXiv](https://arxiv.org/abs/2503.21841), [Project/Code](https://rsidea.whu.edu.cn/hyperfree.htm), [HF](https://huggingface.co/JingtaoLi/HyperFree) | 对变长高光谱输入最直接；“字典覆盖连续谱段”是 SRF-aware 方案的近邻。 |
| PhySwin | NeurIPS 2025 | token-efficient spectral embedding + radiometric/physical priors + MixMAE/SwinV2 | [OpenReview](https://openreview.net/forum?id=zrBucj9BwG) | 说明 tokenizer 不能只做结构适配，也应保留物理约束和计算效率。 |
| SpectralEarth | JSTARS/arXiv 2025 | 基于 EnMAP 的大规模高光谱预训练数据与基准 | [arXiv](https://arxiv.org/abs/2408.08447), [GitHub](https://github.com/AABNassim/spectral_earth), [Dataset](https://geoservice.dlr.de/web/datasets/enmap_spectralearth) | 可作为高光谱 tokenizer 的预训练/评测数据源。 |
| AnySat | CVPR 2025 | 多分辨率、多尺度、多模态 EO 编码器，强调 scale-adaptive 表示 | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Astruc_AnySat_One_Earth_Observation_Model_for_Many_Resolutions_Scales_and_CVPR_2025_paper.html), [GitHub](https://github.com/gastruc/AnySat) | 更偏多尺度/多模态统一；可作为 cross-resolution 对照。 |
| LESSViT | arXiv 2026 | channel-agnostic patch embedding + wavelength-aware positional encoding + low-rank spatial-spectral attention | [arXiv](https://arxiv.org/abs/2605.18541) | 明确把 spectral configuration shift 定义成核心问题，适合做评测基线。 |
| SpecAware | ISPRS JPRS 2026 | sensor meta-attributes + image semantic content 驱动的 multi-sensor HSI FM | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271626000754), [arXiv](https://arxiv.org/abs/2510.27219) | 指向 sensor metadata 和 image content 双条件化，而不只是 wavelength。 |
| SpectralEarth-FM | arXiv 2026 | spectral tokenization、sensor-specific encoders、cross-sensor fusion、shared hierarchical encoder | [arXiv](https://arxiv.org/abs/2605.21075) | 适合比较“统一 tokenizer”与“sensor-specific encoder + fusion”的取舍。 |
| Any-Optical-Model | arXiv 2025/2026 | spectrum-independent tokenizer，为每个 channel 分配 dedicated band embedding，并处理 missing/cross-sensor/cross-resolution | [arXiv](https://arxiv.org/abs/2512.17224) | 直接对准 RS-31：任意 optical band composition。 |

## 方法比较

### 1. 固定通道 patch embedding

做法：固定传感器、固定 band 顺序、固定输入通道数。

优点：实现简单，预训练稳定，适合 HLS/Sentinel-2 这样的标准数据源。  
缺点：遇到 NAIP/Planet/Landsat/EnMAP 或缺 band 就需要重训练、补零、投影或启发式重采样。

适合基线：Prithvi-EO-2.0、SatMAE++。

### 2. Band embedding / wavelength embedding

做法：每个 channel 对应一个 band id 或中心波长 embedding，与 patch token 相加或拼接。

优点：工程成本低，能处理不同 band 组合。  
缺点：中心波长不能完整表示带宽和 SRF；同名 band 在不同传感器上的响应曲线仍不同。

适合基线：Any-Optical-Model、LESSViT 的 wavelength-aware positional encoding。

### 3. Hypernetwork 动态生成输入权重

做法：把 wavelength/band metadata 输入 hypernetwork，生成 patch embedding 的通道投影权重。

优点：可以连续插值到未见波段；比查表式 band embedding 更灵活。  
缺点：如果条件只有中心波长，仍可能忽略响应曲线、辐射定标和 band 宽度。

适合基线：DOFA、Clay dynamic embedding、HyperFree learned weight dictionary。

### 4. Channel cross-attention / channel tokenizer

做法：先对每个 band 或 band group 建 token，再用 channel-wise attention 融合。

优点：支持任意通道集合，也能显式建模 band 间关系。  
缺点：高光谱时通道 token 数大，注意力成本和内存压力明显；需要通道采样或低秩近似。

适合基线：Panopticon、LESSViT、SpectralEarth-FM。

### 5. SRF-aware tokenizer

做法：用完整 spectral response function 作为 band 条件，而不是只用中心波长。可将 SRF 曲线投影到 Fourier/RBF/PCA basis，生成 band descriptor，再由 hypernetwork 产生通道投影。

优点：物理意义更强，能区分“中心波长相近但响应曲线不同”的传感器。  
缺点：公开数据集常缺完整 SRF；需要处理 SRF 元数据质量和传感器版本差异。

这是本文建议的未来研究主线。

## 当前问题

1. **中心波长近似太粗**：很多方法只编码中心波长，忽略带宽、响应曲线形状和传感器辐射处理链。
2. **缺 band 测试不真实**：随机 dropout 一个 band 不等价于真实传感器没有该 band，也不等价于云/质量 mask 导致的局部缺失。
3. **跨传感器评测混杂因素多**：传感器变化常与地区、季节、GSD、标签体系一起变化，很难判断 tokenizer 是否真的解决了 spectral shift。
4. **高光谱 token 成本高**：对 100-300 个 band 做 full spatial-spectral attention 成本很大，必须做 channel grouping、low-rank attention 或 band sampling。
5. **GSD 与 band 适配耦合**：Sentinel-2 不同 band 自身分辨率不同，跨传感器时 spectral shift 和 spatial-resolution shift 同时发生。
6. **物理一致性指标不足**：下游 mIoU/F1 不能说明模型是否保留了 NDVI/NDWI、spectral angle、辐射一致性等物理信息。

## 未来研究方向：SRF-Aware Band-Adaptive Tokenizer

### 核心假设

如果 tokenizer 使用完整 SRF 描述每个 band，而不仅是 band id 或中心波长，那么模型在 missing-band、leave-sensor-out 和 cross-sensor fusion 中会更稳定，尤其是在 Sentinel-2/Landsat/HLS/EnMAP 等光谱响应相近但不完全一致的数据之间。

### 方法草图

输入：

- 影像张量：`X in R^{C x H x W}`
- 每个 band 的元信息：中心波长、带宽、SRF 曲线、GSD、质量 mask、可选的传感器 id

模块：

1. **SRF encoder**：把每个 band 的 SRF 曲线投影为 `b_i`，可用 RBF/Fourier basis、PCA basis 或小 MLP。
2. **Band hypernetwork**：用 `b_i + gsd_i + sensor_embed` 生成该 band 的 patch projection 权重或 gating 向量。
3. **Channel grouping**：高光谱输入按连续波段或学习到的聚类分组，避免通道注意力爆炸。
4. **Spectral-spatial mixer**：先在 band/group 维度做轻量 cross-attention，再进入 ViT/Swin/Mamba 主干。
5. **Physics-preserving losses**：MAE reconstruction 外，加入 NDVI/NDWI、spectral angle mapper、band-order consistency 或 SRF-convolved reconstruction。

### 训练目标

- Channel-wise masked reconstruction：随机 mask band/group，并重建观测 band。
- Sensor translation：用同区域同时间的 HLS/Sentinel-2/Landsat/EnMAP 对齐样本，预测被另一传感器 SRF 卷积后的观测。
- Downstream supervised heads：土地覆盖、作物分类、建筑/道路分割、变化检测。
- Consistency loss：同一区域不同传感器 embedding 应接近，但保留传感器特有 uncertainty。

## 实验矩阵

| 实验 | 数据 | Baseline | 指标 | 目的 |
|---|---|---|---|---|
| 固定传感器 in-domain | Sentinel-2/HLS | Prithvi-EO-2.0, SatMAE++, Clay | mIoU/F1/accuracy | 确保新 tokenizer 不牺牲标准配置性能。 |
| Missing-band | Sentinel-2 13 bands, HLS | fixed embedding, band dropout, AOM-like band embedding | mIoU/F1 + missing-band degradation | 测试随机缺失和真实 band 子集下的鲁棒性。 |
| Leave-sensor-out | train Sentinel-2/HLS, test Landsat/NAIP/Planet | DOFA, Clay, Panopticon, AOM | zero-shot/linear probe performance | 评估跨传感器泛化。 |
| MSI-to-HSI alignment | Sentinel-2/EnMAP 或 HLS/EMIT pairing | HyperFree, SpectralEarth, LESSViT | SAM spectral angle, RMSE, downstream F1 | 评估 SRF-aware 表示能否桥接多光谱和高光谱。 |
| Cross-resolution | 10m/20m/30m/sub-meter | AnySat, AOM, PhySwin | accuracy vs GSD shift | 分离 band shift 与 GSD shift。 |
| 低样本适配 | LoveDA/DeepGlobe/EuroSAT/BigEarthNet/EnMAP subsets | full fine-tune, LoRA, adapter, linear probe | n-shot curve | 看 tokenizer 是否减少下游标注需求。 |

## 推荐数据与任务

- 多光谱：Sentinel-2、HLS、Landsat、BigEarthNet、EuroSAT、fMoW-Sentinel、LoveDA、DeepGlobe。
- 高光谱：SpectralEarth/EnMAP、Pavia、Houston、Indian Pines、EMIT/EnMAP 配对数据。
- 航空/VHR：NAIP，必要时只用于 RGB/NIR 跨传感器测试。
- 任务：scene classification、land-cover segmentation、crop mapping、change detection、MSI-to-HSI reconstruction。

## 最小可复现实验

第一阶段不建议一上来预训练超大模型。更稳的最小实验是：

1. 选一个小主干：ViT-S/Swin-T 或轻量 Mamba encoder。
2. 实现三种 tokenizer：
   - Fixed Conv tokenizer
   - Center-wavelength band embedding tokenizer
   - SRF-aware hypernetwork tokenizer
3. 在 Sentinel-2/HLS 上做 masked reconstruction 预训练。
4. 在 Landsat/NAIP/EnMAP 子集上做 leave-sensor-out linear probe。
5. 对比 missing-band degradation curve：缺 1/3/5 个 band、只保留 RGB、只保留 NIR/SWIR、真实传感器 band 子集。

## 下一步执行清单

1. 建立 `data/sensor_specs/`：收集 Sentinel-2 MSI、Landsat OLI、HLS、NAIP、PlanetScope、EnMAP/EMIT 的 band 表、中心波长、带宽、SRF 下载链接和引用来源。
2. 写一个 `SensorBandSpec` 数据结构：字段至少包含 `sensor_name`、`band_name`、`center_nm`、`fwhm_nm`、`gsd_m`、`srf_curve`、`normalization`。
3. 先实现三种 tokenizer baseline：fixed Conv、center-wavelength embedding、SRF-aware hypernetwork。
4. 用同一主干和同一训练 budget 做 ablation，避免把 tokenizer 收益和主干规模混在一起。
5. 先做 linear probe + missing-band curve，再做 full fine-tuning；如果 linear probe 没有稳定收益，不建议扩大预训练。
6. 记录每个实验的传感器、band 子集、GSD、地区、季节和 split，防止 cross-sensor 结果被地理偏差污染。

## 可能的论文题目

**SRF-Tokenizer: Spectral Response Function Aware Tokenization for Cross-Sensor Remote Sensing Foundation Models**

预期贡献：

1. 提出用完整 SRF 而非中心波长的 band-adaptive tokenizer。
2. 构建 missing-band 与 leave-sensor-out 的标准实验协议。
3. 证明 SRF-aware tokenizer 在跨 Sentinel-2/Landsat/HLS/EnMAP 时降低性能退化。
4. 给出物理一致性指标，说明模型不只是下游精度高，也保留光谱结构。

## 风险与规避

- SRF 元数据难收集：先从 Sentinel-2、Landsat、HLS、EnMAP/EMIT 这些公开传感器做起。
- 数据配对不干净：把“严格同地同时间配对”和“弱配对”分开报告。
- 新 tokenizer 增益可能小：必须设置 strong baselines，尤其是 Clay/DOFA/Panopticon/HyperFree。
- 计算成本高：先做小模型和 linear probe，再扩展到大规模预训练。
- 审稿人可能认为只是 engineering：把贡献放在 SRF-aware 表示、真实 missing-band benchmark 和物理一致性评估上。

## 阅读队列

1. [DOFA: Neural Plasticity-Inspired Multimodal Foundation Model for Earth Observation](https://arxiv.org/abs/2403.15356)
2. [SatMAE++: Rethinking Transformers Pre-training for Multi-Spectral Satellite Imagery](https://arxiv.org/abs/2403.05419)
3. [S2MAE: A Spatial-Spectral Pretraining Foundation Model](https://openaccess.thecvf.com/content/CVPR2024/papers/Li_S2MAE_A_Spatial-Spectral_Pretraining_Foundation_Model_for_Spectral_Remote_Sensing_CVPR_2024_paper.pdf)
4. [Clay Foundation Model documentation](https://clay-foundation.github.io/model/release-notes/specification.html)
5. [Panopticon: Advancing Any-Sensor Foundation Models for Earth Observation](https://arxiv.org/abs/2503.10845)
6. [HyperFree: A Channel-adaptive and Tuning-free Foundation Model for HSI](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html)
7. [PhySwin: An Efficient and Physically-Informed Foundation Model for Multispectral EO](https://openreview.net/forum?id=zrBucj9BwG)
8. [SpectralEarth: Training Hyperspectral Foundation Models at Scale](https://arxiv.org/abs/2408.08447)
9. [LESSViT: Robust Hyperspectral Representation Learning under Spectral Configuration Shift](https://arxiv.org/abs/2605.18541)
10. [SpecAware: A Spectral-Content Aware Foundation Model](https://www.sciencedirect.com/science/article/pii/S0924271626000754)
11. [SpectralEarth-FM](https://arxiv.org/abs/2605.21075)
12. [Any-Optical-Model](https://arxiv.org/abs/2512.17224)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
