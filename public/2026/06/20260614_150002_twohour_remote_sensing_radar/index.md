# OSTB：遥感 VLM 部署别先赌一个 backbone


# OSTB：遥感 VLM 部署别先赌一个 backbone

**结论：这一轮最值得单独跟踪的是 *One Stone, Three Birds: Self-adaptive Optimal Transport for Multi-VLM Selection, Adaptation, and Ensembling*。它不是又训练一个遥感专用 CLIP，而是处理一个更接近真实部署的问题：手里同时有 CLIP、GeoRSCLIP、RemoteCLIP、SkyCLIP、RS-M-CLIP、RSDiX-CLIP、StreetCLIP 等候选 VLM，但目标地区没有标签，到底该信哪一个、怎么适配、要不要集成？论文提出 OSTB，用自适应最优传输在无标签目标集上估计样本-类别结构，并把同一个结构同时用于模型排序、目标域 GMM 适配和可靠性加权集成。对遥感 VLM 来说，它的价值在于把“选模型”从经验判断变成了可评测、可复现、可插拔的部署模块。**

我按 2026-06-14 15:00 +08 检索公开来源，过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 主线工作。本篇选择 2026-06-06 提交 arXiv 的 OSTB。论文 arXiv 页面、HTML、PDF 和官方 GitHub 仓库均已公开；仓库提供论文链接、特征数据下载入口、数据集划分说明和实验结果表。该工作覆盖自然图像、遥感和医学病理三类 benchmark，其中遥感部分是光学/航空/卫星场景分类数据集，不属于雷达方向。

这篇适合放进“遥感基础模型与多模态理解”。原因是它没有只讨论单个遥感模型的预训练配方，而是讨论 VLM 生态已经多模型化以后，如何在没有目标域标签的情况下做部署决策。对于遥感场景，这个问题很现实：一个地区、一个传感器、一个类别体系下，通用 CLIP 与遥感专用 CLIP 谁更可靠，并不能只看模型名字或平均榜单。

## 背景

遥感 VLM 的数量正在变多。早期可以简单比较 CLIP、RemoteCLIP、GeoRSCLIP 这类模型的零样本准确率；现在更常见的情况是，研究者或工程系统手里有多个候选模型：通用视觉语言模型有更广泛的自然图像先验，遥感专用模型有更强的 overhead imagery 语义，地理街景模型可能带来地名和城市空间先验，不同模型在不同遥感数据集上的强弱会发生明显切换。

实际部署时，最缺的通常不是候选模型，而是目标地区标签。比如要在一个新城市、新国家或新数据源上做场景分类、土地利用识别或开放词表检索，类别名可能是已知的，但没有足够标注样本来判断哪个 VLM 最适合。直接选“论文里平均分最高”的模型不稳，因为遥感数据的分辨率、地物组合、拍摄季节、城市形态和类别定义会改变模型偏差。

更麻烦的是，模型选择、目标域适配和模型集成经常被分开做。先凭经验选一个 backbone，再做 test-time adaptation；或者把多个模型概率简单平均；或者用置信度、熵、交叉熵之类指标选模型。这些做法都隐含一个假设：模型自己的置信度能代表可靠性。但 VLM 在域外数据上很容易过度自信，尤其是遥感类别名和图像纹理不完全匹配时。

OSTB 的切口正是在这里。它把部署问题改写为：给定若干冻结 VLM、目标类别名称和一批无标签目标图像，能不能从这些模型互相冲突但互补的预测和特征中，估计一个更可信的目标域样本-类别结构？如果能，那么这个结构不只可以告诉我们哪个模型靠谱，还可以反过来适配每个模型的视觉特征分布，并为最终集成分配权重。

## 方法/框架

OSTB 的核心是自适应最优传输。输入包括候选模型池、目标类别文本和无标签目标适配集。每个 VLM 都提供两类信息：一类是语义 posterior，也就是图像-文本相似度经过 softmax 后得到的类别概率；另一类是视觉 posterior，也就是用该 VLM 的图像特征在目标集上拟合类别条件的 GMM，再得到样本到类别的视觉概率。

论文的关键判断是：语义 posterior 和视觉 posterior 都不应被单独信任。语义 posterior 直接来自类别文本和图像特征的匹配，容易受 prompt、类别词和预训练语料影响；视觉 posterior 更贴近目标集的特征结构，但初始伪标签可能很噪。OSTB 用最优传输在样本和类别之间估计一个共享 coupling，同时施加边际约束，避免所有样本塌到少数高置信类别上。

