# RSVG-ZeroOV：把训练免费开放词汇 grounding 扩到遥感视频


# RSVG-ZeroOV：把训练免费开放词汇 grounding 扩到遥感视频

**结论：这一轮最值得补进雷达的是 2026-06-15 上 arXiv 的 *Training-Free Open-Vocabulary Visual Grounding for Remote Sensing Images and Videos*。它把 RSVG-ZeroOV 从图像级遥感开放词汇 grounding 扩展到视频级时空 grounding：用冻结 VLM 抽取文本相关注意力，用扩散模型补目标结构，再用 Evolve 模块净化 mask；视频部分再加 query-relevant key-frame selector 和 SAM3 temporal propagator。它的价值不在于训练了一个更大的遥感 VLM，而在于给出一个很清晰的系统范式：遥感开放词汇定位可以先从“训练大模型”转向“组合冻结基础模型的注意力、结构先验和时序传播”。**

我按 2026-06-16 17:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本文使用的是光学遥感图像、低空 UAV 视频和通用视频 grounding benchmark，不把雷达类工作纳入讨论。同期本地文章已经覆盖 FusionRS、DEO、RATS、Gaze Heads、TTABC、Clay-CNN Hybrids、AI4Land、MaskWAM、GeoFM layer probing、CoastlineVLM、Stateful Visual Encoders、LG-SAM、VecLang、TerraBench、OSTB 等方向，因此这里不重复已有条目。

## 背景

遥感 VLM 的一个长期痛点是：模型会“看懂场景”，但不一定能把用户说的目标精确落到像素、框或视频 tube 上。直接让 Qwen2.5-VL、GeoChat、LLaVA 这类 VLM 输出坐标，经常能生成合理描述，却在小目标、密集场景、相对位置和复杂表达上定位不稳。遥感图像又特别放大了这个问题：目标尺度变化大，背景重复，机场、港口、道路和居民区里有大量同类小目标。

传统 RSVG 方法通常需要人工标注的 referring expression、box 或 mask。这个路线能在封闭类别和固定数据集上做高分，但很难覆盖真实用户会输入的开放词汇：例如“高速路最右侧正在行驶的红色集装箱卡车”“港口左侧的白色游艇”“比水面船只更小的白色单层巴士”。标注成本高，类别覆盖窄，表达形式也有限。

RSVG-ZeroOV 抓住的是一个可迁移的中间层：冻结 VLM 的注意力图虽然不能直接给精确坐标，但已经包含文本和视觉区域的语义关联；扩散模型的 self-attention 又更擅长捕获目标结构和完整区域。把二者合起来，再用一个简单的注意力演化过程抑制无关响应，就能在不做任务训练的情况下得到可用 mask。

## 论文/项目

论文标题是 *Training-Free Open-Vocabulary Visual Grounding for Remote Sensing Images and Videos*，arXiv 编号 2606.16124，版本 v1 提交于 2026-06-15。作者来自 Xidian University、Fuzhou University 等单位。论文说明这是先前图像版 RSVG-ZeroOV 的 journal extension，新增了视频 grounding 框架、遥感与通用视频实验、更完整的 ablation 和可视化。

主源链接如下：

- 新版论文 arXiv：<https://arxiv.org/abs/2606.16124>
- 新版论文 HTML：<https://arxiv.org/html/2606.16124v1>
- 新版论文 PDF：<https://arxiv.org/pdf/2606.16124>
- 图像版官方 GitHub：<https://github.com/like413/RSVG-ZeroOV>
- 图像版 arXiv：<https://arxiv.org/abs/2509.18711>
- RRSIS-D 数据入口：<https://github.com/Lsan2401/RMSIN>
- RISBench 数据入口：<https://github.com/HIT-SIRS/CroBIM>

已验证事实是：GitHub 仓库目前对应图像版 RSVG-ZeroOV，README 标注为官方实现，提供 Qwen2.5-VL、Stable Diffusion 和 SAM 组合推理流程，并列出 RRSIS-D 与 RISBench 下载入口。2026-06-15 这个视频扩展版在论文中使用 SAM3 进行时序传播，但我没有在新版论文正文里看到新的 video extension 代码链接，因此复现状态要保守表述：图像版代码公开，视频版实现和脚本需要继续跟踪。

## 方法

图像版 RSVG-ZeroOV 是三阶段。

第一阶段是 **Overview**。模型用冻结 VLM 的 image-text attention 得到粗定位 prior。论文实验里默认采用 Qwen2.5-VL，关键观察是：VLM 直接输出框不可靠，但中后层注意力已经能响应到用户表达对应的区域。作者最终融合第 16、17、18、19 层视觉 token 相关注意力，权重为 0.1、0.1、0.3、0.5。

