---
title: "TerraBench：地球科学智能体不能只会调工具"
date: "2026-06-13T03:00:02+08:00"
tags: ["Earth-system Agent", "工具调用", "GIS", "benchmark", "数值推理", "证据链"]
mode: "twohour"
categories: ["多源数据融合、效率部署与应用落地"]
draft: false
---

# TerraBench：地球科学智能体不能只会调工具

**结论：这一轮最值得单独跟踪的是 TerraBench。它的价值不在于又给 LLM Agent 做了一个排行榜，而是把地球科学任务里的真实困难放进了评测：卫星影像、格网物理量、GIS 上下文、仿真器、外部文档和数值容差必须在同一个可执行流程里协同。结果也很直接：强模型并不是不会选工具，而是经常把参数、单位、空间范围、时间窗口和数值证据链做错。**

我按 2026-06-13 03:00 +08 检索公开来源，过滤了 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 方向。本篇选择 2026-06-11 提交的 *TerraBench: Can Agents Reason Over Heterogeneous Earth-System Data?*。论文有 arXiv、HTML 版本和 GitHub 仓库；它的主线是 Earth-system / geospatial agent benchmark，不是单一遥感视觉模型。

这篇适合放进“多源数据融合、效率部署与应用落地”。原因是它把遥感 AI 从“看懂一张图”推进到“能不能把图像、GIS、环境变量、仿真和文档组织成可审计计算”。对遥感大数据来说，这个方向比普通 VQA 更接近生产系统：用户真正需要的不是模型说一句“这里可能有洪水风险”，而是它能否调用正确数据、设定正确区域、运行正确工具、保留中间产物，并给出容差内的数值答案。

## 背景

过去一年地理智能体和遥感 VLM 的热度很高，但很多评测仍然偏窄。常见任务是图像问答、caption、单图 grounding、地图工具问答或简单 GIS 操作。它们能测模型是否会读图、会不会调用地图 API，却很难测真实地球科学工作流里最麻烦的部分：数据异构、单位不一致、空间投影、时间窗口、仿真参数、文档约束和结果可追溯性。

TerraBench 的问题意识很明确。天气和气候基础模型擅长预测物理场，但不擅长用自然语言交互式推理；LLM 擅长语言规划，但不能直接处理高维地球系统数据。真实分析往往处在两者之间：研究者要从遥感影像、栅格变量、矢量边界、模拟器输出和论文表格中重建一个可信结论。

这类任务对遥感 AI 很重要，因为遥感应用的终点通常不是单个 mask 或类别标签，而是一个带行动含义的决策：某个县未来几天水资源压力如何，某片作物在指定气候情景下是否减产，某段道路中断会造成多大通勤延误，某个城市热风险是否超过阈值。模型要回答这些问题，必须把视觉、地理和科学计算接起来。

从 CV/ML 到遥感的迁移路径也很清楚。通用 Agent 研究里的 ReAct、工具调用、代码执行、artifact 管理和过程评测，可以迁移到遥感大数据系统；但遥感场景必须额外处理坐标、尺度、时序、空间自相关、物理单位、数据来源和科学容差。TerraBench 正是在这些地方把普通 agent benchmark 拉回地球科学现实。

## 方法/框架

TerraBench 建在 TerraAgent 之上。TerraAgent 是一个 ReAct-style executable framework，也就是让 LLM 在推理过程中交替进行思考、工具调用和观测，再把环境检索、地理处理、仿真和 artifact-backed computation 连接起来。这里的关键不是“给模型更多工具”，而是把工具调用变成可检查的执行轨迹。

论文把任务分成三条 track。第一类是 Fundamentals，面向可以直接验证的多模态执行任务，例如读取地球观测影像、提取栅格统计或做基础空间分析。第二类是 Simulator-Grounded，要求模型运行或近似运行科学/工程仿真，做 intervention、counterfactual 或情景比较。第三类是 Document-Grounded Verification，要求模型根据外部文档和执行结果重建或近似已发表的科学量。

评测设计里最有价值的是双层指标。它不只看最终答案是否对，还看过程是否可信。过程层包括 instruction accuracy、tool call success、tool accuracy、参数准确性、调用顺序等，合成 ToolUseScore；答案层则用 Hit@tol 和 NumScore 做容差感知数值评估。这个设计很适合遥感，因为很多错误不是类别错，而是“看似走完流程，最后数值差很多”。

论文还强调 artifact provenance。也就是说，模型不能只给最终结论，而要留下中间数据、执行结果和证据来源。对遥感生产尤其关键：如果一个智能体说某地风险上升，用户必须能回查它用了哪一幅影像、哪个行政边界、哪个时间窗、哪个仿真器参数、哪一段文档依据。