这个 transport plan 扮演三个角色。第一，它是模型选择依据。OSTB 根据每个模型的语义分支和视觉分支与共享目标结构的一致性，给候选 VLM 排序。第二，它是适配监督。transport plan 给 GMM 分支提供软分配，使每个模型的视觉类别中心向目标域真实簇结构靠拢，而不是停留在噪声伪标签初始化上。第三，它是集成权重来源。最终预测同时融合各模型的语义 posterior 和适配后的视觉 posterior，权重来自自适应可靠性估计。

这个设计比简单 ensemble 更有意义。简单平均会让错误但自信的模型污染结果；只选一个模型又浪费了其他 VLM 的互补信息。OSTB 的思路是让多个模型先共同解释无标签目标集的样本-类别结构，再由这个结构决定谁更可信、怎么适配、怎么集成。

从 CV-to-RS 迁移角度看，OSTB 是典型的通用 CV/ML 方法向遥感迁移：方法本身不是遥感专用网络，而是多模型无标签部署框架。遥感适配点在于候选池中同时放入通用 VLM 和遥感 VLM，目标数据集换成 AID、EuroSAT、MLRSNet、PatternNet、RESISC45 等遥感场景分类 benchmark。它回答的不是“遥感图像该用哪种卷积或 Transformer”，而是“当多个预训练 VLM 都可能有偏时，如何用目标域自身的无标签结构做可靠部署”。

## 数据/benchmark

论文把实验分成自然图像、遥感和医学病理三类，总共 36 个 benchmark。遥感部分包含 10 个场景分类或土地覆盖相关数据集：AID、EuroSAT、MLRSNet、OPTIMAL31、PatternNet、RESISC45、RSC11、RSICB128、RSICB256 和 WHURS19。它们覆盖航空场景、高分辨率场景分类、多标签遥感、土地覆盖和不同尺度的遥感图像分类。

遥感候选模型池由通用 VLM 和遥感/地理 VLM 混合组成：OpenAI CLIP ViT-B/16、CLIP ViT-B/32、GeoRSCLIP-ViT-B/32、RemoteCLIP-ViT-B/32、SkyCLIP50-ViT-B/32、RS-M-CLIP、RSDiX-CLIP-ViT-B/16、RSDiX-CLIP-ViT-B/32 和 StreetCLIP。这个设置很贴近真实选择困难：通用模型、遥感模型和地理语义模型都可能有理由被纳入候选池。

遥感数据规模也比较丰富。MLRSNet 有 109,161 张样本和 46 类，PatternNet 有 30,400 张和 38 类，RESISC45 有 31,500 张和 45 类；小数据集如 WHURS19 只有 1,005 张和 19 类，OPTIMAL31 有 1,860 张和 31 类。这种规模差异能测试 OSTB 在大目标集和小目标集上的稳定性。

协议上，目标适配集是无标签的。OSTB 只使用目标类别名称、候选 VLM 的概率输出和视觉特征，不使用目标标签训练 VLM，也不做 prompt optimization 或 prompt ensembling。适配阶段估计 transport plan、GMM 分类器和可靠性权重；测试阶段把这些固定下来评估 held-out target test samples。这个协议比“看测试集选最强模型”更接近真实部署。

## 实验

总体模型选择结果显示，OSTB 在 36 个 benchmark 平均上取得最好的 label-free 排序质量。论文用 held-out test accuracy 诱导的 oracle ranking 做参照，OSTB 的 Spearman ρ 为 0.807，Kendall τ 为 0.680，Hit@1 为 0.667，Top-3 为 0.917，regret 为 1.249，selected-model accuracy 为 77.03%。作为对比，KL divergence、cross-entropy、entropy 和 confidence 等无标签排序指标整体更弱。

Top-k 部署结果也有信息量。如果只使用 OSTB 排序后的 top-1 候选，在遥感域平均准确率为 79.95%；top-2 提升到 83.38%；top-4 达到 86.24%；使用所有候选则为 85.37%。这说明排序不仅能解释模型可靠性，也能作为部署剪枝工具：在延迟、显存或模型授权受限时，保留少数高可靠模型可能比全量集成更合适。

