# TUE-CD：震后建筑变化检测真正难的是短时间隔下的侧视错位


# TUE-CD：震后建筑变化检测真正难的是短时间隔下的侧视错位

**结论：这一轮最值得补进雷达的是 2026-06-09 提交到 arXiv 的 *Building Change Detection in Earthquake: A Multi-Scale Interaction Network and A Change Detection Dataset*。它的重点不只是提出 MSI-Net，而是把震后应急变化检测里的一个真实难点摆到台面上：救援最需要的是震后几天内的影像，但越靠近灾害发生时刻，影像越可能存在视角、侧视、遮挡和几何错位问题。论文构建了 Turkey earthquake CD dataset（TUE-CD），用 WorldView-2/Maxar 公开影像整理 1656 对 256 x 256 双时相图像块，标注 2338 个毁坏建筑，并用多尺度 offset calibration 去缓解短时间隔影像的 side-looking mismatch。**

我按 2026-06-15 19:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是高分辨率光学震后建筑变化检测。同期候选中，Earth-OneVision 摘要显式覆盖 SAR，按本轮规则不作为主项；PolyBuild 与最近的 polygon/LPM 文章重合较大；SemDINO 侧重 DINOv3 语义变化检测，但没有新增应急数据集。因此本轮保留 TUE-CD/MSI-Net 这个更贴近灾害应急 benchmark 的方向。

需要先说明可复现性状态：论文、arXiv HTML 和 PDF 已公开；我没有确认到官方 GitHub 仓库，也没有确认 TUE-CD 数据集已单独开放下载。因此它目前更适合作为“问题定义 + 数据集线索 + 方法设计”的跟踪项，而不是马上可跑的工程项目。

## 背景

遥感变化检测在灾害响应里经常被写成一个标准二分类问题：输入灾前、灾后两张图，输出变化 mask。但震后建筑损毁并不只是普通的建筑新增/消失。

救援场景里，时间是第一约束。xBD 这类灾害建筑损毁数据集很重要，但很多事件里的灾前/灾后影像间隔可能很长，适合灾害损毁识别和长期恢复评估，却不完全等价于“震后 24 小时到 5 天内快速制图”。如果 post-event 影像要尽快获取，卫星过境机会、拍摄角度、太阳高度、云和任务调度都会限制影像质量。结果就是：灾前和灾后图像里的同一栋高楼，可能因为侧视角不同出现屋顶位移、墙面显露、阴影变化、遮挡变化。普通 CD 模型很容易把这种几何错位当成建筑损毁。

这正是 TUE-CD 的切口。论文不是简单再刷 WHU-CD 或 CLCD，而是围绕 2023 年 2 月 6 日土耳其南部 7.8 级地震，整理震后短时间窗口的双时相光学影像。作者强调 post-event 数据在震后 5 天内获取，因此更符合应急响应逻辑，但也带来明显 side-looking 问题。

这个问题对遥感 AI 很实际。灾害变化检测如果只在配准良好、时间间隔较长、变化类型干净的数据上表现好，进入真实应急流程就可能大量误报。高楼的侧视错位、倒塌废墟的纹理混乱、道路和阴影变化、密集城区遮挡，都会把“真实损毁”和“成像几何差异”搅在一起。一个有价值的震后 CD benchmark，必须把这种错位当成任务核心，而不是当作预处理噪声忽略掉。

## 论文/项目

论文标题是 *Building Change Detection in Earthquake: A Multi-Scale Interaction Network and A Change Detection Dataset*，arXiv 编号 2606.10329，作者来自山东大学。论文提交时间为 2026-06-09，主题属于 cs.CV / cs.AI。

论文贡献有两层。

第一层是数据集。TUE-CD 使用 WorldView-2 卫星获取的土耳其震区双时相高分辨率影像，影像来源与 Maxar 公开灾害数据有关。论文提到样本覆盖 Adiyaman、Kahramanmaras、Hatay、Gaziantep 等重灾区域，共整理 1656 对 256 x 256 image patches，标注 2338 个毁坏建筑，训练/验证/测试按 7:1:2 划分。相较 WHU-CD 的建筑新增变化、CLCD 的耕地变化，TUE-CD 更强调震后建筑倒塌与短时间隔成像带来的几何错位。

