# RS-03 GSD-Aware GeoFM Adapter


# RS-03 GSD-Aware GeoFM Adapter

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-03` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 对应 prompt：research/50threadprompts.md 中 RS03 GSDAware GeoFM Adapter 目标：研究遥感 foundation model 如何显式利用 GSD/分辨率作为连续条件；比较 ScaleEarth、SkySense、PrithviEO2.0、AlphaEarth、GeoFM

## 正文

# RS-03 GSD-Aware GeoFM Adapter

更新时间：2026-06-07  
对应 prompt：`research/50_thread_prompts.md` 中 `RS-03 GSD-Aware GeoFM Adapter`  
目标：研究遥感 foundation model 如何显式利用 GSD/分辨率作为连续条件；比较 ScaleEarth、SkySense、Prithvi-EO-2.0、AlphaEarth、GeoFM/AnySat/Clay/Galileo 中的尺度处理方式；设计一个只引入轻量 adapter/LoRA 的 GSD-aware 下游适配方法，并给出分类、分割、检测三个任务的实验矩阵。

## 1. 问题由来

GSD, ground sample distance，决定一个像素对应地面的真实长度。遥感模型如果只看 resize 后的 patch，很容易把“像素尺度”误当成“真实尺度”：同样 224 x 224 的输入，在 0.3 m 航空影像中可能覆盖一个街区，在 10 m Sentinel-2 中可能覆盖数平方公里。自然图像 VFM 常把尺度变化当成数据增强问题，但遥感中尺度本身包含任务语义：

- 建筑、车辆、飞机、船舶等目标的真实尺寸范围相对稳定，GSD 决定它们在图像中的像素大小。
- land cover / crop / ecological mapping 中，GSD 影响 mixed pixel、边界模糊、纹理可见性和类别层级。
- 多源训练常把 Sentinel-2、Landsat、NAIP、VHR aerial、Planet、commercial imagery 放在一起，如果模型不知道 GSD，跨传感器泛化会出现隐性偏差。
- 下游 benchmark 常把图像统一 resize 到固定输入大小，这会抹掉真实地理尺度，导致模型在跨分辨率测试时不稳。

因此，GSD-aware adapter 的核心不是“把分辨率写进 prompt”，而是让模型在特征变换、attention、adapter/LoRA 参数或 decoder 中连续地感知地面尺度。

## 2. 代表工作与尺度处理方式

| 工作 | 年份/来源 | 链接 | 官方代码/模型 | 尺度/GSD 处理 | 对 RS-03 的启发 |
|---|---:|---|---|---|---|
| ScaleEarth | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.07562) | 公开检索未确认官方代码 | 将 GSD 作为连续尺度条件，用 Hyper-LoRA 动态生成/调节 VLM 参数，并构建 GeoScale-VQA 来测尺度理解 | 直接证明“连续 GSD 条件 + LoRA”是可行题眼；可从 VLM 扩到分类/分割/检测 |
| SkySense | 2024 CVPR | [CVF](https://openaccess.thecvf.com/content/CVPR2024/html/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.html) | [GitHub](https://github.com/Jack-bo1220/SkySense) | 多模态、多时相、大规模预训练，覆盖不同遥感源；主要通过数据规模和任务头吸收尺度差异 | 强基线，但尺度是隐式学习；适合做 frozen backbone + GSD adapter 对照 |
| SkySense V2 | 2025 ICCV/arXiv | [arXiv](https://arxiv.org/abs/2412.10115) | [GitHub org](https://github.com/Jack-bo1220/SkySense) | 多模态统一模型；面向多任务、多传感器，多分辨率问题更多通过统一表征处理 | 可作为多源 GeoFM 基线，检查显式 GSD 条件是否还能带来收益 |
| Prithvi-EO-2.0 | 2024 arXiv / IBM-NASA | [arXiv](https://arxiv.org/abs/2412.02732) | [GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0), [Hugging Face](https://huggingface.co/ibm-nasa-geospatial) | 基于 HLS/Sentinel-Landsat 系列，多时相 30 m 级数据；包含时间/位置相关设计，但训练尺度相对集中 | 适合作为 30 m 多时相基座，测试 adapter 是否能迁移到 10 m/1 m/VHR |
| AlphaEarth Foundations | 2025 Google/DeepMind | [Google Research](https://research.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/), [Nature](https://www.nature.com/articles/s41586-025-09260-x) | [Earth Engine dataset](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL) | 生成年度 10 m 卫星 embedding field；尺度固定在产品网格，但融合多源信息 | 不是常规可微调开源 backbone；更适合作为 10 m embedding baseline 或 teacher |
| AnySat | 2025 CVPR Highlight | [CVF](https://openaccess.thecvf.com/content/CVPR2025/html/Astruc_AnySat_One_Earth_Observation_Model_for_Many_Resolutions_Scales_and_CVPR_2025_paper.html) | [GitHub](https://github.com/gastruc/AnySat) | 明确面向 many resolutions, scales, modalities；使用 scale-adaptive encoder/JEPA 类训练 | 很适合对照“结构内建多尺度”与“外接轻量 GSD adapter” |
| Clay v1.5 | 2024-2025 open model | [docs](https://clay-foundation.github.io/model/release-notes/specification.html) | [GitHub](https://github.com/Clay-foundation/model) | 支持多传感器、任意尺寸和多波段输入，工程接口通常保留 metadata | 适合作为工程可复现实验基线，测试 metadata-driven adapter |
| Galileo | 2025 | [GitHub](https://github.com/nasaharvest/galileo) | [GitHub](https://github.com/nasaharvest/galileo) | 多模态 EO 表征，关注不同遥感模态和局部/全局特征 | 可以作为多任务、多源基线；尺度条件需要查具体输入 metadata |
| PANGAEA | 2024-2025 benchmark | [Project](https://pangaea-bench.github.io/), [GitHub](https://github.com/yurujaja/pangaea-bench) | [GitHub](https://github.com/yurujaja/pangaea-bench) | 覆盖多任务、多区域、多分辨率/模态，是比较 GeoFM 的好平台 | 适合作为统一 benchmark 框架，避免只在单一 GSD 数据集上过拟合 |
| EarthShift | 2026 arXiv | [arXiv](https://arxiv.org/abs/2605.29330), [Project](https://earthshift.github.io/) | 项目页 | 真实世界 distribution shift benchmark，包含空间/时间/尺度/传感器偏移 | 可作为跨 GSD/跨传感器 robustness 验证的补充 |

## 3. 方法脉络

### 3.1 隐式尺度学习

SkySense、Prithvi、Clay、Galileo 等主要依赖大规模多源预训练，让模型从数据中隐式吸收尺度差异。这类方法优点是简单，缺点是模型可能把传感器、地域、类别和 GSD 纠缠起来。例如 10 m Sentinel-2 中“城市纹理”与 0.3 m NAIP 中“建筑轮廓”不是同一层级语义，统一 resize 后模型容易学到 dataset shortcut。

### 3.2 多尺度结构设计

AnySat、dynamic image pyramid、部分多分辨率 encoder 把尺度问题放进结构里处理：不同分辨率或尺度输入通过特定 encoder、金字塔或 scale-adaptive aggregation 对齐。这类方法适合从头训练或大规模预训练，但如果研究目标是“只引入轻量 adapter/LoRA”，直接改 backbone 成本偏高。

### 3.3 连续 GSD 条件化

ScaleEarth 是最直接相关的路线：将 GSD 作为连续变量输入，用 Hyper-LoRA 生成或调节模型参数，使模型在推理时根据地面尺度改变表征。这个思路非常适合 RS-03：保持 backbone frozen，只训练一个小型 GSD conditioner 和 LoRA/adapter 参数，即可验证显式尺度条件是否提升跨 GSD 泛化。

### 3.4 Embedding 产品作为 teacher/baseline

AlphaEarth Foundations 不是普通的可微调开源模型，而是提供 10 m 年度 embedding field。它适合做两件事：作为 10 m 任务的强 baseline；或作为 teacher，约束 GSD adapter 在中低分辨率上保持地理语义一致。但它不适合直接作为所有下游任务的可训练 backbone。

## 4. 现有问题

1. **GSD 与传感器/地域/任务纠缠**：如果 10 m 数据主要来自 Sentinel-2，1 m 数据主要来自航空影像，模型可能学到“数据源差异”而不是“尺度规律”。
2. **输入 resize 抹掉真实地理尺度**：同样 512 x 512 patch 的真实覆盖面积相差数百倍，分类和分割标签粒度也随之变化。
3. **连续尺度很少被系统评测**：多数论文只做 single-dataset downstream，缺少 train-GSD/test-GSD 的外推曲线。
4. **分割与检测中的尺度影响不同**：分割更关心边界和 mixed pixel，检测更关心目标像素大小和 anchor/box 匹配，分类更关心语义层级。
5. **metadata 不完整**：真实数据集常缺少精确 GSD、原始 CRS、sensor response、采集高度等信息，需要从数据说明或 GeoTIFF transform 中恢复。
6. **轻量 adapter 容易过拟合数据集**：如果只在一个 benchmark 内调 GSD adapter，可能学到 dataset id；需要跨区域和跨传感器验证。

## 5. proposed method: GeoScale-LoRA Adapter

### 5.1 核心假设

在 frozen GeoFM backbone 上引入连续 GSD 条件化的轻量 adapter/LoRA，可以在跨分辨率、跨传感器的分类、分割和检测任务中提升泛化，尤其在训练 GSD 与测试 GSD 不一致时更明显。

### 5.2 输入条件

对每个样本构造尺度向量：

```text
s = [
  log(GSD_meter),
  log(patch_ground_width_meter),
  log(patch_ground_height_meter),
  sensor_family_id embedding,
  optional: temporal_gap / season embedding
]
```

最小版本只用 `log(GSD_meter)`，避免把问题扩大。

### 5.3 模型结构

推荐从最小可复现版本做起：

1. frozen backbone：Prithvi-EO-2.0、Clay、SkySense 或 AnySat 中选择 1-2 个可运行模型。
2. GSD conditioner：两层 MLP，输入 `log(GSD)`，输出每层 adapter 的 scale/bias 或 LoRA routing weights。
3. GeoScale-LoRA：在 ViT attention 的 `q,v` 或 MLP projection 上加低秩 LoRA，LoRA 权重由 GSD conditioner 调制。
4. task head：分类用 linear/MLP；分割用 UPerNet/SegFormer style decoder；检测用 DINO/RetinaNet/Mask R-CNN head，尽量保持 head 一致。

### 5.4 三个 ablation 版本

| 版本 | 描述 | 目的 |
|---|---|---|
| A0 frozen + task head | 不使用 GSD | 基础线 |
| A1 metadata token | 把 GSD 离散/连续 token 拼到输入或 CLS | 验证简单条件是否足够 |
| A2 static LoRA | 普通 LoRA，不输入 GSD | 区分参数量收益和 GSD 条件收益 |
| A3 GeoScale-LoRA | LoRA/adapter 由连续 GSD 调制 | 主方法 |
| A4 wrong-GSD control | 推理时故意给错 GSD | 验证模型是否真的依赖 GSD |

## 6. 可复现实验矩阵

### 6.1 分类任务

| 目标 | 数据集候选 | GSD 范围 | 指标 | Baseline |
|---|---|---|---|---|
| 场景分类跨分辨率泛化 | EuroSAT, RESISC45, UCMerced, BigEarthNet subset | 0.3 m 到 10 m/30 m | OA, macro-F1, train-GSD/test-GSD curve | frozen feature + linear, static LoRA, metadata token |
| land-cover/crop 分类 | BigEarthNet, SEN12MS optical subset, crop mapping regional data | 10 m/20 m/30 m | macro-F1, per-class F1, region holdout | Prithvi/Clay/AnySat |

关键实验：在高分辨率 aerial scene 上训练，在中分辨率 satellite scene 上测试，反向也做；不要只随机划分。

### 6.2 分割任务

| 目标 | 数据集候选 | GSD 范围 | 指标 | Baseline |
|---|---|---|---|---|
| 城市 land-cover 分割 | LoveDA, Vaihingen, Potsdam, DeepGlobe Land Cover | 0.05 m 到 10 m | mIoU, boundary F1, small-object IoU | SegFormer/UPerNet head, static LoRA |
| 建筑/道路分割 | SpaceNet, Massachusetts Buildings/Roads, Inria Aerial, DeepGlobe Roads | 0.3 m 到 1 m+ | IoU, F1, connectivity/topology metric | frozen backbone + decoder |

关键实验：统一 resize 后仍提供真实 GSD；测试是否改善边界厚度、道路连通和小建筑漏检。

### 6.3 检测任务

| 目标 | 数据集候选 | GSD 范围 | 指标 | Baseline |
|---|---|---|---|---|
| 小目标/旋转目标检测 | DOTA, DIOR, xView, FAIR1M subset | 0.1 m 到 1 m+ | mAP, AP-small, AP by object-size-in-meter | DINO/RetinaNet/Oriented R-CNN head |
| 车辆/飞机/船舶跨 GSD | DOTA/xView/DIOR 合并子集 | 多 VHR | AP50/AP75, size-bin AP | static LoRA, no-GSD |

关键实验：按真实米制尺寸分桶，而不是只按像素面积分桶；观察 GSD-aware adapter 是否减少“同一真实尺寸目标在不同 GSD 下 AP 波动”。

## 7. 训练与评测协议

### 7.1 数据划分

- `in-GSD`: 训练和测试 GSD 范围一致。
- `near-GSD`: 测试 GSD 与训练接近，例如 0.3 m -> 0.5 m。
- `far-GSD`: 测试 GSD 明显不同，例如 0.3 m -> 10 m，或 10 m -> 30 m。
- `leave-sensor-out`: 留出一个传感器/数据集测试，避免 dataset shortcut。
- `leave-region-out`: 留出城市/国家/生态区测试，避免空间泄漏。

### 7.2 评价指标

除了常规 OA/mIoU/mAP，还建议报告：

- `Delta-GSD`: far-GSD 相对 in-GSD 的性能下降。
- `Scale Calibration Error`: 按 GSD 分桶后置信度与准确率的校准误差。
- `Metric-size AP`: 按真实米制目标尺寸分桶的 AP。
- `Boundary-by-GSD F1`: 不同 GSD 下的边界 F1。
- `Wrong-GSD Sensitivity`: 推理时输入错误 GSD 后性能下降，验证模型是否使用尺度条件。

## 8. 未来研究方向

1. **GSD-aware LoRA routing**：不是所有层都需要尺度条件，研究浅层纹理层、中层对象层、高层语义层分别调制的收益。
2. **Scale-equivariant decoder**：backbone frozen，只在 decoder 中用 GSD 生成卷积 dilation、mask resolution 或 anchor prior。
3. **GSD + geolocation 解耦**：引入地理区域 adversarial loss，避免 GSD adapter 记住传感器/地区。
4. **continuous scale augmentation**：通过重采样和真实 metadata 构造连续 GSD 曲线，但要区分真实低分辨率与人工 downsample。
5. **VLM 尺度证据评测**：把 ScaleEarth 的 GeoScale-VQA 思路扩到 grounding/detection，让模型解释“这个对象大约多大”。
6. **teacher-student with AlphaEarth**：用 AlphaEarth 10 m embedding 约束中分辨率语义，用 VHR 数据训练边界/小目标，做跨尺度蒸馏。

## 9. 最小可执行论文方案

题目草案：**GeoScale-LoRA: Continuous GSD-Conditioned Adapters for Cross-Resolution Remote Sensing Foundation Models**

贡献点：

1. 提出一个轻量、backbone-agnostic 的 GSD-conditioned LoRA/adapter。
2. 构建分类、分割、检测三个任务的 train-GSD/test-GSD 评测协议。
3. 证明显式连续 GSD 条件优于 metadata token、普通 LoRA 和无 GSD 基线。
4. 用 wrong-GSD control、leave-sensor-out 和 leave-region-out 验证方法不是简单 dataset shortcut。

首个实验建议：

1. 选择 Clay 或 Prithvi-EO-2.0 作为可运行 frozen backbone。
2. 先做分类：EuroSAT + RESISC45/UCMerced 的跨分辨率迁移，快速验证主假设。
3. 再做分割：LoveDA + Potsdam/Vaihingen/DeepGlobe，检查边界和小目标。
4. 最后做检测：DOTA/DIOR/xView subset，按米制目标尺寸报告 AP。

主要风险：

- 跨数据集实验可能把类别定义差异和 GSD 差异混在一起。
- 一些公开模型的输入 metadata 接口不统一，工程成本可能偏高。
- 人工 downsample 不能完全代表真实低分辨率传感器。
- 如果 backbone 已在多尺度预训练中学得很好，轻量 adapter 的收益可能只体现在 far-GSD 或小样本设置。

## 10. 阅读队列

1. [ScaleEarth: Scale-aware Remote Sensing VLM, arXiv 2026](https://arxiv.org/abs/2605.07562)
2. [SkySense, CVPR 2024](https://openaccess.thecvf.com/content/CVPR2024/html/Guo_SkySense_A_Multi-Modal_Remote_Sensing_Foundation_Model_Towards_Universal_Interpretation_CVPR_2024_paper.html)
3. [Prithvi-EO-2.0 GitHub](https://github.com/NASA-IMPACT/Prithvi-EO-2.0)
4. [AlphaEarth Foundations blog](https://research.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/)
5. [AlphaEarth annual satellite embedding dataset in Earth Engine](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL)
6. [AnySat, CVPR 2025](https://openaccess.thecvf.com/content/CVPR2025/html/Astruc_AnySat_One_Earth_Observation_Model_for_Many_Resolutions_Scales_and_CVPR_2025_paper.html)
7. [Clay model repository](https://github.com/Clay-foundation/model)
8. [Galileo repository](https://github.com/nasaharvest/galileo)
9. [PANGAEA benchmark](https://pangaea-bench.github.io/)
10. [EarthShift benchmark](https://earthshift.github.io/)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

