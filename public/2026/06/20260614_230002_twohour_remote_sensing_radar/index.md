# LPM：把遥感建筑轮廓提取改写成坐标语言建模


# LPM：把遥感建筑轮廓提取改写成坐标语言建模

**结论：这一轮最值得单独跟踪的是 Amazon Last Mile 的 *Rethinking Language Models for Building Outline Extraction from Remote Sensing Imagery*。它没有继续走“分割 mask -> 规则矢量化 -> 几何修正”的老路，而是把建筑轮廓直接序列化为坐标 token，让一个 decoder-only LLM 逐点生成多边形。论文在 INRIA、SpaceNet2、CrowdAI、WHU 四个公开建筑 benchmark 上验证，核心贡献不是把遥感图像拿去问答，而是把 LLM 的自回归序列建模能力迁移到结构化几何输出。对遥感 AI 来说，这比普通 VLM caption 更值得看：它指向“模型直接输出 GIS 可用矢量对象”的路线。**

我按 2026-06-14 23:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是光学/航空遥感建筑轮廓提取，数据集包括 RGB 航空或卫星影像，不属于雷达方向。它和最近的 VLM 热点关系很直接，但重点不是自然语言问答，而是把视觉模型和语言模型改造成可生成 polygon 的几何模型。

这篇文章的现实意义在于：遥感业务最终常常需要的不是一张好看的分割图，而是能进 GIS、地图、规划、灾害评估、导航系统的建筑 footprint。传统深度学习模型通常先输出 raster mask，再靠 Douglas-Peucker、直线拟合、角点检测、拓扑修复等步骤变成多边形。每一步都可能引入误差，也很难端到端优化。LPM 的问题意识很清楚：既然代码、公式和结构化文本都能被语言模型建模，建筑多边形坐标序列是否也可以被当作一种“几何语言”来生成？

## 背景

建筑轮廓提取一直是高分辨率遥感里的核心任务。它服务城市更新、应急响应、人口估计、物流地址库、能源建模和制图生产。过去的主流路线大致有两类。

第一类是 mask-based 方法，例如 U-Net、Mask2Former、SAM/SAM2 适配模型、SAMPolyBuild 等。它们擅长像素覆盖，但输出的是栅格。业务侧真正需要的是闭合、多边形化、边界规整的矢量对象，于是还要做后处理。后处理通常不可微，且对阈值、屋顶阴影、树冠遮挡、密集建筑粘连很敏感。

第二类是 keypoint / graph 方法，例如 PolyWorld、P2PFormer、PolyBuilding、PolyR-CNN、Pix2Poly。它们尝试直接预测顶点或边，再把顶点连接成多边形。相比 mask 路线，它们更接近矢量输出，但往往仍拆成“顶点检测 + 连通关系推断 + 组装修复”几个子问题。密集城区里，如果相邻建筑靠得很近，连通关系很容易出错。

LPM 的切入点是第三种路线：不先生成 mask，也不先生成无序顶点，而是把一张图里所有建筑的顶点按固定规则序列化，直接训练语言模型做 next-coordinate prediction。这个定义听起来简单，但关键在于序列化规则、坐标 token 空间和噪声鲁棒训练。如果这些环节做不好，模型看到的就不是稳定“语法”，而是一串随机排列的数字。

## 方法

LPM 的主体是 **SAM2 vision encoder + DistilledGPT2 decoder**。作者没有用超大 LLM，而是用约 82M 参数的 DistilledGPT2 来证明框架本身有效。输入图像先经过 SAM2 编码器抽取多层视觉特征，再通过融合模块和 PSP 上下文模块转成一组 `<VISUAL>` token，作为语言模型生成坐标序列的条件。

最关键的第一步是 **建筑多边形序列化**。作者先按每个建筑到图像左上角的最小距离排序，决定建筑顺序；再在每个建筑内部，从最靠近左上角的顶点开始，按顺时针顺序排列顶点。不同建筑之间用 `<SEP>` 分隔，整段序列用 `<SOS>` 和 `<EOS>` 标记起止。例如一张图里有多个建筑时，序列就是：

```text
<SOS>, x1, y1, x2, y2, ..., <SEP>, xk, yk, ..., <SEP>, <EOS>
```

