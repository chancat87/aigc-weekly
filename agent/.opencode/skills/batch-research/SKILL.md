---
name: batch-research
description: 批量数据采集技能，负责分批并发调度 researcher agent 抓取所有数据源。
---

# Batch Research 技能

此技能用于指导 `/weekly` 命令如何高效、分批、并发地从多个数据源采集信息。

## 核心职责

作为批量调度器，负责：

1. 解析数据源列表
2. 生成所有待抓取 URL
3. 分批并发调用 `researcher` agent
4. 汇总结果生成报告

## 工作流程

### Step 1: 准备阶段

1. **读取数据源**：从 `.opencode/REFERENCE.md` 获取完整数据源列表
2. **生成 URL 列表**：
   - 静态 URL：直接使用
   - 动态 URL（Hacker News）：使用 `generateHNUrls(start_date, end_date)`

```javascript
import { generateHNUrls } from '.opencode/utils.mjs'

// Hacker News - 每天一个 URL
const hnUrls = generateHNUrls(start_date, end_date)
// 返回: [
//   "https://news.ycombinator.com/front?day=2026-03-22",
//   "https://news.ycombinator.com/front?day=2026-03-23",
//   ...
// ]
```

### Step 2: 分批策略

将所有 URL 按优先级分为 3 批，每批 10-12 个 URL：

| 批次        | 数据源类型          | 来源                                       |
| ----------- | ------------------- | ------------------------------------------ |
| **Batch 1** | Important Resources | REFERENCE.md 中 "Important Resources" 部分 |
| **Batch 2** | Blogs & Websites    | REFERENCE.md 中 "Blogs & Websites" 部分    |
| **Batch 3** | KOL & Influencers   | REFERENCE.md 中 "KOL & Influencers" 部分   |

### Step 3: 并发调度

对每个批次：

1. **并发调用**：同时启动该批次内所有 `researcher` agent
2. **等待完成**：等待当前批次所有 researcher 返回结果
3. **进入下一批**：当前批次全部完成后，再启动下一批次

**调用 researcher 的参数格式**：

```yaml
url: https://news.ycombinator.com/front?day=2026-03-22
source_name: Hacker News
week_id: Y26W12
start_date: 2026-03-22
end_date: 2026-03-28
timezone: UTC+0
```

**并发调用示例**（伪代码）：

```
# Batch 1: Important Resources
并行调用：
  - researcher(url: "https://news.ycombinator.com/front?day=2026-03-22", source_name: "Hacker News")
  - researcher(url: "https://news.ycombinator.com/front?day=2026-03-23", source_name: "Hacker News")
  - researcher(url: "https://drafts.miantiao.me/", source_name: "Miantiao Drafts")
  - researcher(url: "https://www.solidot.org/search?tid=151", source_name: "Solidot")
  - ...

等待 Batch 1 全部完成

# Batch 2: Blogs & Websites
并行调用：
  - researcher(url: "https://www.anthropic.com/engineering", source_name: "Anthropic Engineering")
  - researcher(url: "https://claude.com/blog", source_name: "Claude Blog")
  - ...

等待 Batch 2 全部完成

# Batch 3: KOL & Influencers
并行调用：
  - researcher(url: "https://baoyu.io/", source_name: "Baoyu")
  - ...

等待 Batch 3 全部完成
```

### Step 4: 汇总报告

所有批次完成后，生成 `logs/research-report.md`：

```markdown
## 抓取报告

**参数回显**：

- week_id: Y26W12
- 时间范围: 2026-03-22 至 2026-03-28
- 时区: UTC+0

**统计**：

- 总数据源: 30 个
- 成功: 27 个源，共 X 篇文章
- 失败: 3 个源

**成功列表**：

| 源                  | 文章数 | 文件                              |
| ------------------- | ------ | --------------------------------- |
| Hacker News (03-22) | 5      | drafts/2026-03-22-hn-\*.md        |
| Anthropic Blog      | 2      | drafts/2026-03-24-anthropic-\*.md |

**失败列表**：

| 源        | 错误                  |
| --------- | --------------------- |
| daily.dev | 429 Too Many Requests |
```

## 约束与注意事项

- **全量抓取**：必须抓取所有数据源，不能跳过
- **批次顺序**：必须按批次顺序执行，等待当前批次完成后再进入下一批
- **错误隔离**：单个 researcher 失败不影响其他
- **重试由 researcher 处理**：本技能不负责重试，由 researcher 自行处理
- **进入下一阶段前**：必须完成所有批次的抓取
