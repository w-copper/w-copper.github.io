# 过去 24 小时遥感 AI 雷达：VLM 要看对区域，GeoFM 要接对任务，TTA 要有证据


# 过去 24 小时遥感 AI 雷达：VLM 要看对区域，GeoFM 要接对任务，TTA 要有证据

**结论：过去 24 小时最强信号不是单个遥感 SOTA，而是几条方法线正在合到一起。** 第一，Gaze Heads 说明 VLM 的区域描述可以被少数 attention heads 追踪和干预，这给遥感 VQA、开放词汇分割和变化解释提供了“看没看对区域”的可审计机制。第二，TTABC 把 CLIP/VLM 的 test-time adaptation 从刷榜拉回到证据、代理目标和 shift 类型的受控比较，对跨城市、跨季节、跨 GSD 遥感部署很关键。第三，Clay-CNN Hybrids 和 AI4Land 提醒我们，GeoFM 不一定要替代 U-Net 或业务管线，很多时候更适合作为上下文、先验和全球尺度生产系统的一部分。第四，RATS、Adaptive Visual Token Selection 和 OmniVideo-100K 这类 CV/ML 新工作分别给出 part-level token、层级 token 选择、结构化 evidence chain 的迁移路径。今天最值得做的研究方向是：**把 box/mask prompt 作为空间锚点，用 gaze/head steering 约束 VLM 看哪里，再用 CLIP/GeoFM 的轻量 TTA 校准目标域类别、边界和置信度，最终输出 mask/polygon、证据区域、置信度和人工复核优先级。**

我按 2026-06-16 09:00:02 +08:00 回看公开来源，重点检查 arXiv cs.CV 2026-06-15 recent 批次和近 3 个月内仍在形成趋势的 GeoFM/VLM/TTA 工作。本篇过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 主线；若论文来自通用 CV/ML，我只保留能明确迁移到光学、多光谱、VHR、UAV 或地理大数据任务的部分。

## 今日 6 个重点

| 排名 | 论文/项目 | 来源时间 | 任务 | 遥感迁移点 | 代码/数据 | 分数 |
|---|---|---:|---|---|---|---:|
| 1 | Gaze Heads: How VLMs Look at What They Describe | arXiv cs.CV recent, 2026-06-15；v1 2026-06-12 | VLM 区域描述机制 | 用 attention heads 判断 VLM 是否看向 box/mask/polygon 指定区域，并在推理时重定向 | 项目页、GitHub、HF 数据集公开 | 8.8 |
| 2 | What Drives Test-Time Adaptation for CLIP? / TTABC | arXiv, 2026-06-12 | CLIP/VLM 测试时适配基准 | 给遥感跨域 TTA 提供受控协议：不同 shift 下更新 prompt、prototype、adapter 不能混为一谈 | 论文称 benchmark 开源 | 8.4 |
| 3 | Clay-CNN Hybrids | arXiv, 2026-06-12 | GeoFM + U-Net 滑坡分割 | GeoFM 不替代密集预测网络，而是作为 bottleneck/context 改善少数类灾害制图 | GitHub/Notebook 公开 | 8.2 |
| 4 | AI4Land | arXiv v2, 2026-06-11 | 全球 1 km 土地利用重建 | 遥感 AI 走向全球数据产品：防空间泄漏、HPC I/O、Zarr/NetCDF、少数类可靠性 | 论文承诺 open-source emulators，仓库需继续跟踪 | 7.9 |
| 5 | RATS! Patches Talk Through Registers | arXiv cs.CV recent, 2026-06-15 | ViT part discovery | register token bottleneck 可迁移到遥感小目标、建筑部件、道路拓扑和地块组件发现 | 搜索结果显示 code signal，需核验仓库 | 7.6 |
| 6 | Adaptive Layer-wise Visual Token Selection in LVLMs | arXiv, 2026-06-12；CVPR 2026 highlight | LVLM 高效推理 | 大幅遥感图像不能盲目裁 token；不同层需要不同视觉证据，适合 tile/region 风险感知推理 | 论文公开 | 7.5 |

## 背景