## 数据/benchmark

TerraBench 包含 403 个 agentic tasks，覆盖三条 track、八个应用领域和约 24,500 个经过验证的执行步骤。公开摘要和 HTML 版本显示，八类应用包括 weather、air quality、emergency response、water resources、agriculture、infrastructure、environmental monitoring、hurricane/cyclone analysis。

这个规模不算海量，但它的密度很高。论文报告只有 50.9% 的候选样本通过人工审查保留下来，保留下来的样本中 74.4% 需要多次执行 pass 才能最终确定。这说明 benchmark 不是简单拼接题目，而是在筛掉流程不可靠、证据不完整、泄漏风险高或答案不可验证的样本。

附录里还给了工具和仿真器类别，例如作物水分和农业生产、灾害风险与暴露、建筑能耗和热不适、道路网络扰动、人类健康暴露响应等。外部方法来源包括 FAO AquaCrop、DSSAT、CLIMADA、EnergyPlus、SUMO、UTCI、EPA BenMAP-CE 和 OpenStreetMap 许可说明。这些不是遥感视觉 benchmark 常见的内容，但正是地理智能体需要面对的工作流生态。

需要注意的是，TerraBench 不是一个纯遥感图像 benchmark。它不会直接告诉我们哪个分割模型在 LoveDA 或 SpaceNet 上更强。它测的是 Earth-system agent 是否能把遥感和地理数据作为证据源，接入科学工具并产出可验证结论。对遥感 AI 来说，这反而是一个很好的上层评测：基础模型的输出最终要被纳入这种决策链。

## 实验

论文的实验结论比较冷静，也比较刺痛。最强 frontier 模型 Claude Sonnet 4.6 只达到 59.2 ToolUseScore 和 22.9 Hit@tol；最强 open-weight 模型 Qwen3.5-35B 是 40.0 ToolUseScore 和 5.9 Hit@tol。换句话说，即使模型能比较像样地完成一部分工具流程，最终数值答案仍然经常落不到容差范围内。

更重要的是失败来源。论文指出差距主要来自 argument 和 numeric grounding failures，而不是简单的 tool selection errors；超过 84% 的数值答案在所有模型上都超出可接受误差范围。这是地球科学智能体最核心的问题：模型知道该调用哪个工具，不代表它知道该给工具什么参数。

举例来说，遥感/地理任务里的参数错误可能非常隐蔽。模型可能选择了正确的降雨工具，却用了错误时间窗口；选择了正确行政区，却没有处理边界投影；读取了正确影像，却把像元分辨率、单位或 nodata 当成普通数值；调用了正确仿真器，却漏掉基线情景或阈值定义。最终答案看起来有数字，但科学含义已经偏了。

这和普通 VLM 幻觉不同。VLM 幻觉常表现为“图里没有却说有”；TerraBench 暴露的是 workflow hallucination：每一步看上去都合理，但组合起来并不构成可信计算。对遥感大数据系统，这种错误比普通描述错误更危险，因为它可能被包装成可执行分析报告。

## 亮点

第一，它把遥感/地球科学智能体评测从“会不会用工具”推进到“用工具是否产生可验证科学结果”。这比简单 API benchmark 更有判别力，因为真实工作流里最难的是参数化、容差和证据链。

第二，它同时评估过程和答案。ToolUseScore 能定位工具调用层面的失败，Hit@tol / NumScore 能定位数值结果是否落在可接受范围内。这个拆分对研究很有用，因为可以区分“流程错了”和“流程对但数值不稳”。

第三，它覆盖多源地理数据和科学仿真。遥感影像只是其中一种输入，模型还要处理格网物理量、GIS、外部文档和模拟器。这更接近环境监测、灾害响应、农业和基础设施分析的真实形态。

第四，它强调 provenance 和 trace acceptance。论文把 workflow fidelity、provenance support、leakage control、schema compliance、tolerance validity、trace honesty 等放进审查标准。这些词看起来工程化，但正是遥感 AI 进入实际系统前最缺的质量门槛。

第五，它给开源模型留下了明确突破口。当前开源模型在最终数值准确性上很弱，但问题不一定只能靠更大模型解决。参数校验器、单位检查器、坐标验证器、数据血缘记录、工具调用计划器和执行后审计器，都可能显著改善结果。

## 不足

第一，TerraBench 更偏 Earth-system agent，不是专门为遥感视觉基础模型设计。它对分割、检测、变化检测、开放词表 mapping 的直接指导有限，需要我们主动把遥感模型输出接到 agent 工具链里。

第二，benchmark 的任务虽然复杂，但仍是封闭集合。真实地球科学工作流会遇到更多数据缺失、API 变更、权限限制、区域外语言描述、传感器产品差异和机构规范，这些可能比论文环境更难。

