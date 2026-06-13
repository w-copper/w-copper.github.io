---
title: "SpatialClaw：把遥感 VLM 的空间推理改成可执行代码"
date: "2026-06-13T23:00:05+08:00"
tags: ["VLM", "空间推理", "Agent", "工具调用", "GIS", "CV-to-RS"]
mode: "twohour"
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# SpatialClaw：把遥感 VLM 的空间推理改成可执行代码

**结论：这一轮最值得单独深挖的是 *SpatialClaw: Rethinking Action Interface for Agentic Spatial Reasoning*。它不是遥感原生论文，也没有在卫星影像 benchmark 上报告结果；但它给遥感 VLM 一个很直接的启发：空间推理不应只靠一次性文本回答，也不应只靠固定 schema 的工具调用，而应该让模型在一个有状态 Python kernel 里逐步写代码、调用感知工具、查看中间证据、修改分析路径，最后再提交答案。对大幅遥感影像、矢量图层、DEM、时间序列和 GIS 证据链来说，这个“代码即动作接口”的设定比普通 VQA prompt 更接近真实工作流。**

我按 2026-06-13 23:00 +08 检索公开来源，过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 主线。本篇选择 2026-06-11 提交 arXiv 的 SpatialClaw。论文和官方 GitHub 均已公开，仓库说明包含 agent runtime、LangGraph workflow、persistent Jupyter kernel、AST safety check、planning/reflection loop、20 个 benchmark loader、perception tool wrappers、FastAPI GPU tool server、vLLM 发现与负载均衡、SLURM 复现实验管理。本文把它作为 CV-to-RS 迁移方向，而不是当作已有遥感 SOTA 结果引用。

这篇适合放进“遥感基础模型与多模态理解”。原因是它研究的是 VLM agent 的空间推理接口，而遥感 VLM 的很多关键失败都来自空间接口不足：模型看不清局部证据、不会把 tile 和全图坐标对齐、不会把 mask/box/polygon/DEM 统一计算、不会记录跨步骤证据，也不会把中间计算交给可验证工具。SpatialClaw 不直接解决遥感问题，但它给了一个可复用的系统骨架。

## 背景

遥感 VLM 评测这两天有一个共同趋势：从“图里有什么”走向“模型如何得到答案”。SpatialSky-Bench 问 VLM 是否理解 UAV 空间导航；VLRS-Bench 问遥感 VLM 是否能跨 RGB、DSM、NIR 等输入做多任务推理；UltraVR 把超高分辨率 VQA 拆成证据定位、局部感知、计数、整合和最终决策；TerraBench 则把地球科学任务放进可执行工具链。它们都指向同一件事：遥感 AI 的瓶颈不只是视觉 encoder，而是证据访问和空间计算过程。

传统 VLM 的交互方式太薄。给一张图、一个问题，让模型直接输出答案，适合测试粗粒度识别，但不适合大幅遥感场景。一个 8000 像素航空图里，问题可能涉及左上角港口、右下角桥梁、中心城区道路密度和周边水体边界。模型如果只看缩略图，小目标会丢；如果切成 tile，又要知道 tile 坐标、重叠区域、目标去重和跨 tile 关系；如果还有矢量边界或地形栅格，还要做投影、叠加、统计和单位换算。一次性回答很难可靠完成这些步骤。

固定工具调用接口也不够。很多 agent 框架把工具设计成 `detect_object`、`segment`、`measure_distance`、`query_map` 这类函数，模型按 schema 调用。问题是空间推理经常需要临时组合操作：先分割水体，再用行政区 polygon 裁剪，再统计边界附近 200 米缓冲区里的建筑，再排除云影区域，再画图检查结果。若工具接口过窄，模型就只能在预设动作里选；若接口过宽，又容易把参数传错、坐标弄错、重复计算。

SpatialClaw 的问题意识就在这里。它认为 spatial agent 的能力被 action interface 限制。单次代码执行会在看到中间结果前就把整套分析写死；固定工具调用又缺少灵活组合能力。于是它把动作接口改成“逐步写 Python cell”：模型每一步都能根据上一步 stdout、新变量和可视化结果继续调整，就像研究者在 notebook 里分析空间数据。

这对遥感很有启发。遥感工作本来就是 notebook/脚本驱动的：读影像、重投影、裁剪、分块、运行模型、合并 mask、矢量化、叠加 GIS 图层、计算面积和距离、出图、审查异常。VLM 如果要成为遥感分析 agent，最自然的接口不是让它凭空描述图像，而是让它在受控环境里写可审计代码，调用遥感和 GIS 工具，并留下每一步 artifact。