第二层是方法。作者提出 MSI-Net，即 Multi-Scale Interaction Network。网络目标不是单纯扩大 backbone，而是围绕“两个时间点特征如何交互、如何校准错位、如何融合多尺度信息”设计模块。主干是共享权重的 Siamese encoder，输入为 RGB 双时相图像；多尺度特征经过 joint cross-attention、multi-scale offset calibration 和 feature integration 后，逐级上采样得到变化图。

论文在 WHU-CD、CLCD 和 TUE-CD 三个数据集上做实验。WHU-CD 用来验证建筑变化，CLCD 用来验证耕地变化，TUE-CD 则验证震后建筑损毁。作者比较了 9 个 CD 方法：FC-EF、FC-Siam-conc、FC-Siam-diff、DTCDSCN、BIT、GAS-Net、AMTNet、USSFC-Net 和 HANet。

## 方法

MSI-Net 的核心可以拆成三个模块。

第一是 **JCA：Joint Cross Attention**。它把通道维度的 cross-attention 和空间维度的 joint attention 放在一起，用来增强双时相特征交互。变化检测里的关键不是分别理解两张图，而是判断同一位置、相邻结构和上下文之间是否发生了语义变化。JCA 的作用是让两个时间点的特征在多尺度上先互相“看见”，减少只靠差分带来的噪声。

第二是 **MOC：Multi-Scale Offset Calibration**。这是最值得关注的模块。TUE-CD 的主要难点是 side-looking mismatch：由于灾前灾后影像拍摄角度不同，高建筑会出现位置偏移和侧面显露。MOC 估计多尺度 offset，用校准后的特征缓解错位影响。它的思路接近“不要急着判定变化，先判断两个时间点的局部结构是否只是成像位置不一致”。对震后建筑损毁，这比直接做 feature subtraction 更合理。

第三是 **FeI：Feature Integration**。经过 JCA 交互和 MOC 校准后，多尺度特征仍需要融合。FeI 把校准特征与原多尺度特征整合，补偿局部细节和全局语义。震后损毁往往既有局部屋顶/废墟纹理，也有整栋建筑区域的结构变化，多尺度融合是必要的。

训练上，论文使用 weighted cross-entropy，应对变化像素和未变化像素之间的不平衡。作者设置 change 与 no-change 权重为 0.7 和 0.3，优化器使用 AdamW，初始学习率 0.001，训练 200 epoch，batch size 为 16。所有比较方法采用同样训练 epoch 和 batch size，以减少训练设置差异。

## 实验

三个数据集的结果给出不同层面的信息。

在 WHU-CD 上，MSI-Net 的 Precision 为 96.66%，Recall 为 94.55%，mF1 为 95.58%，mIoU 为 91.81%，OA 为 99.27%。它在 Precision、mF1、mIoU 和 OA 上领先，说明方法在标准建筑变化数据集上没有只为 TUE-CD 过拟合。

在 CLCD 上，MSI-Net 的 Precision 为 84.21%，Recall 为 83.30%，mF1 为 82.96%，mIoU 为 73.53%。论文报告 mF1 比第二名 HANet 高约 0.6 个百分点。这个数据集是耕地变化，场景复杂度和建筑损毁不同，说明 JCA 的双时相交互不只适用于建筑。

最关键的是 TUE-CD。MSI-Net 在 TUE-CD 上 Precision 79.17%、Recall 76.97%、mF1 78.02%、mIoU 68.48%、OA 96.16%。表面看分数不如 WHU-CD 高，但这正说明 TUE-CD 更难。论文指出 AMTNet 在 Recall 上更高，USSFC-Net 在 Precision 上更高，但 MSI-Net 在 mF1、mIoU 和 OA 上最好；相对 AMTNet，MSI-Net 的 mF1 和 mIoU 分别高 1.13 和 1.24 个百分点。

