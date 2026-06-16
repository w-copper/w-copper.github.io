---
title: "DEO：用双教师蒸馏把 DINOv3 的 RGB 语义注入多光谱 GeoFM"
date: "2026-06-16T15:00:04+08:00"
tags: ["DEO", "多光谱", "DINOv3", "蒸馏", "GeoFM", "CVPR2026"]
mode: "twohour"
categories: ["遥感基础模型与多模态理解"]
draft: false
---

# DEO：用双教师蒸馏把 DINOv3 的 RGB 语义注入多光谱 GeoFM

**结论：这一轮最值得补进雷达的是 CVPR 2026 Highlight 论文 *Brewing Stronger Features: Dual-Teacher Distillation for Multispectral Earth Observation*。它提出 DEO，用一个多光谱 EMA teacher 学 Sentinel-2 10 通道表示，再用冻结的光学 VFM teacher（默认 DINOv3）把 RGB 语义和 patch-level 结构蒸馏到同一个学生模型里。论文的关键信号不是“再训练一个遥感 backbone”，而是把通用视觉基础模型和多光谱 EO 基础模型之间的接口说清楚：如果目标是让 RGB 光学语义迁移到多光谱，预训练目标最好和 DINO/DINOv3 这类 contrastive self-distillation 范式对齐，而不是只靠 masked image modeling 做局部重建。**

我按 2026-06-16 15:00 +08 检索公开来源，并过滤 SAR、PolSAR、InSAR、radar-only、microwave-only 与 SAR-optical fusion 主线工作。DEO 的训练主线是 fMoW-Sentinel / fMoW-RGB 的光学与 Sentinel-2 多光谱数据；论文确实在相关工作和对比方法中提到含雷达路线，但本篇只讨论它对非 SAR 光学/多光谱 GeoFM 的价值。同期本地文章已经覆盖 FusionRS、RATS、Gaze Heads、TTABC、Clay-CNN Hybrids、AI4Land、MaskWAM、GeoFM layer probing、CoastlineVLM、Stateful Visual Encoders、LG-SAM、VecLang、TerraBench、OSTB 等方向，因此这里不重复已有条目。

## 背景

遥感基础模型现在有一个很实际的分叉：一边是 DINOv2、DINOv3、RADIO 这类通用视觉基础模型，RGB 语义强、patch 特征好、下游 dense prediction 适配成熟；另一边是 Prithvi、SatMAE、CROMA、Copernicus-FM、TerraFM、AnySat 这类 EO foundation models，能处理多光谱、多传感器、时序或地理场景，但不少模型仍然依赖 masked image modeling，学到的表示更偏局部重建，未必有足够强的全局语义结构。

这个矛盾在多光谱任务里尤其明显。Sentinel-2 的 NIR、red-edge、SWIR 等波段对作物、洪水、植被、水体、裸地和灾害监测很重要，但 DINOv3 这类视觉模型只吃 RGB。直接把 RGB VFM 用到多光谱，会丢掉非 RGB 波段；只在 Sentinel-2 上做 MIM，又可能学不到 DINOv3 那种适合分割和迁移的语义空间。

DEO 的切入点是：不要假设一个“万能 EO 模型”一次解决所有传感器，而是把不同 teacher 的知识放在一个兼容的训练目标里。多光谱 teacher 负责传感器内的 representation learning，光学 VFM teacher 负责把成熟的 RGB 语义先验和 patch structure 转给学生模型。

## 论文/项目

论文标题是 *Brewing Stronger Features: Dual-Teacher Distillation for Multispectral Earth Observation*，arXiv 编号 2602.19863，作者来自 University of Ljubljana。arXiv 页面显示论文 2026-02-23 提交、2026-02-24 修订；CVF Open Access 页面显示该论文发表于 CVPR 2026，页码 27815-27826，项目页标注为 CVPR 2026 Highlight。

主源链接如下：

