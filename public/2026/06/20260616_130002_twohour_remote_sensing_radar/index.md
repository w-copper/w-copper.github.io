# FusionRS：把红外风格监督补进遥感 VLM 的 RGB-IR-text 数据底座


# FusionRS：把红外风格监督补进遥感 VLM 的 RGB-IR-text 数据底座

**结论：这一轮最值得补进雷达的是 *FusionRS: A Large-Scale RGB-Infrared Remote Sensing Dataset for Dual-Modal Vision-Language Foundation Models*。它不是又一个只做 RGB caption/retrieval 的遥感 VLM 数据集，而是把 60 万组遥感 RGB 图像、翻译得到的 infrared-style 图像和文本描述组织成 RGB-IR-text triplets，并额外生成 49,068 条训练用 IR-aware captions 与 10,000 条测试用 IR-aware captions。论文用 FusionRS 训练 CLIP-style RGB-IR-text 对齐模型和生成式 VLM，显示 IR-aware captions 能显著增强红外图像描述、IR-cue QA 和红外-文本对齐。对遥感 AI 来说，它的价值不在于提供“真实热红外物理测量”，而在于提出一个很清晰的数据工程问题：如果遥感 VLM 要走向非 RGB、多模态、可解释描述，文本监督必须显式描述该模态的视觉证据，而不能只复用 RGB caption。**

我按 2026-06-16 13:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是 RGB/infrared vision-language 数据集与模型训练论文，红外在这里是 visible/infrared 或 infrared-style 视觉模态，不是 SAR、InSAR、微波后向散射或雷达相干。同期本地文章已经覆盖 RATS、Gaze Heads、TTABC、Clay-CNN Hybrids、AI4Land、MaskWAM、GeoFM layer probing、CoastlineVLM、Stateful Visual Encoders、LG-SAM、VecLang、TerraBench、OSTB 等方向，因此这里不重复已有条目。

## 背景

遥感 VLM 过去两年的主线基本围绕 RGB 图像展开：遥感 caption、图文检索、RS-VQA、grounding、开放词汇分割和多轮问答。这个路线已经很有成果，但它也留下一个明显短板：遥感并不只有 RGB。红外、热红外、多光谱、夜间低照度、植被指数和其他非可见光线索，经常包含 RGB 看不到或不稳定的结构信息。

问题是，现有 VLM 的文本监督大多仍然是 RGB 语义描述。例如一张机场图像的 caption 会说 runway、aircraft、terminal、parking area，却很少描述灰度强度、亮暗区域、高对比边界、弱纹理区域或结构轮廓。把这种 caption 直接拿去训练红外图像理解，模型可能学到场景类别，但学不到“红外图像中哪些视觉证据支持这个判断”。

FusionRS 抓住的是这个 modality-language gap。论文并不只是把 RGB 图像翻成红外风格图像，而是进一步生成 IR-aware caption，让文本显式写出红外风格中的灰度强度、对比结构、亮暗区域和目标轮廓。这个设计对遥感 VLM 很重要：多模态不是把不同传感器堆到模型输入里就结束，语言监督也必须知道自己在描述哪个模态。

## 论文/项目

论文标题是 *FusionRS: A Large-Scale RGB-Infrared Remote Sensing Dataset for Dual-Modal Vision-Language Foundation Models*，arXiv 编号 2606.17020，arXiv 元数据显示提交时间为 2026-06-15 17:49:34 UTC，分类为 cs.CV 和 cs.AI。

主源链接如下：

- 论文：<https://arxiv.org/abs/2606.17020>
- HTML：<https://arxiv.org/html/2606.17020v1>
- PDF：<https://arxiv.org/pdf/2606.17020>

我在论文正文和 arXiv HTML 中没有看到官方 GitHub 或 Hugging Face 数据发布链接。因此当前可复现性判断要保守：方法、数据构造协议、表格和实验设置公开，但完整数据集、训练脚本和模型权重是否可下载还需要后续跟踪。

