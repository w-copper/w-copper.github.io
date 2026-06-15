# ShearFuse-UNet：火势蔓延预测不一定要更大模型，方向边界更重要


# ShearFuse-UNet：火势蔓延预测不一定要更大模型，方向边界更重要

**结论：这一轮最值得补进雷达的是 2026-06-12 提交到 arXiv 的 *ShearFuse-UNet: Hadamard, DCT, and Shearlet Transform Fusion for Next-Day Wildfire Spread Prediction*。它不是遥感 VLM，也不是新的 GeoFM，而是把次日野火蔓延预测里一个很具体的结构先验说清楚了：火线不是普通纹理，而是受风、地形、植被和既有燃烧边界共同约束的方向性边界。ShearFuse-UNet 用 WHT、DCT 和 Shearlet 三类固定变换替代一部分 learned attention，在 267k 参数下达到 WildfireSpreadTS 上 F1 0.596，比 14M 参数 ResNet18 U-Net baseline 的 0.589 略高，重点价值在“轻量、可部署、面向边界几何”。**

我按 2026-06-15 15:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇使用的是多模态卫星、气象、地形和火点时序数据，不以雷达或微波成像为核心输入。它和历史里的 wildfire GeoFM LoRA 方向不同：那条线更偏火烧迹地/灾后制图和基础模型微调，本篇聚焦 **次日火势蔓延预测**，也就是应急响应里更关心的“明天哪里可能烧到”。

## 背景

遥感灾害 AI 很容易被两个方向吸走注意力。

一个方向是大模型化。我们会自然想到用 GeoFM、VLM、SAM 或多模态 Agent 来做灾害识别、火烧迹地制图、风险问答和报告生成。这条线重要，但它并不直接解决应急预测里的延迟和资源约束。

另一个方向是物理模拟。火势蔓延受燃料、湿度、风速、坡度、地表覆盖、历史火点和人工干预影响，传统模型通常需要大量参数、专家校准和高质量输入。它可解释，但在真实应急环境中，快速更新、缺失数据和区域泛化都很难。

ShearFuse-UNet 切在两者之间：保留 U-Net 这种轻量 dense prediction 框架，但把火线几何放进网络结构里。它不追求用 Transformer 学出一切，而是问一个更工程的问题：如果火势边界天然有方向性，能不能用固定的频域和方向变换，把这种先验便宜地注入模型？

这个问题对遥感很实际。次日火势预测不是普通语义分割。背景里的大部分像素都不会燃烧，正类稀疏；真正关键的是边界附近的一小圈区域。模型如果只学全局纹理或只看上一日火点，很容易漏掉狭长扩散带；如果过度敏感，又会把大量未燃区域报成风险区。火线边界的方向、连续性和局部形态，就是这类任务的核心信号。

## 论文/项目

ShearFuse-UNet 的 arXiv 页面显示论文于 2026-06-12 提交，作者来自 University of Illinois Chicago 和 US Forest Service Pacific Wildland Fire Science Laboratory。论文目标是从多模态卫星数据预测下一天的 wildfire spread mask。

它主要连接两条已有基线。

第一条是 WildfireSpreadTS。这是 NeurIPS 2023 Datasets and Benchmarks Track 的数据集，提供 2018 年 1 月到 2021 年 10 月美国 607 个火事件的多模态时间序列，共 13,607 张样本，任务是 24 小时分辨率的火势蔓延预测。论文使用的 WildfireSpreadTS 输入是 128 x 128 空间分辨率、40 个输入通道。

第二条是 Google Research 的 Next Day Wildfire Spread 数据集。Google Research 页面将其描述为覆盖美国近十年历史野火的 curated large-scale multivariate dataset。ShearFuse-UNet 论文在该数据集上也做了验证：样本为 64 x 64 patch，12 个输入通道，来自卫星影像和天气数据，并采用 8:1:1 的 train/validation/test split。