第二阶段是 **Focus**。模型用 Stable Diffusion v1.4 的 self-attention 提供结构先验。VLM 注意力容易只看目标角点、边缘或判别性局部；扩散模型 self-attention 更能扩展到完整对象区域。论文的核心工程点是把 VLM 的语义 prior 和 DM 的结构 prior 交互，而不是只使用一个 foundation model。

第三阶段是 **Evolve**。作者设计注意力演化模块来抑制无关激活，得到更纯净的 object mask。之后可以用 SAM 做可选 refinement。论文表 12 显示，SAM box refinement 在 RRSIS-D 上把 RSREC mIoU 提到 34.49、RSRES mIoU 提到 28.35。

视频版 Video RSVG-ZeroOV 再加两步。先用 query-relevant key-frame selector 找到与文本最相关的关键帧，在关键帧上运行图像版 RSVG-ZeroOV 得到初始 mask；再用 SAM3 temporal propagator 把 mask 传播到整个视频，形成时空 grounding 结果。这个设计很务实：不训练视频 grounding 模型，而是把开放词汇理解放在关键帧，把时序一致性交给视频分割基础模型。

## 实验

图像 grounding 使用 RRSIS-D 和 RISBench，任务包括 RSREC 框定位和 RSRES mask 分割。视频 grounding 使用 UAV-SAVG 做遥感低空视频评估，并额外在 HC-STVGv1、HC-STVGv2、VidSTG 上测试通用视频泛化。

在 RRSIS-D 上，RSVG-ZeroOV with refinement 的 RSREC Pr@0.5 为 31.39、mIoU 为 34.49；RSRES Pr@0.5 为 27.39、mIoU 为 28.35。相比最强弱监督 baseline QueryMatch，论文报告 RSREC mIoU 提升 17.28 点，RSRES mIoU 提升 12.62 点，而且没有使用任务训练数据。和 GeoChat+SAM、Qwen2.5-VL+SAM、LISA、NExT-Chat 等 pixel-level VLM 对比时，RSVG-ZeroOV 在表 5 的四个指标上也都是最高。

在 RISBench 上，RSVG-ZeroOV with refinement 的 RSREC Pr@0.5 为 38.90、mIoU 为 38.87；RSRES Pr@0.5 为 31.03、mIoU 为 31.84。RISBench 的 referring expressions 更长、更复杂，这个结果说明方法不只是适合简单类别词，也能处理更复杂语义约束。

视频实验更有信号。UAV-SAVG 上，Video RSVG-ZeroOV Strategy 1 的 m vIoU 为 27.19、vIoU@0.5 为 29.28、m fAcc 为 33.77、fAcc@0.5 为 34.61。它相对 Qwen2.5-VL baseline 分别提升 9.48、11.63、12.63、12.14 点；相比全监督 SAVG-DETR，m vIoU 接近，vIoU@0.5 和 frame-level 指标更强。也就是说，关键帧 mask 的质量确实能转化为视频时序定位收益。

消融也值得记。论文默认使用 Stable Diffusion guidance scale 7.5、DDIM 20 steps、seed selection K=7、response threshold τ=0.3、binarization α=0.4、temporal verification δ=0.05。表 13 显示，在 UAV-SAVG 上用 SAM3 替代 SAM2 后，Strategy 1 的 m vIoU 从 24.93 到 27.19，fAcc@0.5 从 30.52 到 34.61。这说明视频提升不只来自 SAM3，也来自 query-aware key-frame grounding 与 tube selection，但 SAM3 的时序传播确实有稳定增益。

## 亮点

第一，它把遥感开放词汇 grounding 从“训练专用数据集”推进到“冻结基础模型组合”。这对标注昂贵的遥感很重要，尤其适合快速验证新类别、新区域和用户自由描述。

第二，它不是简单 prompt VLM 输出框。论文明确证明 VLM coordinate output 不稳，但 attention map 有用；扩散模型 attention 又能补结构。这比“直接问大模型目标在哪里”更接近可复现系统。

第三，它把图像 grounding 和视频 grounding 串起来。遥感视频或 UAV 视频越来越重要，但 video-level referring annotation 更贵。关键帧开放词汇定位加 SAM3 传播，是一个低标注、低训练成本的合理方向。

第四，它覆盖多个 benchmark。RRSIS-D、RISBench、UAV-SAVG 加上 HC-STVGv1/v2 和 VidSTG，能同时看遥感图像、遥感视频和通用视频泛化，不只是单一数据集调参。