## 方法/框架

SpatialClaw 是 training-free framework。它不训练新的 VLM，也不为每个 benchmark 调专门 prompt；核心改变是运行时接口。系统维护一个有状态 Python kernel，预加载输入帧、感知模块、几何工具和科学计算库。VLM 每一步写一个 Python cell，cell 经过 AST safety check 后执行，执行结果再返回给模型作为下一步观察。

仓库 README 把流程概括为五阶段循环：planner 先起草策略，main VLM 逐步写代码，系统检查并执行 cell，stdout、新变量和 `show()` 图像作为 observation 返回，模型继续分析，直到调用 `ReturnAnswer(...)` 提交答案。这个循环的关键不是“模型会写代码”本身，而是代码成为可组合的空间操作界面：模型可以把分割结果、深度估计、几何计算、数组统计和可视化检查放在同一个状态里。

SpatialClaw 的工具栈面向通用 3D/4D 空间推理。官方 README 提到 perception primitives 包括 SAM3 segmentation、Depth-Anything-3 reconstruction、geometry utilities，以及 NumPy、SciPy、Matplotlib 等科学计算库。运行时还包括三类服务：vLLM backbone、GPU perception-tool server 和 agent-side Jupyter kernels。对于大规模实验，它支持 vLLM 自动发现与负载均衡、FastAPI 工具服务和 SLURM launch managers。

迁移到遥感时，工具清单应替换成遥感/GIS primitives。最小版可以包括：读取 GeoTIFF/COG、查看 CRS 和 transform、按经纬度或投影坐标裁剪 tile、调用分割/检测/VLM 模型、把 mask polygonize、用 Shapely/GeoPandas 做相交/缓冲/面积/长度统计、用 rasterio/xarray 做栅格窗口读写、用 OSM 或行政边界做矢量叠加、用 Matplotlib/Folium/QGIS 风格图层输出中间图。

这里的设计重点是“有状态”。遥感 VLM 的很多错误来自没有持久证据状态：第一步找到的建筑，在第二步计数时被重复；一个 tile 的局部坐标没有转回全图坐标；模型看到的 crop 不能和最终地图定位对应；mask 被压缩成文字后丢掉形状。SpatialClaw 式 kernel 可以让模型把 `building_polygons`、`road_graph`、`water_mask`、`tile_index`、`crs`、`uncertainty_map` 这些对象保存在变量里，而不是在自然语言上下文中模糊记忆。

对遥感来说，还必须加两层约束。第一是安全约束：只允许读指定数据目录、只允许调用白名单库和工具、限制网络和文件写入、限制每步运行时间。第二是地理约束：每个空间对象都必须带 CRS、分辨率、时间戳、数据源和置信度；任何面积、距离、比例都必须记录单位。否则代码接口会把 VLM 的幻觉从文字层转移到脚本层。

## 数据/benchmark

SpatialClaw 原论文评测的是 20 个通用空间推理 benchmark，覆盖 single-image spatial reasoning、multi-view spatial reasoning、general spatial reasoning、video spatial & 4D reasoning 和 general video understanding。官方配置文档列出的 benchmark 包括 ERQA、Omni3D、OmniSpatial、SPBench、MindCube、MMSI、SPAR-Bench、BLINK、SpatialTree、ViewSpatial、MMSI-Video、OSI-Bench、PAI-Bench、VSI-Bench-U、VSTI-Bench、DSI-Bench、CV-Bench、PerceptComp、Video-MME 和 Video-MME-v2。

这些 benchmark 不是遥感数据，但它们覆盖了遥感 VLM 也会遇到的能力：对象相对位置、视角变化、多帧运动、3D/4D 关系、视觉证据检索、工具辅助测量和中间结果修正。遥感迁移时，不应照搬题目，而应照搬评测结构：给 agent 一个需要多步空间计算的问题，要求它产出可执行轨迹和最终答案。

一个遥感版 benchmark 可以从四类任务构造。

第一类是超高分辨率图像空间问答。输入 DOTA、xView、FAIR1M、DIOR 或 SpaceNet 的大图和目标标注，问题包括“左上港区船只是否多于右下港区”“道路以东 100 米内是否有储罐”“两个机场跑道之间哪一个更长”“指定 polygon 内车辆密度是否超过阈值”。这类任务测试 tile 选择、局部感知、计数、距离和方向关系。

