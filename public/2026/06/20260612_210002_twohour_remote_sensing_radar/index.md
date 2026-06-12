# Flexible GeoFM：缺 band 鲁棒性可能比单榜最高分更重要


# Flexible GeoFM：缺 band 鲁棒性可能比单榜最高分更重要

**结论：这一轮最值得单独跟踪的不是一个新遥感 VLM，而是一篇把 geospatial foundation model 架构放到同一预训练、同一 GeoBench 协议下比较的工作；它提醒我们，真正可落地的遥感基础模型必须能在 band 缺失、传感器切换和任务谱段偏好变化时“优雅退化”。**

我按 2026-06-12 21:00 +08 检索公开来源，过滤了 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 方向。本篇选择 2026-06-10 提交的 *Emerging Flexible Designs for Geospatial Multimodal Foundation Models*。论文中包含一个 Sentinel-1/Sentinel-2 扩展实验，但本文只讨论其 Sentinel-2 光学多光谱主实验和缺 band 结论，不把 SAR-only 结果作为推荐重点。

这篇的价值在于它不再只问“哪个 GeoFM 在某个下游任务上最高”，而是问一个更工程也更科学的问题：当下游数据只有 RGB+NIR，或者缺少 Red Edge / SWIR，或者从 Sentinel-2 迁移到商业四波段影像时，模型性能如何下降。这个问题直接关系到遥感基础模型能不能从论文 benchmark 进入真实生产管线。

## 背景

过去两年遥感基础模型的竞争很容易被三个指标带偏：模型参数量、预训练数据规模、单个 benchmark 的平均分。问题是，遥感应用的输入从来不稳定。不同卫星的光谱配置不同，同一地区可能因为云、传感器噪声、产品级别或采购成本导致某些 band 不可用；农业、城市、生态和灾害任务对谱段的依赖也不同。一个模型在完整 Sentinel-2 十波段上表现强，并不代表它在 RGB+NIR 或缺 SWIR 的场景里可靠。

这篇论文把 SatMAE、DOFA 和一个 ClimaX/Flex 风格架构放到同一实验条件下比较。作者统一了预训练目标、预训练数据、模型规模和 GeoBench 下游协议，尽量减少“每篇论文各自调参、各自选数据”的不可比问题。这个设定对后续做 GeoFM 很重要，因为很多所谓 SOTA 其实混杂了架构、数据、训练轮数、下游 head 和评测 split 的差异。

从 CV-to-RS 角度看，它继承的是 masked autoencoding、动态 token/embedding、encoder-decoder 和中间融合这些通用视觉模型设计，但真正的遥感化问题在于光谱结构：band 不是普通 RGB 通道，Red Edge、NIR、SWIR 对植被、水分、土壤和建筑材料的物理含义不同。遥感基础模型如果忽略这种结构，很容易学到对某些谱段的隐性依赖。

## 方法

论文比较三类代表性设计。SatMAE 用先验知识把 Sentinel-2 band 分组，并分别提取特征后做 intermediate fusion；DOFA 用 wavelength-aware dynamic patch embedding，把波长信息注入早期特征构建；Flex 则更接近数据驱动的 early-fusion / cross-attention 思路。三者都用 masked autoencoding 做自监督预训练，以便比较架构本身对光谱灵活性的影响。

预训练主实验使用美国东南部 Sentinel-2 数据。论文描述其采样考虑 biome、气候和土地覆盖多样性，总量为 854,200 个 image tiles，所有选定 band 被重采样到 10 m。下游评测采用 GeoBench 的 Sentinel-2 子集，覆盖分类和分割：m-BigEarthNet、m-brick-kiln、m-EuroSAT、m-Cashew、m-SA-Crop。分类使用 linear probing，分割统一使用 UPerNet，backbone 冻结，只训练下游 head 或 decoder。