- 论文 arXiv：<https://arxiv.org/abs/2602.19863>
- CVF Open Access：<https://openaccess.thecvf.com/content/CVPR2026/html/Wolf_Brewing_Stronger_Features_Dual-Teacher_Distillation_for_Multispectral_Earth_Observation_CVPR_2026_paper.html>
- 项目页：<https://wolfilip.github.io/DEO/>
- 官方代码：<https://github.com/wolfilip/DEO-FM>
- Hugging Face 权重：<https://huggingface.co/SolaireTheSun/DEO>

已验证事实是：官方 GitHub 仓库公开 PyTorch 实现，MIT license；README 显示已释放 pretraining code、Swin-B 和 ViT-B 预训练权重，权重也可在 Hugging Face 获取；模型可输入 3 通道 RGB 或 10 通道 Sentinel-2 多光谱（不含 60m atmospheric bands）。仓库说明运行环境偏 Linux，要求 Python 3.11+、PyTorch 2.4+ 和 xFormers 0.0.29+，目前没有 GitHub release。

## 方法

DEO 是一个双教师学生模型。第一条分支是多光谱 contrastive self-distillation：学生和 EMA teacher 都看 Sentinel-2 多通道图像的不同 crop/view，用 DINO 风格的对齐目标学习多光谱表征。作者还使用 coding-rate regularizer 来避免表示坍缩，让特征空间保持维度多样性。

第二条分支是光学 VFM distillation：冻结的 DINOv3 teacher 只看 RGB/optical view，学生也通过单独的 3 通道 patch embedding 处理 optical input。蒸馏不只对齐 class token，还对齐最后层和中间层 patch tokens。这个设计很关键，因为遥感分割、变化检测和制图不是 image-level 分类，patch-level 结构往往比全局类别 token 更重要。

最终学生模型同时优化多光谱 self-distillation loss 和光学 VFM distillation loss。论文强调，这和 Copernicus-FM 这类 MIM + VFM distillation 的组合不同：DEO 把学生的训练范式直接对齐到 DINO/DINOv3 的 contrastive self-distillation 逻辑，所以更容易继承 DINOv3 的语义结构。

架构上，论文主推 Swin backbone。理由是 Swin 的层级结构和小 patch size 更适合高分辨率 dense prediction，而 DINOv3 等 VFM 常用 ViT patch size 16，特征分辨率受限。DEO 等于把 ViT-style optical teacher 的知识蒸馏到更适合遥感密集预测的 Swin 学生里。

## 数据与实验

预训练使用 50 万张 fMoW-Sentinel 与 fMoW-RGB 图像，训练 100 epoch，16 张 NVIDIA A100，Adam optimizer。作者从 fMoW-Sentinel 中去掉 3 个 60m atmospheric bands，保留 10 个 Sentinel-2 波段；同时用同位置 fMoW-RGB 中的高分辨率 aerial image 替换 15 万个低空间分辨率 optical bands，以提供更细的光学 privileged knowledge。

下游任务覆盖三类。

第一类是语义分割。论文使用 frozen backbone + UPerNet，评估 GEO-Bench 中多个 optical / multispectral 数据集，并加入 SpaceNetv1、Sen1Floods11 和 PASTIS 等任务。表 1 显示 DEO 在 optical 平均 81.98、multispectral 平均 57.45、overall 平均 69.72；相比 SatDiFuser、Copernicus-FM、TerraFM、DINOv3-LS 等基线，整体排名第一。论文摘要和 CVF 页面报告语义分割平均提升 3.64 个百分点。

第二类是变化检测。论文在 LEVIR 和 OSCD 上使用二值 F1，做法是提取 pre/post image 的 backbone features，再用 element-wise subtraction 融合，接 UPerNet decoder 输出 change map。DEO 的平均 F1 为 75.9，在 multispectral OSCD 上尤其强，论文报告变化检测平均提升 1.2 个点。

