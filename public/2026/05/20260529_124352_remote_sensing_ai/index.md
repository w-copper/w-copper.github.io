# 2025年遥感AI最新进展：像素级定位与开放词汇分割


# 2025年遥感AI最新进展：像素级定位与开放词汇分割

> 本文介绍了2025年遥感人工智能领域的两项重要研究进展，均来自顶级学术会议并已开源代码。

---

## 论文一：GeoPixel - 像素级基础大型多模态模型

### 📄 论文信息

| 项目 | 内容 |
|------|------|
| **论文标题** | GeoPixel: Pixel Grounding Large Multimodal Model in Remote Sensing |
| **作者** | Akashah Shabbir, Mohammed Zumri, Mohammed Bennamoun, Fahad Shahbaz Khan, Salman Khan |
| **会议** | ICML 2025 (International Conference on Machine Learning) |
| **GitHub** | https://github.com/mbzuai-oryx/GeoPixel |
| **Stars** | 144 ⭐ |
| **论文链接** | https://arxiv.org/abs/2501.13925 |

### 🎯 解决的问题

遥感图像分析面临以下核心挑战：

1. **视角差异**：遥感图像采用俯视视角，与自然图像的视角差异显著
2. **尺度变化**：地物目标在不同分辨率下呈现不同尺度
3. **小目标密集**：高分辨率遥感图像中存在大量小而密集的目标
4. **缺乏细粒度定位数据**：现有遥感多模态模型缺乏像素级定位能力

现有大型多模态模型(LMMs)主要针对自然图像设计，在遥感领域表现不佳，特别是：
- 输出缺乏精确的空间和语义关联
- 仅支持低分辨率输入，限制了细尺度分析能力
- 缺乏像素级的视觉定位(grounding)能力

### 💡 解决方案

**GeoPixel** 是第一个专门为高分辨率遥感图像设计的端到端像素级基础大模型。

#### 核心创新：

1. **自适应图像分区**
   - 将输入图像自适应划分为局部区域和全局区域
   - 支持高达4K HD分辨率，任意宽高比
   - 实现高效的高分辨率图像编码和分析

2. **像素级定位架构**
   - 基于SAM-2的视觉编码器提取鲁棒特征
   - 专用像素解码器生成分割掩码
   - 在对话中生成交错的分割掩码

3. **GeoPixelD数据集**
   - 通过半自动化流水线构建
   - 利用集合标记(set-of-marks)提示和空间先验
   - 包含超过600,000个目标及其描述
   - 支持多粒度的视觉定位对话生成

4. **端到端架构**
   - 集成视觉编码器、大型语言模型和像素解码器
   - 支持自然语言查询与像素级输出的关联
   - 实现细粒度的视觉理解和空间定位

### 📊 实验结果

GeoPixel在多个遥感基准测试中表现出色：

- **单目标分割**：超越现有LMMs的像素级理解能力
- **多目标分割**：在复杂场景中实现精确的多目标定位
- **分辨率支持**：成功处理4K高分辨率遥感图像
- **定性分析**：展示了在土地利用、交通网络提取、基础设施映射等任务中的优越性能

### 📈 评估与意义

**技术贡献：**
- 首次实现遥感领域的像素级视觉定位对话
- 解决了高分辨率遥感图像的细粒度理解问题
- 建立了遥感多模态模型的新范式

**应用价值：**
- 灾害响应：精确识别受损建筑和基础设施
- 环境监测：细粒度的地表覆盖变化检测
- 城市规划：详细的建筑物和道路网络提取
- 军事侦察：高精度的目标识别和定位

---

## 论文二：GSNet - 开放词汇遥感语义分割

### 📄 论文信息

| 项目 | 内容 |
|------|------|
| **论文标题** | Towards Open-Vocabulary Remote Sensing Image Semantic Segmentation |
| **作者** | Chengyang Ye, Yunzhi Zhuge, Pingping Zhang |
| **会议** | AAAI 2025 (Association for the Advancement of Artificial Intelligence) |
| **GitHub** | https://github.com/yecy749/GSNet |
| **Stars** | 85 ⭐ |
| **论文链接** | https://arxiv.org/abs/2412.19492 |

### 🎯 解决的问题

传统遥感语义分割方法存在以下局限：

1. **封闭词汇限制**
   - 只能识别训练时定义的固定类别
   - 无法处理新出现或未见过的地物类别
   - 适应新类别需要重新训练模型

2. **领域适应困难**
   - 直接将自然图像的开放词汇方法应用于遥感效果不佳
   - 遥感图像具有独特的几何特性和上下文信息
   - 现有视觉-语言模型缺乏遥感领域知识

3. **数据集缺乏**
   - 缺少专门为开放词汇遥感分割设计的大规模数据集
   - 现有数据集类别有限，无法支持开放词汇研究

### 💡 解决方案

**GSNet** (Generalist and Specialist Network) 提出了一个创新的开放词汇遥感语义分割框架。

#### 核心创新：

1. **新任务定义**
   - 首次提出开放词汇遥感图像语义分割(OVRSISS)任务
   - 目标：分割遥感图像中的任意语义类别
   - 无需微调即可适应新类别

