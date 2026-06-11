# RS-01 SAM Box/Coarse-Mask to Point Prompt Refinement for Optical Remote Sensing


# SAM Box/Coarse-Mask to Point Prompt Refinement for Optical Remote Sensing

## 研究问题

细问题：在光学遥感实例/语义分割中，检测框或粗 mask 已经能给出目标的大致位置，但 SAM/SAM2 对小目标、旋转目标、密集相邻目标和低对比边界仍容易生成粘连、漏分、边界外扩或背景误包含的 mask。这个方向研究如何把 box 或粗 mask 自动转化为更细致的正/负 prompt 点，并用少量迭代让 SAM 输出更稳定的边界。

这个问题不等同于“遥感语义分割”或“把 SAM 用到遥感”。它只关注一个环节：给定 `box`、`rotated box`、`coarse mask` 或检测器输出，如何选择 prompt 点的位置、数量、正负标签和迭代策略。

## 问题由来

SAM 的交互分割在自然图像中很强，但遥感图像有几个结构性差异：

- 目标小：飞机、车、船、屋顶构件在 tile 中只占少量像素，box 内背景比例很高。
- 目标旋转：水平框会包进大量背景，尤其是飞机、船、跑道、细长建筑。
- 目标密集：停车场车辆、建筑群、集装箱等相邻实例容易被一个正点或一个 box 合并。
- 大幅面切片：超大影像被切成 patch 后，目标可能跨 tile，且局部上下文不足。
- 语义与边界分离：CLIP/VLM/检测器知道类别，SAM 主要负责边界；两者之间的误差会传给 prompt。

因此，box prompt 常能定位但边界粗，point prompt 可纠偏但点位选择困难。可投稿的小空间在于：把检测/粗分割的不确定性、边界几何和遥感先验转化成一组正负 prompt 点。

## 代表论文与项目

| 论文/项目 | 年份/venue | 链接 | 官方代码/项目 | 与本问题的关系 |
|---|---:|---|---|---|
| Segment Anything, From Space? | 2024 WACV | https://openaccess.thecvf.com/content/WACV2024/html/Ren_Segment_Anything_From_Space_WACV_2024_paper.html | 未见官方 GitHub | 系统评估 SAM 在 overhead imagery 的失败模式，是遥感 prompt 设计的起点。 |
| SAM-Assisted Remote Sensing Imagery Semantic Segmentation With Object and Boundary Constraints | 2024 IEEE TGRS | https://arxiv.org/abs/2312.02464 | 未见官方 GitHub | 用 SAM object/boundary 约束改善遥感语义分割，提示边界约束可与点 prompt 联合。 |
| DiffuPrompter | 2024 Remote Sensing | https://www.mdpi.com/2072-4292/16/11/2004 | 未确认官方代码 | 训练自由地利用 diffusion attention 产生 box/point prompt，可作为自动 prompt 生成基线。 |
| SAM-RSIS | 2024 IEEE TGRS | https://colab.ws/articles/10.1109%2Ftgrs.2024.3460085 | 未见官方 GitHub | 渐进式 box prompting 与 SAM 微调，适合比较“只有 box”和“box+点 refinement”。 |
| SAMPolyBuild | 2024 ISPRS JPRS | https://www.sciencedirect.com/science/article/pii/S0924271624003563 | https://github.com/wchh-2000/SAMPolyBuild | 建筑多边形提取；支持 bbox 与 prompt points，说明点 prompt 可服务于规则边界/多边形化。 |
| PointSAM | 2024 arXiv / 2025 TGRS方向 | https://arxiv.org/abs/2409.13401 | https://github.com/Lans1ng/PointSAM | 点监督 SAM，提出负提示校准、伪标签自训练和 point-to-box converter，是最相关方法。 |
| CrossCut | 2026 AAAI | https://ojs.aaai.org/index.php/AAAI/article/view/37637 | https://github.com/nanzhou02/CrossCut | 交互式正/负点击跨 patch 传播，解决大图 patch 信息隔离。 |
| RS2-SAM2 | 2026 AAAI / 2025 arXiv | https://arxiv.org/abs/2503.07266 | 未确认官方 GitHub | 用 pseudo-mask dense prompt 适配 SAM2 到遥感 referring segmentation，说明粗 mask prompt 是强信号。 |
| Remote SAMsing | 2026 arXiv | https://arxiv.org/abs/2605.00256 | 未确认官方代码 | 分析 SAM2 遥感大图 mask quality/coverage trade-off 与 tiling 问题，可作为后续评测参考。 |
| SAM2 official | 2024 Meta | https://github.com/facebookresearch/sam2 | https://github.com/facebookresearch/sam2 | 基础模型与 image/video prompt API；可用于实现 box+points+mask 输入组合。 |
| segment-geospatial / SamGeo | 持续维护 | https://github.com/opengeos/segment-geospatial | https://github.com/opengeos/segment-geospatial | 工具型基线，方便在真实 GeoTIFF/QGIS 工作流中验证自动 prompt。 |

