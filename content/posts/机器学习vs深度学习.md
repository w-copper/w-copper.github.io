+++
date = '2019-10-05T11:05:20+08:00'
draft = false
title = '机器学习vs深度学习'
+++
<!--more-->
## 起源

深度学习可以认为是机器学习里的一个分支，但是随着其发展，前者越来越独立，或者说，可以被认为是一个新的领域。

二者有着共同之处。概括的来说，二者都是在教计算机如何学习。二者的不同之处可以这样想：机器学习可解释，深度学习不可解释。

并且，随着深度学习发展，人们又给了它一个新的名号：人工智能。

## 机器学习

机器学习更多的依赖于概率论、最优化方法，研究如何从现有的数据，利用进行模式发掘，也就是所谓的模式识别。

机器学习的一些经典例子有：

- 线性回归，广义的线性回归（GLM），岭回归（L2正则化）
- SVM，经典中的经典
- EM算法，高斯混合模型
- 多层感知机，层数较小
- PCA变换
- 贝叶斯的概率图模型
- 高斯判别模型
- 马尔科夫链，马尔科夫随机场
- 蒙特卡洛采样
- 聚类算法
- 遗传算法，模拟退火等优化算法

也可以看出，机器学习对信息论、概率论、矩阵、随机过程等有着较高的要求，因此也有人说机器学习就是统计学。

## 深度学习

与机器学习比起来，这个后来居上的深度学习似乎更加简单一些，尤其是随着一批深度学习框架的推出，例如`caffe, pytorch, tensorflow, mxnet`等等。

深度学习可以根据任务要求分为以下几个方面：

- 图像：
    - 场景分类，即给定图像，判定场景。例如给出不同的天气图片，判断是何种天气
    - 目标识别，将图像中特定的对象识别并给出其位置
    - 人脸识别，非常火
    - 目标跟踪，给出连续的视频帧，跟踪给定目标的移动。根据目标数量多少，又可以分为单目标和多目标
    - 风格迁移，也就是GAN，生成式对抗网络
    - 语义分割，FCN流派
- 语音：
    - 语音转文字
- 文字：
    - 对话，比如说小爱同学
    - 翻译，Google翻译
- 运动：
    - 强化学习，控制机器人移动等
- 混合：
    - 看图说话
    - 根据文字生产图片

此外根据网络结构不同还可以分为CNN，RNN等等。