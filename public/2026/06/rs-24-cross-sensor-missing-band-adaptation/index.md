# RS-24 Cross-Sensor Missing-Band Adaptation


# RS-24 Cross-Sensor Missing-Band Adaptation

## 1. 核心判断

跨传感器 missing-band adaptation 正在从“把不同传感器重采样到同一组固定 band”转向“让模型显式理解每个 band 的物理含义”。2024-2026 的代表路线包括：

- **波长/传感器条件化**：DOFA、Any-Optical-Model、HyperFree、SpecAware、Panopticon 用 wavelength/band embedding、动态 embedding、hypernetwork 或 channel-adaptive prompt 处理可变 band。
- **缺失 band 鲁棒预训练**：LESSViT、AnyBand-Diff、AOM 通过 channel-agnostic patch embedding、hierarchical channel sampling、masked conditional diffusion 或 channel-wise reconstruction 直接模拟 band 缺失。
- **跨传感器共址学习**：SpectralEarth-FM、msGFM 类工作用同一区域的 HSI/MSI/Landsat/Sentinel 等共址数据做 JEPA/contrastive/masked pretraining，让不同传感器对齐到共享语义空间。
- **物理先验约束**：PhySwin 和 AnyBand-Diff 提醒我们，遥感不是普通多通道图片；反射率范围、光谱连续性、指数保持、辐射一致性都可以成为训练约束。

最值得做的小课题不是再堆一个大模型，而是：**把完整 SRF 曲线、band dropout 和跨传感器共址蒸馏结合起来，做一个可复现的 missing-band / cross-sensor adapter protocol**。

## 2. 问题由来

自然图像模型默认 RGB 三通道且语义稳定；遥感光学传感器则不同：

- **Band layout 不同**：Sentinel-2 有 13 个 band，Landsat/HLS band 设置不同，Planet/NAIP 更偏 RGB/NIR，高光谱 EnMAP/EMIT/DESIS 可有上百个窄 band。
- **SRF 不同**：即使两个传感器都叫 red/NIR，中心波长、带宽、响应曲线也不同。用 band name 对齐会丢掉物理差异。
- **缺失 band 是常态**：业务中常遇到传感器缺 band、云污染、坏线、只下载部分 band、历史数据 band 不全、模型训练时的 band 配置与部署时不同。
- **空间分辨率耦合**：Sentinel-2 的 10/20/60m band 不能简单当作同分辨率通道；跨传感器时还会同时变化 GSD。
- **标注稀缺与区域偏差**：高光谱/多光谱下游标签少，模型容易只在某个传感器和区域内有效。

因此，跨传感器适配的本质不是“补几个通道”，而是学习一个函数：在输入传感器、SRF、可用 band、空间分辨率和地理场景变化时，模型仍能保留稳定地物语义与光谱物理一致性。

## 3. 代表论文与项目

