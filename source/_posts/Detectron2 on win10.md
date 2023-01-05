---
title: Detectron2 在win10的安装经历
date: 2020-7-21 13:55:46
tags:
- python
- Detectron2
- windows
---

<!-- more -->

# Detectron2 在win10的安装经历

## 环境配置

- Windows 10 专业版 2004 19041.1083
- VS2019
- CUDA 10.2
- ninga windows v1.10.2 (from github)
- Anaconda 3 + python 3.7
- 预先安装的python库有：
  - pycocotools-windows  2.0.0.2 (`pip install pycocotools-windows`)
  - pytorch 1.71 cuda10.2 (`pytorch==1.7.1 torchvision==0.8.2 torchaudio==0.7.2 cudatoolkit=10.2 -c pytorch`)

## Detectron2 安装

- 下载：Detectron2 版本为 0.4.1，在github中[下载源码](https://github.com/facebookresearch/detectron2)

- 安装：

  1. 修改`CONDA_ENV_PATH/Lib/site-packages/torch/include/torch/csrc/jit/ir/ir.h`中第1347行：

     `static constexpr Symbol Kind = ::c10::prim::profile_optional;`

     将其注释

     > 我也不知道为啥，反正注释掉后不报错了

  2. 安装detectron2

     ```bat
     cd DETECTRON2_PATH
     call "C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\VC\Auxiliary\Build\vcvars64.bat"
     set DISTUTILS_USE_SDK=1
     python setup.py install develop
     ```

## 后记

安装的过程异常的顺利，基本没有坑点

