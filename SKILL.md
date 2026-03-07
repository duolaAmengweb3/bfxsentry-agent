# BfxSentry Agent — Skill 手册

> 所有可用命令的完整参考。运行 `sentry skills` 可在终端查看精简版。

---

## 信号类

### `sentry scan`

全市场一次性扫描，采集实时数据并输出所有模块信号，不执行交易。

```bash
sentry scan              # 彩色终端输出
sentry scan --json       # JSON 格式，适合管道处理
sentry scan -c config/phase1-safety.yaml   # 使用自定义配置
```

输出示例：

```
═══════════════════════════════════════════════════
  BfxSentry · 全市场扫描
═══════════════════════════════════════════════════

  BTC/USD  $67,932  Vol 1178.1 BTC  11:32:35 PM

  ── 聪明钱雷达 ──
    [*] 聪明钱 中性         — 中性   置信  47%

  ── 融资雷达 ──
    [*] 融资市场正常         — 中性   置信  30%

  ── 爆仓猎人 ──
    [*] 爆仓市场平稳         — 中性   置信  25%

  ── 盘口狙击 ──
    [!] 上方墙突破          ^ 多    置信  60%

  ─────────────────────────────────────────────────
  综合判断  多 1 · 空 0 · 强信号 1
  最强信号  上方墙突破 (60%)
```

---

### `sentry signal`

查看各模块当前信号详情。

```bash
sentry signal                # 所有模块概览
sentry signal smart-money    # 聪明钱方向推断
sentry signal funding        # 融资利率异常
sentry signal liquidation    # 爆仓级联检测
sentry signal orderbook      # 盘口失衡/墙突破
sentry signal polymarket     # Polymarket 雷达
```

---

## 策略类

### `sentry strategy`

查看各策略启用状态、tick 间隔、最近决策记录。

```bash
sentry strategy                # 所有策略
sentry strategy smart-follow   # 聪明钱跟单策略详情
sentry strategy liq-hunter     # 爆仓猎人策略详情
sentry strategy ob-sniper      # 盘口狙击策略详情
sentry strategy funding-arb    # 融资套利策略详情
sentry strategy pm-hedge       # PM 对冲策略详情
```

**策略参数速查：**

| 策略 | 触发条件 | 仓位 | 杠杆 | 止损/止盈 | Tick 间隔 |
|------|---------|------|------|----------|----------|
| 聪明钱跟单 | 评分 ≥65, ≥5 鲸鱼同向 | 8% | 2x | 2% / 1.5% 移动止损 | 180s |
| 融资套利 | FRR ≥P75, 利用率 ≥80% | 25% | 1x | 按费率回落退出 | 300s |
| 爆仓猎人 | 强度 ≥P85, 单边 >70% | 5% | 3x | 0.5% / 1% | 5s |
| 盘口狙击 | Bid/Ask ≥1.5x + 成交流确认 | 5% | 3x | 0.3% / 0.5% | 5s |
| PM 对冲 | 聚合信心 ≥20%, 偏差 ≥3% | $100 | 1x | 5% / 10% | 15s |

---

### `sentry backtest`

基于 SQLite 录制的市场快照回测策略。

```bash
sentry backtest liq-hunter -d 7        # 回测爆仓策略 7 天
sentry backtest smart-follow -d 30     # 回测聪明钱策略 30 天
sentry backtest ob-sniper -d 14        # 回测盘口狙击 14 天
sentry backtest -d 7                   # 回测所有策略 7 天
```

报告包含：胜率、总 PnL、平均 PnL、最大回撤、Sharpe Ratio。

---

## 交易类

### `sentry position`

查看当前持仓和浮动 PnL，手动平仓。

```bash
sentry position                    # 查看所有持仓
sentry position close <id>         # 手动平仓指定持仓
sentry position close-all          # 全部平仓 (live 模式会发交易所单)
```

---

### `sentry trade`

手动提交做多/做空指令，经风控过滤后执行。

```bash
sentry trade long 0.01 --stop 2% --tp 3%     # 做多 0.01 BTC
sentry trade short 0.01 --stop 1.5%           # 做空 0.01 BTC
sentry trade long 0.05 -c config/phase1-safety.yaml  # 使用安全配置
```

---

## 系统类

### `sentry start`

启动持续运行的交易代理。

```bash
sentry start                              # dry-run 模式 (默认)
sentry start --mode live                   # 实盘模式 (需要 API Key)
sentry start -i 5                          # 全局 tick 间隔 5 秒
sentry start -c config/phase1-safety.yaml  # 使用安全参数 (前 2 周推荐)
```

**环境变量 (live 模式)：**

```bash
export BFX_API_KEY=your_api_key
export BFX_API_SECRET=your_api_secret
export BFX_CAPITAL_USD=5000          # 可选，默认 5000
export SOCKS_PROXY=socks5h://127.0.0.1:7897   # 可选，自动检测
```

---

### `sentry stop`

优雅停止 Agent：等待 in-flight tick 完成 → 交易所真实平仓 (live) → 清理退出。

```bash
sentry stop            # 优雅停止
sentry stop --force    # 强制终止 (SIGKILL)
```

**停机流程：**

```
SIGTERM → 阻止新 tick → 等待 in-flight → 交易所平仓 → 写入 SQLite → 退出
```

---

### `sentry config`

查看或修改运行配置。

```bash
sentry config show                                  # 显示完整配置
sentry config set liq_hunter.enabled false           # 禁用策略
sentry config set risk.max_daily_loss_usd 500        # 修改日亏损上限
```

---

### `sentry logs`

查看交易决策审计日志（信号 → 意图 → 风控 → 执行完整链路）。

```bash
sentry logs                # 最近 20 条
sentry logs -n 50          # 最近 50 条
sentry logs --level warn   # 只看警告级别
```

---

### `sentry skills`

列出所有已注册的 Skill 及其用法。

```bash
sentry skills
```

---

## 风控配置参考

```yaml
risk:
  max_total_position_usd: 5000    # 总仓位上限
  max_daily_loss_usd: 200         # 日亏损上限
  max_daily_trades: 50            # 日交易次数上限
  max_concurrent_positions: 3     # 最大并发持仓
  order_type: limit               # 下单类型 (limit/market)
  limit_offset_pct: 0.02          # 限价偏移
  retry:
    max_attempts: 3               # 最大重试次数
    backoff_ms: [1000, 3000, 5000]  # 退避间隔
    on_max_retry: alert_and_skip  # 达到上限: 告警+跳过
  portfolio:
    max_portfolio_var_pct: 3      # 组合 VaR 上限
    max_same_direction_pct: 70    # 同向集中度上限
    circuit_breaker:
      consecutive_losses: 5       # 连续亏损触发熔断
      loss_streak_usd: 300        # 连亏金额触发
      cooldown_minutes: 60        # 熔断冷却时间
```

---

## 事件驱动机制

| 事件 | 触发条件 | 系统响应 |
|------|---------|---------|
| `liq_cascade` | 1 分钟爆仓强度 ≥ P95 | 立即触发策略评估 tick |
| `wall_break` | 大墙消失 + 价格突破 | 立即触发策略评估 tick |
| `spread_extreme` | Bid-Ask 价差 > 0.1% | 强制 limit-only 60 秒 |

所有事件走 `guardedTick` 锁，不会并发执行。

---

## 安装

```bash
npm install -g bfxsentry-agent
```

需要 Node.js 20+。中国网络环境自动使用 SOCKS5 代理 (`127.0.0.1:7897`)。