说明：上表中的“未确认官方 GitHub”表示截至本次检索没有找到清晰的作者官方代码仓库；可用论文实现或第三方复现替代，但复现实验中应标注。

## 现有 prompt 策略拆解

### 1. Box-only

流程：检测器或人工框给 `x1,y1,x2,y2`，直接作为 SAM box prompt。

优点：稳定、简单、对单个大目标常有效。

失败模式：

- 水平框包住旋转目标和背景，mask 外扩。
- 密集实例在一个 box 内粘连。
- 细长目标如道路/水渠只靠 box 容易短断或吞掉背景。

### 2. Box + Center Positive Point

流程：在 box 中心或 coarse mask 的质心处加一个正点。

优点：能强调目标主体，减少 box 内背景干扰。

失败模式：

- 小目标/细长目标中心点可能落在空洞、阴影或背景。
- 多实例 box 的中心点不能说明要分哪一个实例。
- 对建筑物，中心点对边界规整化帮助有限。

### 3. Box + Boundary Negative Points

流程：沿 box 边缘、粗 mask 外环或高不确定区域采样负点，约束 SAM 不要外扩。

优点：直接抑制背景，适合旋转目标、建筑边界和密集实例。

失败模式：

- 负点太靠近真实边界会切掉目标。
- 粗 mask 本身错误时，负点会强化错误。
- 遥感边界低对比时，负点数量过多可能导致 mask 破碎。

### 4. Coarse Mask + Skeleton/Interior Positive Points

流程：从 coarse mask 内部距离变换最大值、骨架端点、连通域中心采样正点。

优点：比 box center 更贴近目标形状；适合细长或不规则目标。

失败模式：

- 粗 mask 漏掉的部分很难靠内部点恢复。
- 断裂道路/河流会产生多个连通域，需要实例/语义任务区别处理。

### 5. Uncertainty-Driven Iterative Requery

流程：先运行 SAM 得到 mask，再比较 coarse mask/边界梯度/检测框，挑选 disagreement 区域采样正负点，重新 query SAM。

优点：能把“哪里错了”显式转成 prompt。

失败模式：

- 需要设计停止条件，否则计算开销高。
- 如果第一轮 mask 极差，后续点会被错误区域牵引。
- 多个候选 mask 的选择策略会影响稳定性。

### 6. Cross-Patch Click Propagation

流程：对大图切片后，把正/负点击或自动点传播到相关 patch；融合不同 patch 配置下的 mask。

优点：缓解大图分块导致的上下文断裂，CrossCut 已证明这条线有价值。

失败模式：

- 点传播需要知道目标跨 patch 的空间关系。
- 对小而密集目标，传播过宽会引入邻近实例。

## 可投稿方法方案：B2P-RS-SAM

名称草案：B2P-RS-SAM: Geometry- and Uncertainty-Aware Box-to-Point Prompt Refinement for Remote Sensing SAM

### 核心假设

给定检测框或粗 mask，与其直接把 box 交给 SAM，不如自动生成少量高置信正点和高价值负点。正点负责锁定目标主体，负点负责排除背景/邻近实例，迭代点负责修正第一轮 SAM 的不确定边界。对小目标、旋转目标和密集目标，这种 prompt 比单 box 更能提升边界质量。

### 输入

- `box`：来自 YOLO/Mask R-CNN/GroundingDINO/已有检测标注。
- 可选 `coarse_mask`：来自语义分割模型、SAM-RSIS/SAMPolyBuild 初始输出、弱监督伪标签。
- 可选 `rotated_box` 或方向估计：从 mask 主轴 PCA、最小外接矩形或检测器 OBB 得到。