第五，它对后续 VLM 系统很有启发。遥感 VLM 不一定要把所有能力塞进一个端到端模型；可以把语义理解、结构补全、mask refinement、时序传播拆成可替换模块，再逐步评估每个模块的贡献。

## 不足

第一，训练免费不等于计算免费。Stable Diffusion attention extraction、Qwen2.5-VL attention、SAM/SAM3 refinement 和视频传播组合起来，推理链路并不轻。对于大范围瓦片制图或长视频监控，需要做缓存、关键帧稀疏化和模型裁剪。

第二，方法依赖基础模型 attention 的质量。若 VLM 对遥感小目标、罕见目标、细粒度属性或方向关系理解错误，后续 DM/SAM 只能放大或修补局部结构，不能从根本上恢复语义。

第三，视频版代码状态还不完整。图像版 GitHub 已公开，但 2026-06-15 论文中的 SAM3 视频扩展脚本、UAV-SAVG 评估代码和完整配置是否公开，需要继续跟踪。

第四，它主要验证的是定位和分割，不直接解决证据解释。真实遥感应用往往需要回答“为什么定位这里”“依据是屋顶、道路、阴影还是水体边界”，这需要把 grounding mask 和语言证据绑定起来。

第五，benchmark 仍可能偏离真实开放世界。RRSIS-D、RISBench 和 UAV-SAVG 很有价值，但真实用户查询会包含地名、时间、地图约束、功能语义、否定表达和多目标关系。开放词汇 grounding 的下一步必须接 GIS priors 和交互式修正。

## 遥感迁移方案

最直接的迁移是把 RSVG-ZeroOV 当作 **开放词汇标注器**。给定 LoveDA、OpenEarthMap、DOTA、DIOR、xView 或自建 UAV 视频，先用自然语言 query 生成候选 masks/tubes，再人工快速筛选，构造弱标签或主动学习样本。它特别适合找长尾对象、局部结构或没有固定类别体系的目标。

第二个方向是 **VLM grounding + change reasoning**。对同一区域 t1/t2 图像分别 grounding，或在视频中 grounding 同一目标的时序 tube，再让 VLM 解释变化：新建、拆除、移动、遮挡、停放、扩张。这样可以把变化检测从二值 mask 推向“用户指定目标的变化解释”。

第三个方向是 **GIS-aware grounding**。用户查询经常包含“道路左侧”“河岸附近”“学校操场旁边”“港口西北角”这类空间关系。可以把 OSM road/building/POI 或 parcel boundary 转成额外候选 prior，用来约束 VLM attention 和 SAM mask selection。

第四个方向是 **视频遥感交互式审查**。在 UAV 巡检、交通监控、灾害现场视频中，用户可以用自然语言指定目标，系统返回时空 tube 和关键帧证据。RSVG-ZeroOV 的 key-frame selector 正好适合作为第一版交互原型。

第五个方向是 **开放词汇 benchmark 审计**。很多遥感开放词汇论文只看类别词分割，不看自由表达和复杂空间关系。可以把 RSVG-ZeroOV 当作 strong training-free baseline，迫使新方法证明自己在开放表达、少标注和视频一致性上真的更强。

## 可做的论文方向

第一，做 **GIS-Constrained Training-Free RSVG**。问题是纯视觉 attention 容易被重复纹理和相似目标干扰。假设是 GIS vector priors 能减少遥感开放词汇 grounding 的空间歧义。方法是把道路、建筑、POI、地块和水系矢量转成候选 mask prior，与 VLM/DM attention 融合。指标看 RRSIS-D、RISBench、自建 GIS-query split 的 mIoU、Pr@0.5 和 spatial-relation accuracy。

第二，做 **Change-Aware RSVG-ZeroOV**。问题是现有变化检测缺少自然语言指定目标。方法是对双时相图像运行 RSVG-ZeroOV，构造 target-conditioned change mask，再让 VLM 生成变化类型和证据句。数据可用 LEVIR-CD、WHU-CD、SECOND、LEVIR-CC 和自建表达。指标包括 change F1、target grounding mIoU、caption factuality 和跨城市泛化。

第三，做 **Efficient Open-Vocabulary Grounding for Large EO Mosaics**。问题是训练免费方法推理链太重。方法是先用 GeoFM/CLIP embedding 做 tile retrieval，再只在 top-k tiles 上运行 RSVG-ZeroOV；对视频则做关键帧稀疏采样。指标包括 recall@tile、mask mIoU、GPU seconds per km2、吞吐量和漏检率。

第四，做 **Evidence-Grounded Remote Sensing VLM**。问题是 mask 有了，但解释不一定可靠。方法是要求模型输出 mask、box、引用表达解析、视觉证据和不确定性；用人工审计或 rule-based checks 评价证据是否落在 mask 内。这个方向适合和 RS-VQA、caption、grounding 结合。

