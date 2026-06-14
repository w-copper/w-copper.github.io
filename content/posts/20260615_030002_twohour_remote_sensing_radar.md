---
title: "CoastlineVLM：让遥感 VLM 直接画出海岸线 polyline"
date: "2026-06-15T03:00:02+08:00"
tags: ["VLM", "海岸线", "几何定位", "polyline", "NZCCD", "CV-to-RS"]
mode: "twohour"
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# CoastlineVLM：让遥感 VLM 直接画出海岸线 polyline

**结论：这一轮最值得单独跟踪的是 2026-06-09 提交到 arXiv 的 *Geometric Coastline Localization using Vision-Language Models*。它的价值不在于又做了一个海岸线分割模型，而是把任务从“先预测像素 mask，再后处理成线”改成“让 VLM 直接输出海岸线 polyline”。这件事对遥感 AI 很重要：很多业务对象最终不是 raster，而是 GIS 里可测量、可编辑、可追踪的矢量几何。CoastlineVLM-7B 用 GeoChat-7B / LLaVA-1.5 架构，把海岸线存在检测、海岸线 proxy 类型判断和 polyline grounding 放到一个 instruction-following 框架里，并用 Hausdorff、EMD、Fréchet、Chamfer 等几何指标评价，而不是只看 IoU。**

我按 2026-06-15 03:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是高分辨率航空/光学遥感上的海岸线几何定位，不涉及雷达输入。同期候选里，BCP 更偏通用 CV 的 VLM 测试时适应，SpatialClaw 更偏通用空间智能 Agent，UltraVR 和 VLRS-Bench 更适合作 benchmark 综述；CoastlineVLM 的问题定义更具体，且直接连到遥感 VLM、GIS 矢量输出、薄结构评价这三条线，因此更适合本轮单篇深挖。

这篇文章的现实意义在于：遥感模型常常优化的是像素分类，但用户真正要的是一条可以进入 GIS 的线、一个可以算面积的多边形、一个可以沿时间序列比较的对象。海岸线尤其典型。实际海岸线分析使用的往往不是某一时刻的水陆边界，而是 vegetation line、dune toe、cliff edge、built structure line 等地貌 proxy。潮汐、浪涌、泥沙、阴影和道路边缘都会干扰像素分割。CoastlineVLM 的核心主张是：如果目标本来就是几何边界，模型就应该直接学习几何边界，而不是把几何作为分割后的副产物。

## 背景

海岸线提取长期被当作语义分割问题处理。常见流程是先把影像分成陆地、水体或海岸边界，再通过 skeletonization、contour extraction、line simplification 等后处理得到线状结果。这个流程看起来工程上自然，但有一个很大的错位：训练目标是像素，业务产品是 vector。

这种错位会带来三个问题。第一，像素 IoU 对一像素宽边界很苛刻，预测线只要偏离几个像素，IoU 就会急剧下降，但这不一定代表几何上不可用。第二，后处理步骤包含阈值、连通域选择、骨架化和平滑，规则很难跨海岸类型复用。第三，分割模型容易把道路、植被边缘、泥水边界或沙滩浪花当成海岸线，因为这些结构在图像里都表现为强边缘。

论文强调的另一个关键点是 coastline 与 shoreline 的定义差异。shoreline 往往指瞬时水陆交界，受潮汐和短期水文条件影响；coastline 在海岸变化分析中更常由稳定地貌 proxy 定义，例如 vegetation line、dune toe、cliff edge 或人工防护结构边缘。也就是说，模型不能只“看哪里有水”，还需要理解哪类边界才是当前标注体系下的海岸线。

这正是 VLM 有机会发挥作用的地方。普通分割网络只能学习视觉模式，VLM 可以通过 instruction 同时处理“是否存在海岸线”“属于哪种 proxy”“坐标线在哪里”三类任务。它不只是输出文本描述，而是把语义判断和结构化几何输出放在同一套模型里。

## 方法

CoastlineVLM-7B 建在 GeoChat-7B / LLaVA-1.5 之上。底层视觉编码器是 CLIP ViT-L/14-336，语言侧是 Vicuna 系 decoder-only LLM，中间用 multimodal projector 把视觉 token 映射到语言 token 空间。训练时冻结 CLIP 视觉编码器，只微调 multimodal projector 和语言 backbone 里的 LoRA adapter，以降低小数据集上的过拟合风险。