### 点采样模块

1. Interior positive points
   - 对 coarse mask 做距离变换，选 top-k 距离峰值。
   - 无 mask 时，在 box 内使用 GrabCut/SLIC/边缘响应估计前景中心，退化为 center + 角度主轴点。

2. Boundary negative points
   - 从 box 外扩环、coarse mask 外环、rotated box 与 horizontal box 的差集采样。
   - 负点避开高前景置信区域，降低误伤边界。

3. Neighbor-separation negative points
   - 在检测框内或附近寻找其他连通域/其他检测框中心，作为负点抑制粘连。
   - 对 iSAID 的 small vehicle、ship、plane 类尤其关键。

4. Uncertainty requery points
   - 第一轮 SAM 输出后，计算 `SAM_mask XOR coarse_mask`、边界梯度低置信区和 mask logits 边界带。
   - 在 false positive 区采负点，在 false negative 区采正点。

5. Prompt budget controller
   - 限制点数，例如 `1/3/5/9` 点。
   - 小目标优先少点，密集目标优先负点，细长目标优先骨架点。

### 训练/推理路线

最小路线可以完全 training-free：

1. 用现有检测框或 GT box 模拟检测器输出。
2. 用 SAM/SAM2 运行 box-only baseline。
3. 用 B2P 生成 `box + points`，运行 SAM/SAM2。
4. 用一轮 requery 得到 `box + points + previous mask`。
5. 对比 PointSAM、SAMPolyBuild prompt 模式、CrossCut 交互式点或论文可复现部分。

增强路线：

- 训练一个轻量 point scorer，输入局部图像 patch、coarse mask、边界梯度、SAM logits，输出候选点价值。
- 用强化学习或贪心搜索学习“下一点”策略，但先用启发式打出强 baseline。

## 实验矩阵

| 实验组 | Prompt 输入 | 是否训练 | 目标问题 | 预期观察 |
|---|---|---:|---|---|
| A0 | box only | 否 | 基线 | 大目标可用，小/旋转/密集目标边界差。 |
| A1 | box + center positive | 否 | 前景锁定 | 外扩减少，但粘连仍明显。 |
| A2 | box + interior positives | 否 | 小目标主体定位 | 小目标 recall/IoU 提升。 |
| A3 | box + boundary negatives | 否 | 旋转和背景抑制 | FP、boundary error 降低。 |
| A4 | box + neighbor negatives | 否 | 密集实例分离 | AP50/AP75、粘连率改善。 |
| A5 | coarse mask + skeleton positives | 否 | 细长/不规则目标 | 道路、水体、建筑边界更稳。 |
| A6 | A2+A3+A4 | 否 | 组合 prompt | 主实验方法。 |
| A7 | A6 + one requery | 否 | 迭代纠错 | 边界 F1 和 AP75 提升。 |
| A8 | learned point scorer | 是 | 学习点价值 | 与启发式比较，验证是否值得训练。 |
| A9 | Cross-patch propagation | 可选 | 大图 patch 问题 | 跨 tile 断裂减少，但需控制误传播。 |

## 数据集建议

| 数据集 | 任务 | 链接 | 用途 |
|---|---|---|---|
| iSAID | 航空实例分割/检测 | https://arxiv.org/abs/1905.12886 | 主数据集；适合 small vehicle、ship、plane、storage tank 等小/密集/旋转目标。 |
| ISPRS Vaihingen/Potsdam | 城市语义分割 | https://www.isprs.org/resources/datasets/benchmarks/UrbanSemLab/semantic-labeling.aspx | 建筑、道路、树木等语义边界；适合边界 F1 和建筑规整性实验。 |
| LoveDA | 跨域语义分割 | https://github.com/Junjue-Wang/LoveDA | 城乡域偏移；测试 prompt 策略是否跨区域稳定。 |
| WHU Building / Inria Aerial | 建筑提取 | 可按任务补充 | 建筑边界与多边形化，衔接 SAMPolyBuild。 |
| DOTA / FAIR1M | 旋转目标检测 | 可选 | 若只有 OBB/检测框，可用于 rotated box-to-point 评测。 |

