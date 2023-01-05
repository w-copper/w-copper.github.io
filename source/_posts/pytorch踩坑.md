---
title: pytorch踩坑
date: 2019-10-03 15:03:09
tags:
- pytorch
- 学习
- 机器学习
categories:
- pytorch
---
## 安装

- 利用`Anaconda`创建虚拟环境`pyt`

- GPU版本需要先配置cuda10.0，步骤如下(安装CPU版本的直接跳过)：
    - 从NIVIDIA官网下载适合本机的显卡驱动，一般最新版就行，[链接](https://www.nvidia.com/Download/index.aspx?lang=en-us)
  <!-- more -->
    - 下载[CUDA Toolkit](https://developer.nvidia.com/cuda-10.0-download-archive?target_os=Windows&target_arch=x86_64&target_version=10&target_type=exelocal)，
    - 下载cuDNN，这个需要注册。[链接](https://developer.nvidia.com/rdp/form/cudnn-download-survey)

- 直接利用`pip`或者`conda`安装即可
    - cpu版本需要安装`torch=1.2.0, torchvision-cpu=0.4.0`
    - GPU版本需要安装`torch=1.2.0, torchvision=0.4.0, cudatoolkit=10.0`

- `torch`和`torchvision`下载慢的话可以直接从镜像下载后，在本地`conda install [filename]`的方式安装，
    - `cudatoolkit`的[链接](https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/win-64/cudatoolkit-10.0.130-0.tar.bz2)
    - `torch, torchvision`的[链接](https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/pytorch/)

## TensorboardX问题

`tensorboardX`与`tensorboard`用法基本一致，但是在`pytorch`中，利用`tensorboard`的`add_graph`所添加的网络图并不能显示出来，`tensorboardX`则可以。

但是`tensorboardX<=1.8.0`与`pytorch=1.2.0`之间存在问题[issue](https://github.com/lanpa/tensorboardX/issues/483)，原因是在`pytoch`更新到`1.2.0`时将`uniqueName`改为了`debugName`,而`pytorch`还未发布更改后的。

解决方法有三：
- Linux用户可以直接从github下载源码安装，`git clone https://github.com/lanpa/tensorboardX && cd tensorboardX && python setup.py install`
- Win用户和Linux用户可以将`pytoch`版本降低为`1.1.0`
- 两个方法都不喜欢？改源码！
    - 找到`tensorboardX`的安装目录，如果用的`Anaconda`那理论上应该在`Anaconda3/envs/[环境名]/lib/site-packages/tensorboardX`
    - 找到`pytorch_graph.py`
    - 打开，将**所有**的`uniqueName`改为`debugName`
    - 删除`tensorboardX`目录下的`__pycache__`文件夹
