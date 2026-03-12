https://docs.bitfinex.com/docs/introduction
api 文档
https://docs.bitfinex.com/reference/rest-public


下面是《**Bitfinex Whale Console（Bitfinex 巨鲸控制台）**》的**详细 PRD.md**（单产品、可直接交给 Claude/Trae 开发）。我已把你三条推文的核心方法论“结构化”为一套**可解释的状态机 + 可告警 + 可复盘**系统，并结合外部资料补齐了**可落地的数据源、API 频率/限流、以及可延展的高价值功能**。

---

# PRD.md — Bitfinex Whale Console（Bitfinex 巨鲸控制台）

## 0. 文档信息

* 产品代号：BWC
* 版本：v0.1（MVP）→ v0.2（增强）→ v1.0（可订阅）
* 目标用户：小白交易者 / 中级交易者（偏 BTC/ETH）、看推文但缺少“系统化监控”的人

---

## 1. 背景与机会

你提供的三条推文，实际上在表达同一个“优势假设”：

> Bitfinex 聚集更多“crypto 原生老牌巨鲸”，其**杠杆仓位变化**（Longs）与**跨所折溢价**（BFX vs Coinbase）能提供更前瞻的市场线索。

但目前这套方法存在三个痛点：

1. 信息分散在 TradingView/推文里，无法连续追踪
2. 大部分人看不懂 longs/premium 的细节，只能靠“感觉”
3. 没有统一的判读规则，更缺乏复盘与统计，难建立信任

**产品机会：**把推文级洞见做成“可解释的监控系统”，输出可执行的状态（吸筹/派发/风险），并用复盘数据建立长期订阅价值。

---

## 2. 产品目标

### 2.1 一句话价值主张

把 Bitfinex 的“巨鲸仓位行为”与“折溢价情绪”变成**清晰状态机 + 自动提醒 + 事件复盘**，让小白也能判断：
**巨鲸在吸筹？在派发？还是出现风险信号？**

### 2.2 核心目标（MVP）

* 在一个 Dashboard 内，稳定展示：

  * BTC Margin Longs（巨鲸仓位代理指标）
  * Bitfinex Premium（BFX vs Coinbase 折溢价）
  * ETH/BTC Whale Longs（节奏型仓位指标）
* 自动生成“信号事件卡片”（解释原因 + 触发时刻 + 后续表现）
* 提供 Telegram / Web Push 告警（至少一种）

### 2.3 非目标（MVP 不做）

* 不做交易执行（自动买卖）
* 不做链上分析、钱包归因
* 不做复杂策略回测（先做轻量复盘统计）

---

## 3. 用户画像与使用场景

### Persona A：推文跟随型小白

* 行为：刷 X 看到“Bitfinex 巨鲸加仓/折价”但不知道怎么持续监控
* 需求：简单明确的提示（红黄绿），别让我学一堆术语

### Persona B：中级交易者/半量化

* 行为：会看图表，会做仓位，但缺少高质量“结构化信号”
* 需求：信号必须可解释、可量化、可复盘验证

---

## 4. 产品核心逻辑：Whale Regime（巨鲸状态机）

系统输出一个核心状态：**Whale Regime**

* 绿：吸筹占优（Accumulation）
* 黄：混沌（Mixed / Wait）
* 红：派发/风险占优（Distribution / Risk）

状态由三类信号加权得出：

### 4.1 信号 1：仓位行为（Longs）

* 观察对象：BTC Margin Longs（Bitfinex 杠杆多头总规模的代理）
* 解释：推文假设“下跌/震荡时 longs 上升 = 左侧建仓；上涨段 longs 回落 = 派发/获利了结”
* 输出子状态：

  * Accumulation Pressure（吸筹压力）
  * Distribution Pressure（派发压力）

### 4.2 信号 2：跨所折溢价（Premium）

* 观察对象：Bitfinex BTC 报价 vs Coinbase BTC 报价
* 解释：Bitfinex 更偏“币圈原生巨鲸”，Coinbase 更偏“美方资金情绪”。折溢价异常 → 情绪/供需结构变化
* 输出子状态：

  * Premium Spike Risk（折溢价异常风险）

### 4.3 信号 3：节奏型仓位（ETH/BTC Whale Longs）

* 观察对象：ETH/BTC longs 的“慢建仓、快平仓”节奏
* 解释：推文强调“平仓结束往往对应阶段性顶”，因此平仓事件比建仓事件更“可操作”
* 输出子状态：

  * Build Phase（建仓阶段）
  * Unwind Phase（平仓阶段）
  * Unwind Completed（平仓完成）

---

## 5. 指标定义与计算（MVP 版）

> 目标：先稳、先可解释。阈值后续用“分位数/历史统计”自适应优化。

### 5.1 BTC Premium（折溢价）

* 公式：
  `Premium = (Price_BFX - Price_CB) / Price_CB`