代码侧需要保守看。论文详细描述了 PyTorch 实现，尤其是 cone-adapted digital Shearlet transform 用 FFT-based circular convolution 实现，不依赖外部库；但截至本轮检索，我没有找到 ShearFuse-UNet 的官方 GitHub 仓库。因此它当前更适合作为方法和复现候选，而不是马上可跑的开源工具。

## 方法

ShearFuse-UNet 的主体仍是标准 U-Net：四级 encoder、bottleneck、四级 decoder、skip connection 和 1 x 1 输出卷积。模型很小，base channel width 设为 8，encoder 通道大致是 8、16、32、64、128。

真正的改动在 encoder block。每个关键 encoder block 前面插入三条 transform-domain 分支。

第一条是 **Walsh-Hadamard Transform (WHT)** 分支。WHT 用正交的 Hadamard 基做全局混合，计算便宜，系数只有加减结构。论文把它类比成一种固定的 Query-like 表征：不是通过 learned projection 学注意力，而是用固定全局基把空间模式投到 sequency domain，再用可学习缩放和 soft-thresholding 选择保留哪些模式。

第二条是 **Discrete Cosine Transform (DCT)** 分支。DCT 对自然信号有能量压缩优势，低频部分对应平滑变化，高频部分对应细节。论文设置 DCT compression ratio，最后选择 r = 0.70，也就是保留一部分低频系数来减少冗余。它提供的是和 WHT 互补的频域描述。

第三条是 **Shearlet** 残差分支。这是最重要的部分。WHT 和 DCT 都偏各向同性，适合全局混合和频率压缩，但火线前沿常常是细长、弯曲、有方向的边界。Shearlet 的优势是多尺度、多方向、对曲线奇异结构更敏感。论文把 cone-adapted digital Shearlet 分解做成残差路径，只在 down2 和 down4 两个 encoder stage 注入，避免每一级都加方向分支导致冗余。

三条分支的融合方式也比较克制。WHT 和 DCT 的输出经过 SpectralFusion gate 自适应融合，Shearlet 重建结果作为额外残差加入。论文强调这只是功能类比 self-attention，不是数学等价：WHT/DCT/Shearlet 替代的是 learned Q/K/V 投影的一部分角色，但核心优势是固定变换带来的低参数量和明确先验。

训练上，论文使用 AdamW，初始学习率 1e-3，2 个 epoch warmup，cosine annealing，总计 200 epoch。loss 是 BCE、Dice 和 Focal 的组合，权重为 0.4、0.3、0.3。这个组合很符合火势蔓延预测的类别不平衡特征：正类少、边界难、漏检成本高。

## 实验

WildfireSpreadTS 上，ShearFuse-UNet 达到 Precision 0.564、Recall 0.632、F1 0.596、IoU 0.424，参数量 267k。对比 ResNet18 U-Net baseline，后者参数量 14M、F1 0.589；Base Swin-UNet 是 99M 参数、F1 0.592；Tiny Swin-UNet 是 34M 参数、F1 0.591。也就是说，ShearFuse-UNet 的绝对 F1 提升不大，但参数量和计算成本优势非常明显。

和同参数量的 WHT+DCT Fusion-UNet 相比，ShearFuse-UNet 的 F1 从 0.595 到 0.596，几乎持平；但 Recall 从 0.619 提到 0.632，Precision 从 0.573 降到 0.564。这个变化很值得注意：Shearlet 分支不是简单提高总分，而是把模型推向更高敏感性。对野火应急来说，漏报潜在蔓延区域通常比多报一些复核区域更危险，所以 recall 的上升有业务意义。

效率表也支撑这个判断。论文报告 128 x 128 单样本推理时，Base Swin-UNet 为 6.63 GFLOPs、8.31 ms/sample；ShearFuse-UNet 为 1.35 GFLOPs、3.03 ms/sample，同时 F1 更高。这说明固定变换不是论文包装，它确实改变了计算预算。

论文还测试了输入天数。把输入从 1 天扩展到连续 2 天后，参数量只从 267k 增到 269k，F1 从 0.596 提到 0.600，Precision 从 0.564 提到 0.570。这说明 temporal context 有稳定收益，但在当前架构里只是浅层扩展，后续还有更大空间。