这个设计的意义不只是工程细节。语言模型能学语言，是因为文本有稳定语法；多边形生成也需要稳定“几何语法”。论文消融显示，随机顶点顺序会让 SpaceNet2 IoU 掉到 42.19，WHU 掉到 46.71；使用左上角起点和左上角建筑排序后，SpaceNet2 回到 83.80，WHU 回到 88.69。也就是说，序列化规则本身就是模型能不能学会几何的前提。

第二步是 **坐标 token 化**。对 224 x 224 图像，作者显式定义坐标 token `<INDEX=i>`，其中 `i = 0...N-1`。x 和 y 共用同一套坐标 token，模型按 x、y 交替生成。这样做让多边形输出变成标准自回归 token 生成问题，但也带来一个问题：自然语言预训练的 token embedding 并不知道坐标 10 应该比坐标 100 更接近坐标 11。

为了解决这个问题，作者加入 **distance-aware coordinate token embedding**。训练中使用 triplet regularization，让相近坐标 token 的 embedding 更接近，远距离坐标 token 更远。直观上，这是在给 LLM 补上一种空间连续性先验。没有这个约束，模型可能把坐标当成互不相关的词表项；有了这个约束，坐标序列才更像连续几何空间。

第三步是 **coordinate label smoothing**。遥感建筑标注常常有像素级误差：屋檐、阴影、树冠、视角差、人工标注偏移都会让顶点位置不完全可靠。作者对坐标 token 的监督使用高斯平滑分布，而不是只把一个坐标当成唯一正确答案。这个做法不会平滑 `<SOS>`、`<SEP>`、`<EOS>` 等结构 token，只作用于坐标预测。论文报告不同数据集适合不同平滑强度，例如 SpaceNet2 在 `sigma=0.5` 时 PoLiS 从 1.403 改善到 0.955，INRIA 这种标注偏移更明显的数据则更适合较强平滑。

推理时，模型从 `<SOS>` 开始逐 token 生成，直到 `<EOS>` 或最大长度；再按 `<SEP>` 分割出每个建筑的坐标点列。重点是：这个过程不需要 mask-to-polygon 后处理，也不需要额外顶点连接模块。生成结果天然就是一组闭合建筑轮廓。

## 数据

论文在四个常用公开建筑提取 benchmark 上验证。

**INRIA Aerial Image Labeling Dataset** 包含 360 张高分辨率 tile，空间分辨率约 0.3 m，常用于跨城市建筑分割与泛化测试。论文使用官方 train/validation split。

**SpaceNet2 Las Vegas** 来自 SpaceNet 挑战系列，作者沿用 Pix2Poly 协议，使用 52,374 张训练图像和 9,242 张测试图像。它适合评估城市建筑密度、屋顶形状和矢量轮廓质量。

**CrowdAI** 是更大规模的卫星建筑数据集，论文使用 280,741 张训练图像和 60,317 张测试图像。它对模型吞吐和大规模训练稳定性更有压力。

**WHU Building Dataset** 使用新西兰航空影像，包含 4,736 / 1,036 / 2,416 张训练、验证、测试图像，原图大小为 512 x 512。论文按既有协议裁成 224 x 224 patch 训练和评估。

这些数据都属于光学遥感/航空影像建筑提取，不涉及 SAR 或 radar-only 输入。评价指标也不只看 IoU，还包括 complexity-aware IoU、PoLiS、MTA、Nratio 和拓扑指标。这个指标组合是合理的，因为建筑 footprint 的质量不能只用像素覆盖衡量；顶点数量、边界距离、拓扑闭合和角点规整都很重要。

## 实验

整体结果显示，LPM 的最大优势不是所有数据集上 IoU 都大幅领先，而是 **几何质量更稳、顶点数量更接近真实、多阶段误差更少**。

在 INRIA 上，LPM 的 IoU 为 80.16，略高于 SAM2-UNet 的 80.07 和 Pix2Poly 的 79.46；更关键的是 PoLiS 为 0.749，而 Pix2Poly 为 1.914，几何轮廓误差明显更低。

在 SpaceNet2 Vegas 上，LPM 达到 83.80 IoU，高于 HiSup 的 82.10 和 Pix2Poly 的 81.81；PoLiS 为 1.255，也优于 HiSup 和 Pix2Poly。说明在城市建筑提取里，直接序列生成并没有牺牲像素覆盖，反而改善了多边形边界质量。