| 论文/项目 | 年份/venue | 链接 | 代码/数据 | 与 RS-24 的关系 |
|---|---:|---|---|---|
| DOFA: Neural Plasticity-Inspired Multimodal Foundation Model for Earth Observation | 2024 arXiv | [arXiv](https://arxiv.org/abs/2403.15356) | [GitHub](https://github.com/zhu-xlab/DOFA) | 用 wavelength-conditioned dynamic hypernetwork 处理不同传感器和 band，是 band-adaptive 的核心基线。 |
| S2MAE: A Spatial-Spectral Pretraining Foundation Model | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Li_S2MAE_A_Spatial-Spectral_Pretraining_Foundation_Model_for_Spectral_Remote_Sensing_CVPR_2024_paper.pdf) | 未见稳定官方代码 | 3D Transformer MAE 与 spectral-spatial masking，为缺 band 预训练提供基础范式。 |
| SatMAE++ | 2024 CVPR | [GitHub](https://github.com/techmn/satmae_pp) | GitHub 含权重 | 多光谱卫星预训练基线，适合作为非 SRF-aware 的对照。 |
| msGFM: Bridging Remote Sensors with Multisensor GFMs | 2024 CVPR | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Han_Bridging_Remote_Sensors_with_Multisensor_Geospatial_Foundation_Models_CVPR_2024_paper.pdf) | 论文页线索 | 通过多传感器预训练桥接 remote sensors，适合作为共址学习/跨传感器对齐基线。 |
| PhySwin | 2025 NeurIPS | [OpenReview](https://openreview.net/forum?id=zrBucj9BwG) | 未见官方代码 | 用物理先验、MixMAE 和 token-efficient spectral embedding 做高效多光谱 FM；可作为物理约束 baseline。 |
| HyperFree | 2025 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html) | [项目页](https://rsidea.whu.edu.cn/hyperfree.htm) | learned weight dictionary 覆盖 0.4-2.5um，动态构建 embedding，直接面向可变 HSI channel。 |
| Panopticon | 2025 CVPRW EarthVision | [arXiv](https://arxiv.org/abs/2503.10845) | [GitHub](https://github.com/Panopticon-FM/panopticon) | any-sensor FM，DINOv2 改造、波长编码、channel sampling 和 channel cross-attention。 |
| SpecAware | 2026 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271626000754), [arXiv](https://arxiv.org/abs/2510.27219) | [planned GitHub](https://github.com/busbyjrj/SpecAware) | 用 sensor meta-attributes + image content 驱动 hypernetwork，目标是多传感器 HSI 统一表示。 |
| SpectralEarth-FM | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.21075) | 论文数据 SpectralEarth-MM | HSI 与 Sentinel-2、Landsat 等共址数据；hierarchical transformer + sensor-specific encoders + cross-sensor fusion。 |
| LESSViT | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.18541) | [项目页](https://uiuctml.github.io/LESSViT/) | 明确定义 spectral configuration shift；channel-agnostic patch embedding + wavelength-aware PE + hierarchical channel sampling。 |
| Any-Optical-Model (AOM) | 2026 AAAI / arXiv 2025 | [arXiv](https://arxiv.org/abs/2512.17224), [AAAI PDF](https://ojs.aaai.org/index.php/AAAI/article/download/37583/41545) | 未见官方代码 | 面向 arbitrary band compositions、missing bands、cross sensor、cross resolution；spectrum-independent tokenizer。 |
| AnyBand-Diff | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.14341) | 未见官方代码 | masked conditional diffusion 从任意 band subset 修复完整谱信息，加入 physics-guided sampling。 |
| SSA: Spectral-Band and Fusion-Scale Agnostic HS Fusion | 2026 arXiv | [arXiv](https://arxiv.org/abs/2602.01681) | 未见官方代码 | Matryoshka Kernel + INR，任意 spectral channels 与空间 scale，适合比较“重建路线”。 |
| Cross-Domain Transfer of HSI Foundation Models | 2026 arXiv | [arXiv](https://arxiv.org/abs/2604.26478) | 未见官方代码 | 检验 HSI FM 从遥感到近距离 sensing 的跨域迁移，提醒 cross-domain 与 cross-sensor 需要分开评测。 |

## 4. 方法谱系

### 4.1 Wavelength / SRF-conditioned tokenization

典型方法：DOFA、AOM、HyperFree、Panopticon、SpecAware。

核心思想是不要把 band 当成固定通道索引，而是把每个 band 的物理位置编码进模型。现有方法多用中心波长、band id 或 learned dictionary；更进一步的研究空间是使用完整 SRF 曲线：

- 把 SRF 曲线采样成向量，用 Fourier/RBF basis 编码。
- 通过小型 hypernetwork 生成 band-specific patch projection。
- 对输入每个 band 生成 token type embedding，支持 band 缺失和新 band 加入。

风险：公开数据往往没有完整 SRF 或处理级别信息；只用中心波长会过度简化。

### 4.2 Missing-band dropout / masked spectral pretraining

典型方法：LESSViT、AOM、AnyBand-Diff、S2MAE。

这一类把缺 band 当作训练时的数据增强或自监督任务。关键不是随机 drop 通道这么简单，而是要模拟真实缺失：

- drop 连续波段，而不是独立随机 band；
- 按传感器实际可用 band 子集采样；
- 对云污染/坏线/低 SNR band 加噪；
- 用 masked reconstruction 或 latent consistency 保持地物语义。

风险：人工 band dropout 不等价于真实 cross-sensor shift，因为真实传感器还改变 SRF、GSD、辐射定标和观测条件。

### 4.3 Cross-sensor co-located alignment

典型方法：SpectralEarth-FM、msGFM、Panopticon。

同一区域、相近时间、多传感器影像可以提供“不同观测，同一地物”的弱监督。适合用：

- JEPA / contrastive alignment：不同传感器 view 表示接近；
- teacher-student distillation：完整 HSI 或高质量 MSI 作为 teacher，缺 band sensor 作为 student；
- sensor-specific encoder + shared encoder：先保留传感器差异，再投到共享语义空间。

风险：共址不等于同一时间；作物物候、云、阴影和配准误差会污染对齐信号。

### 4.4 Physical consistency constraints

典型方法：PhySwin、AnyBand-Diff、SpecAware。

可加入的约束包括：

- reflectance range / radiometric consistency；
- spectral smoothness 或一阶/二阶谱曲线约束；
- NDVI、NDWI、NDBI 等指数保持；
- spectral angle mapper (SAM metric, not Segment Anything)；
- sensor SRF convolution consistency：高光谱预测经 SRF 卷积后应接近多光谱观测。

风险：物理约束如果过强，会压制真实地物的非平滑谱特征或受大气校正误差影响。

## 5. 当前缺口

1. **SRF 没有被充分利用**：很多方法用中心波长或 band index，少有方法把完整响应曲线作为一等输入。
2. **band missing 与 cross-sensor 混在一起**：论文常报告 missing-band，但真实部署同时有 SRF、GSD、时相、辐射处理差异。
3. **评测协议不统一**：随机 drop band、leave-sensor-out、leave-band-group-out、MSI-to-HSI reconstruction 衡量的是不同能力。
4. **下游任务偏窄**：很多工作只看分类；跨传感器分割、变化检测、检索、VQA 的结论还少。
5. **代码和数据释放不稳定**：2026 的新工作不少仍是 arXiv 或 planned GitHub，复现要优先选择 DOFA、SatMAE++、Panopticon、SpectralEarth、HyperFree 等更清晰的资源。
6. **高光谱与多光谱桥接不足**：HSI FM 能否帮助 Sentinel/Landsat 缺 band 场景，仍缺系统实验。

## 6. 推荐研究方案：SRF-MBD Adapter

题目草案：**SRF-MBD: Spectral Response Function Conditioned Missing-Band Dropout for Cross-Sensor Remote Sensing Foundation Models**

### 6.1 假设

相比只使用 band index/中心波长，使用完整 SRF 曲线并在训练时做真实传感器子集采样，可以提升模型在 band 缺失、跨传感器和跨分辨率设置下的稳定性；这种提升在少样本下游适配时更明显。

### 6.2 方法模块

1. **SRF encoder**
   - 输入每个 band 的 SRF 曲线、中心波长、FWHM、GSD、处理级别。
   - 用 Fourier/RBF basis + MLP 生成 band embedding。
   - 若没有完整 SRF，退化为中心波长 + 带宽估计。

2. **Dynamic band projection**
   - 用 hypernetwork 为每个 band 生成低秩 projection：`W_band = A(srf) B(srf)`。
   - 将可变 band 投影到统一 token space。

3. **Realistic missing-band dropout**
   - 不是随机丢单个 band，而是按真实传感器 layout 采样：Sentinel-2 subset、Landsat subset、RGB/NIR subset、HSI contiguous-window subset。
   - 加入 cloud/noise/dropout mask，模拟坏 band。

4. **Cross-sensor teacher-student alignment**
   - 对共址区域，用 HSI 或全 band MSI 作为 teacher view，缺 band subset 作为 student view。
   - 损失包括 latent consistency、masked reconstruction、SRF convolution consistency。

5. **Downstream lightweight adapter**
   - 冻结 backbone，只训练 LoRA/adapter/head。
   - 比较 full fine-tune、linear probe、center-wavelength-only adapter、SRF-MBD adapter。

### 6.3 损失设计

- `L_task`：下游分类/分割/变化检测监督损失。
- `L_latent`：完整 view 与缺 band view 的 latent consistency。
- `L_recon`：masked spectral reconstruction。
- `L_srf`：预测 HSI 经目标传感器 SRF 卷积后接近 MSI 观测。
- `L_index`：NDVI/NDWI/NDBI 等指数一致性，可作为辅助而非主损失。
- `L_uncertainty`：缺失严重时输出更高不确定性，避免过度自信。

## 7. 实验矩阵

| 维度 | 推荐设置 |
|---|---|
| 数据 | Sentinel-2、Landsat/HLS、EnMAP、EMIT、DESIS；如可用，使用 SpectralEarth / SpectralEarth-MM 类共址数据 |
| 任务 | land-cover segmentation、crop classification、HSI classification、change detection、MSI-to-HSI reconstruction |
| Split | in-sensor、leave-sensor-out、leave-band-group-out、leave-region-out、leave-season-out |
| Missing pattern | random bands、contiguous spectral window、real sensor subset、cloud/noise corrupted bands |
| Baselines | RGB/Sentinel fixed-channel ViT、SatMAE++、DOFA、Panopticon、HyperFree、LESSViT、AOM、AnyBand-Diff reconstruction-then-task |
| Metrics | OA/F1/mIoU、SAM spectral angle、RMSE/PSNR/SSIM for reconstruction、ECE/NLL for uncertainty、drop ratio vs performance curve |
| Ablation | center wavelength vs full SRF；random dropout vs real sensor dropout；no physics vs SRF consistency；frozen vs LoRA vs full fine-tune |

## 8. 最小可复现实验

第一阶段不要追求全量 HSI 大模型，先做一个能证明方向的中等实验：

1. 选择 Sentinel-2 / Landsat-HLS 共址 patch，构造同一区域不同 band layout。
2. 用 DOFA 或 Panopticon 作为 backbone baseline。
3. 实现 SRF encoder + missing-band dropout adapter。
4. 下游任务选 land cover segmentation 或 crop classification。
5. 做四组对比：
   - fixed channels；
   - center-wavelength embedding；
   - center-wavelength + random band dropout；
   - full/estimated SRF + real sensor subset dropout。
6. 如果 full SRF 难拿，先用 band center + bandwidth 近似，并在论文中把 full SRF 作为扩展。

## 9. 未来研究方向

- **SRF-aware benchmark**：建立公开的 sensor metadata 表，把每个样本的 band、GSD、SRF、处理级别记录清楚。
- **uncertainty under missing bands**：模型不仅要尽力预测，还要知道缺哪些 band 会让哪些类别不可靠。
- **HSI teacher for MSI student**：用高光谱基础模型蒸馏多光谱模型，增强缺 band 场景下的地物区分。
- **cross-resolution + cross-band joint adaptation**：band 缺失常与 GSD 变化同时出现，不能只测光谱。
- **task-aware band selection**：不同任务依赖不同 band，模型可以学习“缺哪些 band 会伤害哪个任务”。
- **physics-lightweight adapters**：将物理约束做成小 adapter，而不是重训 foundation model。

## 10. 阅读顺序

1. [DOFA](https://arxiv.org/abs/2403.15356) 和 [Panopticon](https://github.com/Panopticon-FM/panopticon)：理解 any-sensor / wavelength-conditioned 表示。
2. [HyperFree](https://openaccess.thecvf.com/content/CVPR2025/html/Li_HyperFree_A_Channel-adaptive_and_Tuning-free_Foundation_Model_for_Hyperspectral_Remote_CVPR_2025_paper.html) 与 [SpecAware](https://www.sciencedirect.com/science/article/pii/S0924271626000754)：理解 channel-adaptive HSI FM。
3. [LESSViT](https://arxiv.org/abs/2605.18541)：把 spectral configuration shift 当作核心问题。
4. [SpectralEarth-FM](https://arxiv.org/abs/2605.21075)：理解 HSI 与 MSI 共址预训练。
5. [AnyBand-Diff](https://arxiv.org/abs/2605.14341) 与 [SSA](https://arxiv.org/abs/2602.01681)：理解 reconstruction 路线和 robust adaptation 路线的差异。

## 11. 可以直接发展的论文题目

**SRF-MBD: Spectral Response Function Conditioned Missing-Band Dropout for Cross-Sensor Remote Sensing Foundation Models**

目标贡献：

1. 一个把 SRF 曲线作为模型输入的轻量 adapter。
2. 一个真实传感器子集驱动的 missing-band dropout protocol。
3. 一个区分 random missing、real sensor missing、cross-sensor、cross-resolution 的评测矩阵。
4. 在至少两个下游任务上证明：SRF-aware 适配比 center-wavelength-only 和 random channel dropout 更稳。

主要风险：

- 完整 SRF 元数据获取困难。
- 共址数据存在时相差异和配准误差。
- 如果只在小数据集上做，容易被认为是工程组合；需要清晰的评测协议和 failure analysis。

