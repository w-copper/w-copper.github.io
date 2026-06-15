# RPC-GS：卫星 3DGS 别再把 RPC 当针孔相机凑合


# RPC-GS：卫星 3DGS 别再把 RPC 当针孔相机凑合

**结论：这一轮最值得单独跟踪的是 2026-06-04 提交到 arXiv 的 *RPC-GS: Gaussian Splatting with native RPC Rendering for Satellite Imagery*。它不是又一个把 3D Gaussian Splatting 套到卫星影像上的工程复现，而是抓住了卫星多视角重建里的一个根问题：现代推扫式卫星通常用 RPC/Rational Polynomial Camera 表达成像几何，过去很多 3DGS 方法为了方便渲染，把 RPC 近似成 pinhole 或 affine camera，这会把相机模型误差直接写进 DSM 和新视角合成结果。RPC-GS 的价值在于把 RPC 原生接入 Gaussian Splatting 渲染链路，让卫星 3D 重建少一点“计算机视觉相机模型”的假设，多一点遥感传感器几何。**

我按 2026-06-16 01:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。本篇选择的是光学卫星多视角三维重建，实验使用 DFC2019 WorldView-3 RGB 场景和 IARPA2016 多视角卫星 benchmark，不属于雷达方向。同期已在本地文章或用户清单中覆盖的主题包括 TTABC、OSMGraphCLIP、TUE-CD、GeoFM layerwise transfer、MaskWAM、LALE、CoastlineVLM、Stateful Visual Encoders、LG-SAM、LPM、CSI-Net、VecLang、TerraBench、OSTB 等，因此不重复写这些方向。

这篇文章的现实意义在于：遥感 AI 正在快速拥抱 3DGS、NeRF、世界模型、VLM 和 Agent，但很多系统仍把“几何可信度”当成后处理问题。对普通透视相机，3DGS 的投影、协方差变换和深度排序都有清楚定义；对卫星 RPC 相机，投影是经纬高到行列号的有理多项式映射，没有天然的 pinhole camera coordinate frame。若在这里偷懒，模型看起来仍能渲染漂亮图像，但高程、建筑边界、遮挡关系和跨视角一致性都会受损。

## 背景

3D Gaussian Splatting 的主流设定来自地面相机：每个 3D Gaussian 有位置、协方差、颜色和透明度，渲染时先把 Gaussian 投影到图像平面，再按深度做 alpha compositing。这个流程天然依赖相机投影和深度定义。

卫星影像不是这个几何设定。很多高分辨率光学卫星是 pushbroom sensor，影像不是一次性中心投影形成的，而是随平台运动逐行扫描。遥感产品通常用 RPC 模型描述从地理坐标到影像坐标的映射。RPC 是工程上非常常见的传感器模型，但它不像 pinhole 相机那样给出一个简单的内外参矩阵和相机坐标系。

过去的卫星 NeRF/3DGS 工作常用两种近似。一种是把 RPC 派生为 perspective camera，另一种是用 affine camera 做局部线性化。它们可以让现成 CV 渲染框架跑起来，但代价是把卫星成像的非线性几何压扁。对于低建筑、平坦区域，这种近似可能还算可用；对于高层建筑、复杂城区、山区地形、长基线多日期影像，误差会更明显。

RPC-GS 的问题意识很直接：既然卫星影像的标准相机模型是 RPC，Gaussian Splatting 就应该原生支持 RPC，而不是先把 RPC 改造成 CV 更熟悉的相机。这个方向看起来偏几何，但对遥感基础模型很关键。未来如果 VLM/Agent 要在三维地球、城市数字孪生、灾害评估或建筑高度估计中给出可信回答，它必须依赖几何上站得住的底层表示。

## 方法

RPC-GS 保留 3D Gaussian Splatting 的基本思想，但替换了投影链路。它把 splatting-friendly 的归一化场景坐标，通过一串地理坐标变换映射到 geodetic coordinates，也就是经度、纬度和椭球高；然后使用 RPC 投影函数把三维地理坐标映射到图像行列号。

