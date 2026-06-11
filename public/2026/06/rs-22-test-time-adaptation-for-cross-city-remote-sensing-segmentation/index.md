# RS-22 Test-Time Adaptation for Cross-City Remote Sensing Segmentation


# RS-22 Test-Time Adaptation for Cross-City Remote Sensing Segmentation

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-22` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务原文：研究 testtime adaptation 在跨城市遥感语义分割中的可靠性。重点分析熵最小化、自训练、BN adaptation、prototype adaptation 在 LoveDA、DeepGlobe、Vaihingen/Potsdam 上的风险，提出带不确定性约束的 TTA 方法。 1. 结论先行 跨城市遥感

## 正文

# RS-22 Test-Time Adaptation for Cross-City Remote Sensing Segmentation

更新时间：2026-06-07  
任务原文：研究 test-time adaptation 在跨城市遥感语义分割中的可靠性。重点分析熵最小化、自训练、BN adaptation、prototype adaptation 在 LoveDA、DeepGlobe、Vaihingen/Potsdam 上的风险，提出带不确定性约束的 TTA 方法。

## 1. 结论先行

跨城市遥感语义分割的 TTA 不是“把 TENT 跑一下”这么简单。遥感目标具有强空间自相关、类别长尾、城市/农村类别先验差异、GSD 和成像条件差异；这些因素会让熵最小化、自训练和 BN adaptation 在无标签测试流上发生负迁移。当前 2024-2026 的直接 RS-TTA 工作仍少，更成熟的是两条邻近线：遥感 UDA/source-free/one-shot domain adaptation，以及通用 CV 的 continual TTA / segmentation TTA / uncertainty-aware TTA。

最有价值的小课题是：**Uncertainty-Constrained Test-Time Adaptation for Cross-City Remote Sensing Semantic Segmentation**。核心假设是：只在可靠像素、可靠 tile 和可靠类别原型上更新少量参数，并用空间一致性、类别先验和回滚机制约束更新，可以减少跨城市 TTA 的 model collapse 和 rare-class forgetting。

## 2. 问题由来

遥感语义分割常在一个城市、一个传感器或一个采样策略上训练，然后部署到另一个城市。城市之间的差异不是简单色彩变化，而是多因素叠加：

- 地理景观差异：武汉、南京、长春、Potsdam、Vaihingen 的建筑密度、道路宽度、植被形态不同。
- 类别先验差异：LoveDA rural 中 agriculture/forest 占比高，urban 中 building/road 占比高；熵最小化容易把主导类越推越强。
- 空间自相关：一个 1024 tile 中相邻像素高度相关，batch size 看似大，独立样本数其实很低。
- 边界和小目标：道路、水体边界、建筑阴影、车辆等区域的高不确定性往往正是最重要的区域。
- 测试流非平稳：真实大范围制图是从城区到郊区、从平原到山地、从晴天到阴影的连续流，单一 target distribution 假设不成立。

LoveDA 本身就是为了 land-cover segmentation 和 UDA 设计的遥感域适配数据集，其 GitHub 说明中也保留了 Semantic Segmentation Challenge 和 UDA Challenge；OpenReview 摘要强调城市级/国家级制图泛化不足。LoveDA 早于本时间窗，但仍是 RS-22 的核心实验场。  
链接：[LoveDA GitHub](https://github.com/Junjue-Wang/LoveDA)，[LoveDA OpenReview](https://openreview.net/forum?id=_-O9SefMb99)。

## 3. 代表论文与项目

### 3.1 遥感跨域分割：TTA 的背景和上限参考

| 工作 | 年份/来源 | 链接 | 代码/数据 | 与 RS-22 的关系 |
|---|---:|---|---|---|
| LoveDA: A Remote Sensing Land-Cover Dataset for Domain Adaptive Semantic Segmentation | NeurIPS D&B 2021，2025 仍维护 | [OpenReview](https://openreview.net/forum?id=_-O9SefMb99) | [GitHub](https://github.com/Junjue-Wang/LoveDA) | 核心跨域分割 benchmark；urban/rural 和多城市设置适合构造 cross-city TTA。 |
| One-shot adaptation for cross-domain semantic segmentation in remote sensing images / MOAT | Pattern Recognition 2025 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0031320325000500) | 论文页未见官方代码 | 用一个无标签目标图像快速适配，介于 UDA 和 TTA 之间；包含 LoveDA、Potsdam、Vaihingen。 |
| AMDFormer: UDA for RS semantic segmentation with adaptive temperature sampling and modulated dynamic threshold | PRCV 2025，2026 online | [Springer](https://link.springer.com/chapter/10.1007/978-981-95-5628-1_34) | 未见官方代码 | 关注 rare-class sampling 和动态 pseudo-label 阈值；适合作为 TTA 中 class-balanced confidence filter 的启发。 |
| Domain generalization for semantic segmentation of RS images via VFM fine-tuning | ISPRS JPRS 2025 | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271625003569) | [GeoSA-BaSA](https://github.com/mmmll23/GeoSA-BaSA) | 不是 TTA，但提供 VFM fine-tuning + DG 的强 source-only/domain-generalization baseline。 |
| EarthShift | arXiv 2026 | [arXiv](https://arxiv.org/abs/2605.29330) | [Project](https://earthshift.github.io/) | 真实 distribution shift benchmark；可借鉴报告 OOD drop、worst-domain 和 shift taxonomy。 |
| REOBench | arXiv 2025 | [arXiv](https://arxiv.org/abs/2505.16793) | [GitHub](https://github.com/lx709/reobench) | 遥感鲁棒性 benchmark；适合扩展 corruption + cross-city 双重 shift。 |

### 3.2 通用 TTA / segmentation TTA：可迁移算法库

| 工作 | 年份/venue | 链接 | 代码 | 可迁移模块 |
|---|---:|---|---|---|
| Entropy is not Enough for Test-Time Adaptation | ICLR 2024 Spotlight | [OpenReview](https://openreview.net/forum?id=9w3iw8wDuE) | 论文页 | 直接指出单纯 entropy minimization 不足；支持 RS 中“熵低不等于预测对”的核心风险。 |
| Improved Self-Training for Test-Time Adaptation | CVPR 2024 | [CVF PDF](https://openaccess.thecvf.com/content/CVPR2024/papers/Ma_Improved_Self-Training_for_Test-Time_Adaptation_CVPR_2024_paper.pdf) | 论文页 | 自训练 TTA 的改进路线；可迁移到 pseudo-mask 选择和 teacher-student 更新。 |
| TEA: Test-time Energy Adaptation | CVPR 2024 | [GitHub](https://github.com/yuanyige/tea) | [GitHub](https://github.com/yuanyige/tea) | energy-based 目标可替代单纯 entropy，适合检测高不确定/分布外 tile。 |
| Active Test-Time Adaptation | ICLR 2024 | [GitHub](https://github.com/divelab/ATTA) | [GitHub](https://github.com/divelab/ATTA) | 将主动学习思想纳入 TTA；遥感可用高风险 tile 请求人工确认或延迟更新。 |
| Efficient Test-Time Adaptation of VLMs / TDA | CVPR 2024 | [GitHub](https://github.com/kdiAAA/TDA) | [GitHub](https://github.com/kdiAAA/TDA) | key-value cache、progressive pseudo-label refinement、negative pseudo-label；可迁移到 RS-CLIP/OV segmentation。 |
| Test-Time Adaptation of VLMs for Open-Vocabulary Semantic Segmentation / MLMP | NeurIPS 2025 | [GitHub](https://github.com/dosowiechi/MLMP) | [GitHub](https://github.com/dosowiechi/MLMP) | 多层特征 + 多 prompt 的 entropy minimization；可作为 open-vocabulary RS segmentation 的 TTA baseline。 |
| ReservoirTTA | arXiv 2025 | [HF paper](https://huggingface.co/papers/2505.14511) | [GitHub](https://github.com/LTS5/ReservoirTTA) | 长时间测试流、循环/渐变 domain；适合真实跨城市制图流。 |
| Hybrid-TTA | ICCV 2025 | [GitHub](https://github.com/hhhyyeee/Hybrid-TTA) | [GitHub](https://github.com/hhhyyeee/Hybrid-TTA) | 动态 domain shift detection；适合从 urban 到 rural 或不同城市块切换时触发不同更新策略。 |
| RoTTA | CVPR 2023，仍是 2024-2026 TTA 常用基线 | [arXiv](https://arxiv.org/abs/2303.13899) | [GitHub](https://github.com/BIT-DA/RoTTA) | memory bank、robust BN、time-aware reweighting；适合非平稳测试流。 |
| SAR | ICLR 2023，仍是稳定 TTA 常用基线 | [arXiv](https://arxiv.org/abs/2302.12400) | [GitHub](https://github.com/mr-eggplant/SAR) | sharpness-aware reliable entropy minimization；对抗高噪声样本导致 collapse。 |

说明：RoTTA 和 SAR 早于 2024，但在 2024-2026 的 TTA 文献中仍是重要基线；RS-22 若做实验应包含它们，否则 TTA 部分不完整。

## 4. 四类 TTA 策略在遥感跨城市分割中的风险

### 4.1 BN Adaptation

机制：只更新 BN running statistics 或 affine 参数。优点是简单、计算便宜；缺点是遥感高分辨率 tile 空间自相关强，batch 内像素不是独立样本。

风险：

- 小 batch 或单 tile 时统计不稳，更新方向受单个区域主导。
- rural/urban 之间类别先验差异大，BN 统计可能把语义差异当成风格差异抹掉。
- 如果模型是 LayerNorm/ViT/SegFormer，BN adaptation 的适用性弱。

适合做 baseline，但不适合作为唯一贡献。

### 4.2 Entropy Minimization

机制：让模型在目标域预测更 confident。风险在 RS 中尤其明显：低熵可能是模型过度自信，不代表正确。

典型失败：

- 主导类塌缩：rural tile 中 agriculture 占比高，模型可能把 barren/forest/water 边界吞掉。
- rare class 遗忘：小面积 water、road、barren 由于高熵被过滤或被主类覆盖。
- 边界变差：边界像素天然高熵，强行降熵会造成过度平滑。
- 城市切换时错误积累：先适配到城市 A 的先验，再进入城市 B 后负迁移。

这与 ICLR 2024 的 “Entropy is not Enough” 给出的总判断一致：entropy 只能反映置信度，不足以刻画可适配因素。

### 4.3 Self-Training / Pseudo-Labeling

机制：选择高置信伪标签更新模型或 teacher-student。遥感中伪标签质量和空间覆盖很关键。

风险：

- confidence threshold 会偏向 easy/head classes。
- 伪标签错误具有空间连片性，一旦某一地块被错标，会批量污染训练。
- 不同城市类别比例不同，固定阈值不能适应 domain。
- 遥感 label 边界本身可能存在错位，伪标签过拟合到错误边界。

可借鉴 AMDFormer 的 rare-class sampling 和动态阈值思想，但要改造成 test-time 版本。

### 4.4 Prototype Adaptation

机制：为每个类别维护 feature prototype，用目标域预测更新原型并校正分类头。

风险：

- prototype contamination：错误伪标签会污染类别中心。
- open-set/unknown land-cover：目标城市出现 source 未覆盖地物时，prototype 会被迫吸收未知类。
- class imbalance：农业/建筑 prototype 更新多，小类原型陈旧。
- 多尺度对象：同类建筑在不同 GSD、阴影和密度下可能是多峰分布，单一 prototype 不足。

推荐使用 class-balanced reservoir memory、多原型、uncertainty gating 和源域 anchor。

## 5. 推荐方法：UCTTA-RS

名称：**UCTTA-RS: Uncertainty-Constrained Test-Time Adaptation for Cross-City Remote Sensing Semantic Segmentation**

### 5.1 研究假设

在跨城市遥感测试流中，不确定性约束可以把“可适配样本”和“危险样本”分开：只用低风险像素/tile 更新轻量参数，并对高风险区域保留原模型或请求人工/延迟更新，可以降低负迁移和 rare-class forgetting。

### 5.2 模型设置

推荐两条模型线并行：

- 传统分割线：SegFormer-B2/B5、UPerNet-Swin、DeepLabV3+、HRNet。
- foundation feature 线：DINOv2/Prithvi/Clay/GeoFM backbone + lightweight segmentation head。

测试时只更新：

- BN/Norm affine 参数，或
- decoder adapter / LoRA，或
- class prototype memory 和 calibration head。

默认冻结主干，防止一次目标城市流把基础特征带偏。

### 5.3 不确定性约束

对每个像素或 superpixel 计算：

- predictive entropy；
- test-time augmentation disagreement；
- teacher-student disagreement；
- prototype distance / margin；
- boundary uncertainty；
- tile-level energy/OOD score。

只把同时满足以下条件的区域用于更新：

1. 低熵且高 margin；
2. TTA/augmentation 预测一致；
3. 与源域或目标域类别 prototype 距离合理；
4. 不在高不确定边界区域；
5. class-balanced reservoir 中该类未过量。

高风险区域不参与梯度，但参与报告和可视化。

### 5.4 损失函数

```text
L = L_reliable_entropy
  + lambda_p * L_prototype_consistency
  + lambda_s * L_spatial_smooth_boundary_aware
  + lambda_a * L_source_anchor
  + lambda_d * L_class_diversity_prior
