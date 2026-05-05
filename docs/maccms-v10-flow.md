# 苹果 CMS V10 视频播放完整流程

## 目录

- [苹果 CMS V10 视频播放完整流程](#苹果-cms-v10-视频播放完整流程)
  - [目录](#目录)
  - [1. 整体架构流程](#1-整体架构流程)
  - [2. 数据获取流程](#2-数据获取流程)
    - [API 调用示例](#api-调用示例)
  - [3. 播放器渲染流程](#3-播放器渲染流程)
    - [播放页模板数据流转](#播放页模板数据流转)
  - [4. 视频播放流程](#4-视频播放流程)
  - [5. 完整时序图](#5-完整时序图)
  - [6. 播放地址解析流程](#6-播放地址解析流程)
    - [解析地址优先级](#解析地址优先级)
    - [播放器文件位置](#播放器文件位置)
    - [播放器配置流程](#播放器配置流程)
  - [7. 播放页模板标签](#7-播放页模板标签)
    - [模板标签说明](#模板标签说明)
  - [8. 播放器配置后台路径](#8-播放器配置后台路径)
  - [9. 流程总结](#9-流程总结)

---

## 1. 整体架构流程

```mermaid
flowchart TD
    subgraph Client[客户端]
        A[用户浏览器]
    end

    subgraph CMS[苹果CMS V10]
        B[前端页面]
        C[模板引擎]
        D[播放器文件]
        E[API接口]
        F[数据库]
    end

    subgraph External[外部资源]
        G[资源站/采集接口]
        H[第三方解析器]
        I[视频CDN]
    end

    A -->|访问播放页| B
    B --> C
    C -->|获取视频数据| E
    E -->|查询| F
    E -->|获取播放地址| D
    D -->|调用解析| H
    H -->|获取真实URL| I
    A -->|播放视频| I

    G -.->|采集资源| F
```

---

## 2. 数据获取流程

```mermaid
flowchart LR
    A[用户请求视频列表页] --> B{请求类型}
    B -->|列表| C[api.php/provide/vod/?ac=list]
    B -->|详情| D[api.php/provide/vod/?ac=detail]
    B -->|搜索| E[api.php/provide/vod/?ac=list&wd=关键词]

    C --> F[构建SQL查询]
    D --> F
    E --> F

    F --> G[查询数据库 mac_vod 表]
    G --> H[返回JSON数据]

    H --> I{at参数}
    I -->|xml| J[XML格式输出]
    I -->|空/其他| K[JSON格式输出]

    J --> L[客户端解析XML]
    K --> M[客户端解析JSON]
```

### API 调用示例

```bash
# 视频列表
GET /api.php/provide/vod/?ac=list

# 视频详情
GET /api.php/provide/vod/?ac=detail&ids=33317

# 带分页
GET /api.php/provide/vod/?ac=list&pg=1&limit=20

# 搜索
GET /api.php/provide/vod/?ac=list&wd=战狼

# 指定分类
GET /api.php/provide/vod/?ac=list&t=6
```

---

## 3. 播放器渲染流程

```mermaid
flowchart TB
    A[访问播放页] --> B[加载模板文件 play.html]
    B --> C[查询视频详情 vod_id]
    C --> D[获取播放地址信息 vod_play_url]
    D --> E[解析播放地址格式]

    E --> F{播放源类型}
    F -->|m3u8| G[使用 DPlayer / videojs]
    F -->|直链| H[使用 iframe 外链播放器]
    F -->|解析接口| I[调用第三方解析器]

    G --> J[初始化H5播放器]
    H --> K[iframe嵌套播放]
    I --> L[解析接口转换URL]

    J --> M[用户点击播放]
    K --> M
    L --> M

    M --> N[视频流输出]
```

### 播放页模板数据流转

```mermaid
flowchart LR
    A[obj 对象<br/>视频详情数据] --> B[vod_play_list<br/>播放源列表]
    B --> C[from: 播放源名称<br/>如: youku, tencent, m3u8]
    B --> D[sid: 播放源ID]
    B --> E[urls: 集数列表]
    E --> F[nid: 集数序号]
    E --> G[title: 集数标题]
    E --> H[url: 播放地址]
```

---

## 4. 视频播放流程

```mermaid
sequenceDiagram
    participant U as 用户浏览器
    participant P as 播放页模板
    participant CMS as 苹果CMS系统
    participant DB as 数据库
    participant PL as 播放器
    participant PR as 解析接口
    participant CDN as 视频CDN

    U->>P: 访问播放页 /vod/play/id/xxx
    P->>CMS: 请求视频数据
    CMS->>DB: 查询视频信息
    DB-->>CMS: 返回 vod_play_url 等
    CMS-->>P: 返回视频数据对象

    P->>PL: 传递播放参数<br/>MacPlayer.PlayUrl
    PL->>PR: 调用解析接口
    PR-->>PL: 返回真实播放地址

    PL->>CDN: 请求视频流
    CDN-->>U: 传输视频数据
    U-->>PL: 视频播放中
```

---

## 5. 完整时序图

```mermaid
sequenceDiagram
    participant User as 用户
    participant Browser as 浏览器
    participant Template as 播放模板
    participant API as API接口
    participant DB as 数据库
    participant Player as 播放器文件
    participant Parser as 解析接口
    participant Video as 视频源

    User->>Browser: 点击视频播放

    Browser->>Template: GET /vod/play/id/33317
    Template->>API: 请求视频详情
    API->>DB: SELECT * FROM mac_vod<br/>WHERE vod_id=33317
    DB-->>API: 返回视频数据
    API-->>Template: 返回JSON数据<br/>包含 vod_play_url

    Template-->>Browser: 渲染播放页<br/>生成播放列表

    Browser->>Player: 加载播放器JS<br/>MacPlayer.PlayUrl='youku/xxx'

    Player->>Parser: 调用解析接口<br/>api.xx.com/?url=播放地址
    Parser->>Video: 解析真实URL
    Video-->>Parser: 返回真实m3u8地址
    Parser-->>Player: 返回播放地址

    Player->>Video: 请求视频流
    Video-->>Player: 传输视频数据
    Player-->>Browser: 播放视频
```

---

## 6. 播放地址解析流程

```mermaid
flowchart TD
    A[原始播放地址<br/>youku/m3u8/xxx] --> B{播放器配置}

    B --> C[全局解析地址]
    B --> D[独立解析地址]
    B --> E[本地播放器]

    C -->|优先级2| F{独立解析是否<br/>填写}
    D -->|优先级1| F

    F -->|是| G[使用独立解析地址]
    F -->|否| H{解析状态<br/>是否启用}

    H -->|是| I[使用全局解析地址]
    H -->|否| E

    G --> J[解析接口转换]
    I --> J
    E --> K[直接播放]

    J --> L[第三方解析器]
    L --> M[返回真实URL]

    K --> N[浏览器播放]
    M --> N
```

### 解析地址优先级

```mermaid
flowchart LR
    A[播放请求] --> B{独立解析配置}
    B -->|已配置| C[独立解析地址]
    B -->|未配置| D{全局解析配置}
    D -->|启用| E[全局解析地址]
    D -->|未启用| F[直接播放<br/>本地/直链]

    C --> G[第三方解析]
    E --> G
    G --> H[获取真实URL]
    F --> I[浏览器原生播放]
    H --> I
```

### 播放器文件位置

```
/static/player/           # 播放器目录
├── dplayer.html         # DPlayer播放器
├── videojs.html         # videojs播放器
├── ckplayer.html        # ckplayer播放器
└── player.js            # 播放器核心JS
```

### 播放器配置流程

```mermaid
flowchart LR
    A[后台播放器设置] --> B[选择播放器<br/>编码如 dplayer]
    B --> C[配置解析地址]
    C --> D[解析状态启用/禁用]
    D --> E[保存配置]
    E --> F[生成播放代码]

    F --> G[模板调用<br/>MacPlayer.Html]
    G --> H[页面渲染播放器]
```

---

## 7. 播放页模板标签

```html
<!-- 遍历所有播放源 -->
{maccms:foreach name="obj.vod_play_list" id="vo"}
<div class="play_source">
  <h2>{$vo.from}-在线播放</h2>
  <span>{$vo.player_info.tip}</span>
</div>

<!-- 遍历当前播放源的集数 -->
{maccms:foreach name="vo.urls" id="vo2"}
<a href="{:mac_url_vod_play($obj,['sid'=>$vo.sid,'nid'=>$vo2.nid])}"> {$vo2.title} </a>
{/maccms:foreach} {/maccms:foreach}
```

### 模板标签说明

| 标签                 | 说明                           |
| -------------------- | ------------------------------ |
| `obj.vod_play_list`  | 播放源列表数组                 |
| `vo.from`            | 播放源名称（youku, tencent等） |
| `vo.sid`             | 播放源ID                       |
| `vo.urls`            | 该播放源的集数列表             |
| `vo2.nid`            | 集数序号                       |
| `vo2.title`          | 集数标题                       |
| `vo2.url`            | 集数播放地址                   |
| `mac_url_vod_play()` | 生成播放页URL函数              |

---

## 8. 播放器配置后台路径

```
系统 → 播放器参数配置     # 全局解析地址
视频 → 播放器管理         # 单个播放器配置
  ├── 状态: 启用/禁用
  ├── 编码: dplayer
  ├── 名称: DPlayer播放器
  ├── 解析状态: 启用/禁用
  ├── 解析地址: http://xxx.com/?url=
  └── 播放器代码: 自定义嵌入代码
```

---

## 9. 流程总结

```mermaid
flowchart TD
    A[1. 资源采集] --> B[2. 入库存储]
    B --> C[3. 开放API配置]
    C --> D[4. 前端页面请求]
    D --> E[5. API返回数据]
    E --> F[6. 模板渲染播放列表]
    F --> G[7. 用户点击播放]
    G --> H[8. 加载播放器]
    H --> I{9. 解析地址判断}
    I -->|需要解析| J[调用解析接口]
    I -->|直链| K[直接播放]
    J --> L[获取真实URL]
    L --> K
    K --> M[浏览器解码播放]
```

| 步骤        | 说明                                    |
| ----------- | --------------------------------------- |
| 1. 资源采集 | 从资源站采集视频信息到数据库            |
| 2. 入库存储 | 存储 vod_name, vod_play_url 等          |
| 3. API配置  | 后台开放API接口并配置参数               |
| 4. 页面请求 | 前端通过 /api.php/provide/vod/ 获取数据 |
| 5. 返回数据 | JSON 格式返回视频列表/详情              |
| 6. 渲染列表 | 模板引擎渲染播放源和集数列表            |
| 7. 点击播放 | 用户选择集数并点击播放                  |
| 8. 加载播放 | 根据配置加载对应播放器                  |
| 9. 解析播放 | 调用解析接口或直接播放                  |