第二类是光学遥感 + GIS 矢量推理。输入 NAIP/Google-style aerial RGB 或 Sentinel-2/Landsat 光学影像，再给 OSM road/building/landuse、行政边界或 parcel。问题包括“新建建筑是否落在既有建筑 footprint 外”“某村庄 500 米缓冲区内绿地比例是多少”“道路连通性是否被洪水 mask 切断”。这类任务测试 raster-vector fusion、CRS、缓冲、相交和拓扑。

第三类是多时相变化证据链。输入 LEVIR-CD、WHU building change、SECOND、SpaceNet temporal 或 Landsat/Sentinel-2 时间序列，问题不只是“哪里变化”，而是“变化发生在哪个区域、变化类型是什么、是否影响道路/建筑/农田、面积是多少、置信度如何”。这类任务测试 temporal state、前后影像对齐、变化 mask 到语义解释的转换。

第四类是环境/农业/城市指标计算。输入 Sentinel-2/Landsat 光学产品、公开气象/人口/土地覆盖栅格和矢量边界，问题包括 NDVI 异常、城市热岛 proxy、作物物候阶段、灾后暴露人口估计、绿地可达性等。这里更接近 TerraBench，但需要把视觉证据纳入 agent 轨迹，而不是只做表格/栅格计算。

评测指标也应借鉴 SpatialClaw 的过程式思路。除了最终 accuracy 或数值误差，还要报告 tool execution success、CRS error rate、unit error rate、tile localization accuracy、evidence mask IoU、object count error、polygon validity、topology error、duplicate object rate、artifact completeness、step count、token/compute cost 和 human audit pass rate。若只看最终答案，很难知道模型是视觉看错、代码写错、参数错，还是最后推理错。

## 实验

论文摘要报告，SpatialClaw 在 20 个空间推理 benchmark 上达到 59.9% average accuracy，比最近的 spatial agent 高 11.2 个百分点；增益覆盖两个模型家族、六个 VLM backbone，参数规模从 26B 到 397B，并且没有 benchmark-specific 或 model-specific adaptation。官方 README 也强调使用同一套 system prompt、tool set 和 hyperparameters。

这个结果说明一个重要点：action interface 本身可以带来明显收益。它不是换一个更大的视觉编码器，也不是为每个任务写专门工具，而是让模型把工具输出和中间证据以代码变量的方式组合。对遥感研究而言，这意味着“更好的 prompt”可能不是终点；更大的改进可能来自把遥感空间操作暴露成可执行、可检查、可回滚的接口。

迁移实验可以按最小可行版本开始。第一步，不训练任何模型，选择一个强 VLM 加一套遥感工具白名单。给它 DOTA/xView 中 100-300 个空间计数和关系问题，比较三种接口：直接 VQA、固定工具调用、SpatialClaw-style Python cell。若 Python cell 在 evidence localization、counting 和 relation accuracy 上明显更好，就说明接口设计对遥感 VLM 有独立价值。

第二步，加入视觉工具。直接 VQA 只给图；固定工具调用可以调用 detector/SAM/segmenter；代码接口可以在 cell 中组合 detector、SAM、Shapely、rasterio 和可视化。评估时不要只看最终答案，要看模型是否选择了正确 tile、是否把 bbox/mask 转成正确全图坐标、是否对重叠 tile 做去重、是否把不确定区域标出来。

第三步，加入 GIS 图层。让模型回答需要 raster-vector 叠加的问题，例如某行政区内新增建筑面积、道路缓冲区内水淹比例、农田 parcel 内 NDVI 异常面积。这里可以直接暴露 `geopandas.overlay`、`rasterio.mask`、`pyproj`、`shapely.buffer` 等函数。关键对照是：固定工具 schema 是否足够表达任务，代码接口是否减少了参数/单位/坐标错误。

第四步，做错误归因。把失败分成六类：视觉证据错、tile/坐标错、工具参数错、空间计算错、证据整合错、最终答案错。这个分类比普通遥感 VQA 的 accuracy 更有价值，因为它能告诉我们下一步该改视觉模型、工具接口、坐标状态、代码安全检查，还是答案校准。

## 亮点