在 Google Next-Day Wildfire Spread 数据集上，ShearFuse-UNet 也超过 TD-FusionUNet baseline。小容量设置下，TD-FusionUNet 为 103k 参数、F1 0.702，ShearFuse-UNet 为 67k 参数、F1 0.707；较大容量设置下，TD-FusionUNet 为 313k 参数、F1 0.704，ShearFuse-UNet 为 185k 参数、F1 0.709。这里的数字和 WildfireSpreadTS 不可直接横比，因为数据、预处理和输入通道不同，但能说明 Shearlet 残差不是只对单一数据集有效。

## 亮点

第一，它把“方向性边界”作为火势预测的一等结构先验。很多遥感模型把野火预测当作普通 segmentation，但火线前沿更接近曲线边界演化问题。Shearlet 分支正好对这种细长、弯曲、方向敏感结构有 inductive bias。

第二，它没有用大模型硬堆。267k 参数、1.35 GFLOPs、3.03 ms/sample 的设定非常适合应急场景里的批量 tile 推理、边缘部署或近实时更新。遥感 AI 不是每个问题都应该上 billion-scale foundation model。

第三，它给“固定数学变换 + 轻量神经网络”这条线重新提供了证据。WHT、DCT、Shearlet 都不是新东西，但把它们放进 U-Net encoder 并服务于具体地理过程，比泛泛地套 Transformer 更有问题意识。

第四，它的 precision-recall 取舍符合灾害响应逻辑。很多论文只报 F1 或 IoU，但火势预测里漏检和误报成本不对称。ShearFuse-UNet 用 Shearlet 提高 recall，即使牺牲一点 precision，在应急预警里可能更合理。

第五，它能迁移到其他遥感边界演化问题。洪水边界、滑坡扩展、海岸线变化、湖泊水位边界、城市火烧迹地扩张、病虫害斑块扩散，都有类似的方向性/曲线边界结构。Shearlet 不必局限于 wildfire。

## 不足

第一，提升幅度要冷静看。WildfireSpreadTS 上 F1 从 0.595 到 0.596 的差距很小，真正明显的是参数效率和 recall 倾向，而不是压倒性精度优势。后续需要更多随机种子、置信区间和跨年份/跨区域 split。

第二，论文没有给出完整官方代码仓库。虽然方法描述足够具体，但 wildfire 数据预处理、阈值、loss 权重、训练细节和评价脚本都会影响结果。如果没有开源复现，短期内还不能把它当成稳定 baseline。

第三，固定变换也有边界。Shearlet 对方向边界有优势，但真实火势蔓延还受燃料类型、人工阻隔、扑救策略、局地风场突变和地形通道影响。只加强边界几何，不等于理解火灾动力学。

第四，Google 数据集实验用了定制预处理，包括把缺失像素、背景像素、火点像素映射成软概率，并对 pre-fire mask 和风速通道做 Gaussian mixture softening。这些处理可能贡献很大，后续复现时要单独消融，不能把全部收益都归给 Shearlet。

第五，它还不是 VLM/Agent 系统。应急业务最终需要解释“为什么这里风险高”“风、坡度、燃料哪个因素主导”“哪些预测必须人工复核”。ShearFuse-UNet 输出的是 mask，不是证据链。要进入决策流程，还需要不确定性、归因和人机交互层。

## 启发

一个值得做成论文的方向是：**Risk-calibrated directional fire-front forecasting for remote sensing disaster response**。

问题可以定义为：给定过去 1 到 7 天的火点、气象、地形、燃料、土地覆盖和遥感观测，预测未来 24 小时火势蔓延概率图，同时输出边界方向不确定性和人工复核优先级。目标不是只把 F1 提高一点，而是把“漏报高风险火线”的概率压下来。

核心假设是：火势蔓延预测需要同时建模三类信息。第一是全局环境驱动，例如风、湿度和地形；第二是局部边界几何，例如火线方向和连续性；第三是风险校准，例如哪些高 recall 预测值得派人复核。WHT/DCT/Shearlet 这类固定变换可以负责低成本结构先验，GeoFM/VLM 不必直接替代它，而是用于证据审计和解释。