遥感 VLM 过去半年很容易走向两个极端：一端是做更大的 instruction tuning 数据，另一端是把通用 VLM 直接接到遥感图上做问答、caption 或 grounding。问题在于，大幅遥感影像里“答对”不等于“看对”。模型可能根据周边道路、城市纹理或训练集先验猜出类别，却没有真正关注用户圈出的地块；也可能给出边界漂亮的 mask，但语义对象错了。

GeoFM 也有类似问题。Prithvi、Clay、SatMAE、DOFA、AnySat、TESSERA 等模型越来越多，但真实任务并不总需要“替换主干”。灾害分割、土地利用重建、开放词汇制图和变化检测往往更需要把基础模型的上下文能力、空间先验和不确定性接到已有强管线里。

所以今天的关键不是再问“哪个模型最大”，而是问：VLM 是否真的看向证据区域，GeoFM 是否接在任务最需要的位置，TTA 是否在目标域证据足够可靠时才更新。

## 问题

如果把这几条线合在一起，遥感 AI 现在有 4 个明确缺口。

1. **区域证据缺口。** 遥感 VQA、caption、grounding 和 open-vocabulary segmentation 很少报告生成回答时视觉注意力是否落在目标 box/mask/polygon 上。
2. **测试时适配缺口。** 很多跨域实验只说用了 TTA，却没有拆清楚更新的是 prompt、prototype、adapter、normalization 还是伪标签筛选。
3. **GeoFM 接入缺口。** Foundation model 常被当作 backbone 替代品，但 Clay-CNN Hybrids 这类结果说明，作为辅助上下文可能更稳。
4. **生产证据缺口。** AI4Land 这类全球产品需要空间防泄漏、年度 rollout、HPC 推理和格式可耦合；普通 benchmark 分数不足以说明可部署。

## 数据/评价

最小可行评价不应该再只看 mIoU、F1 或 VQA accuracy。对 box/mask prompt + TTA 的遥感系统，建议至少加 6 组指标。

- **区域命中率：** VLM 生成关键 tokens 时，gaze heads 或视觉 attention 在目标区域 token 上的质量。
- **语义正确性：** open-vocabulary 类别、属性、变化类型是否和人工标注或高置信外部工具一致。
- **边界质量：** mask IoU、boundary F-score、polygon Hausdorff distance、面积误差。
- **跨域鲁棒性：** train-on-city-A test-on-city-B、跨季节、跨 GSD、跨传感器光学/多光谱设置下的性能下降。
- **校准质量：** ECE、Brier score、risk-coverage curve、人工复核 budget 下的召回率。
- **过程证据：** 输出是否包含 tile 坐标、box/mask/polygon、时间戳、CRS、候选模型分歧和失败类型。

适合第一轮实验的数据集包括 LoveDA、OpenEarthMap、SpaceNet、DOTA/DIOR、LEVIR-CD/WHU-CD 光学变化检测、Landslide4Sense，以及自建少量 box/mask prompt 审计集。若做土地利用或生态应用，可以接 BigEarthNet、ESA WorldCover、HILDA+、LUH2、OSM 和行政区/地块矢量数据。

## 方法

我建议把系统拆成 5 个模块，而不是写成一个黑箱大模型。

1. **候选区域生成。** 用 SAM/RemoteSAM/GeoSAM、已有检测器、变化检测模型、OSM/地块 polygon 或人工 box prompt 生成候选区域。
2. **区域可控 VLM。** 用 Gaze Heads 类方法发现遥感 VLM 或通用 VLM 中的 region-tracking heads，把用户 box/mask/polygon 转成 image token set，在推理时加入 attention bias。
3. **语义筛选。** 用 CLIP/RemoteCLIP/GeoRSCLIP/GeoFM embedding 计算文本类别、区域 crop、mask 内像素和上下文之间的一致性。
4. **轻量 TTA。** 参考 TTABC 的受控范式，只更新 prompt token、prototype、adapter 或 normalization 中的一类；更新触发条件由 mask 稳定性、跨增强一致性和 GIS 先验共同决定。
5. **证据输出。** 输出 mask/polygon、类别、置信度、gaze/attention 命中率、跨模型分歧、人工复核优先级和失败标签。

这里的关键约束是：TTA 不应该在所有 tile 上盲目更新。只有当候选 mask 在多尺度增强、相邻 tile、GIS 先验和文本相似度上都足够稳定时，才允许把它作为目标域证据；否则应该进入人工复核队列。

