---
title: "Clay-CNN Hybrids：GeoFM 做滑坡制图，别急着替换 U-Net"
date: "2026-06-16T03:00:02+08:00"
tags: ["GeoFM", "Clay", "Landslide4Sense", "LoRA", "Sentinel-2", "灾害制图"]
mode: "twohour"
categories: ["多源数据融合、效率部署与应用落地"]
draft: false
---

# Clay-CNN Hybrids：GeoFM 做滑坡制图，别急着替换 U-Net

**结论：这一轮最值得补进雷达的是 2026-06-12 提交到 arXiv 的 *Clay-CNN Hybrids: Leveraging Geo-Foundational Models as Auxiliary Context for Landslide Detection*。它的结论很克制，但很有用：在 Landslide4Sense 滑坡像素级分割上，Clay v1.5 直接当主干并不比 U-Net 强；真正有效的是把 Clay 的预训练表征作为 U-Net bottleneck 的辅助上下文，再用两阶段 LoRA 微调。最佳 Hybrid U-Net + Clay 在三种随机种子下得到 64.5±1.8% F1，高于 U-Net baseline 的 59.9%，也高于论文引用的 Prithvi-EO-2.0 在同一 benchmark 上的 60.7%。这篇文章提醒遥感基础模型研究：GeoFM 的价值不一定是取代所有任务网络，而是给强空间归纳偏置的模型补上更好的光谱和地理语义先验。**

我按 2026-06-16 03:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是 Sentinel-2 多光谱滑坡制图。Landslide4Sense 的输入里包含 DEM 和 slope，其中 DEM/slope 来源与 ALOS PALSAR 产品有关，但论文任务不是 SAR 影像识别，也没有使用 SAR backscatter、coherence、interferometry 或 SAR-optical fusion 作为主线。这里把它视为光学多光谱 + 地形先验的灾害制图工作。

同期本地文章已经覆盖 TTABC、RPC-GS、OSMGraphCLIP、TUE-CD、GeoFM layer probing、MaskWAM、ShearFuse-UNet、LALE、CoastlineVLM、Stateful Visual Encoders、LG-SAM、LPM、CSI-Net、VecLang、TerraBench、OSTB、BCP、UltraVR、ABot-Earth 等方向，因此不重复写这些条目。Earth-OneVision 这类近期多模态地球模型虽然有关注价值，但含 SAR/多传感器主线风险更高；本轮选 Clay-CNN Hybrids，是因为它更干净地回答了一个很现实的问题：遥感 GeoFM 到底应该怎么接入像素级应急制图。

## 背景

滑坡快速制图是遥感 AI 很典型的“看起来简单、落地很难”任务。灾后需要尽快知道哪里发生了滑坡、滑坡边界在哪里、是否威胁道路、村庄、河道或救援路线。人工解译慢，传统指数和阈值方法泛化弱，深度学习语义分割看起来合适，但它面对两个硬问题。

第一是类别极度不平衡。Landslide4Sense 这类 benchmark 中，滑坡像素只占很小比例，论文报告大约 2% 为正样本。模型只要稍微保守，就会漏掉小滑坡；稍微激进，又会把裸地、河滩、采石场、耕地和施工区误报成滑坡。

第二是地物光谱相似。滑坡裸露面、干涸河床、裸土农田和城市裸地在 Sentinel-2 的部分波段上很像。真正决定它是不是滑坡的，往往不只是光谱，而是坡度、地形位置、破碎形态、上下游关系和局部空间结构。

这正是 GeoFM 容易被期待的地方。Clay、Prithvi、SkySense、TESSERA 这类地球观测基础模型通过大规模自监督预训练，理论上能学到更稳的光谱、时空和地理表征。问题是，像素级滑坡边界又非常依赖局部细节和多尺度 skip connection。一个 ViT/MAE 型基础模型是否能直接替代 U-Net，还是更适合作为上下文模块，这是这篇论文想回答的问题。

## 论文/项目

论文标题是 *Clay-CNN Hybrids: Leveraging Geo-Foundational Models as Auxiliary Context for Landslide Detection*，arXiv 编号 2606.14081，作者为 Huong Binh Vu，提交时间为 2026-06-12。论文有公开代码仓库 `binhhuongvu/gfm-landslide-segmentation`，仓库当前主要提供一个 Colab/Jupyter notebook，用于复现实验配置、下载 Landslide4Sense 数据、加载 Clay v1.5 checkpoint，并切换不同 ablation 设置。

