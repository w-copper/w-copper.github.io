# docker+nginx+nextcloud采坑



<!--more-->


其实也算不上采坑，nginx和nextcloud都是很成熟的软件。需要配置的是反向代理有关的设置。


docker-compose.yml

```
services:
  nginx:
    image: nginx:latest
        ports:
        - "port:80"
        networks:
        - net

  nextcloud:
    image: nextcloud
    networks:
      - net
    volumes:
      - /nextcloud/data:/var/www/html
    restart: always

```

利用nginx的反向代理将请求转发至nextcloud

```
location ^~ /nextcloud/ {
    proxy_pass: http://nextcloud/;
}
```

在nextcloud的配置中有这么几项(位于/nextcloud/data/config/config.php,需要root用户)：

```php
<?php
$CONFIG = array(
'overwrite.cli.url' => 'http://nextcloud',
'overwritewebroot' => '',
'proxy' => '',
)
```

需要将其更改为：

```php
<?php
$CONFIG = array(
'overwrite.cli.url' => 'http://nextcloud',
'overwritewebroot' => '/nextcloud',
'proxy' => 'nginx:port',
)
```