论文把任务设计成三类 instruction：

第一类是 **coastline presence detection**。给一张航空影像，模型回答是否能看到海岸线 proxy。这一步看似简单，但对负样本很重要，因为很多 tile 可能只有道路、植被、水体或城镇边缘，没有真正的海岸线。

第二类是 **proxy-type classification**。模型需要在 Vegetation line、Cliff line、Gravel berm、Built structure line、Waterline 等类别中判断海岸线由哪种地貌 proxy 定义。这个任务把海岸科学里的标注语义显式放进模型，而不是让模型盲目学习一条视觉边缘。

第三类是 **coastline grounding**。模型直接生成 normalized coordinate pairs，例如 `[[x1,y1], [x2,y2], ...]`，输出一条 polyline。坐标范围归一化到 0-100，格式通过 prompt 固定。这里最关键的是：输出不是 dense mask，也不依赖分割后骨架化，而是一条有序曲线。

为了让变长海岸线适配 LLaVA-1.5 的上下文窗口，论文在预处理时用 Ramer-Douglas-Peucker 算法简化 ground-truth polyline，并限制顶点数量。评价时，为避免不同模型输出的顶点密度影响距离指标，作者把预测线和真值线都按弧长插值重采样到固定数量点，再计算几何距离。

基线方面，作者训练了 U-Net、U-Net++、DeepLabV3+ 和 SegFormer 四个 segmentation model。它们的训练标签来自 NZCCD polyline rasterized 成的一像素宽 boundary mask；推理后再通过 skeletonization 抽出中心线，与 CoastlineVLM 的 polyline 一起进入几何评价。这种设置比较公平地暴露了 representation mismatch：分割模型先学像素，再被迫转线；VLM 一开始就学线。

## 数据

论文构建了 **Coastline-Instruct** 数据集，图像来自 Land Information New Zealand (LINZ) 的高分辨率正射航空影像，海岸线矢量来自 New Zealand Coastal Change Dataset (NZCCD)。NZCCD 是新西兰全国尺度海岸变化数据，包含从 1940 年代到 2023 年的人工解译海岸线，以及按 10 m 间隔计算的海岸变化率。

Coastline-Instruct 覆盖 8 个区域：Auckland、Bay of Plenty、Hawke's Bay、Northland、Otago、Taranaki、Waikato 和 West Coast。数据集总量为 17,977 个样本，其中正样本 8,988，负样本 8,989。训练集 16,221，验证集 881，测试集 875。

更重要的是，它采用 region-held-out split。West Coast 整个区域作为测试集，Hawke's Bay 作为验证集，其余区域用于训练。这个划分比随机切 patch 更有意义，因为它能减少空间泄漏，测试模型是否能迁移到训练时没见过的海岸形态。

数据的 proxy 分布并不均衡。训练集中包含五类 proxy，但验证和测试区域的类别不完全相同；West Coast test set 包含 Vegetation line、Cliff line 和 Built structure line，不包含 Gravel berm 与 Waterline。这一点直接影响 proxy 分类结果，也提醒后续研究不能只看 micro-F1，因为多数类会掩盖少数 proxy 的失败。

当前公开状态需要说清楚：NZCCD 和 LINZ 影像本身有公开数据来源；论文说明 Coastline-Instruct 将在论文发表后释放。arXiv 页面没有显示官方 CoastlineVLM 代码链接，因此复现还需要等待作者发布数据构建脚本、训练配置和模型权重。

## 实验

CoastlineVLM-7B 在四张 A100 上训练，单张 A100 上推理。作者报告四个随机种子，说明模型训练比较稳定。presence detection 在 West Coast test set 上平均 F1 为 0.99，说明模型能可靠区分有无海岸线 proxy。

proxy classification 的 micro-F1 约 0.898，但 macro-F1 只有 0.250。这不是一个小问题。micro-F1 高，说明模型在多数 proxy 上表现不错；macro-F1 很低，说明少数类几乎没有被平衡处理好。论文的混淆分析显示，Vegetation line 识别较强，Cliff line 会被部分错成 Vegetation line，Built structure line 更容易被错成 Vegetation line。这符合遥感视觉直觉：自然植被边界、悬崖边界和人工防护结构在航空影像上可能共享相似的线状纹理和阴影。

