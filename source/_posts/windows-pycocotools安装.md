---
title: windows pycocotools安装
date: 2019-10-04 14:24:16
tags:
- 机器学习
- python
---

`pycocotools`官方不提供`windows`支持，并且他们也不准备提供。

幸好有大佬提供了支持

`windows`用户可以按照如下步骤安装：

- 在微软网站下载`visual c++ 14.+`的`run time`组件 [链接](https://visualstudio.microsoft.com/zh-hans/downloads/)
- 在Github下载源码 [链接](https://github.com/willyd/coco/tree/master)
- 在`PythonAPI`文件夹下运行`python setup.py build_ext install`