第一，SpatialClaw 把空间推理的接口问题讲清楚了。VLM 不只是需要更多工具，还需要一种能逐步组合工具、查看中间结果、保存状态和修正路径的动作空间。代码 cell 比固定工具 schema 更接近研究者真实分析空间数据的方式。

第二，它是 training-free。对遥感来说，这很实用：很多场景没有足够标注，也不方便重新训练大模型。先把现有 VLM、遥感基础模型、分割器、GIS 库和评测器接成 agent runtime，就能做一批有诊断价值的实验。

第三，官方实现相对完整。公开仓库不是只有 demo，而是包含 agent runtime、benchmark loaders、tool server、配置文档和复现实验管理。这让它比只有论文概念的 spatial agent 更适合作为遥感系统原型的参考。

第四，它强调中间观察。遥感大图推理最怕模型“脑补”。如果每一步都能输出图层、mask、bbox、统计表和可视化，人工和自动 verifier 就能检查模型到底看了哪里、算了什么、错在哪一步。

第五，它能和近期遥感趋势拼起来。UltraVR 给证据链诊断，TerraBench 给地球科学可执行 workflow，VecLang 给矢量地图结构化输出，SpatialClaw 给代码动作接口。四者结合，基本就是下一代遥感 VLM agent benchmark 的雏形。

## 不足

第一，SpatialClaw 不是遥感论文。它的 20 个 benchmark 主要是通用图像、视频、3D/4D 空间推理，不包含遥感传感器、地理坐标、投影、超大幅影像切片、多光谱 band、云影、季节变化或空间自相关。因此本文所有遥感价值判断都是迁移推断，需要单独实验验证。

第二，代码接口提高灵活性，也提高风险。VLM 写代码可能产生隐性错误：单位错、坐标轴反了、经纬度顺序错、buffer 在地理坐标系里直接算米、mask 与影像分辨率不一致、tile overlap 重复计数。这些错误看起来比文字幻觉更“工程化”，但危害不小。

第三，工具能力会限制结果。若 SAM/Depth/Detector 在遥感小目标、阴影、密集建筑或低分辨率光学影像上失败，代码接口只能把错误组合得更复杂。遥感版 SpatialClaw 必须加入遥感专用视觉工具和质量控制，而不是只复用自然图像工具。

第四，计算成本可能较高。逐步执行 cell、生成中间图、调用多个 GPU 工具、保存 artifact，会比一次性 VQA 慢很多。对于大范围制图，必须研究 tile routing、缓存、早停、低分辨率预筛和不确定性驱动的局部放大。

第五，可复现性和安全性需要严格规范。若每个模型都能写任意代码，实验很难比较；若不给足够自由，代码接口又退化成固定工具调用。遥感 benchmark 需要定义白名单 API、资源限制、日志格式、artifact schema 和 scoring protocol。

## 启发

一个可做的小论文方向是：**面向遥感 VLM 的可执行空间推理接口与错误诊断 benchmark**。核心问题不是让模型直接回答更多遥感问答，而是比较不同动作接口对空间证据链的影响：直接文本回答、固定工具调用、一次性脚本、逐步 Python cell，哪一种最能减少证据定位、坐标转换、计数和 GIS 叠加错误？

假设是：在大幅光学遥感图像和 GIS 图层混合任务中，SpatialClaw-style 有状态代码接口会显著提升需要测量、计数、拓扑和跨 tile 整合的问题；但如果没有 CRS/单位约束和 artifact verifier，它也会引入新的 workflow hallucination。

方法可以分三层。第一层是 runtime：一个受控 Python kernel，预加载影像数组、GeoTIFF metadata、tile index、矢量图层和白名单函数。第二层是工具：检测/分割模型、SAM/SAM2 proposal、GeoPandas/Shapely/rasterio/xarray/pyproj、可视化和基本统计。第三层是 verifier：检查 CRS、单位、polygon validity、mask shape、坐标范围、重复对象、输出 artifact 是否完整。

数据可以从最小组合开始：DOTA 或 xView 做高分辨率目标计数与关系，SpaceNet 或 WHU building 做建筑 polygon 与面积统计，LEVIR-CD 做双时相建筑变化，OpenEarthMap/LoveDA 做语义 mask，OSM/行政区边界做矢量叠加。所有任务都应明确输入、问题、可验证答案、允许工具和评分函数。

指标包括 final accuracy、numeric tolerance hit rate、evidence IoU、object count MAE、relation accuracy、CRS error rate、unit error rate、invalid geometry rate、duplicate count rate、tool failure rate、artifact completeness、平均 step 数和 GPU/时间成本。最好再做 first-error analysis：第一次错误发生在视觉、坐标、工具、空间计算、证据整合还是最终答案。