* 价格选取：

  * BFX：Bitfinex BTCUSD ticker（中间价或 last）
  * CB：Coinbase spot 或 exchange ticker
* 触发条件（MVP 初始可配置）：

  * `abs(Premium) >= 0.25%` 且持续 `>= 10 分钟`
* 产物：

  * Premium Level（当前值）
  * Premium Alert（是否触发）
  * Premium Duration（持续时间）

Coinbase 现货价格获取可走其公开 Spot Price 能力（无需鉴权，适合 MVP）。([docs.cdp.coinbase.com][1])
（如果后续要更“交易所级”的撮合价，再切 Coinbase Exchange API/WS。）([Coinbase][2])

### 5.2 BTC Margin Longs（仓位代理）

* 数据源：Bitfinex 公共 Stats 接口提供各类统计 key，适合拿“交易对维度”的统计序列。([Bitfinex][3])
* 频率：MVP 用 1m/5m 颗粒 + 本地缓存
* 特征值（MVP）：

  * Longs Δ1D、Δ7D、Δ30D
  * Longs Slope（近 N 点线性回归斜率）
  * Longs Percentile（历史分位数，默认用 180 天窗口）

> 注：你推文里提到的“改良版 Margin Long Size（USD+USDT 借贷规模）”属于更强表达，但不一定全都能直接从公共接口一把拿到“完全同口径”。MVP 先用可稳定获取的“longs/pos.size 类统计口径”对齐，再在 v0.2 做“口径升级”。

### 5.3 ETH/BTC Whale Longs（节奏检测）

* 指标：ETHBTCLONGS（或等价 stats/TV 数据源）
* 节奏检测（MVP）：

  * Build：`Longs` 连续上升天数 ≥ X 且斜率为正
  * Unwind：`Longs` 在 24–72 小时内下降幅度 ≥ Y%
  * Completed：Unwind 后 `Longs` 进入平台期 ≥ Z 天

---

## 6. MVP 功能需求（Functional Requirements）

### 6.1 Dashboard（单页面主界面）

模块 A：**BTC 巨鲸仓位**

* 当前 Longs 值
* 7D/30D 变化
* 吸筹/派发压力条（0–100）
* 状态标签：吸筹 / 派发 / 观望

模块 B：**Bitfinex Premium**

* 当前 Premium（%）
* 阈值线（可配置）
* 触发灯（红/绿）
* 持续时间（已持续多少分钟）

模块 C：**ETH/BTC 巨鲸节奏**

* 当前阶段：建仓 / 平仓 / 平仓完成 / 无信号
* 阶段持续时间
* 最近一次“平仓完成”事件与后续表现摘要

模块 D：**事件卡片流（最重要）**
每条事件卡必须包含：

* 事件类型：Premium Spike / Longs Build / Longs Unwind / Regime Flip
* 触发时间（UTC + 本地）
* 触发原因（可解释的规则）
* 触发时价格（BTC、ETH/BTC）
* 之后表现：+1D / +7D（自动更新）

### 6.2 告警（至少 1 种渠道）

* MVP 支持 Telegram（推荐）或 Web Push（二选一）
* 告警类型：

  1. Premium 触发并持续 ≥ N 分钟
  2. Whale Regime 从绿→红 / 黄→红
  3. ETH/BTC 出现 Unwind Completed（强提示）

告警内容模板（示例）：

* 标题：`[BWC] Premium Risk Triggered`
* 内容：

  * Premium：-0.32%（持续 18 分钟）
  * BTC：87,320
  * 解释：Bitfinex 相对 Coinbase 发生异常折价（≥0.25%）
  * 链接：打开 Dashboard 事件卡

### 6.3 配置（MVP）

* Premium 阈值（默认 0.25%）
* 持续时间阈值（默认 10 分钟）
* ETH/BTC 平仓检测窗口（默认 72h）
* 告警开关（按类型）

---

## 7. 增强功能（延展，让产品更“值钱”）

以下按“价值密度”排序，v0.2 起逐步加入：

### 7.1 自适应阈值（替代拍脑袋 0.25%）

* 用过去 180 天 Premium 分布计算：

  * P95 / P99 分位阈值
  * 输出“异常等级”：Moderate / High / Extreme
* 好处：不同市场环境下阈值自动适配，专业度显著提升

### 7.2 多时间框架共振（降低假信号）

* 同时看 15m、1h、1d 三个框架的：

  * Premium
  * Longs slope
* 只有在“中期趋势 + 短期触发”共振时推强提醒

### 7.3 “巨鲸行为解释器”（把推文变成机器解读）

每次事件卡自动生成一段“人话解释”：

* 现在发生了什么
* 过去历史上类似情况出现过几次
* 这些情况在 1D/7D 的统计胜率/均值回报

这会极大提高留存与付费意愿。

### 7.4 Funding/借贷侧补强（更贴近你推文的“改良版口径”）

