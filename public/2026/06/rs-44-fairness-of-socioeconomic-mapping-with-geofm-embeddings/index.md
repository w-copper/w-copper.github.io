# RS-44 Fairness of Socioeconomic Mapping with GeoFM Embeddings


# RS-44 Fairness of Socioeconomic Mapping with GeoFM Embeddings

## 结论摘要

这个方向的关键不在于“GeoFM embedding 能不能预测财富/人口/基础设施”，而在于：这些预测误差是否会系统性落在农村、低收入、非洲/拉美、非核心城市、非正式住区、低人口密度地区，以及这些误差是否会改变政策资源排序。

2024-2026 的新变化是，社会经济遥感从手工夜光/道路/建筑 covariates 和 CNN poverty mapping，进入了 embedding-as-data 阶段：AlphaEarth Foundations 提供全球年度 10 m、64 维 embedding；PDFM/Population Dynamics Foundation Model 提供面向人口动态、健康、社会经济和环境任务的地理 embedding；Tempov 把双时相 Landsat 自监督预训练用于财富监测；Prithvi、Clay 等 Earth embeddings 也被用于城市指标预测。

但公平性风险没有自动消失。已有 poverty-map 公平性研究已经证明，卫星贫困图存在城市/农村代表性差异、系统性误差和下游资源分配影响。新一代 GeoFM embedding 反而让风险更值得研究：同一个 embedding 会被复用于很多下游任务，一旦它对某类地区编码不足，误差会被复制到人口、财富、健康、基础设施等多条政策链路。

最值得做的小课题：**GeoFM 社会经济制图的 fairness-aware evaluation benchmark**。它不训练一个更大模型，而是在 AlphaEarth/PDFM/Tempov/Prithvi/Clay/传统 geospatial covariates 上统一报告平均精度、分组误差、最差组误差、空间尺度错配、排序公平性和政策敏感性。

## 问题由来

传统 poverty/population mapping 使用 DHS/LSMS/census 等少量地面标签，结合夜间灯光、道路、建筑、土地覆盖、地形、POI、气候或移动网络数据，把区域财富、人口或基础设施指标推断到未调查区域。这个路线有三个老问题：

- 标签分布不均：调查点常按人口和行政区抽样，低密度农村、非正式住区、边境地区、小岛、冲突地区更少。
- 图像-社会经济关系非平稳：同样的屋顶、道路、农田或夜光，在不同国家/城乡/气候带代表的财富含义不同。
- 平均指标掩盖政策风险：一个模型整体 R² 高，但如果系统性低估农村贫困或非正式住区人口，就会影响资源分配。

GeoFM embedding 带来了更强的表征，但也引入新问题：

- embedding 可能更像“建成环境相似度”，对收入、政策、社会网络、非正式经济等不可见因素弱。
- 预计算 embedding 有固定空间尺度，人口/财富标签常是 cluster、admin、grid、parcel、neighborhood 等多尺度混合。
- 多源 foundation model 可能包含搜索、移动、地图、POI 等数字行为数据，这些数据本身代表性不均。
- downstream 用户容易直接训练 shallow model 并发布地图，却没有检查城市/农村、国家、收入组和空间尺度上的误差差异。

## 代表论文与资源

