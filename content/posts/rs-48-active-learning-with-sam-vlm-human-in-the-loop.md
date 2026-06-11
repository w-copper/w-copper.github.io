---
title: "RS-48 Active Learning with SAM/VLM Human-in-the-Loop"
date: 2026-06-07
series: ["2024-2026 遥感 AI 细分研究方向"]
tags: ["数据集", "弱监督", "benchmark"]
source: "research/rs48_active_learning_sam_vlm_hitl.md"
categories: ["遥感基础模型与多模态理解"]
draft: false
source_repo: "codex-rs-articles"
---

# RS-48 Active Learning with SAM/VLM Human-in-the-Loop

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-48` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 任务：设计一个低成本遥感标注闭环：主动选择样本，SAM 生成 mask，VLM 生成类别/描述，人类纠错，再更新 prompt/prototype。输出标注成本曲线、mIoU/AP 收益、停止准则和失败案例分析。 1. 问题由来 遥感标注贵，贵在三个地方：大幅面影像要切片和定位，小目标/旋转目标/密集实例边界难修，类别语义还经常依

## 正文

# RS-48 Active Learning with SAM/VLM Human-in-the-Loop

更新时间：2026-06-07  
任务：设计一个低成本遥感标注闭环：主动选择样本，SAM 生成 mask，VLM 生成类别/描述，人类纠错，再更新 prompt/prototype。输出标注成本曲线、mIoU/AP 收益、停止准则和失败案例分析。

## 1. 问题由来

遥感标注贵，贵在三个地方：大幅面影像要切片和定位，小目标/旋转目标/密集实例边界难修，类别语义还经常依赖地理上下文。传统主动学习只问“哪张图最不确定”，但 foundation model 时代的问题变了：SAM 能给 mask 但不懂类别，GroundingDINO/VLM 能给语义但受 prompt 和语言先验影响，人类标注者的主要成本也从“从零画 mask”变成“检查、修正、合并、改类别”。

因此，这个方向的核心研究问题不是再做一个主动学习打分函数，而是：

- 如何估计一张候选图像的“自动标注可修正性”：SAM/VLM 生成的伪标签是否值得交给人类改？
- 如何把选样目标从 uncertainty 扩展到地理覆盖、季节覆盖、长尾类别、小目标覆盖和纠错成本？
- 如何让人类纠错反过来更新 prompt、prototype、类别词表或轻量 adapter，而不是只把修正标签放进训练集？
- 如何用“单位人工分钟带来的 mIoU/AP 提升”评估方法，而不是只比较标注比例？

## 2. 2024-2026 代表论文/项目

| 论文/项目 | 年份/来源 | 链接 | 官方代码/数据 | 与本方向的关系 |
|---|---:|---|---|---|
| Active Learning Meets Foundation Models: Fast Remote Sensing Data Annotation | ICCV 2025 | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Burges_Active_Learning_Meets_Foundation_Models_Fast_Remote_Sensing_Data_Annotation_ICCV_2025_paper.pdf) | [GitHub: ICCV_AL4FM](https://github.com/mburges-cvl/ICCV_AL4FM) | 最直接锚点：把主动学习和 SAM 半自动遥感目标检测标注结合，强调标注时间和冷启动。 |
| FMARS: Annotating Remote Sensing Images for Disaster Monitoring with Foundation Models | 2024 IGARSS / arXiv | [arXiv](https://arxiv.org/abs/2405.20109) | [HF dataset](https://huggingface.co/datasets/links-ads/fmars-dataset), [Papers with Code](https://paperswithcode.com/paper/fmars-annotating-remote-sensing-images-for) | 使用 GroundingDINO + SAM 自动标注灾害相关 VHR 遥感图像，适合作为自动伪标签管线基线。 |
| RemoteSAM / RemoteSAM-270K | 2025 ACM MM oral / arXiv | [arXiv](https://arxiv.org/abs/2505.18022) | [GitHub](https://github.com/1e12Leon/RemoteSAM), [HF dataset](https://huggingface.co/datasets/1e12Leon/RemoteSAM270k) | 构建 image-text-mask 三元组数据引擎，可作为 SAM/VLM 自动标注和 referring segmentation 基座。 |
| Segment Anything, From Space? | WACV 2024 | [CVF PDF](https://openaccess.thecvf.com/content/WACV2024/papers/Ren_Segment_Anything_From_Space_WACV_2024_paper.pdf) | 论文评测多遥感数据 | 系统暴露 SAM 在 overhead imagery 上的失败模式，是设计人类纠错和 prompt refinement 的依据。 |
| PointSAM | 2024/2025 arXiv / TGRS 方向 | [arXiv](https://arxiv.org/abs/2409.13401) | [GitHub](https://github.com/Lans1ng/PointSAM) | 点监督、负提示校准、伪标签自训练；可用于“少量点击 -> 更好 mask”的 HITL 单元。 |
| OpenRSD: Towards Open-prompts for Object Detection in Remote Sensing Images | ICCV 2025 | [CVF](https://openaccess.thecvf.com/content/ICCV2025/html/Huang_OpenRSD_Towards_Open-prompts_for_Object_Detection_in_Remote_Sensing_Images_ICCV_2025_paper.html), [arXiv](https://arxiv.org/abs/2503.06146) | 论文页为主 | 开放提示遥感检测，适合作为 VLM/文本 prompt 生成候选框的比较对象。 |
| VRSBench | NeurIPS 2024 Datasets & Benchmarks | [arXiv](https://arxiv.org/abs/2406.12384), [NeurIPS PDF](https://proceedings.neurips.cc/paper_files/paper/2024/file/05b7f821234f66b78f99e7803fffa78a-Paper-Datasets_and_Benchmarks_Track.pdf) | [GitHub](https://github.com/lx709/VRSBench) | 高质量遥感视觉语言 benchmark，可借鉴人工验证、object reference 和 VQA 标注质量控制。 |
| Grounded-SAM-2 | 2024-2025 official-style project | [GitHub](https://github.com/IDEA-Research/Grounded-SAM-2) | GitHub | 通用 GroundingDINO/SAM2 管线，可迁移为“文本/框 -> mask -> 人类修正”的工程基线。 |
| SAM 2 | 2024 Meta | [project](https://ai.meta.com/sam2/), [GitHub](https://github.com/facebookresearch/sam2) | GitHub/model weights | 对多帧 memory 和交互式修正友好，可用于多时相遥感标注闭环。 |
| GEOBench-VLM | ICCV 2025 | [CVF PDF](https://openaccess.thecvf.com/content/ICCV2025/papers/Danish_GEOBench-VLM_Benchmarking_Vision-Language_Models_for_Geospatial_Tasks_ICCV_2025_paper.pdf) | [GitHub](https://github.com/The-AI-Alliance/GEO-Bench-VLM) | 可作为 VLM 语义质量和定位能力评估参考，避免把语言答案当作可靠标签。 |

## 3. 方法脉络

### 3.1 传统主动学习

典型做法是用 uncertainty、entropy、margin、BALD、core-set/diversity 或 query-by-committee 选择未标注样本。遥感中它的问题是：随机切片高度冗余，空间相邻样本相关性强，模型最不确定的样本可能只是云、阴影、配准错或异常纹理，并不一定值得人类标注。

### 3.2 Foundation-model-assisted annotation

FMARS 和 RemoteSAM 代表了“自动生成候选标签”的路线：用文本 prompt 或检测器找到目标，再用 SAM/SAM2 得到 mask，必要时生成 caption/referring expression。这个路线降低从零标注成本，但标签质量高度依赖 prompt、类别词表、mask 后处理和人工审核。

### 3.3 Active learning + human-in-the-loop

AL4FM 的关键价值在于把“选哪些样本给人类”与“SAM 如何减少人类绘制成本”合起来。下一步可做得更细：不是只比较标注样本数，而是记录每个样本的交互次数、修正时间、点击数、类别修改数、mask edit distance 和最终性能收益。

## 4. 可投稿方法方案：GeoHITL-AL

建议题目：**GeoHITL-AL: Cost-Aware Active Learning with SAM/VLM Feedback for Remote Sensing Annotation**

### 4.1 闭环流程

1. 未标注池：大幅面光学遥感影像，带可选 metadata，例如坐标、时间、GSD、传感器、行政区、已有 OSM/地图弱标签。
2. 候选生成：GroundingDINO/OpenRSD/RS-VLM 生成类别候选和框；SAM/SAM2/RemoteSAM 生成 mask；CLIP/RS-CLIP/VLM 生成类别描述。
3. 质量估计：计算 mask stability、box-mask agreement、VLM-text agreement、类别置信度、空间覆盖、长尾类别得分和预计人工修正成本。
4. 主动选择：在预算内选择最有价值样本，不只看 uncertainty，还加入 diversity、geo-coverage、rare-class、expected annotation time。
5. 人类纠错：人类只做必要动作：接受、改类、加点、删 mask、合并/拆分、画缺失目标。
6. 反馈更新：更新类别 prompt、negative prompt、prototype memory、SAM point policy 或轻量 adapter；同时把人工修正写入数据卡。
7. 下游训练：训练检测/分割/开放词表模型，评估单位成本收益。

### 4.2 核心打分函数

可定义候选样本 `x` 的选择分数：

```text
Score(x) = value(x) / cost(x)