2. **LandDiscover50K数据集**
   - 包含51,846张遥感图像
   - 覆盖40个多样化的语义类别
   - 整合多个现有数据集：OEM、LoveDA、DeepGlobe、SAMRS
   - 提供大规模、多领域、多粒度的遥感图像

3. **双流图像编码器(DSIE)**
   - **通才流(Generalist)**：CLIP骨干网络，提供开放词汇识别能力
   - **专家流(Specialist)**：遥感专用骨干网络，提供领域专业知识
   - 两个流协同工作，实现通用性和专业性的平衡

4. **查询引导特征融合(QGFF)**
   - 在文本查询的引导下融合通才和专家特征
   - 实现不同特征流之间的有效互补
   - 支持可变词汇表的灵活查询

5. **残差信息保护解码器(RIPD)**
   - 聚合多源特征进行掩码预测
   - 细节精炼和骨干正则化
   - 保留重要的空间和语义信息

### 📊 实验结果

GSNet在多个遥感基准测试中达到最先进性能：

| 数据集 | GSNet (mIoU) | 次优方法 | 提升 |
|--------|-------------|----------|------|
| **平均** | **31.25%** | 27.71% | +3.54% |
| Potsdam | 45.75% | 38.79% | +6.96% |
| FloodNet | 42.63% | 37.89% | +4.74% |
| FLAIR | 22.37% | - | - |
| FAST | 31.54% | - | - |

**关键发现：**
- GSNet显著超越现有开放词汇自然图像分割方法
- 在Potsdam和FloodNet数据集上表现尤为突出
- 直接替换CLIP为RemoteCLIP反而导致性能下降，说明需要集成化的方法

### 📈 评估与意义

**技术贡献：**
- 开创了遥感开放词汇语义分割这一新研究方向
- 提出了有效的双流架构解决领域适应问题
- 构建了首个大规模遥感开放词汇数据集

**方法论启示：**
- 通用视觉-语言模型与领域专业知识的结合是关键
- 简单的组件替换不足以解决领域适应问题
- 需要专门设计的数据集支持开放词汇研究

**应用前景：**
- 动态场景理解：识别新出现的地物类型
- 应急响应：快速适应灾害相关的特定类别
- 环境监测：灵活识别各类地表覆盖变化

---

## 总结与展望

### 共同特点

1. **顶级会议**：均发表于ICML和AAAI等顶级学术会议
2. **开源代码**：GitHub仓库提供完整实现
3. **数据集贡献**：都构建了专门的遥感数据集
4. **范式创新**：推动了遥感AI向更灵活、更细粒度的方向发展

### 技术趋势

1. **基础模型化**：遥感领域正在向大型基础模型发展
2. **多模态融合**：视觉-语言模型在遥感中的应用日益重要
3. **开放世界能力**：从封闭词汇向开放词汇的转变
4. **细粒度理解**：从图像级向像素级的定位精度提升

### 未来方向

1. **更大的基础模型**：探索更大规模的遥感基础模型
2. **更多的模态**：整合SAR、高光谱等多源数据
3. **更强的泛化能力**：提升跨场景、跨地域的适应性
4. **实时应用**：优化推理速度支持实时遥感分析

---

## 附录：2025年CVPR遥感论文精选

除了上述两篇论文外，CVPR 2025也有大量遥感AI论文发表。以下是精选的有代码开源的论文：

### 🏆 CVPR 2025 主会议论文

