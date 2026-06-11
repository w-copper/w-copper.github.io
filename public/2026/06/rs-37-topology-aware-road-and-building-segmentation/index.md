# RS-37 Topology-Aware Road and Building Segmentation


# RS-37 Topology-Aware Road and Building Segmentation

> 系列定位：这是一篇可独立发布的研究博客草稿，来自 `RS-37` 细分方向调研。它聚焦一个小问题，而不是泛泛讨论大方向。

## 摘要

更新时间：20260607 摘要 道路和建筑分割不能只看像素 IoU。道路需要连通，建筑需要规则边界、角点和拓扑一致，普通 mask 即使 mIoU 高也可能出现道路断裂、建筑边界锯齿、孔洞和相邻建筑粘连。20242026 的相关工作包括 SAMRoad、TopoRFNet、connectivitypreserving loss、Pix2Poly、P2PFo

## 正文

# RS-37 Topology-Aware Road and Building Segmentation

更新时间：2026-06-07

## 摘要

道路和建筑分割不能只看像素 IoU。道路需要连通，建筑需要规则边界、角点和拓扑一致，普通 mask 即使 mIoU 高也可能出现道路断裂、建筑边界锯齿、孔洞和相邻建筑粘连。2024-2026 的相关工作包括 SAM-Road、TopoRF-Net、connectivity-preserving loss、Pix2Poly、P2PFormer、SAMPolyBuild 和 polygon-native building extraction。最值得做的小课题是将 topology-aware loss、vector prior 和 SAM/polygon decoder 结合，专门评价“地图可用性”。

## 问题由来

遥感基础模型擅长提供强特征或候选 mask，但 GIS 产品需要道路网络和建筑轮廓。像素级分割错误一旦进入路网或建筑 footprint，会造成导航断裂、地块统计错误和灾损估计偏差。因此拓扑指标与 vectorization 是从研究分割走向实际地图生产的关键。

## 代表论文与项目

| 工作 | 年份 | 链接 | 贡献 |
|---|---:|---|---|
| SAM-Road | 2024 CVPRW | [GitHub](https://github.com/htcr/sam_road) | 用 SAM/图结构做大规模向量化道路网络提取。 |
| P2PFormer | 2024 | [arXiv summary](https://researchtrend.ai/papers/2406.02930) | primitive-to-polygon，先预测点线角等几何 primitive，再生成建筑轮廓。 |
| Adaptive Structure-Aware Connectivity-Preserving Loss | 2025 WACVW | [CVF PDF](https://openaccess.thecvf.com/content/WACV2025W/CV4EO/papers/Shojaei_Adaptive_Structure-Aware_Connectivity-Preserving_Loss_for_Improved_Road_Segmentation_in_Remote_WACVW_2025_paper.pdf) | 针对道路连通性的结构感知损失。 |
| Pix2Poly | 2025 WACV | [GitHub](https://github.com/yeshwanth95/Pix2Poly) | 端到端 polygonal building footprint extraction。 |
| MT-RoadNet/MTNet | 2025 IJAEOG | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1569843225007277), [GitHub](https://github.com/508hz1207/MTNet) | 道路 surface/centerline 联合提取，关注 topology-aware representation。 |
| TopoRF-Net | 2025 | [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12736503/) | 多分辨率遥感道路提取中的 connectivity-preserving framework。 |
| SAMPolyBuild | 2024 ISPRS JPRS | [ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0924271624003563) | 将 SAM 适配到建筑 polygon extraction。 |

## 方法脉络

1. 后处理路线：先 segmentation，再 skeletonization、graph repair、polygon simplification。
2. 拓扑损失路线：训练时约束连通性、中心线、边界和孔洞。
3. 图/矢量路线：直接预测道路 graph 或建筑 polygon。
4. SAM-assisted 路线：用 SAM 产生候选 mask，再通过几何规则或 graph decoder 修正。

## 当前问题

- mIoU 与路网连通性不一致。
- 建筑 footprint 的角点、直角和平行边很难用普通 Dice/CE 损失约束。
- 道路被树冠、阴影、车辆遮挡时容易断裂。
- 直接 polygon 输出训练不稳定，标注格式也不统一。
- 拓扑损失常计算昂贵，不易扩展到大图。

## 可执行研究方案

题目：Topology-Aware SAM Adapter for Map-Ready Road and Building Extraction

方法：

1. backbone 使用 SAM/GeoFM 特征，输出 raster mask。
2. 增加 centerline branch、boundary branch 和 junction/corner branch。
3. 用 topology-aware loss 约束 road connectivity 和 building regularity。
4. 后接轻量 polygon/graph decoder，输出可矢量化结果。

数据：

- Massachusetts Roads、DeepGlobe Road、SpaceNet Roads。
- Inria Aerial、WHU Building、SpaceNet Buildings。

指标：

- mIoU/F1。
- clDice、APLS、connectivity F1、junction accuracy。
- polygon IoU、corner F1、Hausdorff distance、boundary F-score。

最小实验：

在道路数据上比较 CE/Dice、CE+centerline、CE+topology loss、SAM feature + topology loss，证明拓扑指标改善是否会牺牲像素指标。

## 未来方向

1. topology-aware prompt：让 SAM 根据断裂点自动补 prompt。
2. raster-vector joint training。
3. 大图跨 tile road graph stitching。
4. 建筑规则化 decoder 与灾损不规则建筑的冲突处理。
5. 将 OSM road/building 作为弱拓扑先验并估计其噪声。


## 博客化改写建议

- 开头可以补一个真实应用场景，让读者先看到为什么这个问题值得做。
- 保留论文和 GitHub 链接，适合做“可复现研究路线”栏目。
- 结尾建议固定为“最小实验”和“可能投稿点”，方便后续连续更新。