方法可以分三步。

第一步，复现 ShearFuse-UNet，并做严格消融。比较 U-Net、ResNet18 U-Net、TD-FusionUNet、Swin-UNet、ShearFuse-UNet，统一预处理、随机种子和 train/val/test split。指标除了 F1/IoU，还要报告 recall at fixed false-alarm budget、boundary F1、expected calibration error、tile-level high-risk recall 和推理成本。

第二步，把单日/双日输入扩展成轻量时序模型。可以用 ConvGRU、temporal depthwise convolution 或小型 state-space block 接在 transform encoder 前后，测试 1、2、4、7 天上下文。关键不是让模型变大，而是看时间上下文是否能降低边界附近漏检。

第三步，加一个 VLM/LLM 审计层，但不要让 VLM 直接画火线。VLM 更适合读取模型输出、输入通道摘要、局部地图上下文和历史预测误差，生成“为什么这个 tile 需要复核”的解释，并把误差类型归因到风场突变、燃料不确定、云/缺失数据、边界形态异常或历史火点噪声。

可以从 WildfireSpreadTS 和 Google Next-Day Wildfire Spread 开始，之后迁移到区域性火灾数据或公开火烧迹地边界。基线包括 persistence、ResNet U-Net、Attention U-Net、TD-FusionUNet、ShearFuse-UNet 和一个小型 temporal variant。若方向边界模型能在跨年份或跨区域测试中提高 high-risk recall，同时保持低 GFLOPs，就有明确的遥感应急价值。

一个可直接用于这类工作的 VLM/LLM 审计 prompt 可以写成：

```text
你是野火蔓延预测结果审计器。
给定一个遥感 tile 的输入通道摘要、上一日火点/火线 mask、模型预测的次日蔓延概率图、地形坡度、风向风速、燃料/土地覆盖、缺失数据 mask 和历史误差记录，请判断该 tile 是否需要人工复核。

必须逐项检查：
1. 预测高风险区是否沿上一日火线边界合理扩展，而不是远离火线孤立出现。
2. 高风险扩展方向是否与风向、坡度和燃料连续性大致一致。
3. 若模型预测跨越道路、水体、裸地或低燃料区，标记为 barrier-conflict。
4. 若输入存在云、缺失值、火点稀疏或边界断裂，标记为 data-risk。
5. 若预测概率高但解释变量不支持，标记为 false-alarm-risk。
6. 若预测概率低但风、坡度和燃料共同支持扩展，标记为 miss-risk。
7. 输出 pass / human-review / urgent-review 三选一，并给出主要风险标签。

不要因为模型概率高就直接认为预测可靠。
不要把平滑、连续的预测边界自动视为真实火线。
如果漏报风险高于误报风险，优先选择 human-review 或 urgent-review。
```

这条线的核心不是把 VLM 变成火势预测器，而是让小模型负责高频、低延迟、可批量的像素预测，让 VLM/LLM 负责解释、审计和复核排序。遥感灾害 AI 的前沿不只在“大模型看懂图像”，也在“低成本模型稳定地产生可被审计的风险图”。

## 参考

- [ShearFuse-UNet: Hadamard, DCT, and Shearlet Transform Fusion for Next-Day Wildfire Spread Prediction](https://arxiv.org/abs/2606.14071)
- [WildfireSpreadTS GitHub repository](https://github.com/SebastianGer/WildfireSpreadTS)
- [WildfireSpreadTS OpenReview page](https://openreview.net/forum?id=RgdGkPRQ03)
- [WildfireSpreadTS Zenodo dataset record](https://zenodo.org/records/8006177)
- [Google Research: Next Day Wildfire Spread dataset](https://research.google/pubs/next-day-wildfire-spread-a-machine-learning-dataset-to-predict-wildfire-spreading-from-remote-sensing-data/)
- [U-Net with Hadamard Transform and DCT Latent Spaces for Next-day Wildfire Spread Prediction](https://arxiv.org/abs/2602.11672)

