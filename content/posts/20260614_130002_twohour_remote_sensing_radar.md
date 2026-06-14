---
title: "RSKT-Seg：开放词表遥感分割需要自己的 benchmark"
date: "2026-06-14T13:00:02+08:00"
tags: ["开放词表", "VLM", "语义分割", "OVRSIS", "RemoteCLIP", "benchmark"]
mode: "twohour"
categories: ["可提示分割、开放词表与密集预测"]
draft: false
---

# RSKT-Seg：开放词表遥感分割需要自己的 benchmark

**结论：这一轮最值得单独跟踪的是 *RSKT-Seg: Remote Sensing Knowledge Transfer for Open-Vocabulary Semantic Segmentation*。它的价值不只是提出一个开放词表遥感语义分割模型，而是把问题拆成了三件更基础的事：遥感类别名称太粗，通用视觉语言模型容易被自然图像语义带偏；遥感图像中的尺度、纹理和俯视视角会削弱 CLIP 类文本对齐；现有遥感分割数据集本来就不是为“见过类/未见类”泛化评测设计的。因此 RSKT-Seg 同时给出知识迁移方法和 OVRSISBench，把开放词表遥感分割从 demo 推向可比较 benchmark。**

我按 2026-06-14 13:00 +08 检索公开来源，过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 和 SAR-optical fusion 主线。本篇选择 2025-09-16 提交 arXiv、2026-06-10 更新 v2 的 RSKT-Seg。论文和 arXiv HTML 已公开；官方 GitHub 仓库标注为 AAAI 2026 Oral，并提供代码、预训练权重、OVRSISBench 数据集说明和训练/评测配置。该工作面向光学遥感语义分割和开放词表迁移，不属于雷达方向。

这篇适合放进“可提示分割、开放词表与密集预测”。原因是它不满足于让 SAM 或 CLIP 在遥感图上跑一个零样本例子，而是直面开放词表语义分割的评测协议：哪些类别是 base，哪些类别是 novel，文本类别名如何构造，遥感知识如何注入，最后如何在多个公开数据集上比较未见类 mIoU。

## 背景

开放词表分割在自然图像里已经形成一套常见路线：用 CLIP 或 VLM 建立图像区域和文本类别的对齐，再用 mask proposal、dense decoder 或 region-text matching 给未见类做分割。遥感看上去也适合这条路线，因为很多应用场景确实不可能为每个地区、每个地物类别都重新标注。

问题是，遥感的“词表”并不等于自然图像词表。`building` 在遥感里可能是密集居民区、高层楼顶、厂房、温室或临时建筑；`road` 可能是城市道路、乡村土路、桥面、机场跑道或停车场内部通道；`bare land`、`impervious surface`、`low vegetation` 这类标签在自然图像语料里本来就弱。直接把自然图像 CLIP 类别提示搬到遥感分割，模型很容易看见纹理但对不上遥感类别体系。

另一个问题是尺度。自然图像里的对象通常有主体视角和清晰轮廓，遥感图像里的类别则常以大面积纹理、周期结构、空间上下文和地理邻接出现。一个 tile 中的“工业区”可能由屋顶、道路、裸地、阴影和车辆共同定义；一个“农田”类别可能和季节、物候、灌溉和地块边界有关。开放词表模型若只依赖一句类别名，就会把遥感语义压得太薄。

RSKT-Seg 的切口正是在这里：把通用视觉语言知识和遥感专有知识分开处理，再通过知识迁移适配开放词表语义分割。它不是简单地宣布“CLIP 可以零样本分割遥感”，而是承认自然图像预训练模型有可用的开放词表能力，同时也承认遥感需要自己的类别描述、数据协议和评测基准。

## 方法/框架

论文题名里的 RSKT 指 Remote Sensing Knowledge Transfer。公开摘要和项目说明的核心思路是：用遥感知识增强开放词表分割模型，让模型在 base classes 上学习遥感视觉-语义对应，同时保持向 novel classes 泛化的能力。

可以把它理解为三层。第一层是视觉侧的密集分割能力。模型需要从遥感图像中产生像素级或区域级表示，保留边界、纹理和局部上下文。对遥感来说，这一步不能只看对象轮廓，还要处理超大幅图像切片、尺度变化、阴影、同物异谱和异物同谱。

第二层是文本/知识侧的类别表达。开放词表分割最怕类别名过短。`tree`、`low vegetation`、`impervious surface`、`background` 这类词如果直接作为 prompt，既不够遥感，也不够可分。RSKT-Seg 的知识迁移思路可以看作是给模型补上遥感类别语义，让类别不只是一个英文词，而是带有遥感外观、空间上下文和地物属性的描述。

第三层是 base-to-novel 的迁移协议。模型不能只在训练类上分得准，还要在未见类上保持可用。这里最关键的不是单个网络模块，而是评测方式：训练时看到一部分类别，测试时要求识别另一部分类别，并报告 base、novel 和 harmonic mean。这个协议比普通全监督遥感分割更能检验“开放词表”是否真实存在。

