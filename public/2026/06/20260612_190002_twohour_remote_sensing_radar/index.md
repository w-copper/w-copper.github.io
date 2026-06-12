# Earth-Agent：把遥感 VLM 从看图问答推进到可验证的工具推理


# Earth-Agent：把遥感 VLM 从看图问答推进到可验证的工具推理

**结论：这一轮最值得单独跟踪的是 Earth-Agent / Earth-Bench。它的价值不在于又训练了一个更会描述遥感图像的 VLM，而在于把遥感智能体的评测对象从“回答一句话”推进到“能否选择工具、传递参数、执行多步定量分析，并让推理轨迹可检查”。**

我按 2026-06-12 19:00 +08 检索公开来源，过滤了 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 项。本篇选择 ICLR 2026 Poster *Earth-Agent: Unlocking the Full Landscape of Earth Observation with Agents*。它覆盖 RGB、光谱数据和加工后的 Earth products，但核心不是雷达或 SAR；公开材料也没有把 SAR 作为主贡献。因此它符合本轮“非 SAR、优先 VLM/可落地 benchmark”的筛选条件。

这篇和已有 GeoChat、VHM、SegEarth-OV、RS-VLM benchmark 的区别很明显：它不再把遥感 VLM 主要定义为图像描述、分类、VQA 或 grounding，而是把 LLM 作为 policy，让它在 Earth observation 工具系统里做多步规划、工具调用、记忆更新和结果判断。对遥感 AI 来说，这个方向比单纯写 prompt 更值得跟踪，因为真正的 EO 任务往往需要传感器选择、时间窗口、指数计算、区域统计、模型推理和误差检查，而不是只看一张 RGB 图回答“这里有什么”。

## 背景

遥感 VLM 这两年发展很快，但主流评测仍偏向单步感知：给一张遥感图像，让模型分类、生成 caption、回答 VQA、定位目标或做开放词表分割。这类任务当然重要，但离真实 Earth observation 工作流还有距离。一个研究人员或业务人员真正要问的问题常常是：某个地区过去三个月植被是否异常下降，某次灾害前后建筑损毁是否集中在河道附近，城市热岛是否和不透水面扩张有关，或者某个产品的空间统计能否支持一个科学判断。

这些问题的难点不只是视觉识别。模型需要知道该用哪个数据源、哪个时间段、哪个空间范围、哪个指数或产品；还要能调用外部工具，处理多张影像或栅格产品，最后给出定量结果。单纯的 MLLM 即使能描述图像，也容易在这类任务上产生三类问题：凭视觉印象下结论、编造不可执行的分析步骤、无法复现中间证据。

Earth-Agent 切中的正是这个缺口。它把 EO 分析显式建模为 agentic workflow：LLM 不再直接当万能遥感模型，而是作为调度器，在工具库、专家模型和中间记忆之间循环决策。这个设定很适合遥感，因为遥感本来就是一个“数据产品 + 物理指数 + 地理统计 + 视觉模型”共同工作的领域。

## 方法

Earth-Agent 的框架被描述为 ReAct-style POMDP。直观理解是，LLM 在每一步根据目标、历史工具调用结果和当前记忆，决定下一步要调用什么工具、传什么参数、是否继续分析或给出最终答案。它不是把所有能力压进一个视觉语言模型，而是把 EO 任务拆给工具系统处理。

公开项目页显示，Earth-Agent 集成了 104 个专门工具，分为 Index、Inversion、Perception、Analysis 和 Statistics 五类。这里的设计很关键：Index 可以承接 NDVI、NDBI 等遥感指数类操作；Inversion 对应地表参数反演；Perception 负责分类、检测、分割等视觉任务；Analysis 和 Statistics 则处理空间分析和统计汇总。这样一来，VLM/LLM 的职责从“凭模型内部知识直接回答”变成“选择正确分析路径并组织证据”。

