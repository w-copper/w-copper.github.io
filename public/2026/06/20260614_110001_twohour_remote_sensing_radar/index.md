# Plan2Map：别让 VLM 直接手写 GeoJSON


# Plan2Map：别让 VLM 直接手写 GeoJSON

**结论：这一轮最值得单独跟踪的是 *Plan2Map: A Multimodal Benchmark for Document-Grounded Geospatial Boundary Reconstruction from Planning Records*。它不是传统遥感影像分类或分割论文，而是把一个很真实的地理智能问题做成 benchmark：给系统一份规划 PDF，里面有通知文本、法律描述、扫描地图、标签和边界标注，要求系统还原可评分的 GeoJSON 边界。最有价值的结论很直接：端到端让 VLM 直接生成 GeoJSON 几乎不可靠；更稳的路线是让 VLM 读证据、让 GIS 工具定位和配准、让分割模型提边界，再把 mask 投影回 WGS84。**

我按 2026-06-14 11:00 +08 检索公开来源，过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 主线工作。本篇选择 2026-06-01 提交 arXiv 的 Plan2Map。arXiv 和项目页均已公开；项目页标注 Code 和 Dataset 为 coming soon，因此本文把它视为“论文与项目页公开、代码和数据集尚未释放”的条目。

这篇适合放进“多源数据融合、效率部署与应用落地”。原因是它的核心不是单个视觉 encoder，而是把文档解析、地名检索、地图瓦片匹配、边界分割、坐标投影和结果校验串成一个可执行地理工作流。对遥感 VLM、GeoAgent 和地图自动化来说，它比单图 VQA 更接近真实业务。

## 背景

很多地理空间信息并不是一开始就以 GeoJSON、Shapefile 或标准数据库形式存在。城市规划、历史保护区、建设限制、土地使用规则、环境红线和基础设施管控范围，常常只存在于 PDF、扫描件、公告文本、附图和地方政府网页里。人能读懂“某条路以东、某条边界线内、图中黄色区域”，但机器要把它变成可查询的边界并不容易。

Plan2Map 关注的是英国 Article 4 Direction 规划记录。它们定义了某些区域上的规划限制，但源文件往往只给法律通知和附图，不直接给机器可读的边界。数字规划系统真正需要的是几何对象：一个地点是否落在限制区内，某个限制是否和其他规则重叠，历史记录是否能被审计，这些都需要可计算边界。

这类任务和遥感 AI 的关系很近。遥感模型经常输出 mask、检测框或变化区域，但落地时必须和地籍、道路、行政边界、规划文档、地名库和地图瓦片对齐。也就是说，问题不只是“图里有什么”，而是“来自不同来源的证据能不能被合成一个合法、可验证、可投影的空间对象”。

Plan2Map 的关键提醒是：不要高估通用 VLM 直接生成空间几何的能力。VLM 可以读文本、看图、找线索，但让它从 PDF 一步写出准确 GeoJSON，会把地名消歧、地图配准、比例尺、坐标系统、边界追踪和拓扑合法性全部混在一个黑箱里。出错时也很难知道错在阅读、定位、配准还是几何生成。

## 方法/框架

作者提出的系统叫 GeoPlanAgent，是一个 document-grounded、geospatial-tool-in-the-loop 的多阶段流程。它没有把规划 PDF 直接丢给 VLM 生成多边形，而是把任务拆成 evidence extraction、localisation、map registration、boundary segmentation、projection 和 verification。

第一步是 Reader。系统用一次多模态 LLM 调用，把原始 PDF 转成结构化空间证据，包括 postcode、grid reference、address、road name、place name、map label、printed scale 和 page-level metadata。这里的 VLM 更像文档证据抽取器，而不是最终制图器。

第二步是 Worker，通过工具调用生成最终 GeoJSON。它先用 Locate sub-agent 查询 OS Open Names gazetteer，给出一个大致地图中心和不确定半径。随后做 map-tile matching，把规划文件中的地图图版和 OS Open Zoomstack tiles 对齐。项目页写明这里使用 MINIMA-LoFTR 加 RANSAC 来恢复匹配关系。

第三步是 boundary segmentation。系统使用带 LoRA adapter 的 SAM 3，在规划地图上做边界区域分割，并结合 style-transfer augmentation 适应不同文件风格。这个设计很重要：规划图可能是黄底、白底、扫描件、低质量 PDF、彩色边界、斜线填充或多部件区域，直接用通用分割器未必稳。

第四步是 projection。系统通过恢复出的 affine transform，把分割 mask 投影到 WGS84，生成可评分的 GeoJSON。可选的 Critic 再独立审查 top-3 candidates，决定接受、切换候选或请求重新定位。整个系统的思路是把 VLM 的语言和视觉能力限制在适合它的环节，把几何计算交给确定性工具和可检查的中间结果。

这对 CV-to-RS 迁移也有启发。通用 CV 里的 feature matching、RANSAC、promptable segmentation、document VLM 和 agent tool-use 都能迁移到地理空间任务，但遥感和 GIS 场景额外要求坐标系统、比例尺、投影、空间误差和拓扑合法性。Plan2Map 的价值就在于把这些要求放进同一个评测闭环。