第一处关键改动是 **Gaussian mean 的 RPC 原生投影**。普通 3DGS 中，Gaussian 中心点通过相机矩阵投影到图像平面。RPC-GS 中，这个投影必须经过地理坐标、RPC 归一化参数和有理多项式函数。这样做避免了把整幅卫星影像硬拟合成一个透视相机，也避免了 affine 近似在局部之外失真。

第二处关键改动是 **协方差投影**。3DGS 不只是投影点，还要投影 Gaussian 的形状和方向。RPC 映射是部分非线性的，如果只投影中心点而不正确处理协方差，splat 在图像上的椭圆形状会错。RPC-GS 推导了基于 Jacobian 的协方差投影，把三维 Gaussian 在 RPC 投影附近的一阶局部变化映射到二维图像平面。这个细节决定了渲染不是只“位置对”，而是局部形状和覆盖范围也对。

第三处关键改动是 **metric ray-based depth**。标准 3DGS 用相机坐标系里的 z 轴深度排序，但 RPC 没有显式相机坐标系。RPC-GS 因此构造了度量射线式深度，用于 front-to-back alpha compositing。这个设计解决的是遮挡顺序问题：如果深度排序错了，高楼、立交、山体和建筑边缘会出现错误透明叠加，DSM 也会受影响。

第四处贡献是 **统一比较 RPC、perspective、affine 三种相机模型**。这比只展示 RPC-GS 的可视化结果更有价值，因为它把争论变成了可检验问题：在相同初始化、相同训练设置和相同数据下，只改变相机模型与渲染器，最终高程误差和图像重建质量会怎样变化。

## 数据

论文使用两个卫星多视角 benchmark。

**DFC2019** 来自 2019 IEEE GRSS Data Fusion Contest，包含美国 Jacksonville 城市区域的多日期 WorldView-3 true-color RGB 卫星影像。论文使用四个场景，每个场景约 10 到 20 张影像。这个数据集适合检验城区多视角重建，因为建筑高度、街区遮挡、阴影和多日期差异都会考验几何模型。

**IARPA2016 Multi-View Stereo 3D Mapping Challenge** 是卫星多视角 3D 重建常用 benchmark。论文使用三个标准场景，每个场景约 40 到 50 张影像。原始数据包含全精度全色和多光谱影像，实验管线中转成 8-bit RGB 进行比较。

两个数据集都是光学卫星影像，不是 SAR 或 microwave 数据。评价重点也不是分类精度，而是三维重建质量：主要看 altitude MAE，也报告 PSNR 等图像重建指标。对遥感业务来说，altitude MAE 比单纯渲染好看更重要，因为 DSM/建筑高度/地形结构才是后续 GIS 分析、应急评估和三维城市建模的基础。

## 实验

论文的核心实验把 native RPC renderer、perspective approximation 和 affine approximation 放在同一框架中比较。所有方法使用相同设置，只改变相机模型和渲染方式。

在 DFC2019 上，native RPC 的平均 altitude MAE 为 2.14 m；perspective 近似为 3.04 m，affine 近似为 5.91 m。换算下来，RPC-GS 相比 perspective 降低 29.6% 高程误差，相比 affine 降低 63.8%。这个差距已经不是小修小补，而是说明相机模型近似本身会成为主要误差源。

在 IARPA2016 上，RPC-GS 也保持最低 altitude MAE。论文报告它相比 perspective 和 affine 分别降低 9.9% 和 37.9% 的平均高程误差。这里 perspective 的损失没有 DFC2019 那么大，但 native RPC 仍然稳定领先，说明改动不是只针对一个数据集调参。