第三类是多光谱分类。论文在 GEO-Bench 的 m-BigEarthNet、m-So2Sat、m-EuroSAT 上做 linear probing。DEO 的平均结果为 69.22，优于 TerraFM、DINOv3-B、DINOv3-LS、CROMA、Copernicus-FM 等对比；论文摘要报告分类平均提升 1.31 个点。

消融实验也有直接指导意义。先只做 MS contrastive baseline，再逐步加入 DINOv3 class-token distillation、separate optical path、DINOv3 patch-token distillation、optical augmentations、高分辨率 optical data。整体从 69.16 提升到 72.87。也就是说，提升不是单个 trick，而是“目标对齐 + 光学单独路径 + patch 蒸馏 + 高分辨率 privileged optical data”共同作用。

## 亮点

第一，DEO 明确挑战了遥感 GeoFM 过度依赖 MIM 的惯性。MIM 很适合学局部重建和波段补全，但不一定自然形成适合跨任务迁移的全局语义空间。DEO 把 DINOv3 这种通用 VFM 的训练范式搬进多光谱，而不是简单把 DINO 特征当额外 loss。

第二，它把 RGB 到多光谱的迁移做得比较克制。模型没有假装 DINOv3 能理解 NIR/SWIR，而是让多光谱 teacher 学 MS 表示，让 optical teacher 传 RGB 语义，两者通过学生模型统一。这比“把多光谱压成 RGB 再喂 VFM”更合理。

第三，代码和权重已经公开。对遥感基础模型论文来说，这一点很重要。官方仓库提供 pretraining code、feature loading 示例和 Swin-B / ViT-B 权重，Hugging Face 模型卡也能找到 Swin-B 权重入口，适合做复现实验或作为下游 baseline。

第四，实验覆盖 optical-only 和 multispectral 两种输入。很多多光谱模型会牺牲 RGB 高分辨率任务表现，DEO 的卖点是 MS 任务提升，同时 optical-only 任务不明显掉队。对实际系统来说，这意味着一个 backbone 可以同时处理 UAV/aerial RGB 与 Sentinel-2 MS 场景。

第五，低标注实验有价值。论文在 10% labeled data setting 下仍保持强结果，尤其对灾害响应、作物制图、区域迁移这类标注昂贵任务有现实意义。

## 不足

第一，DEO 仍依赖 optical teacher 的强度。论文自己的 limitation 也指出，光学特征是通过蒸馏转移，不是显式重新预训练出来的。如果 teacher 对某些遥感结构、季节、地物或区域有偏差，学生可能继承这些偏差。

第二，它假设输入空间对齐。光学和多光谱在 fMoW/Sentinel-2 语境中相对可控，但跨平台、跨分辨率、跨时相、跨投影误差会让蒸馏信号变脏。这个问题在城市高分辨率 aerial image 与 Sentinel-2 coarse MS 对齐时尤其明显。

第三，SAR 不在它当前能力范围内。论文 limitation 明确说缺少 SAR 等模态的强 teacher 会限制扩展性。本篇按你的要求不把 SAR 纳入方向；如果未来有人把 DEO 扩到 SAR，也必须单独处理 teacher、配准和 speckle/statistics 问题。

第四，benchmark 仍偏标准任务。分割、变化检测、分类是必要验证，但还不能说明模型能支撑开放词汇分割、VLM grounding、跨国家制图、长期时序作物监测或不确定性估计。

第五，算力门槛不低。100 epoch、16 张 A100 的预训练配置对个人实验室不轻。虽然官方公开权重降低了使用门槛，但如果要换区域、换传感器、换波段组合重新预训练，需要设计更轻量的 LoRA/adapters 或 teacher-free adaptation。

## 遥感迁移方案

最直接的用法是把 DEO 作为多光谱下游 backbone，替换现有 SatMAE/Prithvi/Copernicus-FM/GeoRSCLIP 特征，先做 frozen-feature 对比，再做轻量 adapter 微调。任务可以选 PASTIS、EuroCrops、m-BigEarthNet、LoveDA 的 RGB 子集、OpenEarthMap、SpaceNet building、LEVIR-CD 和 OSCD 的非 SAR 光学/多光谱设置。