消融实验也支持模块设计。TUE-CD 上，完整 MSI-Net 的 F1 为 78.02、IoU 为 68.48；去掉 JCA 后 F1 降到 76.51、IoU 降到 66.99；去掉 MOC 后 F1 为 76.38、IoU 为 66.66；去掉 FeI 后 F1 为 77.07、IoU 为 67.41。也就是说，MOC 和 JCA 对短时间隔灾害影像都很关键：前者处理错位，后者处理跨时相信息交互。

论文的 Grad-CAM 分析还指出，高建筑区域的 side-looking 问题更明显；加入 MOC 后，特征图更集中在真实变化区域，而不是被错位边缘牵着走。这个观察比单纯 mIoU 提升更重要，因为它把模型收益和具体成像问题联系起来。

## 亮点

第一，它把震后 CD 从“普通变化检测”拉回到“应急时间窗口”的问题定义。灾害响应不只需要准确，还需要快；快意味着 post-event 影像可能不理想，模型必须面对短时间隔带来的几何错位。

第二，TUE-CD 补了一个真实缺口。很多建筑变化数据集关注城市扩张、新建建筑或长期变化，xBD 关注多灾种建筑损伤，但 TUE-CD 专门强调土耳其地震、短时间窗口、毁坏建筑和 side-looking mismatch。这个数据集如果开放，会很适合做应急 CD benchmark。

第三，MOC 的问题意识比普通 attention 更强。遥感变化检测论文里 attention 模块很多，但不是每个模块都对应明确遥感成像误差。MOC 至少抓住了一个具体物理/几何来源：视角差导致的局部位移。

第四，它提醒后续 benchmark 不应只报告随机 split 的平均分。TUE-CD 这种灾害数据更需要按城市、震中距离、建筑高度、拍摄角度、震后天数和密集城区程度做分组评估，否则模型可能只是在某些干净区域上表现好。

第五，它可以自然接到 VLM/Agent 的应急制图流程。变化检测模型负责给出候选毁坏区域，VLM 或 LLM 更适合做证据审计、误报解释和人工复核排序，而不是直接在整幅图上生成损毁结论。

## 不足

第一，代码和数据集开放状态不清楚。论文贡献里最有价值的是 TUE-CD，但如果没有稳定下载链接、标注说明、许可和 split 文件，它暂时还不能成为可复现实验基准。

第二，TUE-CD 只有 1656 对图像块和 2338 个毁坏建筑，规模并不大。它适合定义问题和做初步 benchmark，但要支撑大模型或 foundation model 适配，还需要更多灾害事件、更多城市、更多建筑类型和更严格的跨事件测试。

第三，标签似乎主要关注 collapsed/destroyed building change，而不是 xBD 式的 no damage / minor / major / destroyed 等多级损毁。对救援来说，多级损伤和可通行性、人口暴露、道路阻断同样重要。二值变化图只是第一步。

第四，论文的主方法仍是监督式 CD。现实应急里，新灾害发生时很难快速获得像素级标注；后续需要少样本、弱监督、主动学习、VLM 审计和人机协同标注。

第五，side-looking 不只靠特征 offset 就能完全解决。严格来说，建筑高度、传感器姿态、DSM/DEM、RPC 几何、阴影和遮挡都会影响错位。MSI-Net 是纯图像特征校准，未显式使用几何元数据，因此在更大视角差或高层密集城区里可能仍不稳定。

## 启发

一个值得做成论文的方向是：**Emergency-ready building damage change detection under short-interval viewing mismatch**。

问题可以定义为：给定灾前影像和震后 1 到 5 天内获取的高分辨率光学影像，模型不仅要输出毁坏建筑 mask，还要估计该判断是否可能由视角错位、阴影、配准误差或遮挡造成。目标不是只提高平均 mIoU，而是在应急制图中降低高置信误报，并把有限人工复核资源排给最可疑区域。