项目使用 Clay v1.5。Clay 官方文档说明，Clay 是面向地球观测数据的 foundation model，输入卫星影像以及位置、时间信息，输出区域表征；其模型采用适配 EO 数据的 Vision Transformer，并通过 MAE 自监督方式训练。对这篇滑坡论文来说，关键不是 Clay 本身又大又新，而是它怎样被放进一个分割系统。

论文比较了三类方案。

第一类是标准 U-Net baseline，也就是 Landslide4Sense 竞赛式的强 CNN 空间模型。

第二类是 Clay 作为主 encoder，再加多尺度地形残差融合。这个方案代表“用 GeoFM 替换传统分割 backbone”的直觉。

第三类是 Hybrid U-Net + Clay：保留 U-Net 的空间编码和 skip connection，只在 bottleneck 处注入 Clay 的语义上下文，并用两阶段 LoRA 微调。这是论文表现最好的方案。

这个设计的价值在于，它不是泛泛说“基础模型有用”，而是把“替代 backbone”和“作为辅助上下文”分开测试。对遥感任务很重要，因为很多密集预测问题并不缺全局语义，缺的是边界、尺度、小目标和局部形态。

## 数据

实验使用 Landslide4Sense benchmark。Hugging Face 数据卡显示，该数据集包含训练、验证、测试三部分，分别有 3,799、245 和 800 个 image patches。每个 patch 是 128 x 128 像素，约 10 m 分辨率，做二分类像素标注：非滑坡为 0，滑坡为 1。

输入共有 14 个通道。前 12 个来自 Sentinel-2 的多光谱波段，覆盖 coastal aerosol 到 SWIR；后 2 个是 slope 和 DEM，作为地形信息输入。论文强调这个数据集采用 geographically stratified leave-out-location 策略，把特定滑坡事件或地区留出，避免同一事件的相邻 patch 同时出现在训练和测试里。这一点比随机切分可靠，因为滑坡制图最怕空间泄漏。

从遥感 AI 角度看，Landslide4Sense 的优点是公开、任务清楚、有多光谱和地形输入，也有较严格的地理划分。缺点也明显：chip 只有 128 x 128，空间上下文有限；滑坡正样本很少；灾害区域、地貌类型和季节条件仍不足以代表全球滑坡制图。

## 方法

论文最关键的方法不是“用了 Clay”，而是 **Clay 放在哪里**。

第一种架构把 Clay 当主 encoder。作者在 Clay 输出之外加入 multi-scale residual terrain fusion，希望让 DEM 和 slope 的地形信息补充到基础模型表征里。这个方案理论上最符合 foundation model 叙事：大模型负责抽特征，decoder 负责恢复 mask。但结果显示，它不够适合 Landslide4Sense 这种边界敏感、局部纹理和小区域密集预测任务。

原因并不复杂。Clay 这类 ViT/MAE backbone 擅长全局和语义表征，但 U-Net 的多尺度下采样、上采样和 skip connection 对像素级定位仍然很强。滑坡不是 ImageNet 物体，也不是单纯场景分类；它的边界、形态和坡面上下文很关键。如果把 CNN 的局部空间归纳偏置拿掉，只靠 Clay 表征，模型容易丢掉细节。

第二种架构更务实：保留 U-Net 主干，把 Clay 特征作为 bottleneck 上的辅助语义上下文注入。换句话说，U-Net 继续负责“把边界画准”，Clay 负责提供“这个区域的光谱/地理语义是否像滑坡环境”的先验。论文的 Grad-CAM 分析也支持这个解释：融合后的响应不是简单把所有裸土都点亮，而是在更大范围内提供纠偏式上下文。

训练上，论文强调两阶段 LoRA 很关键。第一阶段冻结或稳定部分组件，让 decoder 学会利用融合后的表示；第二阶段再进行低秩适配，避免 encoder adaptation 和 decoder learning 互相干扰。这个细节对遥感基础模型落地很重要：很多失败不是因为 foundation model 没有信息，而是微调过程把预训练表征、任务 decoder 和小样本标签噪声搅在一起。

损失函数方面，论文使用 Lovasz-BCE 类组合来处理分割区域质量和类别不平衡。它还加入 MC Dropout 做不确定性估计，用 Grad-CAM 诊断模型关注区域。这比只报告一个 F1 更好，因为灾害制图需要知道模型哪里不确定、哪里可能误报，才能安排人工复核。

## 实验

核心结果很直接。

标准 U-Net baseline 的测试 F1 是 59.9%。Clay 作为 standalone 主 encoder 的结果是 55.2±3.6%，反而低于 U-Net。这是最值得记住的负结果：GeoFM 不是插上去就能替换密集预测网络，尤其是在小目标、边界和多尺度局部结构强依赖的任务里。