第三，自动评测依赖容差和 reference answer。对很多遥感应用，正确答案本身并不唯一，例如灾害风险、生态退化、非法采矿证据、城市热暴露和农情判断往往有专家争议。后续需要把不确定性和多专家一致性纳入评测。

第四，模型失败分析仍需要和具体工具栈绑定。一个模型在 TerraBench 上失败，可能是语言规划错、工具说明没读懂、参数格式错、单位错、坐标错、或执行环境反馈不足。要转成方法论文，还需要把这些错误进一步细分成可干预模块。

第五，它对视觉模型本身的诊断较弱。如果 agent 的输入影像理解本来就错，TerraBench 更可能看到最终数值错，却不一定能分辨是视觉 encoder、地理处理还是仿真参数导致的失败。遥感 VLM 扩展版需要加入视觉证据定位和图像中间变量检查。

## 启发

一个可做的小论文方向是：**面向遥感大数据的可审计工具调用智能体**。核心问题不是训练一个更会聊天的地理助手，而是让它在使用遥感、GIS 和环境工具时，自动检查参数、单位、坐标和证据来源，降低“流程看似正确但数值错误”的风险。

假设是：在 geospatial agent 中加入显式 provenance schema、argument verifier 和 unit/CRS checker，可以比单纯 prompt engineering 更显著提高 Hit@tol，同时不明显降低工具调用成功率。方法上可以把 agent 输出拆成三层：任务计划、工具参数、证据产物。每次工具执行前，verifier 检查空间范围、时间窗口、单位、投影、nodata、分辨率和数据源；执行后再检查输出是否和问题、文档和前一步 artifact 对齐。

数据可以从 TerraBench 的开源任务开始，再构造一个遥感子集：洪水暴露、城市热风险、作物水分压力、建筑能耗 proxy、道路中断、土地覆盖统计。输入数据优先用 Sentinel-2 / Landsat 光学产品、OpenStreetMap、ERA5、CHIRPS、WorldPop、行政区边界和公开环境指标。指标包括 ToolUseScore、Hit@tol、NumScore、参数错误率、单位错误率、CRS 错误率、artifact completeness 和人工审计通过率。

基线可以设为普通 ReAct agent、ReAct + 工具说明增强、ReAct + CoT、ReAct + verifier、ReAct + verifier + artifact provenance。最小实验不需要很大：选 50-100 个地理分析任务，每个任务固定数据源和 reference answer，对比加入 verifier 前后数值命中率和错误类型变化。只要能证明参数/单位/坐标类错误显著下降，就有清晰贡献。

一个可直接用于实验的 prompt 是：

```text
你是遥感与地球科学工具调用审查员。给定用户问题、可用工具说明、当前执行计划和上一轮 artifact，请不要直接运行下一步。先输出一份参数审查表：1) 空间范围及 CRS 是否明确；2) 时间窗口是否与问题一致；3) 输入数据源、分辨率和单位是否匹配；4) nodata、云、缺测或掩膜是否需要处理；5) 工具参数是否能从问题或 artifact 中追溯；6) 输出数值的容差和验证方式。只有所有必需项通过后，才给出下一步工具调用；如果信息不足，必须请求补充或选择保守默认并标记风险。
```

这个 prompt 的目的不是让模型解释得更长，而是把地理分析中最容易被 LLM 忽略的变量提前显式化。后续可以把它变成程序化 verifier：CRS 用 GeoPandas/Rasterio 检查，单位用 schema 检查，时间窗口用 metadata 检查，artifact provenance 用 JSON-LD 或 STAC item 记录。

更进一步，可以把遥感 VLM 接进 TerraBench 风格评测。VLM 不只回答“图中哪里受灾”，而是输出可执行证据：受灾区域 mask、置信度、影像时间、云遮挡说明、与行政边界和人口栅格叠加后的暴露估计。Agent 再把这些 artifact 交给 verifier 和仿真器。这样遥感 VLM 才从图像问答组件变成地理决策系统的一环。

## 参考

- *TerraBench: Can Agents Reason Over Heterogeneous Earth-System Data?*：https://arxiv.org/abs/2606.13148
- arXiv HTML：https://arxiv.org/html/2606.13148v1
- 官方 GitHub：https://github.com/Takerdat23/TerraBench
- 对照阅读：*GeoNatureAgent Benchmark: Benchmarking LLM Agents for Environmental Geospatial Analysis Across Frontier and Open-Weight Foundation Models*：https://arxiv.org/abs/2606.12821
- OpenStreetMap：https://www.openstreetmap.org/
- EnergyPlus 文档：https://energyplus.readthedocs.io/