已验证事实是：FusionRS 由 5 个公开遥感来源构成，包含 600,000 个 RGB-IR-text triplets；训练/验证/测试划分为 580,000 / 10,000 / 10,000；IR-aware caption 子集包含 49,068 条训练 captions、416 条过滤后的验证 captions 和 10,000 条测试 captions。本文对下游遥感研究价值的部分是基于论文实验与任务形态做出的迁移判断。

## 数据

FusionRS 的来源包括 RS5M、SkyScript、NWPU、RSICD 和 RSITMD。论文表 2 和附录表 6 给出了完整统计：RS5M 贡献 488,033 条，SkyScript 65,266 条，NWPU 31,186 条，RSICD 10,824 条，RSITMD 4,691 条，总计 600,000 条。

构造流程分三步。

第一步，收集和清洗 RGB 遥感样本及原始文本。作者去除 stock-photo、copyright、Google Earth 等来源噪声，过滤非英文、过短、过长、过泛化、缺少场景信息的 captions。对 caption 缺失或过弱但有可靠类别标签的样本，使用类别名作为 scene-level fallback。

第二步，用 RGB-to-IR diffusion translator 把 RGB 遥感图像翻译成 infrared-style 图像，形成对齐 RGB-IR 图像对。论文强调这些图像是 infrared-style observations，不是真实传感器采集的热红外或物理红外测量。生成图像是三通道 `.jpg`，视觉上遵循灰度红外风格，便于直接接入标准 CLIP/VLM 管线。

第三步，生成 IR-aware captions。作者使用 Qwen2.5-VL-72B-Instruct 通过 OpenRouter API 生成红外感知描述，输入包括 RGB 图像、翻译后的 infrared-style 图像和原始 caption 或 scene text。目标是保留场景语义，同时显式描述 grayscale intensity、high contrast、bright structures、dark or low-texture regions 和 structural outlines。

这个设计的关键不是“生成红外图像”本身，而是把红外风格视觉证据写进语言监督。没有这一步，模型可能只是在红外图像上学习 RGB 场景标签；有了 IR-aware caption，模型才被迫把红外中的亮暗、边缘、结构和纹理变化映射到文本。

## 方法

论文训练两类模型。

第一类是 CLIP-style RGB-IR-text 对齐模型。每个 batch 包含对齐的 RGB 图像、infrared-style 图像和文本 caption。目标函数同时对齐 RGB-text、IR-text 和 RGB-IR 三组关系，可以写成三项 contrastive loss 的平均。RGB-IR 项负责视觉模态一致性，两个 image-text 项负责把 RGB 和 IR 都接到语言空间。

第二类是生成式 VLM instruction tuning。作者从 IR-aware caption 子集构造指令数据，每条样本包含 infrared-style 图像、自然语言 instruction 和目标回答。任务包括红外图像 captioning、scene QA、object QA 和 IR-cue QA。VLM 微调使用 LoRA，默认 rank 32、alpha 64、dropout 0.05，训练 1 epoch，学习率 2e-4，bf16，梯度累积 8。

论文特别区分了三种监督设置：

- **A-original：** infrared image 配原始 RGB caption。
- **B-iraware：** infrared image 配生成的 IR-aware caption。
- **C-mixed：** 同时使用原始 caption 和 IR-aware caption。

这个 ablation 很有价值，因为它直接回答一个数据问题：红外 VLM 是更需要场景语义，还是更需要模态特异描述。结果显示，CLIP 检索里 mixed 通常更稳；生成式 VLM 中 IR-aware caption 对红外描述和 IR-cue QA 提升最大，但原始 caption 对 scene QA 仍有帮助。

## 实验

CLIP 检索实验在 FusionRS test split 上评估 IR-to-text、text-to-IR、RGB-to-IR 和 IR-to-RGB。论文表 4 显示，OpenAI CLIP ViT-L/14 在未做 IR-aware fine-tuning 的 580K-only 基线中 Mean R 为 66.22，是表中最高的基础结果；OpenAI CLIP ViT-B/32 为 55.49，OpenCLIP ViT-B/32 为 59.83，RemoteCLIP ViT-B/32 为 57.58，GeoRSCLIP ViT-B/32 为 59.32。