baseline 可以设四组。第一，direct VLM：给图和问题直接回答。第二，tool-call agent：只能调用固定 schema 工具。第三，single-shot code：一次写完整脚本并执行。第四，stateful code agent：逐步写 cell，观察中间结果后继续。关键 ablation 是有无 planner、有无 reflection、有无可视化返回、有无 CRS verifier、有无正确局部 crop、有无遥感专用 detector。

一个遥感版代码动作接口 prompt 可以这样写：

```text
你是遥感空间推理 agent。你必须通过受控 Python cell 完成分析，不能直接猜答案。

每一步只写一个可执行 cell。优先保存中间变量和可视化证据。

规则：
1. 所有 raster、mask、polygon、bbox 都必须记录 CRS、transform、分辨率和数据源。
2. 面积、距离、缓冲区必须在投影坐标系中计算，并显式写出单位。
3. 大图必须先定位相关 tile，再做局部检测或分割；跨 tile 目标必须去重。
4. 对每个最终结论，必须保留支持它的 evidence artifact，例如 crop、mask、polygon、统计表或叠加图。
5. 如果视觉证据不足、工具失败或坐标不确定，必须返回不确定状态，而不是用地理常识补全。
6. 最终只能通过 ReturnAnswer(answer, evidence, uncertainty) 提交。
```

这个 prompt 的关键不是让模型解释得更长，而是强制它把空间推理变成可检查对象。比如模型要回答“某行政区内新增建筑面积是否超过 2 平方公里”，它必须展示前后影像、变化 mask、行政区裁剪、面积计算代码、单位转换和不确定区域。这样评审者才能判断错误来自哪里。

进一步的研究可以把 SpatialClaw 和 UltraVR 合并：UltraVR 提供 operation labels，SpatialClaw 提供可执行操作轨迹。对于遥感 VLM，问题不再只是“最终答案对不对”，而是“证据定位 cell 是否选对 tile、分割 cell 是否生成正确 mask、GIS cell 是否正确叠加、统计 cell 是否单位正确、最终答案是否由这些 artifact 支持”。这会比普通排行榜更像可发表的 benchmark 论文。

也可以和 VecLang 合并。SpatialClaw-style agent 负责从影像和工具中构造证据，VecLang/SVL 负责把最终地图对象输出成可解析矢量语言。这样一个系统可以从“看图问答”走向“生成可执行地图更新”：检测建筑变化、生成 polygon、检查拓扑、导入 PostGIS，再由 verifier 给出错误类型。

最小第一实验不需要大模型训练。选 100 个 DOTA/xView 空间计数题和 100 个 SpaceNet/WHU 建筑面积题，用同一个 VLM 比较 direct QA、tool-call 和 stateful code 三种接口。若 stateful code 明显减少 tile 漏看、重复计数和单位错误，这篇就有清晰结论；若没有提升，也能说明当前 VLM 写代码的空间操作能力不足，需要更强 verifier 或工具设计。

这篇对遥感 AI 的真正提示是：下一代遥感 VLM 可能不该只被评为“会不会回答问题”，而要被评为“会不会像一个合格的地理分析员那样组织证据”。它要能看图、切图、调模型、算几何、查矢量、画图、复核单位、保留 artifact，并在不确定时停下来。SpatialClaw 给出的不是遥感答案，而是一个值得移植的动作接口。

## 参考

- *SpatialClaw: Rethinking Action Interface for Agentic Spatial Reasoning*：https://arxiv.org/abs/2606.13673
- SpatialClaw 项目页：https://spatialclaw.github.io/
- SpatialClaw 官方 GitHub：https://github.com/NVlabs/SpatialClaw
- SpatialClaw 配置与 benchmark 文档：https://github.com/NVlabs/SpatialClaw/blob/main/docs/configuration.md
- *UltraVR: A Diagnostic Ultra-Resolution Image-VQA Benchmark for Evidence-Grounded Reasoning*：https://arxiv.org/abs/2606.05576
- *TerraBench: Can Agents Reason Over Heterogeneous Earth-System Data?*：https://arxiv.org/abs/2606.13148
- *Vector Map as Language: Toward Unified Remote Sensing Vector Mapping*：https://arxiv.org/abs/2606.10701
