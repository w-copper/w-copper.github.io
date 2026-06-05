# 🤖 Qwen2-VL 微调框架


# 🤖 Qwen2-VL 微调框架

**Qwen2-VL/Qwen2.5-VL 视觉语言模型微调框架**，支持多种训练方式

> 💻 [GitHub](https://github.com/2U1/Qwen2-VL-Finetune) | 🐳 [Docker](https://hub.docker.com/repository/docker/john119/vlm)

## ✨ 核心功能

### 训练方式
- 🎯 **SFT**：监督微调
- 🔧 **LoRA/QLoRA**：低秩适配
- 📊 **DPO**：直接偏好优化
- 🎲 **GRPO**：组相对策略优化
- 🏷️ **Classification**：分类任务微调

### 数据支持
- 🖼️ **单图数据**：单张图片对话
- 🖼️🖼️ **多图数据**：多张图片对话
- 🎬 **视频数据**：视频理解训练
- 🔀 **混合模态**：图文混合数据

### 优化特性
- ⚡ **DeepSpeed**：分布式训练加速
- 🧠 **Liger Kernel**：内存优化内核
- 💾 **8-bit 训练**：显存优化
- 🔄 **Flash Attention 2**：注意力加速

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| **模型** | Qwen2-VL / Qwen2.5-VL |
| **框架** | PyTorch + Transformers |
| **训练** | DeepSpeed + TRL |
| **优化** | Liger Kernel |
| **推理** | Gradio WebUI |
| **部署** | Docker |

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone https://github.com/2U1/Qwen2-VL-Finetune.git
cd Qwen2-VL-Finetune

# 安装依赖
pip install -r requirements.txt
pip install qwen-vl-utils
pip install flash-attn --no-build-isolation
```

### SFT 训练

```bash
bash scripts/finetune.sh
```

### LoRA 训练

```bash
bash scripts/finetune_lora.sh
```

### GRPO 训练

```bash
bash scripts/finetune_grpo.sh
```

### WebUI 推理

```bash
python -m src.serve.app --model-path /path/to/merged/weight
```

## 🐳 Docker 部署

```bash
# 拉取镜像
docker pull john119/vlm

# 启动容器
docker run --gpus all -it -v /host/path:/docker/path --name vlm --ipc=host john119/vlm /bin/bash
```

## 📊 支持的模型

| 模型 | 参数量 | 特点 |
|------|--------|------|
| Qwen2-VL-2B | 2B | 轻量级 |
| Qwen2-VL-7B | 7B | 平衡 |
| Qwen2.5-VL-3B | 3B | 新一代 |
| Qwen2.5-VL-7B | 7B | 高精度 |

## 📚 引用

```bibtex
@misc{Qwen2-VL-Finetuning,
  author = {Yuwon Lee},
  title = {Qwen2-VL-Finetune},
  year = {2024},
  publisher = {GitHub},
  url = {https://github.com/2U1/Qwen2-VL-Finetune}
}
```

## 🔗 相关资源

- 💻 [GitHub 仓库](https://github.com/2U1/Qwen2-VL-Finetune)
- 🐳 [Docker 镜像](https://hub.docker.com/repository/docker/john119/vlm)
- 📄 [Qwen2-VL 论文](https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct)