第五，做 **Training-Free to Trainable Distillation**。问题是 RSVG-ZeroOV 推理重，但可以生成伪标签。方法是用它在大规模遥感图像上生成开放词汇 masks，再蒸馏一个轻量 grounding head 或 segmentation adapter。关键是保留开放表达能力，同时把推理成本降下来。

## 实验建议

最小复现实验建议从图像版开始。

1. 跑官方 GitHub 的 RRSIS-D 和 RISBench 推理流程，记录 Qwen2.5-VL attention、DM attention、Evolve mask、SAM refined mask 四个阶段。
2. 加入 GeoChat+SAM、Qwen2.5-VL+SAM、DiffSegmenter、DiffPNG 作为 baseline，不只看最终 mIoU，也看失败样例。
3. 做 query 类型分组：类别词、颜色/属性、相对位置、功能语义、多目标关系、否定表达。
4. 做小目标分组：按目标面积占比分 bucket，单独报告 Pr@0.5 和 mIoU。
5. 视频部分先不要从长视频开始，选 UAV-SAVG 短片段验证 key-frame selector 和 SAM3 propagation。
6. 记录推理耗时和显存。训练免费方法如果不能规模化，论文贡献就应定位为标注器或交互系统，而不是大范围制图系统。

可直接用于论文审稿或内部复现实验的 prompt：

```text
你是遥感开放词汇 grounding 复现实验审计器。
给定一个 training-free RSVG 方法、输入 query、图像/视频、输出 mask/tube 和实验表，请判断该方法是否真的具备开放词汇遥感定位能力，而不是只在固定 benchmark 上调参。

必须检查：
1. 输入是否为光学遥感图像或 UAV/航空视频；若包含 SAR、InSAR、radar 或 microwave，请单独标记并排除主结论。
2. query 是否覆盖类别词、属性、相对位置、功能语义、多目标关系和长尾类别，不能只用简单类别名。
3. 是否报告 RSREC 和 RSRES 指标，包括 Pr@0.3/0.5/0.7、mIoU、oIoU；视频任务是否报告 vIoU、fAcc 和关键帧误差。
4. 是否逐阶段展示 VLM attention、DM attention、Evolve mask、SAM refinement 或 temporal propagation 的贡献。
5. 是否和直接 VLM 坐标输出、VLM+SAM、DiffSegmenter、DiffPNG、弱监督方法和全监督方法公平比较。
6. 是否记录推理成本，包括模型数量、DDIM steps、显存、单图/单视频耗时和大图瓦片策略。
7. 是否检查失败模式：小目标、密集同类目标、遮挡、阴影、方向关系、跨帧目标漂移和错误关键帧。

输出：
- 结论：strong / promising / limited / weak
- 最大贡献
- 最大风险
- 是否适合作为伪标签生成器
- 必须补充的 3 个实验
```

## 今日判断

RSVG-ZeroOV 的新版值得跟踪。它把遥感 VLM 的能力边界说得很清楚：通用 VLM 已经有开放词汇语义，但缺精确空间落点；扩散模型有结构 prior，但缺 query 约束；SAM/SAM3 能生成和传播 mask，但需要可靠 prompt。把这些冻结模块按 Overview-Focus-Evolve 和 key-frame propagation 串起来，比单纯训练一个更大的遥感 VLM 更适合快速探索开放世界遥感交互。

短期最值得做的是复现图像版、跟踪视频版代码，并把它用于伪标签、交互式标注和开放表达 benchmark 审计。中期更有论文潜力的是加入 GIS priors、变化推理、证据解释和效率优化。不要把它过度包装成通用制图模型；更准确的定位是：一个强 training-free grounding baseline，一个可扩展的遥感 VLM 系统组件，以及一个能把自然语言、mask 和视频 tube 连接起来的研究入口。

## 参考来源

- RSVG-ZeroOV 新版 arXiv：<https://arxiv.org/abs/2606.16124>
- RSVG-ZeroOV 新版 HTML：<https://arxiv.org/html/2606.16124v1>
- RSVG-ZeroOV 新版 PDF：<https://arxiv.org/pdf/2606.16124>
- RSVG-ZeroOV 图像版 GitHub：<https://github.com/like413/RSVG-ZeroOV>
- RSVG-ZeroOV 图像版 arXiv：<https://arxiv.org/abs/2509.18711>
- RRSIS-D 数据入口：<https://github.com/Lsan2401/RMSIN>
- RISBench 数据入口：<https://github.com/HIT-SIRS/CroBIM>