| 论文/项目 | 年份 | 链接 | 代码/数据 | 和公平性问题的关系 |
|---|---:|---|---|---|
| AlphaEarth Foundations: An embedding field model for accurate and efficient global mapping from sparse label data | 2025 | [arXiv](https://arxiv.org/abs/2507.22291), [Google DeepMind blog](https://deepmind.google/blog/alphaearth-foundations-helps-map-our-planet-in-unprecedented-detail/) | [Earth Engine Satellite Embedding V1](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL) | 全球年度 10 m、64 维 embedding，适合 sparse-label mapping；公平性要检查不同地区和社会经济组的 embedding utility。 |
| General Geospatial Inference with a Population Dynamics Foundation Model | 2024/2026 revision | [arXiv](https://arxiv.org/abs/2411.07207) | [GitHub](https://github.com/google-research/population-dynamics) | PDFM 用 maps、busyness、search trends、weather、air quality 等构建地理 embedding，预测健康、社会经济和环境任务；需要检查数字行为数据代表性偏差。 |
| Geospatial foundation-model embeddings improve population estimation unevenly across space and scale | 2026 | [arXiv](https://arxiv.org/abs/2605.01650) | 未见独立代码 | 直接指出 PDFM embedding 对 Brazil/Nigeria/US 人口估计的收益在空间和尺度上不均，GeoFM 不能简单替代传统 covariates。 |
| A satellite foundation model for improved wealth monitoring | 2026 | [arXiv](https://arxiv.org/abs/2604.23166) | arXiv 页称 open-source approach；当前需进一步核验官方 repo | Tempov 用 300 万双时相 Landsat 对自监督预训练，并用参数高效微调做财富监测；应检查 nowcast/hindcast 在国家、城乡和收入组上的误差。 |
| Earth Embeddings Reveal Diverse Urban Signals from Space | 2026 | [arXiv](https://arxiv.org/abs/2604.03456), [HF paper page](https://huggingface.co/papers/2604.03456) | 未见官方代码 | 比较 AlphaEarth、Prithvi、Clay 预测 6 个美国都市区的 14 个 neighborhood indicators；发现跨城市表现差异明显，适合作为城市内部公平性评估参考。 |
| Slum Detection and Density Mapping with AlphaEarth Foundations | 2026 | [arXiv](https://arxiv.org/abs/2605.10029) | 未见官方代码 | 用 AlphaEarth 做 12 城市 slum classification/density；发现跨城转移和密度梯度建模仍难，说明非正式住区是公平性压力测试场景。 |
| Fairness and representation in satellite-based poverty maps | 2023 | [arXiv](https://arxiv.org/abs/2305.01783) | 需进一步核验 | 虽早于 2024，但它定义了本方向的核心问题：城市/农村代表性、系统性误差和下游政策排序影响。 |
| Mitigating Urban-Rural Disparities in Contrastive Representation Learning with Satellite Imagery / FairDCL | 2024 AIES | [NSF record](https://par.nsf.gov/biblio/10592949-mitigating-urban-rural-disparities-contrastive-representation-learning-satellite-imagery), [arXiv](https://arxiv.org/abs/2211.08672) | 未见主 repo | 用 fair dense contrastive learning 减少城市/农村表示差异；可迁移到 GeoFM embedding 的公平预训练或后处理。 |
| SustainBench / Poverty prediction over space and time | 2021 benchmark, still active | [GitHub](https://github.com/sustainlab-group/sustainbench), [Leaderboard](https://sustainlab-group.github.io/sustainbench/leaderboard/), [arXiv](https://arxiv.org/abs/2111.04724) | 公开 benchmark/code | 不是 2024 新论文，但仍是 poverty mapping 和 SDG 任务的核心复现实验框架。 |
| PovertyMap-WILDS | 2021 benchmark, still useful | [WILDS paper/data context](https://wilds.stanford.edu/) | WILDS package | 按国家和 urban/rural 定义 domain；适合最差组性能和跨国泛化评估。 |
| WorldPop | 持续更新 | [official](https://www.worldpop.org/) | 开放人口数据 | 传统 population mapping 强基线和辅助标签来源；其 constrained/unconstrained 选择本身影响公平性。 |
| Global Human Settlement Layer / GHS-POP | 2023/2024 atlas and updates | [JRC GHSL](https://data.jrc.ec.europa.eu/collection/ghsl), [GHS-POP R2023A](https://human-settlement.emergency.copernicus.eu/ghs_pop2023.php) | 官方数据 | 人口和 built-up baseline；城市/农村定义、built-up mask 和 coarse grid 会影响下游公平性。 |
| High-resolution urban and rural settlement map of Africa | 2025 | [Scientific Reports](https://www.nature.com/articles/s41598-025-34295-7) | 论文数据需核验 | 10 m urban/rural settlement map，可作为非洲城乡分组和 settlement-type fairness label。 |

## 方法脉络

### 1. 传统 covariates + survey labels

输入包括 night lights、built-up、roads、land cover、elevation、climate、population products、POI 和 admin features；标签来自 DHS/LSMS/census/ACS 等。模型通常是 RF、GBDT、Bayesian small-area estimation、CNN 或 CNN feature + regression。

优点是变量物理含义清楚，便于解释 group error。缺点是特征工程重、跨国 harmonization 难、对 informal settlement 和 rural heterogeneity 不够敏感。

公平性风险：如果模型主要依赖夜光或道路，它可能低估无电、非正式、农村或低收入地区的真实人口/贫困。

### 2. GeoFM embedding + shallow supervised learner

代表：AlphaEarth embedding、Prithvi/Clay embedding、Satlas/SatCLIP features。常见做法是对 grid/neighborhood/admin 单元聚合 embedding，然后训练 linear model、GBDT、RF、MLP。

优点是数据准备成本低，跨任务复用强，特别适合 sparse labels。缺点是 embedding 的语义黑箱，且可能强烈绑定预训练尺度和输入数据分布。

公平性风险：平均 R² 提升可能来自城市或建成环境强相关区域；农村、低收入、非正式住区、低密度地区的误差可能没有改善。

### 3. Population / socioeconomic foundation model

代表：PDFM 和 Tempov。PDFM 融合地图、busyness、search trends、天气/空气质量等人群动态数据；Tempov 直接面向 wealth monitoring，使用双时相 Landsat 自监督预训练再参数高效微调。

优点是目标更接近社会经济任务。缺点是如果输入含数字行为或平台数据，代表性偏差更复杂；如果只用 Landsat，很多不可见的社会制度、价格、政策和服务质量仍然难从影像推断。

公平性风险：模型可能在数据丰富、手机/搜索行为代表性强、城市形态标准化地区更准，在边缘群体和低连接地区更差。

### 4. Fairness-aware representation / post-hoc evaluation

代表：FairDCL 和 satellite poverty-map fairness 研究。它们的核心启发是：遥感社会经济模型不能只报告平均准确率，要显式检查 group-wise error、representation distance、policy ranking effects。

对 GeoFM 的迁移方式：

- 对 frozen embedding 做 group-wise utility audit。
- 对 embedding 做 domain adversarial/fair contrastive debiasing。
- 对 downstream head 做 group reweighting 或 distributionally robust optimization。
- 对最终地图做 policy simulation：资源按预测值排序时，哪些群体被系统性漏掉。

## 公平性定义与指标

建议把公平性分为四层，而不是只用一个 fairness metric。

### 1. 表征公平性

目标：不同群体的 embedding 是否同样有用，而不是同样分布。

可报告：

- group-wise linear probe R² / MAE / RMSE。
- embedding kNN coverage：每个测试点最近邻训练样本是否来自同国家/城市/城乡。
- representation drift：不同国家、城市、rural/urban、收入分位的 embedding 分布距离。
- label-conditional alignment：同一财富/人口区间内，不同群体 embedding 是否偏移。

### 2. 预测公平性

目标：不同群体误差是否系统性不均。

可报告：

- group MAE/RMSE/MAPE/R²。
- worst-group MAE 和 worst-group R²。
- error parity gap：`max(group_error) - min(group_error)`。
- signed bias：`mean(y_pred - y_true)`，区分系统性高估/低估。
- income-quantile error：最低 20% 和最高 20% 的误差差距。

### 3. 空间公平性

目标：误差是否集中在特定空间结构。

可报告：

- Moran's I of residuals。
- spatial block residual map。
- urban/rural/peri-urban/remote settlement strata。
- scale transfer gap：cluster -> grid、admin2 -> grid、county -> ZIP、city -> block group。
- density-conditioned error：按人口密度、building density、night-light intensity 分组。

### 4. 政策公平性

目标：模型误差是否改变资源分配。

可报告：

- top-k targeting recall：真正最贫困/最缺基础设施区域有多少进入预测 top-k。
- group allocation share gap：资源预算按预测分配后，各群体获得比例与真实需要比例差异。
- false exclusion rate：需要援助却没被模型选中的区域比例。
- ranking swap rate：真实排名相近区域因模型误差发生排序翻转的比例。
- budget sensitivity curve：预算从 top 5% 到 top 30% 时不同群体覆盖率变化。

## 具体实验设计

### 任务 A：人口估计公平性

目标：评估 GeoFM embedding 对 population estimation 的收益是否跨国家、城乡和尺度稳定。

数据：

- 标签：WorldPop、GHSL/GHS-POP、国家 census/admin counts，或 PDFM population estimation paper 的 Brazil/Nigeria/US 设置。
- 特征：AlphaEarth annual embedding、PDFM embedding、传统 covariates、night lights、built-up、roads、land cover。
- 分组：country、admin level、urban/rural、population density quintile、settlement type、income proxy。

模型：

- Covariates + GBDT。
- AlphaEarth embedding + GBDT/MLP。
- PDFM embedding + GBDT/MLP。
- Covariates + embedding hybrid。

评价：

- 平均 R²/KL divergence/MAE。
- worst-country、worst-urbanicity、worst-density-bin error。
- scale transfer：训练 admin2，测试 grid/admin3；训练 grid，聚合到 admin。

### 任务 B：财富/贫困监测公平性

目标：评估 wealth prediction 模型是否在城乡、国家、收入分位、时间 shift 下公平。

数据：

- 标签：DHS/LSMS asset wealth index、SustainBench poverty over space/time、PovertyMap-WILDS、Tempov wealth monitoring 论文设置。
- 特征：Landsat/Sentinel imagery、AlphaEarth embedding、Tempov/Prithvi/Clay features、night lights、mobile/connectivity features 如果可用。
- 分组：country、urban/rural、wealth quintile、survey year、region、HDI/income group。

模型：

- CNN/ResNet poverty baseline。
- SustainBench/WILDS baseline。
- AlphaEarth + RF/GBDT。
- Tempov-style PEFT。
- Hybrid covariates + embeddings。

评价：

- Pearson r/R²/MAE。
- underestimation bias for poorest quintile。
- rural false exclusion rate in top-poverty targeting。
- temporal fairness：训练旧年份，nowcast 到新年份时的 group error。

### 任务 C：城市 neighborhood indicators

目标：检查 Earth embeddings 预测收入、健康、交通、犯罪、基础设施等指标时，哪些指标和城市群体更不公平。

数据：

- 标签：ACS/census tract/block group、city open data、health burden、commute mode、income、infrastructure access。
- 特征：AlphaEarth、Prithvi、Clay embeddings，POI/road/transit covariates。
- 分组：city、race/ethnicity composition proxy、income quintile、urban form cluster、central/peripheral、transit access。

模型：

- city-wise model。
- global multi-city model。
- leave-one-city-out model。
- city-year transfer model。

评价：

- group-wise R²/MAE。
- city transfer gap。
- protected-attribute proxy error gap。
- indicator visibility score：指标是否主要由 built environment 决定。

### 任务 D：非正式住区/slum mapping

目标：把 slum/informal settlement 作为 GeoFM fairness 的压力测试。

数据：

- AlphaEarth slum detection paper 的 12 城市设置。
- GRAM pseudo masks、slum/informal settlement local labels、OpenStreetMap/POI auxiliary features。
- 分组：city、region、slum density、urban core/periphery、label source quality。

模型：

- AlphaEarth + RF/GBDT/MLP。
- AlphaEarth + POI/road/building features。
- Prithvi/Clay features if available。

评价：

- spatial block F1。
- positive-pixel density R²。
- cross-city transfer F1。
- low-density slum recall。
- full-AOI spatial consistency。

## 推荐最小可复现实验

第一版可以只做三个公开可得程度高的组合：

1. **SustainBench/PovertyMap-WILDS + AlphaEarth/传统 covariates**
   - 目标：复现 poverty prediction over space。
   - 分组：country x urban/rural。
   - 重点指标：worst-group MAE、poorest-quintile underestimation、top-k targeting recall。

2. **PDFM population estimation audit**
   - 目标：复现或近似 2026 PDFM population paper 的 Brazil/Nigeria/US 对比。
   - 分组：country、admin scale、density bin。
   - 重点指标：scale transfer gap、embedding-vs-covariate complementarity。

3. **Urban indicator benchmark with AlphaEarth/Prithvi/Clay**
   - 目标：参考 Earth Embeddings Reveal Diverse Urban Signals 的 6-city setting。
   - 分组：city、income quintile、central/peripheral。
   - 重点指标：leave-one-city-out R²、low-income neighborhood MAE、indicator visibility score。

## 可投稿的小方法方案

### 题目草案

FairGeoSE: Fairness-Aware Evaluation of Geospatial Foundation Embeddings for Socioeconomic Mapping

### 核心假设

GeoFM embeddings 能提升社会经济制图平均性能，但收益在空间、尺度和社会群体之间不均；将 embedding 与传统 physically grounded covariates 结合，并采用 fairness-aware validation，比单独使用 embedding 更稳。

### 方法模块

1. **统一数据卡**
   - 每个样本记录坐标、时间、label source、spatial support、urban/rural、income quintile、country、settlement type、population density。

2. **多表征基线**
   - Traditional covariates。
   - AlphaEarth embedding。
   - PDFM embedding。
   - Prithvi/Clay embedding。
   - Hybrid covariates + embeddings。

3. **公平性评估器**
   - 自动生成 group-wise metrics。
   - 输出 residual spatial autocorrelation。
   - 输出 top-k resource allocation simulation。
   - 输出 scale transfer matrix。

4. **轻量修正策略**
   - Group reweighting。
   - Spatial block balanced sampling。
   - Hybrid stacking with interpretable covariates。
   - Conformal prediction by group。

### 预期贡献

- 一个面向 GeoFM 社会经济制图的公平性评估协议。
- 一个可复现的多任务 benchmark：population、wealth、urban indicators。
- 一个结论清楚的实证发现：embedding 在哪些群体和尺度上有效，在哪些地方需要传统 covariates 或校准。
- 一个可落地工具：给地图发布者生成 fairness report card。

## 实验矩阵

| 维度 | 设置 |
|---|---|
| 任务 | population estimation, wealth prediction, neighborhood indicator prediction, slum/informal settlement mapping |
| 特征 | traditional covariates, AlphaEarth, PDFM, Prithvi, Clay, Tempov where available, hybrid |
| 模型 | linear/ridge, RF, LightGBM/XGBoost, MLP, PEFT if model weights available |
| 切分 | random, spatial block, leave-country-out, leave-city-out, leave-year-out, leave-scale-out |
| 分组 | urban/rural, country, income quintile, density quintile, city core/periphery, settlement type |
| 平均指标 | R², Pearson r, MAE, RMSE, KL divergence for population distribution |
| 公平指标 | worst-group error, error parity gap, signed bias, false exclusion rate, top-k targeting recall |
| 空间指标 | residual Moran's I, spatial block error map, scale transfer gap |
| 政策指标 | allocation share gap, budget sensitivity curve, ranking swap rate |

## 失败模式清单

- **城市高分、农村低分**：道路、夜光、建筑特征在城市更强，农村贫困和农业收入更难从影像看出。
- **富裕区高估、贫困区低估**：模型学习到 built-up density 或道路质量，但无法识别拥挤、非正式就业、租房压力。
- **跨国失效**：相同物理形态在不同国家代表的财富水平不同。
- **尺度错配**：10 m embedding 聚合到 admin unit 后有用，但从 admin label 反推 grid-level poverty 时不可靠。
- **数字行为偏差**：PDFM 类模型中的 search/busyness 数据可能低估低连接人群。
- **非正式住区漏检**：slum 的视觉形态和本地政策定义差异大，跨城市迁移弱。
- **政策排序翻转**：平均误差不大，但 top-k 最贫困地区排序不稳定，影响资源分配。

## 未来研究方向

1. **Group-aware GeoFM embedding audit**
   - 不改模型，只审计 AlphaEarth/PDFM/Prithvi/Clay 在不同群体上的 utility。

2. **Embedding + covariate complementarity**
   - 研究何时传统 covariates 比 embedding 更公平，何时 hybrid 最稳。

3. **Conformal poverty maps**
   - 不只给点估计，而给 group-calibrated prediction interval。

4. **Policy-simulation benchmark**
   - 将模型误差直接转化为资源分配结果，评估地图是否会漏掉弱势群体。

5. **Fair contrastive adaptation for GeoFM**
   - 借鉴 FairDCL，对 frozen embedding 或 adapter 做城市/农村、国家、收入组去偏。

6. **Spatial support-aware learning**
   - 显式建模 label 的空间支持范围，降低 cluster/admin/grid 混用造成的不公平。

7. **Informal settlement as stress test**
   - 用 slum/informal settlement mapping 测试 GeoFM 是否能捕捉社会经济弱势区域，而不只是美观的建成环境。

## 下一步阅读队列

1. [Fairness and representation in satellite-based poverty maps](https://arxiv.org/abs/2305.01783)
2. [Mitigating Urban-Rural Disparities in Contrastive Representation Learning with Satellite Imagery](https://par.nsf.gov/biblio/10592949-mitigating-urban-rural-disparities-contrastive-representation-learning-satellite-imagery)
3. [General Geospatial Inference with a Population Dynamics Foundation Model](https://arxiv.org/abs/2411.07207)
4. [Geospatial foundation-model embeddings improve population estimation unevenly across space and scale](https://arxiv.org/abs/2605.01650)
5. [A satellite foundation model for improved wealth monitoring](https://arxiv.org/abs/2604.23166)
6. [Earth Embeddings Reveal Diverse Urban Signals from Space](https://arxiv.org/abs/2604.03456)
7. [Slum Detection and Density Mapping with AlphaEarth Foundations](https://arxiv.org/abs/2605.10029)
8. [AlphaEarth Foundations](https://arxiv.org/abs/2507.22291) and [Satellite Embedding V1](https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_SATELLITE_EMBEDDING_V1_ANNUAL)
9. [SustainBench](https://github.com/sustainlab-group/sustainbench)
10. [WorldPop](https://www.worldpop.org/) and [GHSL](https://data.jrc.ec.europa.eu/collection/ghsl)

