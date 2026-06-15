# GeoFM 迁移评测：不要只看最后一层，decoder 也会改写排名


# GeoFM 迁移评测：不要只看最后一层，decoder 也会改写排名

**结论：这一轮最值得补进雷达的是 2026-06-11 提交到 arXiv 的 *How do Self-Supervised Remote Sensing Vision Models Transfer to Downstream Tasks?*。它不是再提出一个遥感基础模型，而是系统追问一个更容易被忽略的问题：GeoFM 到底把下游任务需要的信息放在了哪一层，评测时用最后一层 embedding、轻量 decoder、UPerNet 或 fine-tuning，会不会直接改变模型排名？论文比较 MoCo、MAE、DINO v1、Prithvi v1、CROMA 和 TerraMind，结论很直接：GeoFM 的“强弱”不是一个固定标签，而是任务、标签量、特征层、decoder 和微调策略共同作用的结果。**

我按 2026-06-15 17:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是 GeoFM 迁移评测论文。虽然被比较的 CROMA 来自跨传感器预训练家族，论文的下游评测明确使用 optical/Sentinel-2 encoder；这里也只讨论光学/多光谱迁移、dense prediction 和评测协议，不把雷达分支作为主线。

它和前几轮的 Flexible GeoFM 不同。Flexible GeoFM 关心的是 band 配置、tokenization 和 missing-band 鲁棒性；本篇关心的是 **同一个预训练模型被怎样读取和适配**。换句话说，前者问“输入谱段不齐时架构怎么设计”，这篇问“模型内部哪一层才真正对下游有用，以及评测 head 有没有读对”。

## 背景

遥感基础模型这两年很容易陷入一个简单叙事：更大的预训练数据、更复杂的多模态目标、更高的 benchmark 总分，似乎就代表更强的通用能力。但真实下游使用并不这么干净。

一个模型可能在 EuroSAT 这类图像级土地覆盖分类上很好，却在像素级分割里一般；另一个模型可能在低层回归任务上保留更多光谱和环境信息，却不擅长高层语义；还有一些模型在 10% 标签设置下有优势，但标签变多后优势消失。更麻烦的是，很多评测默认取最后一层 embedding 或套一个标准 UPerNet decoder，可 GeoFM 的信息未必集中在最后一层。

这对遥感很关键。卫星影像不是 ImageNet 式的中心物体图片。地物尺度跨度很大，语义有时来自光谱，有时来自纹理，有时来自时序，有时来自地理上下文。像农田、火烧迹地、水体、云、海面污染、城市绿地这类任务，对特征层级的需求并不相同。如果评测协议只读 final embedding，就可能把“模型没有学到”误判成“评测头没有读到”。

这篇论文的价值就在这里：它把 GeoFM 评测从单榜排名推进到 representation-aware evaluation，也就是把问题拆成三层：预训练目标学到了什么，信息在 ViT 深度上怎么分布，下游 adapter/decoder 能不能取到这些信息。

## 论文/项目

论文比较了六个 12-block ViT 系列遥感自监督模型。

第一组是通用 SSL 目标在 SSL4EO 上训练的模型：MoCo、MAE 和 DINO v1。它们分别代表 contrastive、masked reconstruction 和 self-distillation。

第二组是带地理先验或多模态预训练目标的 GeoFM：Prithvi v1、CROMA 和 TerraMind。Prithvi v1 代表时序重建式 HLS/光学基础模型；CROMA 代表跨传感器对齐与 masked autoencoding；TerraMind 代表更大规模的多模态 token prediction 和 pixel-token 双尺度学习。论文为了比较深度分布，把所有模型都放在 12 个 transformer block 的框架下观察。

下游任务覆盖三个层级。

图像级分类使用 EuroSAT，用 kNN 评估 embedding space。图像级回归使用 NeuCo-Bench，包含 biomass、cloud、heat-island 等低层任务，以及 crop、agriculture、forest coverage 等语义任务。像素级分割使用 PANGAEA 任务，并进一步用 PASTIS 和 Sen1Floods11 做 decoder、label availability、fine-tuning 和 layerwise case study。这里需要注意：本文关注的是论文中使用的 optical/Sentinel-2 输入协议，不展开任何雷达-only 方向。