PSNR 方面，RPC-GS 保持竞争力，但它的亮点不是“渲染图像最漂亮”，而是“几何更准”。这点对遥感 AI 很重要。很多生成式 3D 方法容易被新视角图像质量带偏，但遥感场景最终要落到坐标、高程、面积、体积、变化和风险上。如果 PSNR 提高但高程错了，业务价值有限；如果高程误差下降，哪怕渲染指标只是持平，也值得重视。

论文还给出多个场景的定性 DSM 对比。Native RPC 在建筑高度和地形结构上更接近参考 DSM，perspective/affine 近似更容易出现整体高度偏移或局部结构扭曲。这个结果符合直觉：卫星成像几何越复杂，越不能把传感器模型简化成普通 CV 相机。

## 亮点

第一，它把传感器几何放回了模型中心。遥感 AI 这几年很容易被“更大 backbone、更大 VLM、更大数据”吸走注意力，但卫星影像不是普通互联网图片。RPC-GS 提醒我们，坐标系、投影、深度和协方差这些基础问题处理不好，上层模型再大也可能建立在不稳的几何上。

第二，贡献边界清楚。RPC-GS 没有宣称解决所有卫星三维重建问题，而是明确解决 3DGS 与 RPC 相机模型之间的不匹配。这样的论文更容易被复现、比较和扩展，因为变量少，因果链清楚。

第三，实验设计有说服力。它不是拿不同方法、不同初始化、不同训练技巧混在一起比，而是在统一框架里只替换相机模型。这个设计直接回答了“RPC 原生渲染是否真的必要”。结果表明，至少在 DFC2019 和 IARPA2016 上，必要。

第四，它对 VLM/Agent 不是直接能力提升，而是底层可信度提升。未来遥感 VLM 如果要回答“这栋楼大概多高”“灾后建筑是否倾斜”“这个施工区土方量变化多少”“道路高架是否遮挡下方区域”，二维 caption 或 mask 不够，必须接入三维几何证据。RPC-GS 这类模型可以成为 VLM 调用的几何工具。

第五，它给遥感世界模型一个更务实的方向。ABot-Earth、3D Earth Model、城市级 3DGS 都很吸引人，但如果基础相机模型不对，规模化只会放大误差。RPC-native rendering 是把卫星三维生成从演示推向可靠工程的必要环节。

## 不足

第一，公开代码状态还需要跟踪。论文摘要和 checklist 都写到会释放代码和数据处理步骤，但我在公开页面没有看到稳定的官方 GitHub 仓库链接。对 3DGS/RPC 这种实现细节敏感的方法，代码、bundle adjustment、初始化、坐标归一化和数据预处理都很关键。

第二，实验场景数量仍有限。DFC2019 四个场景、IARPA2016 三个场景足以证明方法有效，但还不足以说明它在全球复杂地形、不同卫星、不同太阳高度、不同季节和不同城市形态下都稳。尤其是山区、海岸、高层密集区和强阴影区域，仍需要更多验证。

第三，它主要比较相机模型，没有系统处理多日期外观变化。卫星多视角常常跨日期采集，阴影、车辆、植被、云薄雾和施工变化都会干扰重建。Sat-NeRF 等工作处理过 transient objects 和 shadow modeling，RPC-GS 的几何模块未来还需要和这些外观鲁棒机制结合。

第四，当前重点是 DSM 和新视角合成，还没有直接进入语义任务。对遥感 AI 来说，更有价值的下一步是把 RPC-GS 输出的三维结构接到建筑提取、道路立交识别、灾害损毁评估、变化检测和 VLM 证据推理里，而不是只停在重建指标。

第五，计算成本和大范围部署仍是问题。3DGS 比 NeRF 高效，但城市级、国家级或全球级遥感应用需要分块、缓存、增量更新、LOD 和不确定性管理。RPC-native renderer 解决的是几何正确性，不自动解决大规模系统工程。

## 启发

一个值得继续做的小论文方向是：**RPC-aware 3D Evidence Backbone for Remote Sensing VLMs**。核心问题不是让 VLM 直接“看图猜高度”，而是让 VLM 调用一个 RPC 原生三维证据层，再基于 DSM、视角一致性和不确定性回答空间问题。