核心假设是：震后 CD 的主要误差可以分成三类：真实结构损毁、成像几何错位、非灾害外观变化。若模型显式建模几何错位和不确定性，就能在跨城市、跨拍摄角、跨建筑高度场景中比普通 Siamese CD 更可靠。

方法可以分四步。

第一步，复现 TUE-CD/MSI-Net，并把 WHU-CD、xBD、LEVIR-CD、CLCD 和其他地震/飓风建筑数据集整理成统一二值/多级损毁评测协议。最小可行实验可以只做 TUE-CD + xBD Turkey/Syria 相关区域，指标包括 F1、IoU、building-level recall、false alarm per km2、boundary F1 和 calibration error。

第二步，加入几何/高度先验。若能获得 DSM、building footprint、高度 proxy 或 RPC/太阳角元数据，可以把 MOC 从纯 feature offset 扩展成 geometry-aware offset calibration。没有元数据时，也可以用阴影方向、屋顶-墙面纹理或 foundation model 特征估计侧视风险。

第三步，把 foundation model 放在“特征与泛化”层。可以比较 DINOv2/DINOv3、Prithvi、Clay、TerraMind、SAM2 encoder 与普通 ResNet/Swin encoder；重点不是谁在随机 split 上最高，而是谁在跨城市、跨建筑高度、跨震后天数上误报最少。

第四步，引入 VLM/LLM 审计层。VLM 不直接替代变化检测模型，而是读取候选区域的灾前/灾后 crop、变化 mask、局部建筑 footprint、阴影和相邻道路上下文，输出“需要人工复核 / 可自动通过 / 应拒绝”的证据化判断。

一个可直接用于这类工作的 VLM/LLM 审计 prompt 可以写成：

```text
你是震后建筑变化检测结果审计器。
给定一个灾前影像 crop、震后影像 crop、模型预测的建筑损毁 mask、建筑 footprint、局部道路/空地上下文、拍摄时间和可用的成像角度或阴影信息，请判断该候选变化是否适合进入应急损毁清单。

必须逐项检查：
1. 预测区域是否覆盖建筑主体，而不是只覆盖屋顶边缘、阴影或墙面侧视区域。
2. 灾前和灾后建筑轮廓是否存在整体平移、拉伸或侧视角变化；若是，标记为 view-mismatch-risk。
3. 是否能看到倒塌、屋顶破碎、废墟纹理、结构缺失或明显清场迹象；若没有，不能仅凭颜色差异判定毁坏。
4. 周边道路、空地、相邻建筑是否出现同方向同幅度位移；若出现，优先怀疑配准或视角问题。
5. 输出 accept / review / reject 三选一，并给出最主要证据和最大不确定性。

不要把阴影变化、拍摄角度变化、季节变化或配准误差直接当作建筑损毁。
如果证据不足，必须输出 review，而不是编造灾情解释。
```

这条线的价值在于，它比“再做一个变化检测网络”更接近真实应急系统。灾害制图需要的不只是 mask，还需要知道哪些 mask 可以信、哪些 mask 要复核、哪些误差来自成像几何。TUE-CD/MSI-Net 给了一个很好的切入点：把短时间隔灾后影像的 side-looking mismatch 变成 benchmark 和方法设计的核心变量。

## 参考

- [Building Change Detection in Earthquake: A Multi-Scale Interaction Network and A Change Detection Dataset](https://arxiv.org/abs/2606.10329)
- [arXiv HTML: Building Change Detection in Earthquake](https://arxiv.org/html/2606.10329v1)
- [Maxar Open Data Turkey earthquake example via leafmap](https://leafmap.org/notebooks/69_turkey_earthquake/)
- [xBD: A Dataset for Assessing Building Damage from Satellite Imagery](https://arxiv.org/abs/1911.09296)
- [WHU Building Dataset](https://gpcv.whu.edu.cn/data/building_dataset.html)
- [CropLand-CD / CLCD dataset repository](https://github.com/liumency/CropLand-CD)

