# 如何抓取 arXiv 论文

<!--more-->
# 如何抓取 arXiv 论文

## 一、简介

arXiv 是一个开放获取的学术论文预印本平台，涵盖物理、数学、计算机科学等多个领域。通过编程方式，我们可以方便地抓取 arXiv 上的论文信息。

---
### 使用 arXiv 的官方 API

#### ✅ API 地址：
```
https://export.arxiv.org/api/query
```

#### 📌 参数说明：
- `search_query`：搜索关键词（例如 `"cs.AI"`）
- `start`：起始位置（用于分页）
- `max_results`：最大返回数量（最多100）

#### 📦 示例代码（Python）：

```python
import requests
from feedparser import parse

url = 'https://export.arxiv.org/api/query'
params = {
    'search_query': 'cs.AI',
    'start': 0,
    'max_results': 5
}

response = requests.get(url, params=params)
feed = parse(response.text)

for entry in feed.entries:
    print("标题:", entry.title)
    print("摘要:", entry.summary)
    print("链接:", entry.link)
    print("发布日期:", entry.published)
    print("-" * 50)
```

#### 📚 安装依赖：
```bash
pip install requests feedparser
```