## 实验

一个 2-3 周能启动的最小实验如下。

1. **任务：** LoveDA rural-to-urban / urban-to-rural 开放词汇语义分割，另加 SpaceNet 跨城市建筑提取。
2. **输入：** 每张图给 20-50 个 box prompt 或 SAM 候选 mask，类别文本使用道路、建筑、水体、裸地、农田、林地等常见类。
3. **对比：** source-only、box prompt only、box prompt + VLM region steering、box prompt + CLIP TTA、box prompt + region steering + CLIP/GeoFM TTA。
4. **消融：** 是否使用 gaze/head steering、是否使用 GIS 先验、TTA 更新 prompt/prototype/adapter 的差异、伪标签置信阈值。
5. **指标：** mIoU、boundary F-score、ECE、区域命中率、跨域性能下降、人工复核 top-k recall、每平方公里推理成本。

如果要把实验扩展到变化检测，可以让 t1/t2 的 changed blob 作为 mask prompt，要求 VLM 输出“新增、拆除、扩建、季节变化、阴影/配准误差”。这时 gaze/head trajectory 应该在生成变化词时分别落到 t1 和 t2 的对应区域，而不是只看变化后图像。

## 亮点

这条研究线有 5 个优点。

第一，它把 VLM 的遥感回答绑定到空间证据。Gaze Heads 不保证语义一定正确，但能把“模型是否看对区域”变成可记录、可干预、可失败分析的变量。

第二，它让 TTA 更可控。TTABC 的结论提醒我们，没有一种 TTA 范式适合所有 shift；遥感里城市、季节、GSD、传感器和 taxonomy shift 也必须分开测。

第三，它尊重遥感密集预测的局部结构。Clay-CNN Hybrids 的负结果很重要：GeoFM-only 低于 U-Net 不代表基础模型没用，而是说明 skip connection、局部纹理和边界 decoder 仍然关键。

第四，它能连接基础模型和实际生产。AI4Land 说明全球遥感 AI 产品的难点不只是模型，还包括数据对齐、空间防泄漏、分布式训练、拼接推理和可耦合输出。

第五，它适合投稿。它不是单纯拼模型，而是有明确问题、机制变量、评价指标和负结果空间：区域 grounding、TTA 触发条件、GeoFM 接入位置、人工复核成本都可以做成扎实 ablation。

## 不足

第一，Gaze Heads、RATS、Adaptive Token Selection 和 OmniVideo-100K 都是通用 CV/ML 工作，不是遥感论文。迁移到遥感前，不能直接引用其自然图像、漫画或视频结果作为遥感性能证明。

第二，attention steering 依赖可访问模型内部 attention。闭源 VLM 或部分高效推理框架可能无法注入 pre-softmax bias；开源模型也可能需要改 attention kernel。

第三，小目标仍然困难。遥感车辆、小船、光伏板、窄路和小建筑在 image token 网格里占比很低，box/mask prompt 不一定能给足可控 token。

第四，TTA 有伪标签失控风险。目标域如果存在云雾、阴影、季节差异、配准误差或类别缺失，轻量更新也可能把错误放大。

第五，GIS 先验会带来偏置。OSM、地块、道路和建筑 footprint 不完整时，系统可能把地图缺失误判为影像变化，或者把旧地图当成真值。

## 启发

可以把今天的方向写成一个具体题目：**Evidence-Anchored Test-Time Adaptation for Remote Sensing VLM Segmentation**。

**问题：** 遥感开放词汇分割和区域问答在跨城市、跨季节、跨 GSD 场景中容易看错区域、类别漂移和置信度过高。

**假设：** box/mask prompt 能提供空间锚点；gaze/head steering 能约束 VLM 的视觉证据来源；CLIP/GeoFM 的轻量 TTA 能在稳定候选区域上校准目标域语义。三者结合比单独 prompt、单独 TTA 或单独 SAM 后处理更稳。

**方法：** 候选 mask 由 SAM/GeoSAM 或人工 box 产生；VLM attention 被引导到目标区域；RemoteCLIP/GeoRSCLIP/GeoFM embedding 负责类别和上下文一致性；TTA 只更新 prompt/prototype/adapter 中一类；GIS 先验只作为弱约束，不作为硬真值。