更有研究价值的方向是 **DEO + VLM grounding**。DEO 本身不是 VLM，但它能提供比 RGB-only VFM 更懂多光谱的 dense features。可以让 DEO 负责 pixel/region feature，RemoteCLIP/GeoRSCLIP 或通用 VLM 负责文本空间，再用一个轻量 cross-modal adapter 把“水体、农田、建筑、裸地、洪水淹没、作物类型”等类别词对齐到 DEO 的多光谱特征上。

另一个值得做的是 **band-aware distillation audit**。DEO 证明了 DINOv3 语义可以帮助多光谱，但还需要知道帮助来自哪里：是 RGB 高分辨率边界？是 DINOv3 的 patch separability？还是多光谱 teacher 学到的 NIR/SWIR 物理线索？可以做 band-drop、season-drop、resolution-drop 和 teacher-drop 实验，给每个下游任务输出贡献分解。

如果做变化检测，可以把 DEO 的 twin backbone 接到现有 change decoder，重点评估跨季节误报、非建筑变化误报、弱配准误差和低标注泛化。DEO 的多光谱特征理论上能减少纯 RGB appearance shift 的误报，但这需要在 OSCD、HLS/Sentinel-2 时间序列和自建跨季节 split 上验证。

## 可做的论文方向

第一，做 **DEO-VG: Multispectral Feature Grounding for Remote Sensing VLMs**。问题是遥感 VLM 多数仍偏 RGB，难以利用 NIR/SWIR 证据。假设是 DEO dense features 能作为多光谱视觉侧 grounding backbone，提升开放词汇分割和区域问答。方法是冻结 DEO，训练 text-region adapter，接 RemoteCLIP/GeoRSCLIP 或 Qwen2.5-VL-style decoder。数据可用 LoveDA/OpenEarthMap/PASTIS/m-BigEarthNet，再构造多光谱类别解释。指标包括 mIoU、text-to-region retrieval、region QA factuality 和跨区域泛化。

第二，做 **Band Contribution Audit for Distilled GeoFM**。问题是多光谱 foundation model 的性能提升经常无法解释。方法是对 DEO 做 band masking、teacher masking、optical-resolution masking 和 patch-token distillation ablation，输出任务级贡献矩阵。贡献可以是一个 benchmark protocol，而不是新模型。指标包括分割 mIoU、变化 F1、分类 F1/Top-1、ECE 校准误差和 OOD drop。

第三，做 **Low-Label Disaster Mapping with Optical-to-MS Distillation**。问题是灾害标注稀缺、时效要求高。方法是用 DEO 特征接轻量 decoder，在 1%、5%、10% 标签下比较 Prithvi、SatMAE、DINOv3-LS、Copernicus-FM。任务限定为非 SAR 的光学/多光谱洪水、烧毁区、建筑损毁或滑坡制图。必须报告跨事件、跨地区和跨季节泛化。

第四，做 **Resolution-Misalignment Robust Distillation for EO**。问题是 DEO 依赖 high-resolution optical privileged data，但真实配准常不完美。方法是在预训练或 adapter 阶段引入合成错位、尺度扰动和地理重采样噪声，让学生学会在 RGB aerial 与 Sentinel-2 MS 之间稳健对齐。指标看 dense task performance、边界误差、错位敏感曲线和 feature CKA。

第五，做 **Teacher Ecosystem for GeoFM**。问题是单一 teacher 无法覆盖 RGB、多光谱、时序、DSM、地图矢量等模态。方法是沿 DEO 的双教师思路扩展成可插拔 teacher routing：RGB teacher、MS teacher、temporal teacher、vector teacher 分别提供不同监督，学生通过 shared encoder + modality adapters 学统一特征。第一步不碰 SAR，先做 optical/MS/vector 三类。

## 实验建议

最小实验可以从官方权重开始，不需要重训 16 A100。