在 CrowdAI 上，LPM 达到 95.11 IoU 和 93.15 c-IoU，Nratio 为 0.99，说明预测顶点数量接近理想值。这个数字对矢量化很重要：顶点过多会增加存储和后续 GIS 处理成本，顶点过少会损失轮廓细节。

在 WHU test 上，LPM 的 IoU 为 88.69，接近论文中引用的 Pix2Poly 89.15，并高于作者复现的 Pix2Poly 87.60；PoLiS 为 0.648，是表中最优。换句话说，LPM 在 WHU 上不是像素 IoU 绝对最高，但它给出的矢量几何更干净。

跨数据集泛化也值得看。使用 CrowdAI 训练、WHU 测试时，Pix2Poly IoU 降到 32.89，而 LPM 仍有 70.51；使用 CrowdAI 训练、SpaceNet2 测试时，LPM 为 83.62，高于 Pix2Poly 的 75.90。作者把这解释为：自回归 LLM 学到的是建筑轮廓顶点之间的依赖和闭合形状规律，而不是只在当前数据集里拟合顶点检测与连接规则。

效率方面，论文报告 LPM 在单张 V100 上达到 2.09 fps，8 张 V100 上约 16.70 fps；INRIA validation 推理在 8 张 V100-16GB 上约 20 分钟，而作者测试的 keypoint-based 方法需要约 1.5 小时。这个结果说明直接生成坐标序列并不一定比多阶段管线慢，至少在该设置下它减少了顶点检测和组装瓶颈。

## 亮点

第一，它把遥感 VLM/LLM 从“看图说话”推进到“看图输出 GIS 对象”。建筑 footprint 是真实业务对象，不是自然语言描述。模型如果能稳定生成 polygon、polyline、GeoJSON-like 序列，就有机会直接进入地图生产和空间分析流程。

第二，论文抓住了序列化这个核心问题。很多人会自然想到“把坐标喂给 LLM”，但如果坐标顺序不稳定，模型学到的只是噪声。LPM 的左上角建筑排序 + 左上角顶点起点 + 顺时针顶点顺序，是把多边形变成可学习语言的关键。

第三，distance-aware coordinate token 是一个可迁移设计。遥感里很多输出都不是普通词表，而是坐标、时间、波段、尺度、角度、行政区 ID、栅格索引。这些 token 之间有度量关系，不能完全按自然语言词处理。给 token embedding 加几何或物理约束，是把 LLM 用到遥感结构化任务时很值得保留的思路。

第四，评价指标比单纯 mIoU 更贴近矢量生产。PoLiS、Nratio、拓扑指标能暴露 mask 方法容易掩盖的问题：边界是否简洁、顶点是否冗余、轮廓是否闭合、相邻建筑是否粘连。未来遥感矢量生成论文也应该少报“漂亮 mask”，多报 GIS 可用性。

第五，它给 SAM2 在遥感中的角色提供了另一种用法。SAM2 不一定只用来做 promptable segmentation，也可以作为视觉 token 提供器，把图像证据交给结构化生成器。这个架构对道路中心线、农田地块、水系边界、海岸线 polyline 都有迁移空间。

## 不足

第一，当前输出仍受 224 x 224 patch 设定约束。真实遥感制图往往是大幅面影像，建筑跨 tile、尺度变化、重叠边界和坐标拼接都会引入额外问题。LPM 证明了 patch 级直接生成可行，但还没有完全解决大图流式生成和全局一致性。

第二，序列长度会随建筑数量和顶点数量增长。密集城中村、工业园、复杂屋顶会让序列更长，自回归生成的错误累积也会更明显。论文定性分析也提到，在密集城区、建筑重叠或植被遮挡场景中仍有局限。

第三，闭合、多边形合法性和拓扑一致性虽然比多阶段方法更好，但仍不是形式化保证。自回归模型可能生成重复点、异常点、过短 polygon 或跨建筑混合序列。业务落地仍需要轻量合法性检查，只是后处理不再承担主要几何构造任务。

第四，论文目前没有强调多光谱、时序或跨传感器输入。建筑 footprint 的很多难例可能需要近红外、历史影像、DSM、OSM 或街区拓扑辅助。LPM 的框架可扩展，但当前证据主要来自 RGB 航空/卫星影像。