Bitfinex 提供 Funding Statistics 公共接口，可拿 FRR、总提供量、总使用量等资金面数据，用来解释“借贷成本与仓位扩张是否一致”。([Bitfinex][4])
把它融入信号：

* Longs 上升但资金成本飙升 → 风险更高（可能挤兑）
* Longs 上升且资金成本平稳 → 更健康的建仓

### 7.5 价格结构确认（Stop Hunt / 假突破过滤）

* 检测“新高后快速回落”的结构（如推文引用 Stop Hunt）
* 当 Premium 风险触发 + 结构确认 → 输出“强风险”

> MVP 可先做简化：
> “2 小时内创新高后回撤 > 1%” 作为结构条件

---

## 8. 数据源与技术方案（可落地）

### 8.1 Bitfinex 公共 API

* 公共域名：`https://api-pub.bitfinex.com/` ([Bitfinex][5])
* Stats 端点：用于各类统计时间序列 ([Bitfinex][3])
* Funding Stats：用于 FRR/资金面统计 ([Bitfinex][4])
* 限流：不同端点每分钟 10–90 不等，触发会返回限流错误并封禁 60 秒。([Bitfinex][6])

**工程要求：**

* 必须做缓存（Redis/KV）+ 退避重试
* 默认 1 分钟拉一次；高频（15s）只用于 ticker（若需要）

### 8.2 Coinbase 价格源

MVP 推荐用公开 Spot Price（无鉴权）([docs.cdp.coinbase.com][1])
若后续要更实时/更交易所级：

* 用 Coinbase 的 market data websocket（无需鉴权的频道可用）([docs.cdp.coinbase.com][7])

### 8.3 存储与计算

* Timeseries 存储：

  * MVP：Postgres（Supabase）或 Timescale（可选）
  * 缓存：Redis/KV（Cloudflare KV/Upstash）
* 计算：

  * 定时任务（cron）拉取数据并写入
  * 实时计算“分位数/斜率/事件触发”，写入 events 表

---

## 9. 数据结构（建议）

### 9.1 表：prices

* ts (timestamp)
* venue (bfx / cb)
* symbol (BTCUSD)
* price (float)

### 9.2 表：metrics

* ts
* key (btc_longs / ethbtc_longs / funding_frr / funding_used / premium)
* value
* meta (json：窗口、口径、来源)

### 9.3 表：events

* id
* ts_triggered
* type (PREMIUM_SPIKE / LONGS_BUILD / LONGS_UNWIND / REGIME_FLIP / UNWIND_COMPLETED)
* severity (LOW/MED/HIGH)
* snapshot (json：触发时各指标值)
* explanation (text)
* outcome_1d / outcome_7d（异步回填）

---

## 10. 交互与页面草图（文字版）

### 顶部

* 当前 Whale Regime：🟩/🟨/🟥 + 一句话解释
* 最近一次强事件：点击跳转事件卡

### 中部三栏

左：BTC Longs
中：Premium
右：ETH/BTC 节奏

### 底部

事件流（可筛选：风险/建仓/平仓/状态切换）

---

## 11. 成功指标（KPI）

### 产品指标

* 日活/周活
* 告警订阅转化率
* 事件卡点击率
* 留存：D1/D7

### 信号质量指标

* 事件触发后 1D/7D 的方向一致率（非强预测也要有统计）
* 假信号率（触发后立刻反转）

---

## 12. 风险与对策

1. **数据口径争议（longs 指标到底代表什么）**

* 对策：所有指标必须标注“来源与口径”，并在事件卡里用“我们观测到的现象”表述，不承诺因果。

2. **限流/不稳定**

* 对策：缓存 + 降频 + 退避；事件触发用“持续时间”过滤。Bitfinex 有明确的限流机制说明。([Bitfinex][6])

3. **用户把它当喊单工具**

* 对策：产品语言强调“状态/风险提示”，不输出“买卖建议”，但提供统计复盘供用户自行判断。

---

## 13. 里程碑（建议）

* Day 1–3：数据拉取（BFX stats + ticker；CB spot）+ 存储
* Day 4–6：Dashboard 三模块 + 事件卡
* Day 7：Telegram 告警
* v0.2：分位数阈值 + Funding 补强 + 多时间框架共振
* v1.0：订阅系统 + 历史统计页（胜率/回报分布）

---

# 14. MVP 必需接口清单（工程师可直接开工）

* Bitfinex Stats：获取 longs 等序列数据 ([Bitfinex][3])
* Bitfinex Funding Stats：获取 FRR/资金面 ([Bitfinex][4])
* Bitfinex Public endpoints 域名说明 ([Bitfinex][5])
* Bitfinex Rate limit 说明 ([Bitfinex][6])
* Coinbase Spot Price（无鉴权）([docs.cdp.coinbase.com][1])
* Coinbase WS（可选增强）([docs.cdp.coinbase.com][7])

---