表现最好的是 Hybrid U-Net + Clay，三种随机种子下测试 F1 为 64.5±1.8%。相对 U-Net baseline 提升约 4.6 个百分点，相对 Clay-only 提升更明显。论文还把这个结果和 Prithvi-EO-2.0 在同一 benchmark 上的 60.7% F1 做了比较，指出 Clay hybrid 尽管融合机制更简单、参数量也更小，仍取得更高 F1。

论文也提醒不要过度解读。Landslide4Sense 竞赛第一名达到过 74.54% F1，但那个系统使用了更复杂 ensemble，并且有 test-set-informed preprocessing standardization 的因素。Clay-CNN Hybrids 的价值不在于直接刷新竞赛榜，而在于在相对干净的 train/validation/test 协议下证明：GeoFM 表征作为上下文模块能稳定改善 CNN，而不是直接替换 CNN。

Ablation 的结论也有启发。两阶段训练比简单端到端更稳；terrain inputs 有实际贡献；Lovasz-BCE 对少数类分割有帮助；MC Dropout 的不确定性主要集中在滑坡边界和过渡区域，符合物理直觉。但论文也承认，校准仍可能偏过度自信，不能直接把 MC Dropout 当成可靠的业务置信度。

## 亮点

第一，它给遥感基础模型一个反直觉但实用的结论：在某些像素级任务里，GeoFM 更适合做辅助上下文，而不是做主干替代。这个结论比“更大模型更好”更有工程价值。

第二，它把光谱泛化和空间精度分工讲清楚。Clay 提供预训练的 EO 表征，U-Net 提供局部多尺度定位能力。滑坡制图需要两者，而不是在二者之间做单选。

第三，它的 benchmark 选择有现实意义。Landslide4Sense 是多光谱 + 地形的灾害制图任务，正样本稀少、光谱混淆严重、地理划分更接近真实泛化，比普通 patch 分类更能测试 GeoFM 是否有用。

第四，它公开了代码和 notebook。虽然当前仓库还不是完整工程化 package，但至少能看到实验入口、依赖、数据下载和 ablation registry。对后续复现、改 loss、换 backbone、加 metadata 都有价值。

第五，它把可解释性和不确定性放进实验，而不是只做 mIoU/F1。灾害制图里的模型输出最终要给人看、给应急流程用，哪里不确定、哪里需要复核，和平均分一样重要。

## 不足

第一，代码仓库目前更像 Colab 实验 notebook，不是可直接用于大规模生产制图的工程包。没有 release，也没有完整命令行训练/推理流水线。复现实验可行，但部署到区域级滑坡制图还需要补大量工程。

第二，Clay 的地理和时间编码没有被充分利用。论文说明所有 Clay 输入使用 constant time and geolocation encodings，这意味着模型主要依靠光谱信息，没真正发挥 Clay 预训练里与位置、季节相关的能力。对灾后滑坡来说，真实 acquisition time、地理区域、物候和降雨事件前后信息都可能重要。

第三，chip 尺寸限制了空间上下文。128 x 128、10 m 分辨率只覆盖约 1.28 km 方块，对小滑坡可能够，对大型滑坡、泥石流沟道、坡面上下游关系和道路阻断判断就偏小。论文也提到 larger tile 或 sliding window 可能改善定位。

第四，不确定性还不够可靠。MC Dropout 能显示边界和过渡区更不确定，这个现象合理；但如果整体 calibration 仍过度自信，那么业务上不能直接用概率阈值决定“自动通过”或“人工复核”。灾害场景需要更严格的校准、风险覆盖曲线和复核预算评估。

第五，它还没有验证跨事件、跨国家、跨气候带的真实部署收益。Landslide4Sense 的 leave-out-location 已经比随机划分好，但论文还没有系统做跨区域 OOD、灾后新事件 few-shot、未标注区域 pseudo-label 或主动学习闭环。

## 启发

一个值得继续做的小论文方向是：**GeoFM-as-Context for Risk-Aware Disaster Segmentation**。核心问题不是再证明一个 GeoFM 能不能跑分，而是系统回答：在灾害遥感密集预测中，基础模型什么时候应该替代 backbone，什么时候应该只作为上下文先验，什么时候应该被人工复核策略约束。

可以从滑坡开始，也可以扩展到洪水、野火烧毁区、建筑损毁和泥石流堆积。假设是：对边界敏感、正样本稀少、局部纹理强的灾害分割任务，CNN/UNet/SegFormer 这类空间结构网络仍然应作为主干；GeoFM 表征通过 bottleneck context、cross-attention 或 prototype prior 注入，能提高跨区域泛化和误报抑制；若再加入可靠不确定性估计，可以在相同人工复核预算下找到更多真实灾害区域。