Earth-Bench 的评测也不是只看最终回答对不对。作者采用 dual-level protocol：一方面评估最终 Accuracy 和 trajectory Efficiency，另一方面逐步检查 Tool-Any-Order、Tool-In-Order、Tool-Exact-Match 和 Parameter Accuracy。这一点比普通 VQA benchmark 更扎实，因为遥感分析失败往往不是最后一句话才失败，而是早在工具选择、时间参数、空间范围、阈值设置或数据产品选择时就已经偏了。

从 CV-to-RS 的角度看，Earth-Agent 的迁移路径不是“把自然图像 VLM 直接拿来解释遥感图”。更合理的路径是借鉴通用 agent / tool-use / ReAct / MCP 思路，把遥感里的指数、栅格处理、GIS 统计、检测分割模型和产品查询封装成可调用工具，然后用可审计轨迹约束 LLM。换句话说，CV/ML 的前沿能力迁移到遥感时，最有价值的部分可能不是视觉编码器本身，而是工具化推理、轨迹评测和错误归因协议。

## 实验/数据

Earth-Bench 是这篇工作的核心数据资产。OpenReview 摘要和项目页都说明，Earth-Bench 包含 248 个专家策划任务和 13,729 张图像，覆盖 spectrum、products 和 RGB 三类 Earth observation 模态。项目页进一步说明，benchmark 支持 14 类代表性任务，包括 classification、detection、temperature monitoring、weather forecasting 等，并强调这些任务需要 quantitative reasoning，而不是定性图像描述。

数据公开性较好。官方 GitHub 已开源评测框架，Hugging Face 上也发布了 Earth-Bench 数据集，页面显示数据体量约 16.6GB。GitHub README 还给出了数据下载命令、评测入口和代码文件说明。仓库新闻记录显示，2025-10-17 发布 Earth-Bench，2026-01-26 标注 ICLR 2026 接收，2026-03-31 开源 RGB task 的在线推理专家模型代码和权重。

实验比较包括不同 LLM backbone、通用 agent 框架、以及已有遥感 MLLM。项目页给出的高层结论是：闭源 LLM 在最终准确率上更强，开源模型在工具使用准确性和推理对齐上有优势；instruction-following 能提升工具调用，但不必然提升最终准确率；模型通常能识别正确工具，但无关步骤和参数执行是 EO 数据处理的关键瓶颈。

这组结果的意义不在于某个 LLM 排名，而在于暴露了遥感 agent 的真实失败模式：工具选对不等于参数传对，步骤合理不等于最终数值可靠，能写出自然语言解释不等于能执行可复现分析。相比之下，很多遥感 VLM benchmark 只看答案文本，很难定位失败来自视觉感知、地理知识、工具调用还是数值计算。

## 亮点

第一，问题设定更接近真实 EO 工作流。Earth-Agent 不满足于 RGB 单图问答，而是把 spectrum、products、RGB 和工具调用放在一个统一框架里。这比“再构造一批遥感图文问答”更有前沿信号，因为遥感应用的难点本来就常在跨产品、跨时间和定量分析。

第二，评测协议能诊断轨迹。Tool-Any-Order、Tool-In-Order、Tool-Exact-Match、Parameter Accuracy 这些指标，可以把错误拆到工具选择、顺序、精确匹配和参数层面。后续做遥感 agent 或 VLM 时，可以直接沿用这种思想，不必只报告最终 accuracy。

第三，工程可复现性相对强。官方 GitHub、项目页、OpenReview、arXiv 和 Hugging Face 数据集都公开存在。虽然完整跑通仍需要模型 API、依赖配置和较大的数据下载，但它至少提供了比“只发论文不发代码”的工作更清晰的复现实验入口。

第四，它给 VLM 找到了更稳的位置。VLM 不必被迫承担所有任务；它可以负责目标识别、局部视觉证据、grounding 或中间结果解释，而时序统计、指数计算和空间分析交给工具。这个职责划分更符合遥感系统工程。

## 不足

第一，工具库设计会强烈影响结果。Earth-Agent 的能力边界不是 LLM 本身决定的，而是由 104 个工具、工具文档、参数 schema、专家模型质量和数据覆盖共同决定。如果工具库换一套，性能和失败模式可能变化很大。因此它更像“系统 benchmark”，不是纯模型 benchmark。