附录表 14 给出 IR-aware fine-tuning ablation。C-mixed 在所有 CLIP backbone 上都取得最好或接近最好的 Mean R：OpenAI CLIP ViT-B/32 从 55.49 到 61.41，OpenCLIP ViT-B/32 从 59.83 到 65.34，RemoteCLIP ViT-B/32 从 57.58 到 63.17，GeoRSCLIP ViT-B/32 从 59.32 到 64.41。这个结果说明，只用原始 caption 或只用 IR-aware caption 都可能损失一部分信息，组合监督更适合检索式对齐。

生成式 VLM 实验更直接。以 Qwen2.5-VL-7B 为例，论文表 5 显示，A-original 的 Caption Auto 为 52.55、Caption IR Score 为 1.10、IR-cue QA 为 1.29；B-iraware 分别提升到 70.32、90.04、89.70。Object QA 也从 40.09 小幅升到 41.41，但 Scene QA 从 45.00 降到 41.10。这个结果很合理：IR-aware caption 强化了红外线索描述，但可能牺牲一些简洁场景标签监督。

附录表 15 把这个结论扩展到 GeoChat、H2RSVLM、InstructBLIP、LLaVA-1.5、LLaVA-1.6 和 Qwen2.5-VL-7B。B-iraware 在多数 backbone 上显著提升 Caption IR 和 IR-cue QA。例如 H2RSVLM 的 Caption IR 从 0.69 到 94.78，IR-cue QA 从 0.74 到 92.90；InstructBLIP 的 Caption IR 从 0.54 到 86.32，IR-cue QA 从 0.49 到 84.43。虽然不同模型的 scene/object QA 表现并不一致，但“模态特异语言监督能教会模型说出红外证据”这个信号很强。

## 亮点

第一，FusionRS 把遥感 VLM 的问题从 RGB 扩展到 RGB-IR-text 三元对齐。很多现有遥感 VLM 数据集只支持 RGB-text 或 RGB-VQA，FusionRS 至少给了一个成规模的双视觉模态语言学习协议。

第二，论文明确指出红外图像需要红外语言。这个观点比单纯扩数据更重要。遥感多模态模型经常犯的错误是把所有模态都配同一条 RGB caption，结果模型学到的是类别先验，不是模态证据。FusionRS 的 IR-aware caption ablation 证明了这个差异。

第三，数据规模足够做基础实验。60 万 triplets 虽然比 RS5M 小，但对 RGB-IR CLIP 对齐、LoRA VLM tuning、caption/VQA ablation 和 retrieval benchmark 已经够用。它适合做新方法验证，而不只是 toy dataset。

第四，实验覆盖判别式和生成式两条路线。CLIP 检索说明 embedding 对齐问题，VLM caption/QA 说明自然语言生成问题，两者结合能更完整地评估红外遥感 VLM。

第五，论文把限制写得比较清楚。作者承认 infrared images 是从 RGB 生成的，不应作为真实热红外物理测量，也不应直接用于应急、军事、环境监管、公共政策等高风险决策。这一点对后续引用非常重要。

## 不足

第一，最大风险是红外模态是合成的。RGB-to-IR translation 能生成“看起来像红外”的灰度和高对比结构，但 RGB 中没有的热响应、材料属性、夜间辐射特征和真实传感器噪声无法凭空恢复。因此 FusionRS 更适合做 infrared-style VLM 预训练或数据方法研究，不适合直接宣称解决真实热红外遥感。

第二，当前没有看到官方代码、数据或权重链接。论文提供了流程和表格，但如果数据集暂未公开，外部研究者复现 CLIP/VLM 训练会受限。这个条目需要后续跟踪 GitHub、Hugging Face 或项目页。

第三，评价任务仍偏 caption/retrieval/QA。论文也承认 object detection、change detection、cross-modal geospatial reasoning、disaster monitoring 等下游任务尚未验证。对遥感而言，真正难的是把 RGB-IR 证据用于检测、分割、变化解释和制图。

第四，IR-aware captions 由 VLM 生成，可能带来语言模板化和语义幻觉。虽然作者做了规则过滤和人工抽样检查，但自动 caption 仍可能包含不完整描述、弱红外线索或不可靠物理表述。后续如果把它当 benchmark，需要额外人工审计。

