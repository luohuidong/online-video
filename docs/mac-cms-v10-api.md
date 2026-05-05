# 苹果 CMS V10 Provider 接口参数文档

## 目录

- [视频接口 provide/vod](#1-视频接口-providevod)
- [文章接口 provide/art](#2-文章接口-provideart)
- [明星接口 provide/actor](#3-明星接口-provideactor)
- [通用说明](#4-通用说明)

---

## 1. 视频接口 provide/vod

**接口地址：** `http://域名/api.php/provide/vod/`

### 参数列表

| 参数  | 类型   | 说明                                                                |
| ----- | ------ | ------------------------------------------------------------------- |
| `ac`  | string | 模式：`videolist`（列表）、`detail`（详情），为空则采用列表标准模式 |
| `ids` | string | 视频 ID，多个用英文逗号 `,` 分隔                                    |
| `t`   | int    | 分类（类型）ID                                                      |
| `h`   | int    | 最近多少小时内更新的视频                                            |
| `pg`  | int    | 分页页码                                                            |
| `wd`  | string | 搜索关键词（like 模糊匹配）                                         |
| `at`  | string | 输出格式，设置为 `xml` 则输出 XML 格式（默认 JSON）                 |

### 调用示例

```bash
# 获取视频列表（默认列表标准模式）
/api.php/provide/vod/

# 仅获取列表（不含分类）
/api.php/provide/vod/?ac=videolist

# 指定分类（分类ID=2）
/api.php/provide/vod/?ac=videolist&t=2

# 获取特定视频详情（视频ID=33317）
/api.php/provide/vod/?ac=videolist&ids=33317

# 获取多个视频详情（视频ID=123,567）
/api.php/provide/vod/?ac=detail&ids=123,567

# 搜索关键词
/api.php/provide/vod/?ac=videolist&wd=关键词

# 分页获取（第5页）
/api.php/provide/vod/?ac=list&pg=5

# 获取最近24小时内更新的视频
/api.php/provide/vod/?ac=videolist&h=24

# 输出XML格式
/api.php/provide/vod/?ac=list&at=xml
```

### 响应字段（视频列表）

| 字段            | 说明                           |
| --------------- | ------------------------------ |
| `code`          | 状态码，1=成功                 |
| `msg`           | 返回消息                       |
| `page`          | 当前页码                       |
| `pagecount`     | 总页数                         |
| `limit`         | 每页显示数量                   |
| `total`         | 数据总数                       |
| `list`          | 数据列表数组                   |
| `vod_id`        | 视频ID                         |
| `vod_name`      | 视频名称                       |
| `type_id`       | 分类ID                         |
| `type_name`     | 分类名称                       |
| `vod_en`        | 视频英文名/拼音                |
| `vod_time`      | 更新时间                       |
| `vod_remarks`   | 备注（如：超清）               |
| `vod_play_from` | 播放来源（如：youku, tencent） |

---

## 2. 文章接口 provide/art

**接口地址：** `http://域名/api.php/provide/art/`

### 参数列表

| 参数  | 类型   | 说明                                                   |
| ----- | ------ | ------------------------------------------------------ |
| `ac`  | string | 模式：`list`（列表）、`detail`（详情），为空则列表模式 |
| `ids` | string | 文章 ID，多个用英文逗号 `,` 分隔                       |
| `t`   | int    | 分类 ID                                                |
| `h`   | int    | 最近多少小时内更新的文章                               |
| `pg`  | int    | 分页页码                                               |
| `wd`  | string | 搜索关键词（like 模糊匹配）                            |

### 调用示例

```bash
# 获取文章列表
/api.php/provide/art/?ac=list

# 获取文章详情（文章ID=123）
/api.php/provide/art/?ac=detail&ids=123

# 获取多个文章详情
/api.php/provide/art/?ac=detail&ids=123,456

# 指定分类（分类ID=1）
/api.php/provide/art/?ac=list&t=1

# 搜索关键词
/api.php/provide/art/?ac=list&wd=关键词

# 分页获取
/api.php/provide/art/?ac=list&pg=2

# 获取最近12小时内更新的文章
/api.php/provide/art/?ac=list&h=12
```

### 响应字段（文章列表）

| 字段        | 说明           |
| ----------- | -------------- |
| `code`      | 状态码，1=成功 |
| `msg`       | 返回消息       |
| `page`      | 当前页码       |
| `pagecount` | 总页数         |
| `limit`     | 每页显示数量   |
| `total`     | 数据总数       |
| `list`      | 数据列表数组   |

---

## 3. 明星接口 provide/actor

**接口地址：** `http://域名/api.php/provide/actor/`

### 参数列表

| 参数  | 类型   | 说明                                                   |
| ----- | ------ | ------------------------------------------------------ |
| `ac`  | string | 模式：`list`（列表）、`detail`（详情），为空则列表模式 |
| `ids` | string | 明星 ID，多个用英文逗号 `,` 分隔                       |
| `t`   | int    | 分类 ID                                                |
| `h`   | int    | 最近多少小时内更新的记录                               |
| `pg`  | int    | 分页页码                                               |
| `wd`  | string | 搜索关键词（like 模糊匹配）                            |

### 调用示例

```bash
# 获取明星列表
/api.php/provide/actor/

# 获取特定明星详情（明星ID=1001）
/api.php/provide/actor?ids=1001

# 指定分类（分类ID=5）
/api.php/provide/actor?t=5

# 搜索关键词
/api.php/provide/actor?wd=明星名字

# 分页获取
/api.php/provide/actor?pg=2
```

---

## 4. 通用说明

### 输出格式

- **JSON 格式**（默认）：所有接口默认返回 JSON 数据
- **XML 格式**：在请求参数中添加 `&at=xml`

### 分页机制

- 每页显示数量由后台系统配置（默认 20 条）
- 使用 `pg` 参数控制页码
- 响应中包含分页信息：`page`、`pagecount`、`limit`、`total`

### 后台配置项（开放 API 配置）

在苹果 CMS 管理后台 **系统 >> 开放API配置** 中可设置：

| 配置项           | 说明                                          |
| ---------------- | --------------------------------------------- |
| 接口开关         | 开启/关闭 API 接口                            |
| 是否收费         | 是否启用收费模式                              |
| 列表每页显示数量 | 每页返回的数据条数（建议 20）                 |
| 图片域名         | 图片完整访问路径，以 `http://` 开头，`/` 结尾 |
| 分类过滤参数     | 指定开放的分类 IDs，如 `11,12,13`             |
| 数据过滤参数     | SQL 查询条件，如 `vod_status=1`               |
| 数据缓存时间     | 单位秒，建议 3600 以上                        |
| 指定播放组       | 指定播放组，如 `youku`                        |
| 授权域名         | 收费模式下填写被授权的域名                    |

### 错误码

| code | 说明      |
| ---- | --------- |
| 1    | 成功      |
| 0    | 失败/错误 |

---

## 快速参考

| 接口     | 地址                                      | 必选参数           |
| -------- | ----------------------------------------- | ------------------ |
| 视频列表 | `/api.php/provide/vod/?ac=list`           | `ac=list`          |
| 视频详情 | `/api.php/provide/vod/?ac=detail&ids=xxx` | `ac=detail`, `ids` |
| 文章列表 | `/api.php/provide/art/?ac=list`           | `ac=list`          |
| 文章详情 | `/api.php/provide/art/?ac=detail&ids=xxx` | `ac=detail`, `ids` |
| 明星列表 | `/api.php/provide/actor/`                 | -                  |
| 明星详情 | `/api.php/provide/actor?ids=xxx`          | `ids`              |