方法可以分四步。第一，统一三种融合范式：GeoFM as encoder、GeoFM as bottleneck context、GeoFM as decoder-side prototype/cross-attention。第二，在相同数据、相同 loss、相同训练预算下比较 Clay、Prithvi-EO-2.0、SkySense 或 TESSERA 特征。第三，构造严格的 OOD split：按国家/地貌/气候带/灾害事件留出，而不是只做随机 patch 划分。第四，把 F1/mIoU 和业务指标一起报：top-k 人工复核召回、误报面积、边界 F1、ECE、uncertainty-error correlation、每平方公里推理成本。

最小实验不需要很大。可以先复现 Landslide4Sense，在 U-Net baseline 上加入 Clay bottleneck context，再做三个消融：是否使用真实 time/location metadata、是否使用 terrain cross-attention、是否使用不确定性筛选 pseudo-label。若要验证泛化，可以把公开滑坡数据、Sentinel-2 灾后影像和少量人工标注事件组织成 leave-event-out 测试。

一个可直接用于这类工作的 VLM/LLM 实验审计 prompt 可以写成：

```text
你是遥感灾害分割实验审计器。给定一个使用 GeoFM、CNN/Transformer 分割网络、光学/多光谱影像和地形变量的灾害制图实验，请判断该实验是否能支持“基础模型提升灾害制图泛化”的结论。

必须逐项检查：
1. 数据划分是否按灾害事件、地理区域或气候/地貌类型留出；若只是随机 patch split，标记为 spatial-leakage-risk。
2. 输入是否包含 SAR backscatter、coherence、InSAR 或 SAR-optical fusion；若主线依赖这些信号，标记为 out-of-scope-for-optical-radar-filter。
3. GeoFM 是作为主 encoder、辅助 bottleneck context、decoder prior 还是 feature cache；必须分别报告，不允许混称为“使用基础模型”。
4. 是否和强 U-Net/SegFormer/CNN baseline 在相同训练预算、相同 loss、相同数据增强下比较。
5. 是否报告小目标召回、边界 F1、误报面积、worst-event performance 和 calibration，而不是只报平均 F1/mIoU。
6. 是否使用真实 acquisition time、地理坐标和地形变量；若使用常量 metadata，必须说明 GeoFM 的时空能力没有被充分测试。
7. 是否给出人工复核策略：高不确定区域、低置信正样本、疑似裸土误报区域如何进入复核队列。
8. 若 GeoFM-only 低于 CNN baseline，不允许把结论写成“基础模型失败”；必须检查是否缺少 skip connection、局部纹理建模和多尺度 decoder。

输出 accept / revise / reject 三选一，并列出最大混杂因素、最小补充实验和最可能的部署风险。
```

这条线和遥感 VLM 的关系也很明确。未来应急制图系统很可能不是单个分割模型，而是 GeoFM 提特征、分割网络画边界、VLM/Agent 读任务并组织证据、人工审核处理高风险样本。Clay-CNN Hybrids 给 VLM 一个更可靠的底层工具思路：不要让 VLM 直接凭 RGB 或低分辨率 mask 判断灾害边界，而是让它调用一个经过 OOD split、校准和不确定性审计的灾害分割模块，再生成结构化报告。

对 AI 辅助科研写作来说，这篇论文也适合当作方法论模板。它没有堆很多复杂模块，而是提出一个可检验的集成假设：GeoFM 替代 CNN 不一定好，GeoFM 辅助 CNN 可能更好。这个假设清楚、ablation 可做、负结果有解释、扩展空间也明确。遥感基础模型领域接下来更需要这种“模型能力如何接入任务结构”的研究，而不是只把更大的 backbone 接到每个 benchmark 上。

## 参考

- Clay-CNN Hybrids 论文：https://arxiv.org/abs/2606.14081
- Clay-CNN Hybrids HTML：https://arxiv.org/html/2606.14081v1
- 官方代码仓库：https://github.com/binhhuongvu/gfm-landslide-segmentation
- Landslide4Sense 数据集：https://huggingface.co/datasets/harshinde/LandSlide4Sense
- Clay Foundation Model 文档：https://clay-foundation.github.io/model/
- Clay Hugging Face 权重：https://huggingface.co/made-with-clay/Clay
- Landslide4Sense 2022 原始竞赛仓库：https://github.com/iarai/Landslide4Sense-2022
