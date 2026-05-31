# 2025年遥感AI前沿论文解读：基于Mamba架构的遥感变化检测


# 2025年遥感AI前沿论文解读：基于Mamba架构的遥感变化检测

> **关键词**: 遥感变化检测, Mamba, 状态空间模型, 深度学习, IEEE TGRS
>
> **发布时间**: 2026年5月31日
>
> **论文来源**: IEEE Transactions on Geoscience and Remote Sensing (TGRS)

---

## 一、论文概览

本文精选两篇发表于IEEE TGRS顶刊的遥感变化检测论文，均采用最新的Mamba（状态空间模型）架构，在多个基准数据集上取得了SOTA性能，且代码完全开源。

### 论文1：ChangeMamba

| 项目 | 内容 |
|------|------|
| **标题** | ChangeMamba: Remote Sensing Change Detection With Spatiotemporal State Space Model |
| **作者** | Hongruixuan Chen, Jian Song, Chengxi Han, Junshi Xia, Naoto Yokoya |
| **机构** | 东京大学、RIKEN AIP、武汉大学 |
| **发表** | IEEE TGRS 2024（ESI热点论文，连续12个月高被引论文） |
| **arXiv** | https://arxiv.org/abs/2404.03425 |
| **GitHub** | https://github.com/ChenHongruixuan/MambaCD |

### 论文2：CDMamba

| 项目 | 内容 |
|------|------|
| **标题** | CDMamba: Incorporating Local Clues into Mamba for Remote Sensing Image Binary Change Detection |
| **作者** | Haotian Zhang, Keyan Chen, Chenyang Liu, Hao Chen, Zhengxia Zou, Zhenwei Shi |
| **机构** | 北京航空航天大学 |
| **发表** | IEEE TGRS 2025, Vol. 63, Art no. 4405016 |
| **DOI** | 10.1109/TGRS.2025.3545012 |
| **GitHub** | https://github.com/zmoka-zht/CDMamba |

---

## 二、研究问题

### 2.1 遥感变化检测的核心挑战

遥感变化检测（Change Detection, CD）旨在从同一区域不同时相的遥感影像中自动识别地表变化，广泛应用于城市规划、环境监测、灾害评估等领域。现有方法面临以下核心挑战：

**CNN的局限性**：
- 受限于有限的感受野，难以捕捉大范围空间上下文信息
- 对长距离依赖关系建模能力不足
- 在复杂场景中容易出现误检或漏检

**Transformer的局限性**：
- 自注意力机制计算复杂度为O(n²)，随图像尺寸增长急剧上升
- 在大规模高分辨率遥感影像上训练和部署成本高昂
- 显存占用大，限制了实际应用

### 2.2 Mamba架构的机遇

Mamba是一种基于状态空间模型（State Space Model, SSM）的新型架构，具有以下优势：
- **线性复杂度**：计算复杂度为O(n)，远低于Transformer的O(n²)
- **全局建模能力**：能够有效捕捉长距离依赖关系
- **硬件感知设计**：通过选择性扫描机制实现高效计算

**核心问题**：如何将Mamba架构有效应用于遥感变化检测任务，并克服其在处理二维空间数据时的局限性？

---

## 三、解决方案

### 3.1 ChangeMamba：开创性的时空状态空间模型

ChangeMamba是**首个**将Mamba架构应用于遥感变化检测的工作，提出了三个专用框架：

#### 3.1.1 三大框架设计

| 框架 | 任务类型 | 输出 |
|------|----------|------|
| **MambaBCD** | 二元变化检测（Binary CD） | 二值变化图 |
| **MambaSCD** | 语义变化检测（Semantic CD） | 语义变化信息 |
| **MambaBDA** | 建筑损坏评估（Building Damage Assessment） | 损坏等级 |

#### 3.1.2 核心架构

```
输入: 双时相遥感影像 (T1, T2)
         ↓
    [Visual Mamba 编码器]
    - 全局空间上下文学习
    - 线性复杂度特征提取
         ↓
    [时空关系建模机制]
    - 时空序列模式: 按时间顺序处理
    - 时空交叉模式: 双时相特征交替交互
    - 时空并行模式: 双时相特征拼接处理
         ↓
    [变化解码器]
    - 多尺度特征融合
    - 精细化变化信息提取
         ↓
输出: 变化检测结果
```

#### 3.1.3 时空关系建模机制

ChangeMamba提出了三种创新的时空关系建模机制：

1. **时空序列建模（Spatio-Temporal Sequential Modeling）**
   - 将双时相影像按时间顺序输入Mamba
   - 利用Mamba的序列建模能力捕捉时间演变信息

2. **时空交叉建模（Spatio-Temporal Cross Modeling）**
   - 让双时相特征在编码过程中交替"对话"
   - 增强不同时相特征之间的信息交互

3. **时空并行建模（Spatio-Temporal Parallel Modeling）**
   - 将双时相影像拼接后统一处理
   - 类似"大家来找茬"的方式直接对比差异

### 3.2 CDMamba：融合局部线索的增强型Mamba

CDMamba在ChangeMamba基础上进行了重要改进，解决了Mamba方法忽略局部细节的问题。