代码侧我没有确认到这篇论文自己的独立 GitHub 仓库。它引用并使用了 NeuCo-Bench、PANGAEA、PASTIS 等公开评测资源，因此当前更适合作为评测协议和后续复现实验的蓝图，而不是马上可运行的一站式工具包。

## 方法

论文的核心不是发明新模型，而是做三类诊断。

第一类是 **frozen encoder downstream evaluation**。作者固定 optical encoder，用不同任务和不同标签量评估模型表现，观察排名是否稳定。这个设置回答的是：如果我只把 GeoFM 当 feature extractor，用轻量下游头，它在不同任务上是否仍然可靠？

第二类是 **layerwise probing**。作者不只看最后一层，而是在不同 ViT block 上做 probe，判断任务相关信息在哪一层变得线性可访问。这个设计很重要，因为遥感的低层光谱/纹理信息和高层地物语义不一定同步出现在同一深度。

第三类是 **segmentation adaptation study**。作者在 PASTIS 和 Sen1Floods11 上比较 frozen vs fine-tuned、10% vs 100% labels、UPerNet vs Light Multi-Scale decoder vs single-level upsampler。这里的关键不是“哪个 decoder 名气最大”，而是看 decoder 设计是否匹配 GeoFM 的深度信息组织方式。

最后，论文用 CKA 分析 fine-tuning 前后各层 representation space 的变化。这个分析回答的是：fine-tuning 到底是重写整个 encoder，还是只集中修改某些层和某些模块？

## 实验

最重要的结果是：模型排名非常不稳定。

在 Table 4 的 frozen encoder 综合评测中，MoCo、MAE、DINO、Prithvi、CROMA、TerraMind 在不同任务上的排序会明显变化。EuroSAT、NeuCo 低层回归、NeuCo 语义回归、PANGAEA 分割并没有给出一个统一冠军。论文观察到，MoCo 和 DINO 这类 joint embedding 方法在 EuroSAT 这类高层分类任务上较强，但在 NeuCo 的低层和语义回归上相对弱；MAE 和 Prithvi 这类 reconstruction 目标更偏低层任务；CROMA 和 TerraMind 这类跨模态/多目标模型在 NeuCo semantic regression 上更强。

这说明不同自监督目标确实在保留不同信息。问题不是简单地说 reconstruction 好还是 contrastive 好，而是要看任务到底需要什么：语义类别、连续环境变量、细粒度边界、时序模式，还是像素级空间结构。

PASTIS 的结果更能说明 decoder 的影响。使用 Light Multi-Scale decoder 和 10% 标签时，六个 GeoFM 的 frozen mean mIoU 是 37.34；fine-tuning 后提升到 41.67，平均增益约 +5.06 mIoU。PASTIS 是 18 类作物时序分割，需要语义和时间信息，因此 fine-tuning 明显有用。

但 Sen1Floods11 上 fine-tuning 平均不是正收益。论文报告在所有相关设置上，Frozen -> Fine-tuned 平均变化为 -0.19 mIoU。原因可能是这个任务在当前设置下更接近水/非水二分类，任务复杂度较低，冻结特征已经足够；强行 fine-tuning 反而可能破坏可泛化表征。

decoder 结论也很反直觉。UPerNet 是很多 dense prediction 论文里的标准多尺度 decoder，但这篇发现轻量 decoder 甚至 single-level upsampler 经常能匹配或超过 UPerNet。PASTIS 上从 Light Multi-Scale 换到 UPerNet，平均变化是 -1.38 mIoU；Sen1Floods11 上也为 -0.33。论文还指出，single-level upsampler 常常在中间层 block 5 或 block 7 取特征时更好，而不是最后一层 block 11。