| 论文 | GitHub | Stars | 任务 | 核心贡献 |
|------|--------|-------|------|----------|
| **SkySense-O** | [zqcrafts/SkySense-O](https://github.com/zqcrafts/SkySense-O) | - | 开放世界解释 | CLIP+SAM集成，在14个基准上超越SegEarth-OV +11.95% |
| **SegEarth-OV** | [likyoo/SegEarth-OV](https://github.com/likyoo/SegEarth-OV) | - | 开放词汇分割 | 训练-free方法，语义分割+5.8%，建筑提取+8.2% |
| **AnySat** | [gastruc/AnySat](https://github.com/gastruc/AnySat) | - | 多模态/多尺度 | 单模型支持11种传感器，CVPR 2025 Highlight |
| **XLRS-Bench** | [AI9Stars/XLRS-Bench](https://github.com/AI9Stars/XLRS-Bench) | - | 基准测试 | 超高分辨率遥感MLLM基准，45,942个标注 |
| **AeroGen** | [Sonettoo/AeroGen](https://github.com/Sonettoo/AeroGen) | - | 目标检测增强 | 扩散驱动的数据生成，支持水平和旋转框 |
| **Exact** | [MiSsU-HH/Exact](https://github.com/MiSsU-HH/Exact) | - | 时间序列分割 | 弱监督卫星图像时间序列分割，CVPR 2025 Highlight |
| **SAM-Road++** | [earth-insights/samroadplus](https://github.com/earth-insights/samroadplus) | - | 道路提取 | 全球规模道路图数据集，比现有数据集大20倍 |
| **EMRDM** | [Ly403/EMRDM](https://github.com/Ly403/EMRDM) | - | 云去除 | 改进的均值回归扩散模型，支持单/多时相 |
| **DehazeXL** | [CastleChen339/DehazeXL](https://github.com/CastleChen339/DehazeXL) | - | 去雾 | 全局上下文融合，支持10240×10240推理 |
| **ADWM** | [Jie-1203/ADWM](https://github.com/Jie-1203/ADWM) | - | 全色锐化 | 自适应双层加权机制 |
| **ARConv** | [WangXueyang-uestc/ARConv](https://github.com/WangXueyang-uestc/ARConv) | - | 全色锐化 | 自适应矩形卷积 |

### 🎯 AAAI 2025 遥感论文

| 论文 | GitHub | Stars | 任务 | 核心贡献 |
|------|--------|-------|------|----------|
| **GSNet** | [yecy749/GSNet](https://github.com/yecy749/GSNet) | 85 | 开放词汇分割 | 双流编码器+查询引导融合，平均mIoU 31.25% |
| **ZoRI** | [HuangShiqi128/ZoRI](https://github.com/HuangShiqi128/ZoRI) | 41 | 零样本实例分割 | 首个零样本遥感实例分割框架 |
| **SemStereo** | - | - | 立体匹配+分割 | 语义引导级联结构，WHU数据集SOTA |

### 🔬 CVPR 2025 Workshop论文

| 论文 | GitHub | Workshop | 核心贡献 |
|------|--------|----------|----------|
| **Panopticon** | [Panopticon-FM/panopticon](https://github.com/Panopticon-FM/panopticon) | EarthVision (Best Paper) | 任意传感器基础模型，基于DINOv2 |
| **SSL4Eco** | [PlekhanovaElena/ssl4eco](https://github.com/PlekhanovaElena/ssl4eco) | EarthVision | 生态遥感季节感知基础模型 |
| **Capabilities Encoding** | [pierreadorni/capabilities-encoding](https://github.com/pierreadorni/capabilities-encoding) | MORSE | 高效遥感基础模型基准测试 |

### 📚 推荐资源仓库

- **[Jasper0122/Remote-Sensing-in-CVPR2025](https://github.com/Jasper0122/Remote-Sensing-in-CVPR2025)**: 23篇CVPR 2025遥感论文汇总
- **[Kangsan-Y/CVPR-2025-in-remote-sensing](https://github.com/Kangsan-Y/CVPR-2025-in-remote-sensing)**: 13篇主会议遥感论文列表
- **[wenhwu/awesome-remote-sensing-change-detection](https://github.com/wenhwu/awesome-remote-sensing-change-detection)**: 变化检测资源大全 (2.2k stars)
- **[satellite-image-deep-learning/techniques](https://github.com/satellite-image-deep-learning/techniques)**: 卫星图像深度学习技术 (10.2k stars)

### 🚀 遥感基础模型生态

2025年遥感基础模型生态系统快速发展：

| 模型 | GitHub/HuggingFace | 机构 | 特点 |
|------|-------------------|------|------|
| **TerraMind 1.0** | IBM/terratorch + HF | IBM+ESA | ICCV 2025，任意到任意生成，9种模态 |
| **Prithvi-EO-2.0** | IBM/terratorch + HF | IBM+NASA | 多时相，100M-600M参数，多个微调版本 |
| **Panopticon** | Panopticon-FM/panopticon | UC Berkeley | CVPR 2025最佳论文，任意传感器 |
| **DOFA** | zhu-xlab/DOFA | - | 神经可塑性启发，任意通道数 |
| **Clay Foundation** | Clay-foundation/model | - | Apache 2.0开源，支持S1/S2/DEM |

---

## 参考文献

1. Shabbir, A., Zumri, M., Bennamoun, M., Khan, F. S., & Khan, S. (2025). GeoPixel: Pixel Grounding Large Multimodal Model in Remote Sensing. ICML 2025.

2. Ye, C., Zhuge, Y., & Zhang, P. (2025). Towards Open-Vocabulary Remote Sensing Image Semantic Segmentation. AAAI 2025.

3. CVPR 2025 Remote Sensing Papers:
   - SkySense-O: Open-World Remote Sensing Interpretation
   - SegEarth-OV: Training-Free Open-Vocabulary Segmentation
   - AnySat: One Model for Many Resolutions, Scales, and Modalities
   - Panopticon: Any-Sensor Foundation Models (Best Paper)

4. GitHub Repositories:
   - GeoPixel: https://github.com/mbzuai-oryx/GeoPixel
   - GSNet: https://github.com/yecy749/GSNet
   - CVPR 2025汇总: https://github.com/Jasper0122/Remote-Sensing-in-CVPR2025

---

*本文撰写于 2026年5月29日，基于2025年最新发表的遥感AI论文*

*搜索关键词：arxiv remote sensing deep learning 2025, arxiv remote sensing object detection transformer 2025, arxiv remote sensing segmentation foundation model 2025, arxiv remote sensing change detection 2025, github remote sensing paper with code 2025*