从 CV-to-RS 迁移角度看，RSKT-Seg 借的是 CLIP/VLM 开放词表和自然图像语义对齐能力，但遥感适配点很明确：类别 prompt 要遥感化，密集预测要适应俯视纹理和尺度，benchmark 要按遥感数据集重新定义 base/novel split，不能只沿用自然图像 ADE/COCO 的评测习惯。

## 数据/benchmark

这篇最值得注意的是 OVRSISBench。官方仓库说明它面向 Open-Vocabulary Remote Sensing Image Semantic Segmentation，整合了 LoveDA、Vaihingen、Potsdam、UAVid、OpenEarthMap、iSAID 和 DeepGlobe 等数据集。这个组合覆盖城市、航空、无人机、土地覆盖、实例密集目标和高分辨率场景，比单一数据集更适合测开放词表泛化。

这里的价值在于把遥感分割数据重新组织成开放词表评测，而不是重新标一个小数据集。LoveDA 能测城市/乡村域差异，Vaihingen 和 Potsdam 是经典 ISPRS 航空语义分割，UAVid 带来低空无人机视角，OpenEarthMap 提供跨区域地表覆盖，iSAID 关注高分辨率实例密集类别，DeepGlobe 提供土地覆盖场景。不同数据源的类别定义、分辨率和标注风格并不完全一致，这正好暴露开放词表遥感分割的真实难度。

当然，这种 benchmark 也会带来协议风险。多个数据集拼接后，类别映射、ignore 标签、分辨率差异、切片策略、训练/测试城市划分都会影响结果。开放词表评测尤其要避免“novel 类其实通过同义词或相邻类别泄漏进训练 prompt”的问题。后续使用 OVRSISBench 时，最好把类别拆分、文本模板、数据预处理和评测脚本固定下来，否则不同论文的 novel mIoU 很难横向比较。

## 实验

论文在摘要中报告，RSKT-Seg 在 OVRSISBench 上相比既有方法取得明显提升：novel mIoU 提升 18.98，harmonic mean 提升 7.15。这两个指标比单看 overall mIoU 更有意义，因为开放词表方法真正要证明的是未见类能力，而不是把训练类刷高。

novel mIoU 的提升说明遥感知识迁移确实帮助模型把未见类别和图像区域对上；harmonic mean 的提升则说明它没有完全牺牲 base classes。开放词表分割常见问题是 base 类过拟合、novel 类崩掉，或者为了提升 novel 类泛化而损害已知类精度。harmonic mean 正是用来约束这种不平衡。

官方 GitHub 提供了训练、测试、数据准备和可视化说明，也列出 pretrained weights 与 backbone 下载入口。对复现者来说，这比只有论文数值更重要。开放词表分割的结果高度依赖文本模板、CLIP backbone、mask/decoder 初始化、类别映射和评测脚本；如果没有代码，很多细节会变成不可比的隐性调参。

不过，实验仍需谨慎解读。第一，摘要给出的提升是相对既有方法和特定 benchmark 协议下的结果，不能直接说明模型在所有遥感开放词表任务上都泛化。第二，OVRSISBench 来自已有分割数据集重组，类别空间仍受这些数据集限制，不等于真实开放世界。第三，开放词表分割的“文本类名”质量可能决定很大一部分性能，后续应该单独报告 prompt sensitivity。

## 亮点

第一，它把开放词表遥感语义分割变成了可评测问题。很多遥感 VLM 工作展示 caption、VQA 或 grounding，但像素级开放词表分割仍缺统一协议。OVRSISBench 至少给了一个把 LoveDA、ISPRS、UAVid、OpenEarthMap、iSAID、DeepGlobe 放进同一评测框架的起点。

第二，它把遥感知识迁移放在中心。遥感开放词表失败不只是模型不够大，也不是 prompt 写得不够花。核心问题是自然图像语义和遥感地物语义之间存在系统性偏差。RSKT-Seg 把这个偏差显性化，比直接堆更强 VLM 更有研究价值。

第三，它关注 novel 类指标。遥感论文常用全监督 mIoU 汇总，容易掩盖未见类崩溃。开放词表场景下，novel mIoU 和 harmonic mean 应该成为主指标，否则模型可能只是记住了 base 类。

第四，代码与 benchmark 入口公开。对于后续做 SegEarth-OV、RemoteSAM、SAM2/SAM3、CLIP/RemoteCLIP、GeoFM decoder 的研究者，RSKT-Seg 可以作为一个可跑的对照，而不是只作为相关工作引用。

第五，它和遥感 VLM 的落地方向兼容。开放词表语义分割不是最终产物的全部，但它是很多地理智能任务的底层能力：用户说“找出这片城区里的裸地和临时堆场”，系统需要把自然语言类别落到像素或 polygon，而不是只回答一句描述。

## 不足

第一，benchmark 仍是由既有监督分割数据集重组而来。它能测试未见类泛化，但未必覆盖真正长尾、地方性、细粒度和业务定义类别，例如非法采矿扰动、施工裸土、温室类型、湿地退化、灾损等级或作物物候阶段。