**数据与指标：** LoveDA、OpenEarthMap、SpaceNet、DOTA/DIOR、LEVIR-CD/WHU-CD。指标为 mIoU、F1、boundary F-score、ECE、region-hit rate、risk-coverage、人工复核 top-k recall 和推理成本。

**最小反证实验：** 在 LoveDA 上只用 20-50 个人工 box prompt，比较 `source-only`、`box prompt`、`box prompt + gaze steering`、`box prompt + TTA`、`box prompt + gaze steering + TTA`。如果最后一组不能同时降低 ECE、提高跨域 mIoU/F1、减少明显跑题回答，这条路线就需要重审。

可直接用于系统审计的 prompt：

```text
你是遥感开放词汇分割与区域问答审计器。
给定光学/多光谱遥感影像、文本类别、box/mask prompt、候选 mask、VLM 回答和模型置信度，请判断该输出是否可用于制图或需要人工复核。

必须检查：
1. 目标区域是否真的被模型关注；若 attention/gaze 主要落在 box/mask 外，标记为 region-grounding-failure。
2. 类别是否可能出现在该区域；若文本类别不存在或证据不足，不允许强行分割。
3. mask 是否覆盖完整对象，而不是阴影、纹理、裸土、屋顶碎片或相邻背景。
4. 多尺度增强、相邻 tile 和不同候选模型的边界是否一致。
5. 面积、形状、长宽比和空间关系是否符合 GIS/地理常识；GIS 只能作为弱证据，不能覆盖影像证据。
6. 若为双时相任务，必须区分真实变化、季节差异、阴影、云雾、配准误差和分辨率差异。
7. 若 TTA 使用了伪标签，必须说明伪标签来源、筛选阈值、更新参数类型和可能的错误放大风险。

输出：
- 结论：accept / review / reject
- 主要证据区域：box/mask/polygon id
- 置信度与校准风险
- 最大失败原因：最多 3 条
- 人工复核优先级：high / medium / low
```

## 今日判断

遥感 AI 的短期机会不在“再造一个万能 VLM”，而在把视觉证据链做硬：用户给 box/mask，模型必须看向该区域；模型做 TTA，必须说明用的是什么目标域证据；GeoFM 接入任务，必须比较 backbone 替换、上下文注入和 decoder 先验三种位置；输出地图，必须带置信度、失败类型和复核优先级。

如果要选一条最值得投入的线，我会选 **box/mask prompt + gaze steering + CLIP/GeoFM TTA**。它能同时连接 VLM grounding、开放词汇分割、跨域泛化、GeoFM 表征和人工复核成本，且第一轮实验可以在公开数据上快速完成。

## 参考来源

- arXiv cs.CV recent, Mon 15 Jun 2026. https://arxiv.org/list/cs.CV/recent
- Gaze Heads: How VLMs Look at What They Describe. https://arxiv.org/abs/2606.14703
- Gaze Heads project page. https://gaze.baulab.info/
- Gaze Heads GitHub. https://github.com/rohitgandikota/gaze-heads
- OmniVideo-100K: A Dataset for Audio-Visual Reasoning through Structured Scripts and Evidence Chains. https://arxiv.org/abs/2606.14702
- RATS! Patches Talk Through Registers: Emergent Parts in Register Attention Transformers. https://arxiv.org/abs/2606.14701
- What Drives Test-Time Adaptation for CLIP? A Controlled Empirical Study from an Update Perspective. https://arxiv.org/abs/2606.14299
- Adaptive Layer-wise Visual Token Selection in LVLMs. https://arxiv.org/abs/2606.14277
- Clay-CNN Hybrids: Leveraging Geo-Foundational Models as Auxiliary Context for Landslide Detection. https://arxiv.org/abs/2606.14081
- Clay-CNN Hybrids code. https://github.com/binhhuongvu/gfm-landslide-segmentation
- AI4Land: Scalable Deep Learning for Global High-Resolution Land Use Reconstruction. https://arxiv.org/abs/2606.11793
- Clay Foundation Model. https://clay-foundation.github.io/model/
- LoveDA dataset. https://github.com/Junjue-Wang/LoveDA
- OpenEarthMap. https://open-earth-map.org/
- SpaceNet. https://spacenet.ai/

