# 301重定向映射表

## 概述

本文档记录从旧帝国CMS迁移到新站的URL重定向规则。

---

## 旧站URL格式

```
# 文章详情页
http://www.xxx.com/e/action/ShowInfo/?classid=4&id=123

# 栏目列表页
http://www.xxx.com/e/action/ListInfo/?classid=4&page=1
```

---

## 栏目ID映射

| 旧classid | 栏目名称 | 新URL |
|-----------|----------|-------|
| 4 | 律师风采 | `/category/3` |
| 6 | 律师简介 | `/category/2` |
| 8 | 首页/关于我们 | `/category/1` |
| 11 | 律师风采 | `/category/3` |
| 12 | 刑事辩护 | `/category/4` |
| 15 | 婚姻家庭 | `/category/5` |
| 16 | 房产纠纷 | `/category/6` |
| 17 | 工伤交通 | `/category/7` |
| 18 | 公司劳务 | `/category/8` |
| 19 | 经济生活 | `/category/9` |

---

## 重定向示例

### 1. 文章页

```
旧: /e/action/ShowInfo/?classid=12&id=100
新: /articles/100
```

### 2. 栏目列表页

```
旧: /e/action/ListInfo/?classid=12&page=1
新: /category/4

旧: /e/action/ListInfo/?classid=12&page=2
新: /category/4?page=2
```

### 3. 首页/静态页

```
旧: /index.html        →  /
旧: /contact.html      →  /contact
旧: /about.html        →  /about
旧: /fees.html         →  /fees
旧: /lawyers.html      →  /about
```

---

## Nginx配置示例

```nginx
# 301重定向规则
location = /index.html {
    return 301 /;
}

location = /contact.html {
    return 301 /contact;
}

location = /about.html {
    return 301 /about;
}

location = /fees.html {
    return 301 /fees;
}

# 文章详情页
location ~* ^/e/action/ShowInfo/ {
    if ($args ~* "id=(\d+)") {
        set $article_id $1;
        return 301 /articles/$article_id;
    }
    return 301 /;
}

# 栏目列表页
location ~* ^/e/action/ListInfo/ {
    if ($args ~* "classid=(\d+)") {
        set $classid $1;
        
        # 根据classid重定向
        if ($classid = "4") { return 301 /category/3; }
        if ($classid = "6") { return 301 /category/2; }
        if ($classid = "8") { return 301 /category/1; }
        if ($classid = "11") { return 301 /category/3; }
        if ($classid = "12") { return 301 /category/4; }
        if ($classid = "15") { return 301 /category/5; }
        if ($classid = "16") { return 301 /category/6; }
        if ($classid = "17") { return 301 /category/7; }
        if ($classid = "18") { return 301 /category/8; }
        if ($classid = "19") { return 301 /category/9; }
        
        return 301 /articles;
    }
    return 301 /;
}

# 其他/e/路径
location ~* ^/e/ {
    return 301 /;
}
```

---

## Apache .htaccess 示例

```apache
# 开启重写引擎
RewriteEngine On
RewriteBase /

# 首页重定向
Redirect 301 /index.html /

# 静态页重定向
Redirect 301 /contact.html /contact
Redirect 301 /about.html /about
Redirect 301 /fees.html /fees
Redirect 301 /lawyers.html /about

# 文章页重定向 (使用query string)
RewriteCond %{QUERY_STRING} ^id=(\d+)$
RewriteRule ^e/action/ShowInfo/$ /articles/%1? [R=301,L]

# 栏目页重定向
RewriteCond %{QUERY_STRING} ^classid=4(&page=(\d+))?$
RewriteRule ^e/action/ListInfo/$ /category/3%{QUERY_STRING:/} [R=301,L]

# 通用栏目重定向
RewriteCond %{QUERY_STRING} ^classid=(\d+)(&page=(\d+))?$
RewriteRule ^e/action/ListInfo/$ /category/%1%{QUERY_STRING:/}? [R=301,L]

# 其他/e/路径
RewriteRule ^e/ / [R=301,L]
```

---

## 更新日志

| 日期 | 说明 |
|------|------|
| 2026-05-07 | 初始创建，完成基础重定向规则 |