1. 下载 DEO Swin-B 或 ViT-B 权重，固定 backbone。
2. 选 3 个任务：SpaceNet/OpenEarthMap building，PASTIS crop segmentation，OSCD/LEVIR optical change detection。
3. 对比 DINOv3-LS、SatMAE/Prithvi、Copernicus-FM、RemoteCLIP/GeoRSCLIP 的 frozen features。
4. 统一 decoder 和训练预算，报告 mean/std，不只报最好一次。
5. 做 band-drop：RGB only、RGB+NIR、RGB+red-edge、10-band full。
6. 做 low-label：1%、5%、10%、100%。
7. 做 cross-region split：不要只随机切 tile，否则空间泄漏会高估泛化。

最小成功标准应该设得很硬：DEO 不只要在完整标签训练下 mIoU/F1 更高，还要在低标注和跨区域设置下掉点更少；band-drop 实验必须显示非 RGB 波段给作物、水体、洪水、植被或裸地带来可解释增益。否则它只是一个更强 RGB teacher 蒸馏模型，而不是多光谱 GeoFM。

可直接用于论文审稿或内部复现实验的 prompt：

```text
你是遥感基础模型复现实验审计器。
给定一个多光谱 GeoFM、官方权重、下游分割/变化检测/分类结果和训练脚本，请判断该模型是否真的利用了多光谱信息，而不是主要继承 RGB VFM 的语义先验。

必须检查：
1. 输入波段是否明确：RGB、NIR、red-edge、SWIR、是否去掉 60m atmospheric bands。
2. 是否同时报告 RGB-only、部分波段、full multispectral 的对照。
3. 是否有 cross-region / cross-season / low-label split，不能只看随机 tile split。
4. decoder、训练轮数、输入尺寸、数据增强和参数量是否与 baselines 公平。
5. 是否区分 optical-only 任务和 multispectral 任务，不能用一个平均分掩盖某类任务退化。
6. 是否检查 teacher bias：DINOv3/RGB teacher 是否导致模型过度依赖纹理、建筑边界或高分辨率 aerial cues。
7. 是否公开代码、权重、数据预处理、band order 和 feature loading 示例。

输出：
- 结论：strong / promising / inconclusive / weak
- 多光谱证据是否充分
- 最大性能来源推断
- 最大复现风险
- 必须补充的 3 个实验
```

## 今日判断

DEO 值得作为 2026 年遥感基础模型的一条重要线索跟踪。它把“通用 RGB VFM 怎么帮助多光谱 EO”从经验迁移推进到目标函数层面的设计：用兼容 DINO/DINOv3 的 contrastive self-distillation 学多光谱，再用冻结光学 teacher 做 class-token 与 patch-token 蒸馏。论文、CVF 页面、项目页、GitHub 和 Hugging Face 权重都已公开，复现和下游迁移条件比很多 GeoFM 论文更好。

但它也不是遥感 VLM 的终点。DEO 解决的是多光谱 dense features，不直接解决文本 grounding、开放词汇类别、证据解释和对话式遥感解译。下一步更值得做的是把 DEO 当作多光谱视觉侧底座，接 VLM/CLIP 文本空间、区域级 grounding、band contribution audit 和跨区域低标注评估。这样才能判断它是否只是强 backbone，还是能成为多模态遥感 AI 系统里的可解释视觉编码器。

## 参考来源

- DEO arXiv：<https://arxiv.org/abs/2602.19863>
- DEO CVF Open Access：<https://openaccess.thecvf.com/content/CVPR2026/html/Wolf_Brewing_Stronger_Features_Dual-Teacher_Distillation_for_Multispectral_Earth_Observation_CVPR_2026_paper.html>
- DEO 项目页：<https://wolfilip.github.io/DEO/>
- DEO 官方 GitHub：<https://github.com/wolfilip/DEO-FM>
- DEO Hugging Face 权重：<https://huggingface.co/SolaireTheSun/DEO>