最关键的实验不是普通 full-band fine-tuning，而是四组 band 配置：10 bands 包含 RGB、Red Edge、NIR、Narrow NIR、SWIR1、SWIR2；8 bands 去掉 SWIR；6 bands 进一步去掉部分 Red Edge / Narrow NIR；4 bands 只保留 RGB+NIR。这个设计很好，因为它把“光谱信息越多越好”的朴素假设拆开了：某些任务确实需要 SWIR 或 Red Edge，另一些任务可能被无关或噪声 band 干扰。

## 实验/数据

主结果显示，SatMAE 在 20 个“数据集 x band 配置”组合里有 13 个超过 DOFA 和 Flex，是整体最稳定的架构。更重要的是，它在 band drop 场景下下降更平滑：例如 m-brick-kiln 和 m-EuroSAT 中，SatMAE 的 4-band 表现甚至超过其 10-band 表现。作者推测这与 grouped-channel intermediate fusion 有关；当 Red Edge 和 SWIR 被移除后，模型更集中依赖可见光和 NIR 的有效特征，而不是被不必要谱段牵制。

DOFA 的优势更偏 full-band 和效率。它在 m-brick-kiln、m-BigEarthNet、m-SA-Crop 的 10-band 配置上有强表现，并且计算复杂度明显更低：论文表 4 给出 DOFA-base 约 3.36 GMAC、197 img/s、峰值显存约 2.07 GB；SatMAE 则约 40.26 GMAC、55.75 img/s、峰值显存约 11.36 GB。这意味着 DOFA 适合全谱段、算力受限的部署，但在 Red Edge / mid-range band 缺失时更容易降分。

Flex 的问题是学到了较强的 SWIR 依赖。论文报告其在 10 -> 8，也就是去掉 SWIR 时多项任务显著下降。对 m-cashew、m-SA-Crop 这类植被细分类任务，SWIR 确实有物理意义，因为它和水分、植被状态相关；但如果模型把 SWIR 依赖泛化到并不需要它的任务，就会降低跨数据源鲁棒性。

这组实验给出的核心证据不是“某模型永远最好”，而是“架构的融合位置和光谱先验会改变模型在缺 band 下的失败方式”。这比单个 benchmark 排名更有价值，因为遥感落地常常不是拿到完整、干净、同构的数据，而是在多源、多地区、多季节和多预算约束下拼出可用输入。

## 亮点

第一，问题设定抓住了 GeoFM 的真实瓶颈。很多基础模型论文强调大规模预训练，但真实下游更常见的是 band 不齐、传感器不一致、区域外泛化差。论文用 10/8/6/4 band 逐级剥离，让鲁棒性问题变得可测。

第二，比较相对公平。统一 MAE 预训练、统一 Sentinel-2 数据、统一 GeoBench 下游协议、冻结 backbone，并用同一类下游 head，能减少架构比较中的混杂变量。后续做新 GeoFM 时，这种 apples-to-apples protocol 比单独刷榜更值得借鉴。

第三，它把“光谱先验”重新放回模型设计中心。SatMAE 的 grouped-channel 和 DOFA 的 wavelength-aware embedding 都说明，多光谱基础模型不能简单照搬 RGB ViT。通用 CV 的 MAE 思路可以迁移，但遥感模型需要尊重 band 的物理含义和传感器配置。

第四，结论具有部署意义。DOFA 的效率优势、SatMAE 的缺 band 稳定性、Flex 的 SWIR 偏置，分别对应不同系统选择：大规模推理、跨传感器迁移、农业/植被任务或完整 Sentinel-2 数据场景，不应该用同一个平均分做决策。

## 不足

第一，预训练数据仍偏区域。主实验使用美国东南部 Sentinel-2 数据，虽然采样考虑环境多样性，但不能直接代表全球地表、季节、农业制度、城市形态和气候区。缺 band 鲁棒性在热带、干旱区、高纬度、山地和城市密集区可能不同。

第二，下游任务覆盖还不够宽。GeoBench 子集包括分类和分割，但还没有充分覆盖变化检测、开放词表分割、VQA、跨区域 OOD、弱标签制图和大范围时序监测。一个架构在静态分类/分割上优雅退化，不等于在时序变化或 VLM grounding 中也稳定。

