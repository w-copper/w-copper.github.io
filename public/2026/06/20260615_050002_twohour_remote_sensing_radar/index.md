# Stateful Visual Encoders：把跨图比较前移到视觉端，遥感 VLM 才能记住变化


# Stateful Visual Encoders：把跨图比较前移到视觉端，遥感 VLM 才能记住变化

**结论：这一轮最值得单独跟踪的是 2026-06-03 的 *Stateful Visual Encoders for Vision-Language Models*。它不是遥感专用论文，但它把“多图比较”从语言侧前移到视觉编码器侧，正好击中遥感里最常见的痛点：双时相变化往往很小，语义又很接近，如果视觉表征先被独立编码，真正关键的差异会在进语言模型之前就被稀释掉。更重要的是，这篇工作在遥感上不是只做概念推断，而是直接在 LEVIR-CC 上验证了收益。**

我按 2026-06-15 05:00 +08 检索公开来源，并优先保留有代码/项目页、且能明确转移到遥感任务的 CV 工作。这个条目比纯遥感专用论文更像“可迁移方法”：它不依赖 SAR、PolSAR 或 InSAR，主线是 open-weight VLM 的跨图比较能力，适合迁移到遥感变化描述、时序问答、细粒度差分审计和人工复核队列。

## 背景

遥感里的很多任务，本质都不是单图识别，而是“比较”。变化描述要回答哪里变了、变成什么；时序问答要判断两期影像里的差异是否成立；人工审核要区分真实变化、阴影、配准误差和纹理扰动。问题在于，现有很多 VLM 的比较方式发生在语言模型里，而视觉编码器仍然是逐张独立处理图像。

这对遥感很不友好。双时相影像里，真实变化常常只占很小一部分像素，建筑新增、道路延伸、农田轮作、灾后破坏都可能被大背景淹没。如果没有跨图上下文，视觉侧更容易把“小变化”当成噪声。等信息到语言模型时，能剩下的证据已经不够稳定。

所以这篇工作的核心不是“再做一个更大的 VLM”，而是把状态直接塞进视觉编码器，让当前图像的表示能看到前一张图像的特征。这和遥感变化检测、变化 captioning、以及多时相 VLM 的需求是对齐的。

## 方法

作者提出 Stateful Visual Encoder (SVE)，把视觉编码器从 stateless 变成 stateful。简单说，编码第 `t` 张图时，不再只看本图，而是同时参考前一张图的视觉特征。

论文比较了四种设计：Self-Ext、AdaLN-Zero、Cross 和 Cross+FFN。结果最稳的是 Cross+FFN，也就是当前图像 token 通过 cross-attention 去读取前一时相的视觉上下文，再接一个 FFN 做重整。

这套设计里有几个细节很关键：

1. `weight cloning`，把预训练块里的 Q/K/V 和部分 FFN 权重复制过来，减少训练初期的不稳定。
2. `zero-init outputs`，让新增分支一开始不会破坏原有特征分布。
3. `stop-gradient` 处理前一图像分支，把它当成稳定上下文，而不是一起乱漂。
4. 给 cross-attention 加 positional information，并提供 first-image 的 fallback，保证多图输入时行为一致。

这套 recipe 的意义在于：它不是靠堆参数“硬记住变化”，而是把变化比较这件事变成视觉表征的一部分。对遥感来说，这比只在 prompt 里要求模型“比较两张图”更接近实际需求。

## 实验

这篇工作先在受控对比任务上证明，SVE 对跨图空间聚合、多目标差异识别和轨迹行为克隆都有效，而且在不同分辨率、不同模型大小、不同 VLM backbone 上都能稳定工作。

更值得看的是现实任务。作者明确在 longitudinal radiology、fine-grained image comparison 和 remote sensing 上做了验证。遥感部分主要落在 LEVIR-CC 的 change captioning 上，SVE 让通用 VLM 基线不再只是“能说”，而是更会抓变化细节。

从项目页给出的 LEVIR-CC 结果看，`Qwen3.5-4B (SFT)` 的 CIDEr 为 `142.26`，加入 SVE 后提升到 `144.35`，`S_m*` 也从 `79.60` 提到 `80.46`。这说明收益不只是单一指标上的波动，而是整体描述质量和变化一致性都在变好。

更重要的是，作者强调 SVE 在遥感上可以和 specialist 模型竞争，甚至在某些设置下超过它们。这一点很有价值，因为遥感变化描述长期被专门的 captioning 模型占着，但这类模型通常比较脆，迁移到新城市、新传感器或更复杂时序时会掉得很快。

## 亮点

第一，它把“视觉比较”从语言侧挪回了视觉侧。对遥感来说，这几乎是对症下药，因为变化证据本来就先体现在像素和局部结构上。

第二，它证明了通用 CV 方法可以直接为遥感服务，不一定要先做成遥感专用架构。只要任务定义足够清楚，改的是比较机制，不是换个名字。

第三，它对遥感 VLM 的启发很具体：变化 captioning、双时相 VQA、变化审计、人工复核排序，都可以用这种 stateful encoder 做前端证据提取。

第四，它比单纯的 prompt engineering 更稳。prompt 能要求模型比较，但不能保证视觉证据没有先被冲掉；stateful encoder 则直接改变证据进入语言模型之前的表示方式。

## 不足

第一，这仍然不是遥感专用方法，没有显式加入地理先验、空间拓扑或 GIS 约束。对建筑轮廓、道路、地块这类结构化对象，后面还得接矢量化或对象级约束。

第二，LEVIR-CC 仍然是经典基准，不等于真实部署。跨城市、跨年份、跨分辨率、跨传感器的稳定性还需要进一步验证。

第三，它提升的是比较能力，不是完整的遥感理解栈。要做成可用系统，还得配合 change proposal、区域定位、置信度校准和不确定性解释。

## 启发

如果把这条线继续往遥感方向推，我会把它放到“变化证据抽取器”而不是最终生成器的位置。也就是先用 SVE 类结构压住跨图比较里的信息损失，再让更上层的 VLM 或 Agent 做解释、归因和审核。

一个可行的小题目是：**stateful encoder + change audit head**。输入两期影像，先输出候选变化区域、差异类型和置信度，再让语言模型只负责说明“这里更像真实变化，还是阴影/配准/季节扰动”。这样可以把 captioning、VQA 和 change detection 连成一条链。

可直接复用的提示词可以写成：

```text
你是遥感双时相变化审计器。
给定 T1/T2 影像和候选变化区域，请先判断是否存在真实变化，再解释变化证据来自哪里。
必须区分真实变化、阴影、配准误差、季节差异和纹理扰动。
如果证据不足，输出不确定，并说明还需要哪类辅助信息。
不要只给一句描述，要同时给出区域、原因、置信度和人工复核优先级。
```

这条路线的价值不在于让 VLM 替代变化检测，而在于让它学会看懂变化证据。对遥感来说，这比单纯会描述图片更接近真实业务。

## 参考

- [Stateful Visual Encoders for Vision-Language Models](https://arxiv.org/abs/2606.04433)
- [Project page](https://statefulvisualencoders.github.io/)
- [LEVIR-CC Dataset](https://github.com/Chen-Yang-Liu/LEVIR-CC-Dataset)
- [Stateful Visual Encoders code and data notes](https://github.com/StatefulVisualEncoders/StatefulVisualEncoders/blob/main/docs/DATA.md)