第五，代码和权重公开情况还需要持续跟踪。论文方法细节较完整，但如果没有官方训练代码、数据预处理和序列化脚本，复现成本会高，尤其是不同数据集的 polygon 标注清洗和坐标 token 构造。

## 启发

一个值得继续做的小课题是：**GeoJSON-native Building and Road Generator for Remote Sensing**。核心问题不是再做一个更强的建筑分割模型，而是让模型直接输出 GIS 友好的矢量结构，并用空间合法性、压缩率和跨区域泛化评价它。

假设是：对于建筑、道路、水系、地块这类天然矢量对象，直接生成坐标序列或 GeoJSON-like token，比 mask 后处理更能保持几何简洁性和拓扑一致性；但前提是 token 空间必须显式编码距离、方向、闭合关系和对象分隔。

方法可以从 LPM 扩展三点。第一，把建筑 polygon、道路 polyline、地块 polygon 统一序列化为对象级 token，例如 `<POLYGON> ... </POLYGON>`、`<LINESTRING> ... </LINESTRING>`。第二，在 coordinate token 外加入方向 token、长度 token、闭合 token，减少长序列错误累积。第三，把 GIS 合法性约束做成训练损失或解码约束，例如自交惩罚、最小面积、边界闭合、道路连通性、建筑不重叠。

数据可以先用 WHU Building、SpaceNet building、SpaceNet roads、INRIA 和 OpenStreetMap 派生弱标签。最小实验不必追求全球规模：可以先在 SpaceNet Las Vegas 上做 building polygon，再在 SpaceNet road 或 DeepGlobe road 上验证 polyline 迁移。指标需要包括 IoU、PoLiS、Chamfer distance、topological F1、valid polygon rate、vertex compression ratio、每平方公里推理耗时，以及跨城市测试。

基线可以包括 SAM2-UNet + polygonization、SAMPolyBuild、Pix2Poly、PolyWorld、HiSup、传统 mask regularization，以及 LPM 原始实现。关键实验是比较“直接生成”和“mask 后处理”在相同视觉 encoder 下的差异，避免把收益简单归因于 SAM2 backbone。

一个可直接放进实验规范的 prompt / 检查清单是：

```text
你是遥感矢量对象生成器。给定一张高分辨率遥感影像和目标对象类型，请输出 GIS 可用的 polygon/polyline 序列，而不是 raster mask。

输出必须满足：
1. 每个对象用独立结构表示，不能把相邻建筑或道路段混成一个对象。
2. polygon 顶点必须按稳定方向排序，并显式闭合。
3. 坐标 token 必须保留空间连续性，相邻坐标错误应比远距离跳变错误惩罚更轻。
4. 如果影像遮挡、阴影或树冠导致边界不确定，输出低置信度或请求辅助数据，而不是强行生成尖锐边界。
5. 评价必须同时报告 IoU、PoLiS/Chamfer、拓扑指标、合法 polygon 比例、顶点压缩率和跨区域泛化。

禁止只用 mIoU 证明方法有效。
禁止依赖不可复现的人工后处理规则。
如果输出要进入 GIS，必须检查自交、重复点、闭合失败和对象粘连。
```

这个方向也可以和 VLM 结合，但不要停在“描述建筑很多/道路密集”。更有价值的是让 VLM 解释生成失败：哪里因为树冠遮挡不确定，哪里因为建筑相连导致拓扑风险，哪里需要 OSM/DSM/历史影像辅助。这样，VLM 不只是生成文本，而是成为矢量制图流程里的质量控制与交互修正模块。

## 参考

- 论文 PDF：https://cdn.amazon.science/aa/3c/d4ea78084f199eaf08743fc57e50/scipub-approval152134-45892548-rethinking-language-models-for-building-outline-extraction-from-remote-sensing-imagery.pdf
- CVPR 2026 EarthVision workshop：https://openaccess.thecvf.com/CVPR2026_workshops/EarthVision
- 补充材料：https://openaccess.thecvf.com/content/CVPR2026W/EarthVision/supplemental/Qian_Rethinking_Language_Models_CVPRW_2026_supplemental.pdf
- WHU Building Dataset：http://gpcv.whu.edu.cn/data/building_dataset.html
- SpaceNet：https://spacenet.ai/
- Pix2Poly：https://github.com/yeshwanth95/Pix2Poly

