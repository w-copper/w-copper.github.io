---
title: IE之坑
date: 2019-10-08 13:55:46
tags:
- web开发
- 前端
- IE
---
### url中的中文

`axios`或者其他的通过url获取资源的方式，如果在Chrome中正常，在IE中报关于`promise`的错，请检查是否在url中存在中文字符

<!--more -->

如果存在，很可能就是因为这个原因导致的：IE中发送url使用的编码与chrom不一样

解决方法：`url = encodeURL(url)`

> 注意，如果url中存在着转义字符，如`%3A`等，请用正常字符替换掉转义字符，或者只`encode`带中文的部分