第二，文本类别描述的影响需要更透明。开放词表模型可能因为 prompt 模板、同义词、类别定义长短、是否包含遥感上下文而产生明显差异。后续应报告固定模板、遥感增强模板、LLM 扩写模板、多模板 ensemble 的对比。

第三，多数据集协议可能隐藏域差异。模型在 novel 类上提升，可能来自遥感知识迁移，也可能来自某些数据集的视觉风格更接近预训练分布。最好按数据集、分辨率、城市/乡村、对象/背景、stuff/things 分层报告。

第四，开放词表分割还缺少地理一致性指标。像素级 mIoU 不会检查道路是否连通、建筑 polygon 是否闭合、农田边界是否与地块一致、水体是否遵循河网拓扑。遥感应用最终需要 GIS 可用的对象，不能只停在 mask。

第五，RSKT-Seg 不等于通用遥感 VLM。它处理的是语义分割，不直接解决 VQA、证据 grounding、跨时相变化、矢量生成、工具调用和空间推理。把它接进 GeoAgent 或生产系统时，还需要 verifier、GIS 后处理和不确定性输出。

## 启发

一个可做的小论文方向是：**面向遥感开放词表分割的“类别描述审计 + 地理一致性评测”benchmark**。核心问题不是再提出一个更复杂的 decoder，而是系统回答：遥感类别文本应该怎么写，哪些类别靠视觉外观就够，哪些类别必须引入空间上下文、物理指数或 GIS 先验。

假设是：遥感开放词表分割的主要误差可以分成三类。第一类是视觉误差，模型看不清边界或尺度；第二类是语义误差，类别名与遥感外观不匹配；第三类是地理误差，mask 局部像素合理但不满足连通、邻接、形状或地物过程约束。若把类别描述和地理一致性显式纳入评测，可以更准确地区分模型真正的开放词表能力和 prompt 偶然性。

方法可以从 RSKT-Seg/OVRSISBench 开始。第一步，固定一套 base/novel split 和数据预处理。第二步，为每个类别构造四类 prompt：短类名、自然图像描述、遥感外观描述、遥感外观 + GIS 上下文描述。第三步，比较 RSKT-Seg、SegEarth-OV、RemoteCLIP + mask decoder、SAM/SAM2 proposal + CLIP scoring、以及一个强全监督 closed-set baseline。第四步，除了 mIoU，还加入地理一致性指标。

数据可以直接用 OVRSISBench 的 LoveDA、Potsdam、Vaihingen、UAVid、OpenEarthMap、iSAID、DeepGlobe，再选 2-3 个更贴近应用的外部数据做压力测试，例如 xBD 建筑损毁、SpaceNet 建筑/道路、DeepGlobe road extraction 或公开城市绿地/水体数据。指标包括 base mIoU、novel mIoU、harmonic mean、per-dataset drop、prompt variance、boundary F1、connected component error、polygon validity、small-object recall 和 calibration error。

一个实用的 prompt/审计模板可以这样写：

```text
你是遥感开放词表分割的类别描述审计器。给定类别名和目标数据集，请不要只翻译类别名，而要输出可用于分割模型的 evidence schema：

1. class_name: 标准类别名。
2. visual_appearance: 从俯视遥感图像看，该类别常见的颜色、纹理、形状、尺度和边界特征。
3. spatial_context: 该类别常与哪些地物相邻、包含或互斥。
4. possible_confusions: 容易混淆的遥感类别，以及区分线索。
5. sensor_constraints: RGB、多光谱、UAV 或航空影像下哪些线索可靠，哪些不可靠。
6. negative_prompts: 不应被分到该类别的典型区域。
7. gis_checks: 分割结果应满足的连通性、形状、面积、邻接或拓扑检查。

禁止把自然图像常识直接当作遥感证据。
如果类别定义依赖地区、季节或分辨率，必须显式标出。
如果仅凭 RGB 无法可靠区分，必须建议需要的辅助数据。
```

这个方向对遥感 VLM 很直接。未来用户不会只问“图中有没有道路”，而是会提出开放的地理对象请求：找出临时施工裸地、疑似堆场、洪水淹没边界、可疑采矿扰动、绿地退化斑块或农田边界变化。系统需要把自然语言类别转成可审计的遥感证据，再输出 mask/polygon，并说明不确定性。RSKT-Seg 的提示是：开放词表遥感分割不能只靠通用 VLM 词向量，必须有遥感知识、评测协议和地理约束三者一起工作。

## 参考

- *RSKT-Seg: Remote Sensing Knowledge Transfer for Open-Vocabulary Semantic Segmentation*：https://arxiv.org/abs/2509.12040
- arXiv HTML：https://arxiv.org/html/2509.12040v2
- 官方 GitHub：https://github.com/LiBingyu01/RSKT-Seg
- LoveDA：https://github.com/Junjue-Wang/LoveDA
- OpenEarthMap：https://open-earth-map.org/