模型适配结果表明，共享多 VLM 结构比单模型独立适配强。遥感域中，原始 zero-shot 平均为 65.03%，single-VLM GMM 为 74.44%，multi-VLM GMM 为 81.60%。换句话说，多个候选模型共同估计目标结构后，能给每个模型的视觉 GMM 分支提供更好的无标签监督。

最重要的是遥感集成结果。论文的 Table VIII 显示，最强原始候选 RSDiX-CLIP-B/16 的遥感平均准确率为 75.12%，而 OSTB ensemble 达到 85.37%。在 10 个遥感 benchmark 上，OSTB 都是主部署行中最强的结果：AID 98.70、EuroSAT 70.70、MLRSNet 85.22、OPTIMAL31 99.28、PatternNet 96.72、RESISC45 98.80、RSC11 89.46、RSICB128 50.53、RSICB256 64.59、WHURS19 99.67。

这些结果也暴露了遥感 VLM 的真实难点。AID、OPTIMAL31、RESISC45、WHURS19 等数据集上很多模型已经很强，集成后接近饱和；但 RSICB128 和 RSICB256 仍然明显偏低，说明类别体系、尺度或数据分布对 VLM 仍然有挑战。OSTB 能显著提升平均性能，但不是把遥感场景分类彻底解决。

消融实验说明，提升不是来自简单平均。直接平均候选模型概率的 overall accuracy 为 76.17%，semantic-only fusion 为 77.48%，完整 OSTB 为 82.75%。去掉 transport marginal、GMM refinement 或 adaptive weights 都会造成不同程度下降。这说明最优传输的边际约束、目标域 GMM 更新和自适应权重都在发挥作用。

## 亮点

第一，它把遥感 VLM 的“模型选择”问题显性化。很多遥感论文默认只比较自己的模型和几个 baseline，但真实系统里经常要从多个已有 VLM 中选择。OSTB 提供了一个无标签排序和集成框架，可以直接作为部署层方法复用。

第二，它没有要求重新训练 VLM。候选模型保持冻结，只使用概率输出和图像特征。这对遥感很重要，因为很多预训练模型权重可用但训练数据不可复现，重新微调成本高，且不同机构可能只能调用模型接口或离线特征。

第三，它同时处理选择、适配和集成，而不是三个孤立步骤。共享 transport plan 让模型排序、GMM 适配和 ensemble 权重来自同一个目标域结构，这比先随便选模型再做后处理更有系统性。

第四，它的遥感实验覆盖多种 VLM。CLIP、GeoRSCLIP、RemoteCLIP、SkyCLIP、RS-M-CLIP、RSDiX-CLIP 和 StreetCLIP 的混合候选池，正好反映当前遥感 VLM 生态的多源化趋势。论文结果也说明，遥感专用模型不一定在所有数据集上都稳定占优。

第五，它对 CV-to-RS 方法迁移很有启发。最优传输、多模型可靠性估计、无标签目标域适配和 GMM 视觉结构建模，本来都是通用机器学习问题；遥感场景只是把这些问题放大了，因为域差异、类别粒度和空间分布偏差更强。

## 不足

第一，任务主要是图像级场景分类，还没有覆盖遥感 VLM 更难的密集任务。开放词表检测、分割、变化描述、grounding、VQA 和矢量化任务中，模型可靠性不仅体现在类别概率，还体现在空间定位、边界质量和证据链上。OSTB 的思想可迁移，但当前实验证据还集中在分类。

第二，类别先验用的是目标类别名称。遥感类别名经常有定义歧义，例如 `industrial area`、`meadow`、`residential`、`bare land` 在不同数据集中含义不完全一致。论文没有重点讨论 prompt 描述、同义词、类别层级和遥感术语对 transport plan 的影响。

第三，遥感 benchmark 仍以经典场景数据集为主。AID、RESISC45、PatternNet 等适合验证图像级分类，但它们与真实大范围制图、跨城市泛化、跨传感器泛化、长尾地物识别仍有距离。OSTB 在更难的 OOD split 上是否稳定，还需要单独评估。

第四，方法依赖候选池质量。如果所有候选 VLM 都对目标数据集有系统性偏差，最优传输只能在错误证据之间找共识。遥感中这很常见，例如目标地区类别体系不在任何预训练数据中，或者图像来自少见季节、传感器、空间分辨率。