第二，benchmark 规模仍有限。248 个专家任务和 13K 图像已经比许多 EO agent 评测更扎实，但对于全球遥感任务空间仍然很小。不同国家、不同地表类型、不同传感器产品、不同季节和灾害类型，都可能带来新的工具选择和参数错误。

第三，数据下载和运行成本不低。Hugging Face 页面显示数据约 16.6GB，项目运行还需要配置模型 API 或开源模型环境。对普通研究者来说，复现实验门槛高于传统分类/分割 benchmark。

第四，不能把它误读成“prompt 工程解决遥感”。Earth-Agent 的关键不是写一段更聪明的 prompt，而是把任务拆成可执行工具、可检查参数、可复现轨迹和可量化输出。如果后续工作只是在通用 VLM 上包装提示词，而没有数据产品、工具接口和轨迹评测，贡献会很弱。

第五，科学可靠性仍要进一步验证。EO 分析常涉及物理意义、传感器误差、云污染、时空采样偏差和产品不确定性。agent 最终给出一个数字，并不代表这个数字在科学上可用。未来需要把不确定性传播、数据质量标记、传感器适用范围和人工审查机制加入评测。

## 启发

一个可做的小论文方向是：**面向光学遥感变化理解的可审计 VLM-Agent Benchmark**。不要直接让 VLM 回答“哪里发生了变化”，而是构造一个要求多步证据的 benchmark：先选择双时相影像或公开产品，再调用变化候选检测、指数差异、建筑/道路/水体 mask、空间统计和可视化工具，最后给出变化类型、位置、置信度和证据链。

最小实验可以从建筑变化、水体变化和城市扩张三类任务开始。数据集可选 LEVIR-CD、WHU-CD、DSIFN-CD、Dynamic World、ESA WorldCover、Google Open Buildings、Microsoft Building Footprints 和部分公开灾害影像。工具库不必一开始做得很大，只需包含双时相配准检查、基础指数计算、SAM/GeoFM 候选 mask、变化检测 baseline、矢量叠加和区域统计。

评测指标应分两层。最终层看 change/no-change accuracy、IoU、F1、变化面积误差、位置误差和拒答正确率；轨迹层看工具选择准确率、参数准确率、是否使用了正确时相、是否引用了有效 mask、是否产生不可执行步骤、是否能在证据不足时拒答。这样可以避免 VLM 用流畅文字掩盖错误分析。

基线可以包括三类：直接 VLM 问答，传统变化检测模型加规则统计，Earth-Agent-style tool-use agent。真正的贡献点在于错误归因：当系统答错时，能区分是视觉模型没找到变化、工具参数错了、空间统计错了，还是 LLM 解释错了。这对遥感 AI 落地很重要，因为业务系统需要知道该修模型、修工具、修数据，还是修提示和评测协议。

进一步可以把 human-in-the-loop 加进去。agent 对高不确定区域不直接下结论，而是生成审核队列：哪些 tile 需要人看，哪些变化候选缺少证据，哪些工具输出互相冲突。这样 VLM 的作用就不是“替代专家”，而是压缩专家审查空间并保留审计路径。这个方向比单纯追求一个更大的遥感 MLLM 更容易形成可验证、可复现、可发表的研究贡献。

## 参考

- arXiv: *Earth-Agent: Unlocking the Full Landscape of Earth Observation with Agents*：https://arxiv.org/abs/2509.23141
- OpenReview ICLR 2026 页面：https://openreview.net/forum?id=dkIXAbWuxO
- 官方 GitHub：https://github.com/opendatalab/Earth-Agent
- 项目主页：https://opendatalab.github.io/Earth-Agent/
- Earth-Bench Hugging Face 数据集：https://huggingface.co/datasets/Sssunset/Earth-Bench
- 对照阅读：*Towards LLM Agents for Earth Observation*：https://arxiv.org/abs/2504.12110