value(x) =
  w1 * model_uncertainty
  + w2 * geo_diversity
  + w3 * rare_class_score
  + w4 * VLM_SAM_disagreement
  + w5 * expected_generalization_gain

cost(x) =
  c1 * predicted_clicks
  + c2 * predicted_mask_edits
  + c3 * category_ambiguity
  + c4 * object_density
```

关键创新点不是公式本身，而是把 `cost(x)` 学出来：用历史人工纠错日志预测某类 mask 需要多少点击或分钟。

## 5. 实验设计

### 5.1 数据集

| 任务 | 数据集候选 | 为什么适合 |
|---|---|---|
| 目标检测/实例分割 | iSAID, DOTA, xView, DIOR, NWPU VHR-10 | 小目标、旋转目标和密集实例多，适合评估框/mask 自动标注 |
| 语义分割 | LoveDA, DeepGlobe, ISPRS Vaihingen/Potsdam | 跨城市/城乡域差异明显，适合主动学习与域覆盖 |
| 灾害/建筑损毁 | xBD, FMARS | 事件驱动、长尾、标注贵，适合人机协作标注 |
| 开放词表/视觉语言 | VRSBench, GEOBench-VLM, RemoteSAM-270K | 可评估 VLM 生成类别/描述的可靠性 |

### 5.2 Baselines

- Random selection：随机选样。
- Uncertainty AL：entropy/margin/BALD。
- Diversity AL：core-set、embedding clustering。
- Geo-diversity AL：按地理块、城市、季节、GSD 做覆盖。
- FMARS-style auto-labeling：GroundingDINO + SAM 自动标注，不做人类闭环。
- AL4FM-style baseline：主动学习 + SAM 半自动标注。
- Proposed GeoHITL-AL：成本感知 + VLM/SAM disagreement + prompt/prototype feedback。

### 5.3 指标

| 指标 | 定义 |
|---|---|
| mIoU / AP / mAP50:95 | 下游分割/检测性能 |
| Cost-normalized gain | 每 1 小时人工时间带来的 mIoU/AP 提升 |
| Annotation time | 每图/每实例/每类别平均纠错时间 |
| Click count | 每个 mask 的正负点、删除、合并、拆分次数 |
| Mask edit distance | SAM 初始 mask 与人工最终 mask 的差距 |
| Label correction rate | VLM/SAM 初始类别或 mask 被修改的比例 |
| Rare-class recall | 长尾类别召回 |
| Geo coverage | 已标注样本覆盖的地区、季节、GSD、传感器分布 |
| Calibration | 伪标签置信度与人工接受率是否一致 |

### 5.4 标注成本曲线

推荐报告三条曲线：

1. `mIoU/AP vs. labeled images`：传统论文常用，但不足。
2. `mIoU/AP vs. human minutes`：主指标，更公平。
3. `mIoU/AP vs. clicks or corrections`：分析交互式标注效率。

如果能记录真实人工时间最好；如果不能，可用模拟成本：

```text
accept = 1 unit
class_fix = 2 units
add_positive_point = 1 unit
add_negative_point = 1 unit
delete_mask = 1 unit
merge/split = 3 units
draw_polygon = 8 units
```

## 6. 停止准则

建议同时使用四类停止准则：

1. 性能收益趋缓：最近两轮单位成本 mIoU/AP 提升低于阈值。
2. 伪标签接受率稳定：人工接受率高且 correction rate 下降。
3. 地理/类别覆盖达标：城市、季节、GSD、长尾类别覆盖达到预设比例。
4. 风险类仍未收敛：如果灾害、长尾、罕见目标 recall 不达标，则不能仅因平均 mIoU 收敛而停止。

## 7. 失败案例分析

必须单独统计：

- 小目标漏标：车辆、飞机、船、灾损建筑碎片。
- 密集实例粘连：建筑群、集装箱、农田地块。
- 类别语义错：road/runway、bare soil/construction site、water/shadow。
- SAM 边界偏：屋顶阴影、树冠遮挡、低对比边界。
- VLM 幻觉：图中不存在的类别被语言先验生成。
- 地图弱标签过期：OSM/footprint 与影像时间不一致。
- 地理偏置：模型只在某城市或某 GSD 下表现好。

## 8. 未来研究方向

1. **Cost-aware active learning**：把“预计人工修正时间”作为主动学习核心变量。
2. **Disagreement as annotation value**：利用 SAM mask、检测框、VLM 类别和 RS-CLIP 相似度的不一致选择样本。
3. **Prompt/prototype memory**：把人类纠正后的正负点、类别词、视觉 prototype 作为下一轮自动标注的记忆。
4. **Geo-coverage constrained AL**：主动学习中加入地理块、生态区、季节、GSD 约束，避免只选同质样本。
5. **Human-verifiable data cards**：记录每个标签是模型生成、人工确认、人工修改还是人工从零绘制。
6. **Open-vocabulary HITL**：类别词表允许扩展，人类纠错不仅改 mask，也能合并同义词和调整层级 taxonomy。
7. **Multi-temporal HITL**：SAM2 memory 用于同一地点多时相标注，评估是否减少重复修边成本。

## 9. 最小可行实验

第一阶段建议不要做太大：

1. 选 LoveDA 或 iSAID 的一个子集，构造未标注池。
2. 用 GroundingDINO/OpenRSD + SAM/SAM2 生成初始伪标签。
3. 用模拟人工成本或 2-3 名人工标注者记录真实修正。
4. 比较 random、uncertainty、diversity、AL4FM-style、GeoHITL-AL。
5. 预算设置为 30/60/120/240 分钟或等价 click budget。
6. 报告 mIoU/AP、cost-normalized gain、rare-class recall、acceptance rate 和失败案例。

## 10. 读文献顺序

1. [Active Learning Meets Foundation Models, ICCV 2025](https://openaccess.thecvf.com/content/ICCV2025/papers/Burges_Active_Learning_Meets_Foundation_Models_Fast_Remote_Sensing_Data_Annotation_ICCV_2025_paper.pdf)
2. [FMARS, arXiv 2024](https://arxiv.org/abs/2405.20109)
3. [RemoteSAM, arXiv 2025](https://arxiv.org/abs/2505.18022)
4. [Segment Anything, From Space?, WACV 2024](https://openaccess.thecvf.com/content/WACV2024/papers/Ren_Segment_Anything_From_Space_WACV_2024_paper.pdf)
5. [PointSAM, arXiv 2024/2025](https://arxiv.org/abs/2409.13401)
6. [OpenRSD, ICCV 2025](https://openaccess.thecvf.com/content/ICCV2025/html/Huang_OpenRSD_Towards_Open-prompts_for_Object_Detection_in_Remote_Sensing_Images_ICCV_2025_paper.html)
7. [Grounded-SAM-2 GitHub](https://github.com/IDEA-Research/Grounded-SAM-2)
8. [VRSBench, NeurIPS 2024 Datasets & Benchmarks](https://proceedings.neurips.cc/paper_files/paper/2024/file/05b7f821234f66b78f99e7803fffa78a-Paper-Datasets_and_Benchmarks_Track.pdf)


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。