#### 3.2.1 核心创新：Scaled Residual ConvMamba (SRCM) 模块

```
输入特征
    ↓
┌───────────────────────────────┐
│  Mamba分支（全局特征）        │
│  - 全局空间上下文建模         │
│  - 长距离依赖关系捕捉         │
└───────────────────────────────┘
    ↓
┌───────────────────────────────┐
│  Conv分支（局部细节）         │
│  - 局部纹理信息提取           │
│  - 边缘细节增强               │
└───────────────────────────────┘
    ↓
[残差融合]
    ↓
输出: 全局+局部增强特征
```

**设计动机**：变化检测是密集预测任务，需要精确的像素级判断。仅依赖全局特征会丢失关键的局部细节信息（如建筑物边缘、道路边界等），导致检测结果不够精细。

#### 3.2.2 自适应全局局部引导融合（AGLGF）模块

```
时相1特征 ──────┬──────────────────→
                ↓
        [AGLGF模块]
        - 全局特征引导
        - 局部特征增强
        - 动态权重调整
                ↑
时相2特征 ──────┴──────────────────→
```

**核心思想**：利用一个时相的全局/局部特征来引导另一个时相的特征交互，从而获得更具区分性的变化特征。

---

## 四、实验结果

### 4.1 实验设置

#### 数据集

| 数据集 | 任务类型 | 图像尺寸 | 样本数量 |
|--------|----------|----------|----------|
| **LEVIR-CD** | 二元变化检测 | 1024×1024 | 637对 |
| **LEVIR-CD+** | 二元变化检测 | 1024×1024 | 985对 |
| **WHU-CD** | 二元变化检测 | 512×512 | 2,974对 |
| **SYSU-CD** | 二元变化检测 | 256×256 | 20,000对 |
| **SECOND** | 语义变化检测 | 512×512 | 4,662对 |
| **CLCD** | 二元变化检测 | 256×256 | 2,144对 |

#### 评估指标

- **F1分数**: 精确率和召回率的调和平均
- **IoU (交并比)**: 预测区域与真实区域的重叠程度
- **OA (总体精度)**: 所有像素的分类准确率
- **Kappa系数**: 考虑偶然一致性的分类精度

### 4.2 ChangeMamba实验结果

#### 二元变化检测（BCD）性能对比

| 方法 | LEVIR-CD F1 | LEVIR-CD IoU | WHU-CD F1 | WHU-CD IoU |
|------|-------------|--------------|-----------|------------|
| FC-Siam-diff | 83.21 | 72.64 | 88.43 | 79.96 |
| FC-Siam-conc | 83.39 | 72.90 | 88.68 | 80.36 |
| BIT | 89.04 | 80.69 | 90.12 | 82.34 |
| ChangeFormer | 90.13 | 82.37 | 91.08 | 83.89 |
| **MambaBCD** | **91.24** | **84.15** | **92.36** | **86.02** |

**关键发现**：
- MambaBCD在LEVIR-CD上F1分数达到91.24%，超越ChangeFormer 1.11个百分点
- 在WHU-CD上F1分数达到92.36%，提升1.28个百分点
- IoU指标同样全面领先，表明变化区域的定位更加精确

#### 语义变化检测（SCD）性能对比

| 方法 | SECOND Fscd | SECOND SeK | OA |
|------|-------------|------------|-----|
| BiSRNet | 58.42 | 18.63 | 84.27 |
| ChangeStar | 60.18 | 20.15 | 85.12 |
| **MambaSCD** | **63.47** | **22.86** | **86.93** |

### 4.3 CDMamba实验结果

#### 与现有Mamba方法的对比

| 方法 | LEVIR-CD+ F1 | LEVIR-CD+ IoU | CLCD F1 | CLCD IoU |
|------|--------------|---------------|---------|----------|
| ChangeMamba | 85.32 | 75.86 | 82.14 | 70.56 |
| MambaBCD | 85.67 | 76.28 | 82.53 | 71.02 |
| **CDMamba** | **87.77** | **79.28** | **84.97** | **74.44** |

**关键改进**：
- 在LEVIR-CD+上，CDMamba相比ChangeMamba提升F1分数**2.45%**，IoU提升**3.42%**
- 在CLCD数据集上，F1分数提升**2.83%**，IoU提升**3.42%**
- 证明了局部线索对于密集预测任务的重要性

#### 消融实验

| 配置 | LEVIR-CD+ F1 | LEVIR-CD+ IoU |
|------|--------------|---------------|
| Baseline (Mamba only) | 85.32 | 75.86 |
| + SRCM模块 | 86.89 | 77.92 |
| + AGLGF模块 | 86.45 | 77.34 |
| + SRCM + AGLGF (CDMamba) | **87.77** | **79.28** |

### 4.4 计算效率对比

| 方法 | 参数量 (M) | FLOPs (G) | 推理时间 (ms) |
|------|-----------|-----------|---------------|
| ChangeFormer | 41.3 | 56.7 | 48.2 |
| BIT | 38.6 | 52.1 | 45.6 |
| ChangeMamba | 35.2 | 42.3 | 38.7 |
| CDMamba | 37.8 | 45.6 | 41.2 |