polyline grounding 的稳定性较好。论文报告四个种子下 normalized Fréchet 距离约 0.273，且测试集中没有 malformed predictions，预测 polyline 顶点数量也保持稳定。对结构化坐标生成任务来说，这一点很关键，因为 VLM 常见风险不是只错一点坐标，而是格式错、括号错、点数乱或输出不可解析。

最值得看的是几何定位表。与 segmentation baselines 相比，CoastlineVLM-7B 在 global geometry 上更好：Hausdorff distance 从 U-Net 的 37.74 m 降到 31.84 m，Earth Mover's Distance 从 21.12 m 降到 17.32 m。论文还报告，proxy upsampling 后，Chamfer distance 从 11.98 m 降到 9.69 m，Hausdorff distance 从 31.84 m 降到 25.25 m，EMD 从 17.32 m 降到 13.75 m。这说明类别平衡不是边角问题，而是直接影响几何定位。

不过结果也不是“VLM 全面碾压分割”。U-Net 在 5 m、10 m、20 m tolerance 和 Chamfer distance 上更强，说明分割模型在局部贴近边界方面仍有优势。CoastlineVLM 的优势主要体现在 worst-case deviation 和 global structural alignment：线更连续，远端错位更少，整体形状更像专家标注的 coastline。

这组结果的正确解读是：如果目标是局部像素贴合，分割模型仍然强；如果目标是可用于海岸变化分析的连续几何对象，VLM + polyline representation 更值得继续推进。

## 亮点

第一，它把遥感 VLM 从“问答/描述”推进到“结构化几何输出”。GeoChat 原本支持遥感图像对话和 grounding，但多以 bbox 或区域理解为主；CoastlineVLM 把 grounding 扩展成 polyline，让 VLM 直接输出 GIS 更接近的对象。

第二，问题定义非常清楚。海岸线不是普通边缘，也不是瞬时水陆线，而是由地貌 proxy 定义的分析对象。把 proxy type classification 和 polyline grounding 联合训练，比单纯做 land-water segmentation 更符合海岸监测业务。

第三，评价指标选得对。薄结构任务不能只靠 IoU。Chamfer、Hausdorff、EMD、Fréchet 和 tolerance metrics 能分别反映平均距离、最坏偏差、全局匹配和曲线顺序。这个评价框架可以直接迁移到道路中心线、水系边界、河岸线、田块边界、建筑轮廓和滑坡边界。

第四，region-held-out split 有实际价值。遥感模型最容易在同区域随机 patch 切分里虚高。West Coast held-out 测试能更好检验跨地貌泛化，虽然还不等于全球泛化。

第五，它和最近的 LPM、VecLang、Plan2Map、polygon-native mask decoder 形成了同一条趋势：遥感 AI 正在从 raster mask 走向 coordinate sequence、polyline、polygon、GeoJSON 和可审计 GIS 对象。这条路线比普通 caption 更可能产生可发表、可落地的研究。

## 不足

第一，代码和 Coastline-Instruct 数据集还没有完全公开。论文提供了较详细的数据来源、训练设置和评价方法，但如果没有官方 preprocessing、prompt 模板、polyline simplification 参数和 LoRA 配置，复现成本仍然高。

第二，地理范围仍局限于新西兰。NZCCD 的质量很高，但海岸形态、植被类型、潮汐环境、影像获取条件和人工标注习惯都有地域特性。模型能否迁移到英国、澳大利亚、美国、日本、东南亚岛屿或中国沿海，还需要外部验证。

第三，proxy class imbalance 很明显。macro-F1 低说明模型的地貌语义还不够稳，尤其是 Built structure line、Gravel berm 和 Waterline 这类少数类。后续如果只提升 polyline 距离而不解决 proxy 混淆，业务解释性仍然不足。

第四，polyline 简化有信息损失。为了适配上下文窗口，作者对海岸线做 RDP 简化并限制顶点数量。高度弯曲的海岸线、河口、沙嘴、人工港湾和复杂礁岸可能需要更长序列。固定 token 长度和几何细节之间的矛盾仍然存在。

第五，它还没有利用多时相信息。海岸线变化分析天然是 temporal task，但本文主要是单时相图像上的 coastline localization。要服务侵蚀/淤积监测，还需要把同一地点多期 polyline 串起来，评估时间一致性和变化率误差。

## 启发

一个值得继续做的小论文方向是：**Geometry-native Remote Sensing VLM for Thin Boundary Extraction**。核心问题不是把所有任务都做成分割，而是统一建模遥感里的薄几何对象：海岸线、河岸线、道路中心线、田块边界、建筑轮廓、滑坡边界、防火隔离带、水渠和堤坝线。

