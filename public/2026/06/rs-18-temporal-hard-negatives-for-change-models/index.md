# RS-18 Temporal Hard Negatives for Change Models


# RS-18 Temporal Hard Negatives for Change Models

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-18` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 细问题：多时相遥感变化检测中，如何系统构造 hard negatives，让模型学会区分真实变化与季节变化、光照阴影、云薄雾、农田轮作、潮汐水体和配准误差。 1. 问题由来 传统二时相 change detection 通常把输入简化为 (imaget1, imaget2) change mask，但真实遥感里的“不变”并不等于像

## 正文

# RS-18 Temporal Hard Negatives for Change Models

更新时间：2026-06-07  
细问题：多时相遥感变化检测中，如何系统构造 hard negatives，让模型学会区分真实变化与季节变化、光照阴影、云薄雾、农田轮作、潮汐水体和配准误差。

## 1. 问题由来

传统二时相 change detection 通常把输入简化为 `(image_t1, image_t2) -> change mask`，但真实遥感里的“不变”并不等于像素相同。很多变化检测模型在 LEVIR-CD、WHU-CD、CDD 这类标准集上分数很高，部署到跨季节、跨年份、跨传感器或轻微错位场景时会把无害差异误报成变化。

2024 的 [A Change Detection Reality Check](https://arxiv.org/abs/2402.06994) 和其 [GitHub](https://github.com/isaaccorley/a-change-detection-reality-check) 对这个问题给了很直接的提醒：社区里大量架构在标准 benchmark 上堆 SOTA，但评测设置并不总能反映真实泛化。2024 的 [CSDACD](https://colab.ws/articles/10.1109%2Flgrs.2024.3431212) 明确把 cross-seasonal domain shift 作为问题，代码见 [24kironhead/CSDACD](https://github.com/24kironhead/CSDACD)。2026 的 [TERRA-CD](https://arxiv.org/abs/2605.14651) 则开始提供更接近真实城市时序变化的 Sentinel-2 语义变化 benchmark，并公开 [omkarsoak/TERRA-CD](https://github.com/omkarsoak/TERRA-CD)。

因此，RS-18 的核心不是再设计一个普通 CD backbone，而是设计一套 temporal hard negative mining 与评测协议：让“不应改变但像素变化很大”的样本成为训练和评测的一等公民。

## 2. Hard Negative 类型

| 类型 | 看起来像变化的原因 | 常见误报 | 需要的标签/元数据 | 推荐构造方式 |
|---|---|---|---|---|
| 季节变化 | 植被物候、落叶/返青、积雪、干湿季 | 农田、林地、水体边界误报 | 日期、气候带、NDVI/NDWI、物候区 | 同一区域不同季节但同一年土地利用稳定的样本 |
| 光照和阴影 | 太阳高度角、传感器观测角、建筑/山体阴影 | 建筑新增、道路变化、山地变化 | 太阳角、DEM/坡度、阴影 mask | 同一区域相近日期不同太阳角，或合成阴影增强 |
| 云、薄雾、云影 | 云层遮挡和辐射差异 | 大片伪变化、边缘伪变化 | cloud probability、QA band、cloud/shadow mask | Sentinel-2 SCL/CloudScore 选低到中等云污染负样本 |
| 农田轮作/收割 | 作物类型和生育阶段变化 | 土地利用改变、裸地扩张 | 作物历、NDVI 时间序列、parcel | parcel 内多日期作物周期，标注为无结构性变化 |
| 潮汐/水位 | 潮位、水库调度、降雨后暂时积水 | 水体扩张/消退误报 | 潮位、水文站、NDWI、多时相水体频率 | 海岸/河口/湿地多潮位样本，标注 transient change |
| 配准误差 | t1/t2 空间错位、不同 GSD、重采样 | 建筑/道路边缘双线变化 | GCP、registration residual、边缘图 | 对稳定区域施加亚像素到数像素偏移 |
| 成像风格差异 | 不同传感器、辐射定标、压缩、季节 composite | 大面积纹理变化 | 传感器 ID、处理级别、GSD | 同地同类目标跨传感器配对 |

## 3. 代表论文、benchmark 与代码

| 工作 | 年份/来源 | 链接 | 代码/数据 | 与 hard negative 的关系 |
|---|---:|---|---|---|
| A Change Detection Reality Check | 2024 ICLR ML4RS / arXiv | [paper](https://arxiv.org/abs/2402.06994) | [GitHub](https://github.com/isaaccorley/a-change-detection-reality-check) | 说明标准 CD SOTA 可能被 benchmark 设置放大，适合作为评测协议警示起点。 |
| CSDACD: Domain-adaptive Change Detection Network for Cross-seasonal RS Images | 2024 IEEE GRSL | [paper/info](https://colab.ws/articles/10.1109%2Flgrs.2024.3431212) | [GitHub](https://github.com/24kironhead/CSDACD) | 直接处理季节差异导致的 domain shift，是 cross-seasonal negative 的方法基线。 |
| Single-Temporal Supervised Learning for Universal RS Change Detection | 2024 arXiv | [paper](https://arxiv.org/abs/2406.15694) | [GitHub](https://github.com/Z-Zheng/pytorch-change-models) | 用单时相监督构造变化信号，可借鉴 unpaired negative/positive 生成。 |
| ChangeMamba | 2024 IEEE TGRS | [GitHub](https://github.com/ChenHongruixuan/ChangeMamba) | [GitHub](https://github.com/ChenHongruixuan/ChangeMamba) | 时空 SSM backbone，可作为 hard negative 训练的强基线。 |
| CD-Lamba / rschange | 2025 arXiv / 2026 TGRS 线索 | [paper](https://arxiv.org/abs/2501.15455) | [GitHub](https://github.com/xwmaxwma/rschange) | locally adaptive SSM，适合测试复杂负样本下的边界与局部差异建模。 |
| Multi-Modal Building Change Detection for Large-Scale Small Changes | 2026 arXiv | [paper](https://arxiv.org/abs/2603.19077) | [GitHub planned](https://github.com/AeroVILab-AHU/LSMD) | 明确指出光照、季节、材料变化干扰，适合作为 small-change hard negative 数据参考。 |
| TERRA-CD | 2026 arXiv | [paper](https://arxiv.org/abs/2605.14651) | [GitHub](https://github.com/omkarsoak/TERRA-CD) | 2019/2024 Sentinel-2、232 城市、土地覆盖/植被变化/语义变化三套标签，适合跨城市和语义负样本。 |
| OmniCD | 2026 arXiv | [paper](https://arxiv.org/abs/2605.30168) | 待确认 | 多模态语义指导 CD，适合测试文本/语义提示是否能减少季节与风格误报。 |
| ChangeFlow | 2026 arXiv/HF | [HF paper](https://huggingface.co/papers/2605.15375), [project](https://blaz-r.github.io/changeflow_cd) | project page | latent rectified flow 用于变化检测，可作为生成式变化先验对照。 |
| TERRA-CD / TERRA style multi-class CD | 2026 arXiv | [paper](https://arxiv.org/abs/2605.14651) | [GitHub](https://github.com/omkarsoak/TERRA-CD) | 提供多类别 transition 标签，可把“vegetation state change”与 land-cover transition 分开评测。 |
| STTORM-CD | 2026 PMC / Scientific Reports 线索 | [article](https://pmc.ncbi.nlm.nih.gov/articles/PMC12873372/) | 未核验 | 使用 triplet loss 拉近无害季节变化、推远洪水变化，思路上非常贴近 hard negative metric learning。 |

## 4. 方法脉络

### 4.1 传统 CD backbone

代表：Siamese UNet/Transformer、BIT、ChangeFormer、STANet、ChangeMamba、CD-Lamba。  
优点是可复现、适合作为 baseline；缺点是大多把 hard negative 当作普通背景像素，没有显式建模“无害但视觉差异大”的样本。

### 4.2 Domain adaptation / style disentanglement

代表：CSDACD、image translation、style recalibration、OmniCD 的 style disentanglement 线索。  
适合处理季节、光照、传感器风格差异，但风险是把真实变化也当成 domain style 抹掉，需要 semantic alignment 或 change-aware constraint。

### 4.3 Temporal metric learning

代表思路：triplet loss、contrastive temporal pairs、persistent transformation vs transient variation。  
可把 anchor 设为 `t1`，positive 设为“同地无结构变化但季节/光照不同”，negative 设为“真实结构变化”。这是 RS-18 最直接的创新方向。

### 4.4 Foundation model / VLM semantic guidance

代表：OmniCD、TERRA-CD、RS foundation features。  
可以用语义 map、文本 prompt、land-cover transition 约束区分“植被变黄”和“林地变建筑”。风险是 VLM/CLIP 可能引入语言先验，必须用 evidence mask 约束。

### 4.5 生成式变化先验

代表：ChangeFlow、diffusion-based temporal bridging。  
可学习从 t1 到 t2 的可解释形变/风格路径，帮助模型判断两时相差异是连续无害变化还是突发结构变化。风险是生成模型可能平滑掉小变化。

## 5. 推荐 Negative Mining 协议

### 5.1 数据组织

每个样本不只存二时相图像，而是存一个 temporal pack：

```text
site_id
geometry / tile_id
sensor_id, GSD, processing_level
timestamp_t1, timestamp_t2
season labels / month / day-of-year
cloud score / cloud mask / shadow mask
solar angle / view angle if available
registration quality estimate
land-cover labels at t1/t2 if available
change mask / semantic transition mask
negative_type tags
```

### 5.2 三层负样本

| 层级 | 定义 | 目标 |
|---|---|---|
| Easy negative | 同季节、同传感器、干净无变化 | 保持基本 specificity |
| Hard visual negative | 无真实结构变化，但季节、光照、云影、潮汐、轮作或错位明显 | 降低伪变化误报 |
| Semantic hard negative | 像素差异很大但语义类别不变，或语义变化很小但像素变化很小 | 提升 semantic consistency |

### 5.3 采样策略

1. 按地理位置构造 temporal stack，不从随机 tile 里盲配。
2. 对每个真实变化 positive，采样至少 2 个同区域或相似生态区 hard negative。
3. 用 NDVI/NDWI/NDBI 差异、cloud score、edge displacement、solar angle difference 给 negative 打标签。
4. 对 urban/building CD，强制加入 shadow/registration negatives。
5. 对 agriculture/vegetation CD，强制加入 phenology/crop rotation negatives。
6. 对 water/coastal CD，强制加入 tide/water-level negatives。

### 5.4 损失函数草案

总损失：

```text
L = L_cd + lambda1 * L_temporal_contrast + lambda2 * L_negative_type + lambda3 * L_uncertainty
```

- `L_cd`：常规 BCE/Dice/Focal/Tversky。
- `L_temporal_contrast`：同地无结构变化的 embedding 拉近，真实变化 pair 拉远。
- `L_negative_type`：辅助分类头预测 negative 类型，让 backbone 学会解释差异来源。
- `L_uncertainty`：对云影/配准误差区域允许高不确定性，但惩罚高置信误报。

## 6. 实验矩阵

| 目标 | 数据集 | Negative 类型 | Baseline | 指标 |
|---|---|---|---|---|
| 标准二值 CD | LEVIR-CD、WHU-CD、CDD | easy negative | BIT、ChangeFormer、ChangeMamba、CD-Lamba | F1、IoU、precision、recall |
| cross-seasonal CD | CDD / CSDACD setting、TERRA-CD 子集 | 季节、光照、植被物候 | CSDACD、style adaptation、baseline CD | false positive rate on no-change seasonal pairs |
| 语义变化 CD | TERRA-CD | land-cover transition vs transient vegetation | STANet variants、Bi-SRNet、semantic CD | transition mIoU、no-change FPR、confusion matrix |
| small-change building CD | LSMD | 光照、材料、NIR/RGB差异、小变化 | ChangeMamba、CD-Lamba、building CD baselines | building F1、small-change recall、hard-negative FPR |
| temporal robustness | 自建 Sentinel-2 pack | 云、阴影、潮汐、轮作、错位 | 上述全部 | robustness gap、AUC-FPR、calibration ECE |

关键指标建议：

- `HN-FPR`：hard negative 区域误报率。
- `HN-AUC`：按 hard negative 难度分桶后的 precision-recall AUC。
- `Change Recall @ fixed HN-FPR`：在 hard negative FPR 固定为 1%/5% 时真实变化召回率。
- `Temporal Consistency Score`：无结构变化多时相 stack 中预测 mask 的时间稳定性。
- `Boundary Misregistration Sensitivity`：人工平移 0.5/1/2/4 像素后误报曲线。

## 7. 可投稿方法方案

题目草案：**HardNeg-CD: Temporal Hard Negative Mining for Robust Optical Remote Sensing Change Detection**

核心假设：如果显式构造并标注 temporal hard negatives，变化检测模型可以在不牺牲真实变化召回的情况下显著降低季节、阴影、云雾、轮作和错位导致的伪变化。

方法模块：

1. **Negative Pack Builder**：从 Sentinel-2/Landsat/VHR 数据中基于时间、云量、NDVI/NDWI、配准质量采样 hard negative pairs。
2. **Difference Attribution Head**：预测差异来源类型，例如 phenology、shadow、cloud、registration、true change。
3. **Contrastive Temporal Encoder**：拉近无结构变化 pair，拉远真实变化 pair。
4. **Uncertainty Gate**：对云/错位区域输出低置信或 abstain，减少高置信误报。
5. **Evaluation Suite**：报告常规 F1/IoU 加 HN-FPR、Change Recall @ fixed HN-FPR 和 robustness gap。

最小可行实验：

1. 用 LEVIR-CD/WHU-CD 训练标准 baseline。
2. 从 Sentinel-2 或 TERRA-CD 构造 5 类 hard negatives：season、cloud/shadow、phenology、tide/water、registration。
3. 对 baseline、CSDACD、ChangeMamba、CD-Lamba、HardNeg-CD 做同一测试。
4. 证明 HardNeg-CD 在固定常规 IoU 不显著下降的前提下，HN-FPR 下降。

## 8. 风险与规避

| 风险 | 影响 | 规避 |
|---|---|---|
| hard negative 被误标，实际存在真实变化 | 模型学错 | 使用多时相确认、人工抽检、已有 land-cover product 交叉验证 |
| 过度抑制变化，召回下降 | 漏检灾害/建筑变化 | 使用 fixed HN-FPR 下 recall，加入 positive mining |
| Sentinel-2 分辨率不足以评估小建筑变化 | 建筑实验不可信 | VHR 数据只做建筑，Sentinel-2 做土地覆盖/植被/水体 |
| 云/阴影 mask 不准 | negative 类型噪声 | 引入不确定性标签，不把云区当强监督 |
| 只在一个地区有效 | 论文说服力弱 | leave-city/leave-climate-zone-out |

## 9. 下一步阅读队列

1. [A Change Detection Reality Check](https://arxiv.org/abs/2402.06994) 和 [repo](https://github.com/isaaccorley/a-change-detection-reality-check)
2. [CSDACD](https://colab.ws/articles/10.1109%2Flgrs.2024.3431212) 和 [repo](https://github.com/24kironhead/CSDACD)
3. [TERRA-CD](https://arxiv.org/abs/2605.14651) 和 [repo](https://github.com/omkarsoak/TERRA-CD)
4. [LSMD building change benchmark](https://arxiv.org/abs/2603.19077) 和 [repo placeholder](https://github.com/AeroVILab-AHU/LSMD)
5. [OmniCD](https://arxiv.org/abs/2605.30168)
6. [ChangeFlow](https://huggingface.co/papers/2605.15375) 和 [project](https://blaz-r.github.io/changeflow_cd)
7. [ChangeMamba GitHub](https://github.com/ChenHongruixuan/ChangeMamba)
8. [CD-Lamba](https://arxiv.org/abs/2501.15455) 和 [rschange](https://github.com/xwmaxwma/rschange)
9. [Single-Temporal Supervised Learning for Universal RS Change Detection](https://arxiv.org/abs/2406.15694) 和 [pytorch-change-models](https://github.com/Z-Zheng/pytorch-change-models)

## 10. 结论

Temporal hard negatives 是变化检测里很值得做的小问题，因为它把“模型为什么误报”从定性 failure case 变成可采样、可标注、可评测、可优化的协议。相比提出新 backbone，这条路线更容易形成方法论文贡献：新的数据构造协议、新的训练目标、新的鲁棒性指标，以及能直接解释部署场景中最常见的伪变化来源。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