## 数据/benchmark

Plan2Map 包含 208 个手工审查过的 UK Article 4 Direction 记录，时间跨度为 1958 到 2025 年，覆盖英格兰 29 个 local planning authorities。每个 case 包含三个主要 artefact：源规划 PDF、经验证的参考 GeoJSON，以及把参考几何叠加到 OpenStreetMap 底图上的 rendered location-map PNG。

源 PDF 里可能有通知文本、法律 schedule、地图图版、地图标签和边界注释。参考 GeoJSON 在评测时作为 held-out scoring reference。几何类型可以是 Polygon 或 MultiPolygon，复杂度从简单地块到不规则、多部件边界都有。

项目页还给出了元数据维度，包括 local authority、site description、document quality、document colour、boundary shape 和 shape complexity。document quality 分 Good / Bad，document colour 包括 White / Yellow，shape complexity 包括 Easy / Medium / Hard。这些分层很有用，因为失败往往不是平均分能解释的：扫描质量差、底图颜色、边界复杂度和文本线索稀疏都会改变难度。

从遥感 benchmark 角度看，Plan2Map 的特别之处在于它不是给模型一张干净影像和像素级标签，而是给一个真实工作包。系统必须从文档中找空间证据，再把局部地图和真实世界坐标对齐，最后输出 GIS 几何。这更像实际测绘、规划和环境监管里的数据生产链。

## 实验

主结果很清楚。GeoPlanAgent 在 208 个 case 上达到 0.736 mean IoU、0.904 median IoU，67.8% 的预测达到 IoU >= 0.8。median centroid error 为 4.6 m，Acc@0.1D 为 78.8%。加入 Critic 后，mean IoU 小幅到 0.740，median IoU 到 0.906，但核心提升来自前面的定位、配准和分割流程，而不是最后让 LLM 再评一句。

端到端 VLM-to-GeoJSON baseline 表现很弱。项目页给出的 Gemini-3.1-Pro 端到端结果为 0.108 mean IoU、0.000 median IoU，只有 1.4% 的样本达到 IoU >= 0.8，centroid error 为 480 m。这个对比非常有信息量：VLM 不是完全不能看文档，而是不能可靠地把所有空间运算压成一次几何输出。

component ablation 也指出了关键瓶颈。直接 VLM-to-GeoJSON 不可靠；SAM 3 的监督 LoRA 微调相比 vanilla baseline 能把边界分割 pixel IoU 提升 0.30 以上；sliding-window map registration 能把 median centroid error 从 Locate-only 的 176 m 收紧到 5 m，约 38 倍改善。

这些结果说明，剩余错误主要不是“模型不会画边界”这么简单，而是定位和地图配准。一个边界 mask 在 PDF 坐标里可能很好，但如果底图中心偏了、比例尺错了、道路名消歧错了、affine transform 不稳，投影到 WGS84 后就会整体漂移。对遥感制图来说，这类错误比像素边界误差更常见，也更难用普通 mIoU 诊断。

成本也值得注意。项目页报告 GeoPlanAgent 的 $/doc 为 0.043，GeoPlanAgent + Critic 为 0.045，而 Gemini-3.1-Pro 端到端为 0.106。也就是说，多阶段工具链不仅更准，还不一定更贵，因为它减少了无效的大模型尝试，把计算放在更确定的模块上。

## 亮点

第一，它把“地理空间边界重建”从演示任务变成了可评分 benchmark。208 个真实规划记录、held-out GeoJSON、文档质量和形状复杂度分层，让后续方法可以比较，而不是只展示几个 PDF 转地图的漂亮案例。

第二，它非常明确地否定了直接 VLM 写 GeoJSON 这条捷径。端到端 VLM baseline 的 median IoU 为 0，说明空间几何不是普通结构化文本生成。VLM 可以参与，但不能承担全部制图责任。

第三，系统拆分符合地理任务结构。Reader 负责证据抽取，gazetteer 负责定位，LoFTR/RANSAC 负责配准，SAM 3 负责边界 mask，projection 负责坐标转换，Critic 负责候选审查。每一步都有可视化和可审计的中间结果。

第四，它把 promptable segmentation 拉进了 GIS 生产链。SAM 3 不是用来做普通遥感语义分割，而是从规划图版里提取被标注的限制区边界。这个用法对遥感变化制图、灾害范围矢量化、生态红线抽取和历史地图数字化都有迁移价值。

第五，评估指标贴近业务。IoU、centroid error、Acc@0.1D 和成本同时出现，比单纯报告 mIoU 更有现实意义。规划边界如果整体偏 100 米，即使形状相似也不能用；如果成本过高，也难以批量清理历史档案。

## 不足

第一，代码和数据集尚未公开。项目页标注 Code coming soon、Dataset coming soon。对于这种多模块系统，复现难点不只在模型权重，还在 PDF 解析、地图瓦片获取、gazetteer 查询、匹配参数、mask 投影和评分协议。