第五，mixed supervision 在判别式和生成式任务中的表现不一致。CLIP 里 C-mixed 最稳，但 Qwen2.5-VL-7B 的生成式实验中 B-iraware 对红外描述最强，C-mixed 反而不总是最好。这说明多模态文本监督不是简单相加，训练配比、任务格式和 loss 权重都需要重新设计。

## 遥感迁移方案

最值得做的不是直接复刻 FusionRS，而是把它变成一个真实多模态验证协议。

第一步，用公开真实 RGB-thermal 或 RGB-infrared 数据做小规模 sanity check。即使样本量远小于 60 万，也要验证在真实传感器红外图像上，IR-aware caption 是否仍然提升 IR-to-text retrieval、IR captioning 和 IR-cue QA。如果合成红外上有效、真实红外上失效，就说明 translator bias 太强。

第二步，把任务从 caption 扩展到 region-level。遥感中最有用的红外线索往往不是整图场景，而是局部区域：热异常、火点、建筑屋顶、道路、车辆、水体边界、裸地和植被差异。可以把 FusionRS 的 image-level captions 改造成 box/mask/polygon-conditioned captions，让 VLM 描述某个区域的红外证据。

第三步，接 open-vocabulary segmentation 或 grounding。RGB-IR CLIP alignment 可以作为候选区域检索器，IR-aware VLM 可以给候选 mask 生成证据描述。这样可以把“红外高亮结构”与“建筑、道路、车辆、水体、火点”等类别词对齐，而不是停留在全图 caption。

第四步，做变化检测解释。红外或红外风格信息对火灾、城市热岛、夜间活动、灾害响应和植被水分状态很有潜力。可以把 t1/t2 的 RGB-IR pairs 输入 VLM，让模型输出变化类型和红外证据，再用光学变化检测数据做第一轮验证。

第五步，做数据质量审计。FusionRS 最大贡献也可能是一个可复用审计框架：给定某个多模态遥感数据集，检查 caption 是否真的描述了目标模态的视觉证据，而不是只复述 RGB 场景标签。这个方向可以扩展到 multispectral、hyperspectral、NDVI、DSM 和夜光数据。

## 可做的论文方向

第一，做 **Real-vs-Synthetic IR Gap for Remote Sensing VLMs**。问题是合成 infrared-style 数据是否能迁移到真实红外遥感。假设是 IR-aware caption 对语言对齐有效，但真实传感器物理差异会造成系统性偏差。方法是在 FusionRS-style 合成数据上训练，再用真实 RGB-thermal/RGB-IR 小数据集测试 retrieval、captioning、region QA 和 calibration。指标包括 Recall@K、caption factuality、IR-cue precision、OOD confidence 和人工红外证据评分。

第二，做 **Region-Level IR-Aware Remote Sensing VLM**。问题是 image-level caption 太粗，无法支持遥感解译。方法是用检测框、SAM/RemoteSAM mask 或人工 polygon 构造区域级 RGB-IR-text 样本，让模型描述局部亮暗、边界、低纹理和结构轮廓。数据可从 DOTA/DIOR/NWPU VHR-10、LoveDA/OpenEarthMap、真实 thermal aerial 数据和合成 RGB-IR 数据混合构造。指标包括 region caption grounding、object QA、mask-text alignment 和幻觉率。

第三，做 **Modality-Specific Caption Audit for GeoFM/VLM Pretraining**。问题是多模态遥感数据集常把同一条 caption 复制给不同模态，导致模型忽略传感器差异。方法是设计一个审计器，自动检测 caption 是否包含模态特异证据，给出 RGB-only、IR-aware、multispectral-aware、DSM-aware 等标签。贡献可以是 benchmark 和数据清洗协议，而不一定是新模型。

第四，做 **RGB-IR Contrastive Adapter for Existing RemoteCLIP/GeoRSCLIP**。问题是重新训练大 CLIP 成本高。方法是在已有 RemoteCLIP/GeoRSCLIP 上加轻量 IR adapter 或 LoRA，只训练 RGB-IR-text 三元对齐和 IR-aware caption 对齐。对比 full fine-tuning、adapter、prompt tuning、只训 projection head。指标看 IR-to-text、text-to-IR、RGB-to-IR、跨场景泛化和参数效率。

