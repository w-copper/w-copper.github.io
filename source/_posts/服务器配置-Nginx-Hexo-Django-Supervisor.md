---
title: 服务器配置-Nginx+Hexo+Django+Supervisor
date: 2019-10-25 22:47:14
tags:
- Linux
- Nginx
- Django
- python
- supervisor
categories:
- 服务器部署
---
## 前言

很早之前就在腾讯云购买了一个云服务器，最近刚刚给域名备案完成，因此打算利用起来这个服务器，将域名绑定至ip地址上，顺便研究下：
<!-- more -->
- nginx配置
- supervisor项目管理

整个项目的构架如下：

- nginx
    - / --> hexo静态文件
    - /api --> django restful api
    - /githooks --> flask 微服务

- supervisor
    - api --> 管理django restful api
    - githooks --> 管理flask微服务

- git hooks
    - push事件 --> github webhooks post to /githooks/push

## Nginx

nginx安装配置非常简单，在这里我只是简单的修改了`/etc/nginx/nginx.conf`的内容，进行了路径转发

具体的内容如下：

```
root /path/to/hexo/public;

rewrite /blog/(.*) /$1 last; //此处是由于hexo的root为blog，如果hexo本身在根目录下则可以删去这一行

location / {
    index index.html;
}

location /api/ {
    proxy_pass http://localhost:8000; //匹配了/api的路径则利用反向代理代理至django的地址
                                      //有两种写法 proxy_pass http://localhost:8000/; 
                                      // 第一种写法 会将 a.com/api/q -> localhost:8000/api/q
                                      // 第二种写法  a.com/api/q -> localhost:8000/q
    //还有很多配置，无关紧要
}
```

### HTTPS申请

HTTPS的申请非常简单，参考[链接](https://www.zmrenwu.com/courses/hellodjango-blog-tutorial/materials/76/)

## supervisor

使用supervisor进行项目管理，可以认为是一种守护进程

编写对django项目的运行文件

```run.sh
#!/bin/bash
/path/to/python/env/bin/python /path/to/django/project/manage.py runserver --your-config
```
先运行一下，确定没有问题后再加入supervisor的配置

```django.conf
[program:django-api]
command = /path/to/run.sh
user = www
auto_start = true
redirect_stdout = /path/to/log/file
```

运行supervisor
```
[root@path]$ supervisord
[root@path]$ supervisorctl start django-api
```

如果修改了配置文件，需要重新启动
```
[root@path]$ supervisorctl reread
django-api changed
[root@path]$ supervisorctl update
```
查看状态
```
[root@path]$ supervisorctl status django-api
```

## githooks配置

利用github的webhooks，实现自动化拉取仓库更新

其原理为：检测到push等事件 --> 向设置的url中发送post信息

首先编写更新脚本
```
cd /hexo/path //此处必须为绝对路径
git fetch origin your-public-branch //也可以直接写 git fetch -a
git reset --hard orgin/your-branch
git pull
```

此处使用Flask配置微服务，在nginx配置路径转发：/githooks/ --> localhost:port/

Flask app编写如下：
```
@app.route('/push', methods=['GET', 'POST'])
def push():
    if request.method == 'POST':
        try:
            data = json.loads(request.data)
            # run your shell file
        except Exception as e:
            print(e)
```

将Flask app的运行命令同样加入supervisor中进行管理

之后配置github的webhooks：
1. 在仓库的settings中找到Webhooks
2. 添加webhoos，这里只监听push事件，url即https://your.web.com/githooks/push，将发送的消息类型改为JSON