第三，冻结 backbone 的评测有利于观察表示质量，但不等于真实 fine-tuning。实际项目常会做 PEFT、LoRA、adapter、partial fine-tuning 或蒸馏。不同架构在可调参训练后的差距可能变化，需要补充低标注和少量参数更新实验。

第四，SAR 扩展实验不应被过度解读。论文确实包含 S1+S2/m-so2sat 对比，但本文不把它作为方向推荐。对当前非 SAR 研究目标，更应关注它对 Sentinel-2 多光谱、RGB+NIR 迁移和缺 band 设计的启发。

第五，还缺少代码和模型权重层面的复现闭环。我在公开检索中优先确认了 arXiv 论文；论文提到使用 terrastackai/iterate 设置和 SatCAMELSH 数据集计划开源，但如果没有完整训练脚本、预训练权重和数据清单，社区复现成本仍会偏高。

## 启发

一个可做的小论文方向是：**面向光学多光谱基础模型的缺 band 鲁棒评测与自适应 adapter**。核心问题不是再提出一个更大的 GeoFM，而是系统评估不同 band 缺失、传感器切换和任务谱段偏好下，现有 GeoFM 的性能下降曲线，并设计一个轻量 adapter 让模型在缺 band 时自动调整特征融合。

假设是：显式建模 band 组、波长位置和任务谱段需求，可以比简单通道补零、均值填充或 RGB-only fine-tuning 更稳。方法上可以用三部分组成：band-aware tokenizer 记录每个输入 band 的中心波长和分辨率；grouped adapter 在 visible、red-edge、NIR、SWIR 之间做可学习门控；task-conditioned gating 根据下游任务自动降低无关或噪声 band 的权重。

数据集可以从 GeoBench 的 m-BigEarthNet、m-EuroSAT、m-Cashew、m-SA-Crop 开始，再加入 Dynamic World、SEN12MS 的光学部分、LoveDA/SpaceNet 的 RGB 或 RGB+NIR 场景。评测指标除 OA、m-F1、mIoU 外，应加入 band-drop AUC、worst-band performance、cross-sensor gap、参数量、吞吐和显存。基线包括 SatMAE、DOFA、Prithvi-EO、Clay、Galileo，以及简单的 RGB-only、zero-fill、learned-channel-projection。

最小实验可以非常具体：固定一个 GeoFM backbone，构造 10/8/6/4 band 和随机缺 band 两类输入；比较无适配、线性投影、LoRA、grouped adapter 和 wavelength-aware adapter；报告每个任务在完整 band 到缺 band 的下降曲线。只要能证明 adapter 在不显著增加计算量的前提下改善 worst-case performance，就有机会形成一篇扎实的 workshop 或期刊短文。

这个方向也能和遥感 VLM 结合。当前许多 RS-VLM 默认输入 RGB 图像，导致光谱信息被丢弃；如果把 band-aware GeoFM 作为视觉 encoder，再让 VLM 在回答时显式引用“哪些谱段支持这个判断”，就可以从图像描述走向证据可解释的多光谱问答。例如农业 VQA 不只回答“这可能是作物”，而是说明 NIR/Red Edge/SWIR 的证据是否支持植被水分或物候判断。

更重要的是，这类工作有清晰的负结果价值。如果实验发现某些任务 RGB+NIR 已足够，或者某些 Red Edge/SWIR 在特定 benchmark 中引入噪声，也同样有意义。遥感基础模型不应该默认“band 越多越好”，而应该学习“对这个任务，哪些 band 值得信任”。

## 参考

- *Emerging Flexible Designs for Geospatial Multimodal Foundation Models*：https://arxiv.org/abs/2606.12595
- SatMAE: *Pre-training Transformers for Temporal and Multi-Spectral Satellite Imagery*：https://arxiv.org/abs/2207.08051
- DOFA: *Neural Plasticity-Inspired Foundation Model for Observing the Earth Crossing Modalities*：https://arxiv.org/abs/2403.15356
- GeoBench benchmark：https://github.com/ServiceNow/geo-bench
- terrastackai/iterate：https://github.com/terrastackai/iterate