第二，数据域集中在英国 Article 4 Direction。它对英国规划记录、OS 数据、Open Names gazetteer、Open Zoomstack tiles 和英文规划文档高度贴合。迁移到其他国家、其他规划制度、非英文文档或底图不一致地区时，定位和配准模块都要重做。

第三，它不是遥感影像主导的 benchmark。Plan2Map 更偏 GIS/document-grounded reconstruction，而不是 Sentinel-2、NAIP 或航空影像语义理解。对遥感基础模型的直接训练价值有限，但对遥感 AI 落地工作流的启发很强。

第四，边界分割仍依赖规划图中的显式视觉标注。如果源文件只有纯文字描述、没有地图，或者附图缺少清晰边界线，GeoPlanAgent 需要更多地依赖地名、道路网络和法律描述推理，这会显著提高不确定性。

第五，Critic 的增益有限。项目页结果显示加入 Critic 后 mean IoU 只从 0.736 到 0.740。后续如果要用 agent 自我修正，关键不是多加一个 LLM 审稿人，而是让 critic 能定位具体失败类型：地名错、图幅错、比例尺错、mask 错、投影错还是拓扑错。

## 启发

一个可做的小论文方向是：**Evidence-First GeoVLM for Remote Sensing Boundary Reconstruction**。核心问题不是让 VLM 直接输出边界，而是让它先生成可审计证据包，再由 GIS 和视觉工具逐步生成几何。

假设是：遥感 VLM 在边界类任务上的主要失败，不是视觉感知完全不足，而是证据链不可控。模型把文本、图例、地名、地图比例尺、影像纹理和边界线混在一次生成里，导致错误无法定位。若强制模型输出 evidence schema，并把定位、配准、分割、投影拆成可检查模块，边界重建会比端到端 GeoJSON 生成更稳。

方法可以从 Plan2Map 扩展到遥感场景。输入不只规划 PDF，还包括一张遥感影像 tile、一个历史地图或公告附图、OSM/行政边界/道路网等 GIS prior。VLM 首先抽取证据：目标区域名称、参照道路、方向关系、图例颜色、边界描述、可能坐标和不确定性。随后系统用地名库和道路网定位，用影像匹配或地图配准对齐，用 SAM/SegEarth-OV/RemoteSAM 生成候选 mask，再投影为 GeoJSON。

数据可以先用公开、容易构造的任务开始。规划边界可用 Plan2Map；遥感侧可以选灾害范围、保护区边界、矿区扰动、水体岸线、建筑拆迁范围或城市绿地边界。若缺少完整标注，可以从 OSM、政府开放数据、OpenStreetMap relation、USGS/ESA/NASA 公共图层和地方规划开放数据构造弱监督。

评估指标应包含三层。第一层是几何质量：IoU、centroid error、Hausdorff distance、boundary F1、self-intersection rate。第二层是证据质量：引用的地名是否在文档出现、道路参照是否正确、图例颜色是否匹配、坐标范围是否合理。第三层是工作流质量：CRS 错误率、配准失败率、mask 投影失败率、人工审计通过率和每 case 成本。

一个可直接放进实验规范的 prompt/检查清单是：

```text
你是地理空间边界重建系统的证据抽取器。给定一份规划文档、地图截图或遥感图件，请不要直接输出 GeoJSON。请先输出一个 evidence record：

1. target_boundary: 需要重建的区域名称或规则名称。
2. textual_clues: 文档中支持边界位置的短语、道路名、地名、地址、编号和方向描述。
3. visual_clues: 图中边界颜色、填充样式、标签、图例、比例尺、北箭头和页码。
4. localisation_candidates: 可能的中心点、地名或地址候选；每个候选给出置信度和不确定半径。
5. registration_requirements: 需要匹配的道路、河流、地块边界或地图标签。
6. segmentation_prompt: 给 SAM/分割器使用的正负提示、目标颜色或边界样式描述。
7. uncertainty: 哪些证据缺失、冲突或可能导致错误。

禁止直接编造坐标。
如果地图和文本冲突，必须列出冲突来源。
如果不能定位到唯一地点，必须输出多个 localisation_candidates。
如果边界可能是 MultiPolygon，必须明确说明各部分证据。
```

这个方向和遥感 VLM 的关系很直接。遥感 VLM 以后不能只会回答“这里是什么”，也不能只会给出一段解释；它需要产生可进入 GIS 的边界、证据和不确定性。Plan2Map 的核心经验是：空间智能不是让大模型一次性写出结果，而是让大模型进入一个可审计、可投影、可回退的地理计算流程。

## 参考

- arXiv：https://arxiv.org/abs/2606.02747
- 项目页：https://odeb1.github.io/Plan2Map_Project_Page/
- Planning Data：https://www.planning.data.gov.uk/
- OS Open Names：https://www.ordnancesurvey.co.uk/products/os-open-names
- OS Open Zoomstack：https://www.ordnancesurvey.co.uk/products/os-open-zoomstack