效率结果同样有意义。从 UPerNet 换到 single-level upsampler，decoder 参数减少 82% 到 93%，训练时间减少约 26%；更大的节省来自 frozen setup，相比 fine-tuning 平均减少约 52% 训练时间。也就是说，表示层选择和 decoder 简化不只是研究诊断，还可能直接降低遥感下游部署成本。

CKA 结果给出更细的解释。fine-tuning 并不是均匀重写所有 GeoFM。多数模型的 representation shift 随深度增加，但 Prithvi 在中间层变化更明显，CROMA 在多个层都有较大变化，TerraMind 的变化更集中在最后一个 ViT block。更具体地，论文观察到最大变化常集中在 ViT block 的 MLP 第一线性层。这提示后续做 PEFT 或 selective fine-tuning 时，不必盲目全量微调。

## 亮点

第一，它把 GeoFM 评测从“排行榜”推进到“读模型内部”。很多遥感基础模型论文只报告最终任务分数，但这篇问的是分数为什么变、信息在哪一层、adapter 有没有取对。

第二，它提醒我们不要迷信 final embedding。中间层对遥感 dense prediction 很可能更有价值，尤其是作物、边界、水体、建筑、道路这类需要空间细节的任务。

第三，它把 decoder 从附属工程变成评测变量。遥感论文经常把 UPerNet、SegFormer head 或简单线性头当默认配置，但这篇说明 decoder 会改变模型排名，甚至让轻量单层 decoder 赢过重型多尺度 decoder。

第四，它给 parameter-efficient adaptation 提供了方向。CKA 显示 fine-tuning 的变化集中在特定层和 MLP 子模块，这比泛泛地套 LoRA 更有指导意义。后续可以基于层级诊断选择 adapter 插入位置。

第五，它适合构建更可信的 GeoFM benchmark。一个 benchmark 如果只报总体 mIoU，很难解释模型差异；如果同时报告 layerwise probe、decoder sensitivity、label efficiency 和 fine-tuning shift，就能更接近真实下游决策。

## 不足

第一，这篇仍是评测和诊断论文，不是完整 benchmark 平台。它没有释放一个统一可复现的工程仓库，短期复现实验需要自己把模型权重、数据预处理和下游头串起来。

第二，模型比较仍存在不可完全控制的混杂。六个模型的预训练数据规模、参数规模、输入协议和训练目标并不完全一致。作者已经尽量用 12-block ViT 观察深度行为，但这不能消除所有差异。

第三，dense prediction case study 还不够广。PASTIS 代表农业时序分割，Sen1Floods11 代表较简单二分类水体任务，但建筑、道路、开放词表分割、变化检测、灾害损毁评估、城市跨域迁移还需要单独验证。

第四，ImageNet baseline 的结果值得更深入处理。论文发现 fine-tuned ImageNet ViT-B/16 在若干 segmentation 设置中能接近甚至超过部分 GeoFM，这说明遥感基础模型的优势边界还不够清楚。后续评测必须更严格地区分 frozen transfer、label efficiency、OOD robustness 和 full fine-tuning。

第五，和 VLM 的连接还没有展开。当前分析主要面向视觉 encoder 和 dense prediction decoder；但遥感 VLM 的视觉塔同样面临层选择、token pooling、空间 grounding 和多尺度信息读取问题。这篇的诊断方法可以迁移过去，但论文尚未直接验证 RS-VLM。

## 启发

一个值得做成论文的方向是：**Layer-aware GeoFM adaptation benchmark for dense remote sensing prediction**。

问题可以定义为：给定一组公开 GeoFM，不再只比较最后一层 + 固定 decoder 的分数，而是系统评估不同层、不同 token pooling、不同 decoder、不同 PEFT 插入位置在遥感 dense prediction 上的表现。目标是回答一个实际问题：当我拿到一个 GeoFM，应该从哪一层读特征，接什么 head，微调哪些模块，才能在少标签和跨域场景下稳定工作？