第五，GitHub 仓库提供了特征数据和结果说明，但不是一个完整、即插即跑的遥感部署工具。对于想把 OSTB 接到新遥感数据的人，还需要自己准备每个候选 VLM 的图像特征、文本特征、类别 prompt、数据划分和推理缓存。

## 启发

一个可做的小论文方向是：**Label-Free Model Router for Remote Sensing VLM Deployment**。核心问题不是再预训练一个更大的遥感 VLM，而是给已有模型生态加一个可靠路由层：面对一个无标签目标地区，系统自动判断该用哪些 VLM、哪些类别需要集成、哪些样本应该拒答或请求标注。

假设是：不同遥感类别和不同空间区域适合的 VLM 不同。比如建筑、港口和机场可能更依赖高分辨率遥感专用模型；农田、森林和水体可能受多光谱或季节影响更强；城市功能区可能需要地理语义或 POI 先验。若只做 dataset-level 模型选择，仍然会掩盖 class-level 和 region-level 的可靠性差异。

方法可以从 OSTB 扩展。第一步，保留多 VLM 候选池和无标签 target adaptation split。第二步，把 transport plan 的可靠性估计从模型级扩展到类别级、样本级和区域级。第三步，为每个类别学习不同的模型权重，而不是全数据集共享一组权重。第四步，在低一致性样本上输出 uncertainty，并触发人工标注、检索更多时相影像或调用 GIS prior。

数据可以先从 OSTB 的遥感分类 benchmark 做起，再加入更贴近真实遥感 VLM 的任务：RSVQA、RRSIS-D、EarthReason、OVRSISBench、LoveDA、OpenEarthMap、iSAID、xBD 或 SpaceNet。分类任务用 accuracy 和 calibration error；分割任务用 mIoU、boundary F1 和 selective IoU；VQA/grounding 任务用 answer accuracy、pointing accuracy、box/mask IoU 和 evidence consistency。

基线可以包括 best single VLM、zero-shot average ensemble、confidence routing、entropy routing、KL/cross-entropy ranking、single-model test-time adaptation、OSTB 原始版本，以及带类别级权重的扩展版本。关键不是只报告平均精度，而是报告在跨地区、跨类别、长尾类别、低置信样本和 OOD split 上的可靠性曲线。

一个可直接放进实验规范的 prompt/检查清单是：

```text
你是遥感 VLM 部署路由器。给定目标任务、类别集合、无标签目标样本统计和多个候选 VLM 的预测摘要，请不要直接选择平均分最高的模型，而要输出可审计的部署计划：

1. candidate_pool: 每个候选 VLM 的来源、输入模态、预训练域和可能偏差。
2. class_routing: 对每个遥感类别，推荐使用哪些模型以及权重，说明依据。
3. sample_uncertainty: 哪些样本或类别存在模型冲突、低一致性或高 OOD 风险。
4. adaptation_plan: 是否需要无标签适配、GMM/OT 校准、prompt 改写或少量人工标注。
5. rejection_rule: 何时不输出确定类别，改为请求更多证据或人工复核。
6. validation_protocol: 用哪些 held-out 地区、类别和指标验证路由器。
7. failure_modes: 列出可能失败的遥感场景，例如季节变化、细粒度类别、低分辨率、小目标、类别定义冲突。

禁止只根据模型名称、论文平均分或单一置信度做选择。
如果候选模型之间强烈冲突，必须给出不确定性和后续取证方案。
如果类别名在遥感中有歧义，必须建议使用更具体的遥感类别描述。
```

这个方向和遥感 VLM 的关系很直接。未来遥感系统不会只有一个模型，而会同时接入通用 VLM、遥感 CLIP、GeoFM embedding、SAM/开放词表分割器、变化检测模型和 GIS 工具。真正的瓶颈会从“有没有模型”转向“什么时候该信哪个模型”。OSTB 的提示是：遥感多模态理解需要一个无标签、可校准、可审计的模型路由和集成层。

## 参考

- arXiv：https://arxiv.org/abs/2606.08126
- arXiv HTML：https://arxiv.org/html/2606.08126v1
- 官方 GitHub：https://github.com/Afleve/OSTB
- GitHub README：https://raw.githubusercontent.com/Afleve/OSTB/main/README.md
- GeoRSCLIP / RS5M：https://github.com/om-ai-lab/RS5M
- RemoteCLIP：https://github.com/ChenDelong1999/RemoteCLIP
- SkyCLIP / SkyScript：https://github.com/wangzhecheng/SkyScript