**效率优势**：ChangeMamba系列方法在保持高性能的同时，参数量和计算量均低于Transformer方法，推理速度提升约15-20%。

---

## 五、综合评价

### 5.1 创新性评价

| 维度 | ChangeMamba | CDMamba |
|------|-------------|---------|
| **架构创新** | ⭐⭐⭐⭐⭐ 首次将Mamba引入遥感CD | ⭐⭐⭐⭐ 在此基础上增强局部特征 |
| **方法创新** | ⭐⭐⭐⭐⭐ 三种时空建模机制 | ⭐⭐⭐⭐ SRCM和AGLGF模块 |
| **实用性** | ⭐⭐⭐⭐ 通用框架 | ⭐⭐⭐⭐⭐ 更精细的检测结果 |

### 5.2 优势总结

**ChangeMamba的优势**：
1. **开创性工作**：首次将Mamba架构应用于遥感变化检测，开辟了新研究方向
2. **全面的任务覆盖**：统一框架支持BCD、SCD、BDA三种任务
3. **高效的计算性能**：线性复杂度使处理大规模遥感影像成为可能
4. **强大的社区影响力**：ESI热点论文，连续12个月高被引

**CDMamba的优势**：
1. **精细化检测**：通过局部线索增强，显著提升变化边界的检测精度
2. **自适应融合**：AGLGF模块实现双时相特征的动态交互
3. **即插即用设计**：SRCM和AGLGF模块可方便地集成到其他架构

### 5.3 局限性与改进方向

| 局限性 | 可能的改进方向 |
|--------|---------------|
| 对极端天气条件（云雾、阴影）敏感 | 引入多模态数据（SAR、高光谱）融合 |
| 在超大尺度变化检测中仍有提升空间 | 设计多尺度Mamba架构 |
| 预训练策略尚未充分探索 | 结合遥感基础模型进行预训练 |
| 对时相间隔较大的影像适应性有限 | 引入时序建模机制 |

### 5.4 未来研究趋势

1. **多模态Mamba融合**：结合光学影像、SAR数据、高光谱数据等多源信息
2. **大规模预训练**：利用海量无标注遥感数据进行自监督预训练
3. **实时变化检测**：进一步优化架构，满足实时监测需求
4. **三维变化检测**：将Mamba扩展到三维空间变化检测任务

---

## 六、代码资源

### ChangeMamba

```bash
# 克隆仓库
git clone https://github.com/ChenHongruixuan/MambaCD.git
cd MambaCD

# 安装依赖
pip install -r requirements.txt

# 训练示例 (以LEVIR-CD为例)
python train.py --config configs/LEVIR_CD/mamba_bcd.yaml

# 测试
python test.py --config configs/LEVIR_CD/mamba_bcd.yaml --checkpoint path/to/checkpoint.pth
```

### CDMamba

```bash
# 克隆仓库
git clone https://github.com/zmoka-zht/CDMamba.git
cd CDMamba

# 安装依赖 (需要CUDA 12.1, PyTorch 2.1.0)
pip install -r requirement.txt
pip install mamba-ssm causal-conv1d

# 训练
python train_cd.py --config e_cd_mamba.yaml

# 测试
python test_cd.py --config e_cd_mamba.yaml --checkpoint path/to/checkpoint.pth
```

---

## 七、总结

ChangeMamba和CDMamba代表了遥感变化检测领域的最新进展，成功将Mamba架构引入遥感领域，解决了CNN感受野有限和Transformer计算复杂度高的固有问题。ChangeMamba作为开创性工作，提出了完整的框架设计和时空建模机制；CDMamba在此基础上进一步融合局部线索，实现了更精细的检测结果。

这两项工作不仅在技术上取得了突破，更重要的是为遥感变化检测研究开辟了新的方向——基于状态空间模型的遥感影像理解。随着Mamba架构的不断发展和完善，我们有理由期待更多创新性的遥感应用出现。

---

## 参考文献

1. Chen, H., Song, J., Han, C., Xia, J., & Yokoya, N. (2024). ChangeMamba: Remote Sensing Change Detection With Spatiotemporal State Space Model. *IEEE Transactions on Geoscience and Remote Sensing*, 62, 1-20.

2. Zhang, H., Chen, K., Liu, C., Chen, H., Zou, Z., & Shi, Z. (2025). CDMamba: Incorporating Local Clues into Mamba for Remote Sensing Image Binary Change Detection. *IEEE Transactions on Geoscience and Remote Sensing*, 63, 1-16.

3. Gu, A., & Dao, T. (2023). Mamba: Linear-Time Sequence Modeling with Selective State Spaces. *arXiv preprint arXiv:2312.00752*.

4. Zhu, L., Liao, B., Zhang, Q., Wang, X., Liu, W., & Wang, X. (2024). Vision Mamba: Efficient Visual Representation Learning with Bidirectional State Space Model. *arXiv preprint arXiv:2401.09417*.

---

> **声明**: 本文基于公开发表的学术论文进行解读，仅供学术交流和学习参考。论文版权归原作者所有。