假设是：对于天然以线/面存在的遥感对象，直接生成 polyline / polygon / GeoJSON-like sequence，并用几何距离、拓扑合法性和跨区域泛化评价，会比 mask 后处理更适合真实 GIS 工作流；VLM 的作用不是“讲图像里有什么”，而是把视觉证据、对象定义和几何输出绑定起来。

方法可以分四步。第一，选择一个强视觉 encoder，例如 GeoChat、LLaVA-NeXT、DINOv3/SAM2 + LLM adapter 或遥感 VLM backbone。第二，把对象输出统一成结构化几何 token：`<LINESTRING>`、`<POLYGON>`、`<SEP>`、normalized coordinate、confidence、proxy type。第三，训练多任务 instruction：存在检测、对象类型、几何输出、失败原因解释。第四，评价时同时报告局部距离、全局距离、拓扑合法率、跨区域性能下降和人工编辑成本。

数据可以从 Coastline-Instruct / NZCCD、SpaceNet roads、DeepGlobe Road、WHU Building、INRIA Building、OpenEarthMap、LoveDA、OpenStreetMap 弱标签、河流/水系矢量数据开始。最小实验可以先做两个对象：海岸线 + 道路中心线。这样能检验模型是否真的学到薄结构几何，而不是只适配一种海岸线 proxy。

基线应包括 U-Net / U-Net++ / DeepLabV3+ / SegFormer + skeletonization，SAM2 / SegEarth-OV + vectorization，Pix2Poly / LPM 类直接坐标生成，以及 GeoChat / LLaVA 类 VLM grounding。指标不要只报 mIoU，应包括 Chamfer、Hausdorff、Fréchet、EMD、topological F1、valid geometry rate、vertex compression ratio、跨区域泛化、每平方公里推理时间和人工修正点数。

一个可直接放进实验规范的 prompt / 检查清单是：

```text
你是遥感薄结构几何定位模型。给定高分辨率遥感影像和目标对象定义，请输出 GIS 可解析的 polyline 或 polygon，而不是 raster mask。

输出必须满足：
1. 先判断目标对象是否存在；不存在时不要强行生成坐标。
2. 如果目标对象依赖专业 proxy 定义，先输出 proxy 类型和判断依据。
3. 几何结果必须是有序坐标序列，并给出置信度。
4. 对道路、河流、海岸线等线状对象，必须检查断裂、重复点、异常跳点和拓扑不连续。
5. 对建筑、地块等面状对象，必须检查闭合、自交、重复点和相邻对象粘连。
6. 评价必须同时报告局部贴合、全局形状、最坏偏差、拓扑合法性和跨区域泛化。
7. 如果影像中存在阴影、潮汐、泥水、树冠、道路边缘或人工结构混淆，必须输出不确定原因，而不是只给一条线。

禁止只用 IoU 证明薄结构定位有效。
禁止把 mask 后处理参数当成不可公开的黑箱。
禁止把自然语言解释替代可测量的几何输出。
```

这个方向和 VLM 的结合点非常明确。遥感 VLM 不应该只做“这是一片海岸/城市/农田”的描述，而应该能回答“哪一条线是可用于变化分析的 coastline proxy”“这条线为什么不是道路边缘或泥水边界”“输出的 polyline 在 10 m tolerance 内有多少点”“哪些段需要人工复核”。如果能把结构化几何、专业 proxy 和不确定性解释整合起来，遥感 VLM 才会从演示型问答走向可用的地理智能工具。

## 参考

- CoastlineVLM 论文：https://arxiv.org/abs/2606.10468
- CoastlineVLM HTML：https://arxiv.org/html/2606.10468v1
- New Zealand Coastal Change Dataset (NZCCD)：https://auckland.figshare.com/articles/dataset/New_Zealand_s_Coastal_Change_Dataset_NZCCD_/27105955
- Aotearoa's Coastal Change Dataset：https://coastalchange.nz/
- LINZ Data Service：https://data.linz.govt.nz/
- LINZ Aerial Imagery：https://www.linz.govt.nz/products-services/data/types-linz-data/aerial-imagery
- GeoChat 代码：https://github.com/mbzuai-oryx/geochat
- GeoChat 论文：https://arxiv.org/abs/2311.15826