## 指标

实例分割：

- COCO-style `AP`, `AP50`, `AP75`, `AP_small/medium/large`
- mask IoU、per-class AP
- 粘连率：一个预测 mask 覆盖多个 GT 实例的比例
- 漏分率：box 内 GT 未被 mask 覆盖的比例

语义/边界：

- mIoU、F1、OA
- Boundary F1 / trimap IoU
- Hausdorff distance 或 contour Chamfer distance
- 建筑任务可加 polygon IoU、corner F1、regularity score

交互/自动 prompt 成本：

- 每实例点数：NoC@IoU=0.85/0.90
- 单图推理时间、SAM query 次数
- 点类型消融：正点、负点、边界点、不确定点各自贡献

## 关键消融

1. 点数：`1, 3, 5, 9`。
2. 点类型：center positive、distance-transform positive、boundary negative、neighbor negative、uncertainty points。
3. 输入质量：GT box、检测器 box、扰动 box、coarse mask。
4. SAM 版本：SAM ViT-B/H、SAM2 image mode。
5. 目标类型：小目标、旋转目标、密集目标、建筑大目标、细长目标。
6. tile 尺寸：`512, 1024, 2048`，是否跨 patch 传播。
7. 是否一轮 requery。

## 预期贡献点

- 一个面向遥感目标几何的 box-to-point 自动 prompt 策略。
- 一个可复现 benchmark：同一批 box/coarse mask 下比较 box-only、人工/自动点、PointSAM 类方法和 CrossCut 类交互策略。
- 一个错误分析协议：区分外扩、粘连、漏分、边界锯齿、跨 patch 断裂。
- 一个轻量训练扩展：point scorer 或 prompt budget controller。

## 风险与规避

- 风险：方法看起来像 prompt heuristic，技术贡献弱。  
  规避：把启发式抽象为候选点价值函数，并用不确定性/几何/邻域分离三个可解释信号统一。

- 风险：只在 GT box 上有效。  
  规避：必须加入检测器 box 和扰动 box 实验，并报告对 box 噪声的敏感性。

- 风险：负点误伤真实目标边界。  
  规避：负点与前景距离阈值绑定，使用 mask logits 或边界梯度避开高前景区域。

- 风险：SAM2/SAM3 新模型本身提升掩盖方法贡献。  
  规避：在 SAM、SAM2 上都报告相对提升，把贡献限定为 prompt 生成器。

## 最小复现实验计划

1. 数据准备：iSAID 选 4 类小/密集/旋转目标，Potsdam/Vaihingen 选建筑和道路。
2. 构造输入：从 GT mask 生成 GT box、扰动 box、coarse mask；另接一个 YOLO/Mask R-CNN 检测器输出。
3. 基线：box-only SAM、box+center、PointSAM 官方实现、SAMPolyBuild prompt 模式、CrossCut 可运行部分。
4. 方法：实现 B2P 点采样，先 training-free。
5. 评测：AP/AP75/Boundary F1/粘连率/点数/推理时间。
6. 消融：点类型、点数、box 噪声、目标大小、旋转角、密集度。
7. 可视化：每类展示 box-only、box+points、requery 的 mask 差异和点位。

## 未来研究方向

1. Rotated box-to-points：把水平框与 OBB 的差集转成负点，专门解决旋转目标背景过多。
2. Prompt uncertainty calibration：用 SAM mask logits 判断下一点，而不是只用几何规则。
3. Neighbor-aware negative prompts：利用邻近检测框/实例候选自动采负点，降低密集小目标粘连。
4. Cross-tile prompt propagation：借鉴 CrossCut，把一个目标跨 tile 的点与 mask 联合传播。
5. Weak annotation loop：点标注 -> SAM mask -> 自动负点纠错 -> 人工少量复核，量化每个点节省多少标注成本。
6. Dense mask prompt distillation：借鉴 RS2-SAM2，把点 refinement 产生的 mask 蒸馏成 dense prompt generator。

## 推荐论文阅读顺序

1. Segment Anything, From Space?
2. PointSAM
3. SAMPolyBuild
4. SAM-RSIS
5. CrossCut
6. RS2-SAM2
7. Remote SAMsing

