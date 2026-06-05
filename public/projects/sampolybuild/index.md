# 🏗️ SAMPolyBuild - 建筑多边形提取


# 🏗️ SAMPolyBuild - 建筑多边形提取

基于 Segment Anything Model (SAM) 的建筑多边形自动提取工具

## 🎯 功能特点

- 🏠 **建筑轮廓提取**：从卫星影像中自动提取建筑多边形
- 📐 **精确边界**：生成矢量化的建筑轮廓
- 🖼️ **大图支持**：支持大尺寸 TIFF 影像推理
- ⚡ **ONNX 加速**：支持 ONNX 模型推理
- 🎮 **交互模式**：支持点击/框选交互式提示

## 🛠️ 技术栈

| 组件 | 技术 |
|------|------|
| **模型** | SAM + MMDetection |
| **训练** | PyTorch Lightning |
| **推理** | ONNX Runtime |
| **部署** | Docker |

## 📦 模型文件

- `sam_encoder.onnx` - SAM 编码器
- `sam_vitl.onnx` - SAM ViT-L 模型
- `auto_whumix.pth` - WHU 数据集训练权重

## 🚀 快速开始

```bash
# 安装依赖
pip install -r requirements.txt

# 自动推理（大图）
python infer_auto_large_tif.py --input image.tif --output result.shp

# 交互式推理
python interactive_prompt.py --input image.tif

# 导出 ONNX
python export_vit.py
```

## 🐳 Docker 部署

```bash
docker build -t sampolybuild .
docker run -v /path/to/data:/data sampolybuild python infer_auto.py --input /data/image.tif
```

## 📊 支持数据集

- WHU 建筑数据集
- SpaceNet 数据集

## 🔗 相关资源

- 💻 项目代码：D:\project\SAMPolyBuild
- 📦 ONNX 模型：sam_encoder.onnx, sam_vitl.onnx