```

其中：

- `L_reliable_entropy`：只对可靠像素做熵最小化。
- `L_prototype_consistency`：目标特征靠近可靠类别原型。
- `L_spatial_smooth_boundary_aware`：在 superpixel/对象内部平滑，在边界处弱化约束。
- `L_source_anchor`：防止目标更新偏离源域类别原型。
- `L_class_diversity_prior`：防止塌缩到农业/建筑等主导类，但 prior 应随 tile 类型动态估计。

### 5.5 回滚机制

每 N 个 tile 计算无标签健康指标：

- 平均熵是否异常下降但类别多样性也下降；
- 高风险区域比例是否持续升高；
- prototype drift 是否超过阈值；
- source anchor 距离是否突然变大；
- TTA disagreement 是否上升。

触发条件满足时，回滚到 EMA teacher 或最近 checkpoint。这一点对真实城市流很重要。

## 6. 实验矩阵

### 6.1 数据集与划分

| 数据集 | 设置 | 适合测试的问题 |
|---|---|---|
| LoveDA | urban -> rural, rural -> urban；进一步按 Nanjing/Changzhou/Wuhan 构造 leave-city-out | 城乡和城市域偏移、类别先验变化 |
| ISPRS Potsdam/Vaihingen | Potsdam -> Vaihingen, Vaihingen -> Potsdam | 航空 VHR 影像跨城市、GSD/成像条件差异 |
| DeepGlobe Land Cover | 按地理区域或 tiles 构造 spatial block / leave-region split | 大范围 land-cover OOD |
| OpenEarthMap | leave-city/leave-region | 更丰富地理覆盖，验证泛化 |
| REOBench 扩展 | clean -> corruption + city shift | 腐蚀扰动和城市偏移叠加 |

### 6.2 Baseline

必须包含：

- Source-only，无任何适配。
- Target supervised upper bound。
- BN Adapt。
- TENT / entropy minimization。
- EATA/SAR/RoTTA/CoTTA 中至少 2 个稳定 TTA baseline。
- Improved self-training TTA。
- Prototype adaptation baseline。
- RS UDA/one-shot upper reference：MOAT、AMDFormer 或同类方法。
- VFM/DG baseline：GeoSA-BaSA、DINOv2/Prithvi/Clay frozen + head。

可选：

- TEA energy adaptation。
- Hybrid-TTA / ReservoirTTA 用于 non-stationary target stream。
- MLMP 用于 open-vocabulary segmentation variant。

### 6.3 指标

任务指标：

- mIoU；
- per-class IoU；
- rare-class IoU；
- boundary F1；
- urban/rural 或 city-wise mIoU；
- worst-domain mIoU；
- OOD drop：`ID mIoU - OOD mIoU`。

可靠性指标：

- ECE / adaptive ECE；
- NLL / Brier score；
- negative transfer rate：适配后低于 source-only 的 tile 比例；
- class collapse score：预测类别分布与 source/target 估计 prior 的偏离；
- prototype drift；
- rollback count。

成本指标：

- 每 tile 适配时间；
- 显存；
- 需不需要 source data；
- 在线 batch size 敏感性。

### 6.4 Ablation

| Ablation | 目的 |
|---|---|
| 无 uncertainty filter | 验证可靠样本选择是否关键 |
| entropy-only vs energy/prototype/margin | 判断哪类不确定性最有效 |
| pixel-level vs superpixel/object-level update | 检验空间自相关建模 |
| single prototype vs class-balanced multi-prototype | 检验 prototype contamination |
| with/without source anchor | 检验 forgetting 和 collapse |
| static threshold vs dynamic threshold | 检验跨城市稳定性 |
| frozen backbone vs adapter/Norm/head update | 检验更新范围 |
| random stream vs spatially ordered stream | 检验真实制图流 |

## 7. 最小可行实验

第一阶段建议不要一上来做所有数据。最小实验如下：

1. 数据：LoveDA urban -> rural 和 rural -> urban。
2. 模型：SegFormer-B2 source-only。
3. Baseline：BN Adapt、TENT、SAR、self-training TTA。
4. 方法：UCTTA-RS 只更新 decoder/head adapter + class-balanced prototype memory。
5. 指标：mIoU、per-class IoU、negative transfer rate、ECE、class collapse score。
6. 可视化：每类 prototype drift、适配前后不确定性图、失败 tile。

如果 LoveDA 上能证明“减少负迁移”，再扩展到 Potsdam/Vaihingen 和 DeepGlobe。

## 8. 可能未来方向

1. **RS-TTA benchmark**：把 LoveDA、Potsdam/Vaihingen、DeepGlobe、OpenEarthMap 统一成跨城市测试流，报告平均增益和负迁移率。
2. **Uncertainty-aware rollback**：TTA 不一定每次都更新；让模型知道何时不适配。
3. **SAM-assisted TTA**：用 SAM/SegEarth-OV 生成对象边界，只在对象内部做 entropy/prototype 更新，减少边界伪标签污染。
4. **GeoFM + TTA**：比较从头训练分割模型和 Prithvi/Clay/DINOv2 feature head 在 TTA 下谁更稳定。
5. **Active TTA for RS**：把 ATTA 思路用于高风险 tile，请求少量人工点/框/类别确认，而不是无条件自训练。
6. **Non-stationary city stream**：用 ReservoirTTA/Hybrid-TTA 思路处理城市内部从商业区、农田、工业区、水体连续切换。
7. **Calibration-first adaptation**：先校准置信度，再做伪标签更新；把 ECE 作为主约束而非附属指标。

## 9. 推荐阅读顺序

1. LoveDA：理解遥感跨域语义分割的 benchmark。
2. MOAT / AMDFormer：理解 RS one-shot/UDA 如何处理 LoveDA、Potsdam、Vaihingen。
3. Entropy is not Enough：理解 entropy minimization 的理论/实证风险。
4. SAR、RoTTA、Hybrid-TTA、ReservoirTTA：理解动态测试流和稳定性。
5. TEA、ATTA、Improved Self-Training TTA：补充 energy、active selection、自训练。
6. EarthShift / REOBench：把评测从单一 target domain 推向真实遥感 shift。

## 10. 参考链接

- LoveDA GitHub: https://github.com/Junjue-Wang/LoveDA
- LoveDA OpenReview: https://openreview.net/forum?id=_-O9SefMb99
- MOAT / One-shot adaptation for cross-domain semantic segmentation in remote sensing images: https://www.sciencedirect.com/science/article/pii/S0031320325000500
- AMDFormer / UDA for RS semantic segmentation: https://link.springer.com/chapter/10.1007/978-981-95-5628-1_34
- EarthShift: https://arxiv.org/abs/2605.29330
- REOBench: https://arxiv.org/abs/2505.16793
- Entropy is not Enough for Test-Time Adaptation: https://openreview.net/forum?id=9w3iw8wDuE
- Improved Self-Training for Test-Time Adaptation: https://openaccess.thecvf.com/content/CVPR2024/papers/Ma_Improved_Self-Training_for_Test-Time_Adaptation_CVPR_2024_paper.pdf
- TEA: https://github.com/yuanyige/tea
- ATTA: https://github.com/divelab/ATTA
- TDA: https://github.com/kdiAAA/TDA
- MLMP: https://github.com/dosowiechi/MLMP
- ReservoirTTA: https://huggingface.co/papers/2505.14511
- Hybrid-TTA: https://github.com/hhhyyeee/Hybrid-TTA
- RoTTA: https://github.com/BIT-DA/RoTTA
- SAR: https://github.com/mr-eggplant/SAR

## 11. 可投稿小论文雏形

题目候选：**Uncertainty-Constrained Test-Time Adaptation for Cross-City Remote Sensing Semantic Segmentation**

贡献点：

1. 提出 cross-city RS segmentation 的 realistic TTA protocol，报告 mIoU、ECE 和 negative transfer rate。
2. 提出 reliability-gated entropy/prototype adaptation，只在可信区域更新。
3. 提出 class-balanced prototype reservoir 和 source-anchor rollback，缓解 rare-class forgetting 和 model collapse。
4. 在 LoveDA、Potsdam/Vaihingen、DeepGlobe/OpenEarthMap 上比较 TENT、BN Adapt、SAR、RoTTA、self-training、RS UDA/one-shot adaptation。

风险：

- 如果 source-only GeoFM 太强，TTA 提升可能小；需要报告 negative transfer 降低和 calibration 改善。
- 无标签指标可能与真实 mIoU 不完全一致；需要做 oracle analysis。
- 不同数据集 label taxonomy 不一致，跨数据集实验要先做 label mapping。

第一实验：

LoveDA urban -> rural / rural -> urban，SegFormer-B2，比较 source-only、BN Adapt、TENT、SAR、自训练、UCTTA-RS。若 UCTTA-RS 的平均 mIoU 不一定最高，但 negative transfer rate、rare-class IoU 和 ECE 明显更稳，就已经有论文价值。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