第五，做 **Infrared Evidence Grounding for Disaster and Fire Monitoring VLMs**。问题是灾害类 VLM 容易把“火灾、烟、热异常、裸地、阴影”混淆。方法是把红外证据描述作为回答约束，要求模型输出 scene label、可见证据、红外证据和不确定性。注意这类方向必须使用真实传感器数据做验证，FusionRS 只能作为预训练或方法原型。

## 实验建议

最小实验不要从 60 万样本开始。建议先做一个 3 组对照：

1. RGB caption only：IR image 配原始 RGB caption。
2. IR-aware caption only：IR image 配红外证据 caption。
3. mixed：IR-original、IR-aware、RGB-original、RGB-IR visual pair 一起训练。

模型用 RemoteCLIP 或 GeoRSCLIP 的 ViT-B/32 做轻量 adapter，另选 Qwen2.5-VL-7B 或较小开源 VLM 做 LoRA。先在合成 RGB-IR 数据上复现趋势，再拿一个真实 RGB-thermal/RGB-IR 小集做外部测试。

必须报告两类失败。第一类是语义失败：模型看到了红外结构，但类别说错。第二类是物理失败：模型把 synthetic IR 的亮暗模式当成真实热强度，做出没有传感器依据的判断。后一类尤其重要，因为它决定这条线能不能进入应急、环境和公共政策场景。

可直接用于论文审稿或内部数据审计的 prompt：

```text
你是遥感多模态 VLM 数据审计器。
给定一个 RGB-IR-text 遥感数据集、若干样本、caption 生成流程和模型实验结果，请判断该数据集是否真的支持红外遥感理解，而不是只把 RGB 语义复制到红外风格图像上。

必须检查：
1. 红外图像是真实传感器采集、配准图像，还是由 RGB 翻译得到的 infrared-style 图像。
2. caption 是否明确描述红外证据，例如灰度强度、高对比结构、亮暗区域、低纹理区域、目标轮廓；不能只复述 RGB 场景类别。
3. 是否区分 scene semantics 和 modality-specific cues，并分别报告 caption、retrieval、QA 指标。
4. 是否有真实红外或热红外外部测试集；如果没有，必须把结论限定为 synthetic infrared-style 预训练。
5. CLIP 检索是否同时报告 IR-to-text、text-to-IR、RGB-to-IR、IR-to-RGB，不能只看 RGB-text。
6. VLM 是否存在红外物理幻觉，例如把合成亮度解释成真实温度、火点或热异常。
7. 是否公开数据、代码、权重、caption 生成 prompt 和过滤规则。

输出：
- 结论：strong / promising / limited / weak
- 最大贡献
- 最大风险
- 必须补充的外部验证
- 是否适合作为真实红外遥感 benchmark
```

## 今日判断

FusionRS 是一个值得跟踪的数据型工作。它的短期价值在于提醒遥感 VLM：非 RGB 模态需要非 RGB 语言监督，尤其需要把模态特异视觉证据写进 caption 和 QA。它的实验也给出了清楚信号：IR-aware caption 对红外描述、IR-cue QA 和红外-文本对齐有明显帮助。

但它也不能被过度解读。FusionRS 的 infrared images 是从 RGB 翻译得到的 infrared-style 图像，不是真实物理红外测量；目前也没有看到官方代码或数据发布链接。最稳妥的定位是：它适合作为 RGB-IR-text 训练协议、caption 设计范式和多模态遥感 VLM 预训练思路；若要服务真实灾害、火点、夜间、热异常或环境监测，必须补真实传感器外部验证。

## 参考来源

- FusionRS arXiv：<https://arxiv.org/abs/2606.17020>
- FusionRS HTML：<https://arxiv.org/html/2606.17020v1>
- FusionRS PDF：<https://arxiv.org/pdf/2606.17020>
- RS5M / GeoRSCLIP：<https://github.com/om-ai-lab/RS5M>
- Qwen2.5-VL technical report：<https://arxiv.org/abs/2502.13923>