假设是：在高分辨率光学卫星场景中，把 RPC-GS 生成的 DSM、遮挡关系和多视角一致性特征作为 VLM/Agent 的外部工具，可以显著降低涉及高度、体积、遮挡、建筑损毁和立体结构的问题幻觉率；相比只给 VLM 单张 RGB 或拼接多视角图像，几何证据会让回答更可审计。

方法可以分三步。第一，复现 RPC-GS，在 DFC2019/IARPA2016 上生成 DSM、depth uncertainty 和 view-consistency map。第二，构造一组遥感三维问答/审核任务，例如建筑高度排序、屋顶是否坍塌、桥梁/高架遮挡关系、土方堆体体积变化、DSM 与 RGB 语义是否冲突。第三，让 VLM 不直接输出答案，而是先调用几何工具，读取局部 DSM、候选对象 polygon、跨视角误差和置信度，再生成结构化判断。

数据可以从 DFC2019、IARPA2016、SpaceNet building footprint、xBD 灾害建筑数据和公开 DSM/城市 LiDAR 参考数据开始。最小实验不需要训练大 VLM：可以先用现成 VLM 加检索式工具调用，比较三种输入设置：单张 RGB、多视角 RGB、RGB + RPC-GS 几何证据。指标包括回答准确率、幻觉率、证据引用完整性、高度误差、对象级一致性、人工审核时间和不确定样本召回率。

基线包括 Sat-NeRF、EO-NeRF、普通 perspective/affine 3DGS、传统 MVS/DSM 工具、RGB-only VLM、multi-view VLM 和带 DSM 输入的 VLM。关键消融不是只看哪种 VLM 更强，而是比较几何证据是否真的减少错误：去掉 RPC-native projection、去掉 uncertainty、去掉多视角一致性、只保留单视角 RGB。

一个可直接放进实验规范的 prompt / 检查清单是：

```text
你是遥感三维证据审计器。给定高分辨率光学卫星影像、多视角重建结果、RPC-GS 生成的 DSM、对象 polygon 和不确定性图，请先检查证据，再回答空间问题。

必须执行：
1. 不允许只根据单张 RGB 纹理判断高度、体积、遮挡或损毁。
2. 必须读取对象区域内的 DSM 统计量，包括最小值、最大值、中位数、边界坡度和异常高程点。
3. 必须检查该对象在多视角中的重投影一致性；一致性差时输出“不确定”。
4. 必须区分真实结构变化和阴影、视角差、季节变化、配准误差或临时物体。
5. 输出应包含对象 ID、空间证据、几何置信度、视觉证据、最终判断和人工复核优先级。
6. 对高度或体积类问题，必须给出误差范围，而不是只给单点估计。

禁止把 DSM 当成绝对真值。
禁止在几何证据低置信度时给出确定性结论。
禁止只报告 VQA accuracy，而不报告几何误差和证据引用质量。
```

这个方向和当前遥感 VLM 热点的关系很明确。VLM 擅长读任务、组织证据和生成人可理解的解释，但不擅长凭二维像素稳定恢复三维几何。RPC-GS 这类工作可以把“几何”变成 VLM 可调用的工具层，让遥感智能解译从“看起来像”转向“坐标、高程和多视角证据都支持”。这比单纯扩大多模态指令数据更慢，但更接近真实遥感 AI 系统需要的可信能力。

## 参考

- RPC-GS 论文：https://arxiv.org/abs/2606.06690
- RPC-GS HTML：https://arxiv.org/html/2606.06690v1
- DFC2019 数据集：https://dx.doi.org/10.21227/c6tm-vw12
- Sat-NeRF：https://arxiv.org/abs/2203.11872
- 3D Surface Reconstruction From Multi-Date Satellite Images：https://arxiv.org/abs/2102.02502
- 3D Gaussian Splatting 原论文：https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/