核心假设是：GeoFM 的下游失败很多不是因为 backbone 没学到信息，而是因为评测和适配协议没有访问到正确层级；layer-aware adapter 可以在更少参数、更少训练时间下，达到或超过全量微调和重型 decoder。

方法可以分四步。

第一步，固定一批代表性 backbone：Prithvi-EO、SatMAE、DINOv2/SSL4EO、CROMA、TerraMind、Clay、Galileo 或 SkySense。每个模型抽取多个 block 的 patch token、CLS token 和 pooled token。

第二步，在同一遥感任务上比较四类读取方式：final embedding、best single layer、multi-layer learned fusion、layer-gated adapter。dense prediction head 只保留几种明确复杂度等级，例如 linear upsampler、轻量多尺度 decoder、UPerNet 和 task-specific decoder。

第三步，构造任务矩阵。至少包括 PASTIS/作物时序、LoveDA/OpenEarthMap/土地覆盖、SpaceNet/建筑、DeepGlobe/道路、LEVIR-CD/变化检测和一个跨城市或跨季节 OOD split。指标不只用 mIoU/F1，还要报告 boundary F1、worst-domain score、ECE 校准误差、训练时间、decoder 参数量和 feature extraction 成本。

第四步，把 CKA 或 SVCCA 诊断和 adapter 策略绑定。比如如果某模型在中层保留空间细节，就只在中层插 adapter；如果 fine-tuning shift 集中在 MLP 第一线性层，就优先测试 MLP-LoRA、LayerNorm tuning、partial fine-tuning，而不是全量更新。

一个可直接用于这类工作的 VLM/LLM 实验审计 prompt 可以写成：

```text
你是遥感 GeoFM 下游适配实验审计器。
给定一个实验配置，包括 backbone、输入模态、抽取层、token pooling、decoder、微调策略、训练标签比例、数据集 split 和评价指标，请判断这个实验是否能公平支持“模型 A 优于模型 B”的结论。

必须逐项检查：
1. 两个模型是否使用相同输入谱段、空间分辨率、归一化方式和训练/验证/测试 split。
2. 是否只比较 final embedding；如果是，标记为 layer-risk。
3. decoder 参数量是否差异过大；如果 decoder 比 backbone 差异更可能解释性能，标记为 decoder-confound。
4. 是否同时报告 frozen、PEFT 和 full fine-tuning；若只报告其中一种，标记为 adaptation-incomplete。
5. 是否包含低标签和跨域/OOD 测试；若只有随机 split，标记为 deployment-risk。
6. dense prediction 是否报告边界、校准和最差域指标，而不是只报平均 mIoU。
7. 输出 accept / revise / reject 三选一，并给出最主要的混杂因素。

不要因为某个模型在单一任务上分数最高就判定它是更强 GeoFM。
不要忽略 decoder、层选择和标签比例对排名的影响。
如果结论依赖单一 final-layer 设置，优先要求补充 layerwise probe。
```

这条线对遥感 AI 的意义很现实。未来不缺新的 GeoFM 名字，缺的是知道什么时候该用它、怎么用它、为什么它在某个任务上失败。把 GeoFM benchmark 从“模型排行榜”升级成“表示层 + 适配器 + 任务结构”的诊断协议，比继续堆一个新 backbone 更容易形成可复现、可投稿、可落地的贡献。

## 参考

- [How do Self-Supervised Remote Sensing Vision Models Transfer to Downstream Tasks?](https://arxiv.org/abs/2606.13896)
- [NeuCo-Bench GitHub repository](https://github.com/cmalbrec/NeuCo-Bench)
- [PANGAEA: A Global and Inclusive Benchmark for Geospatial Foundation Models](https://arxiv.org/abs/2412.04204)
- [Geo-Bench: Toward Foundation Models for Earth Monitoring](https://github.com/ServiceNow/geo-bench)
- [PASTIS benchmark repository](https://github.com/VSainteuf/pastis-benchmark)
- [Fine-tune Smarter, Not Harder: Parameter-Efficient Fine-Tuning for Geospatial Foundation Models](https://arxiv.org/abs/2504.17397)

