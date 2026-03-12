# Bitfinex Whale Console (BWC) - 技术开发文档

> 文档版本：v1.0
> 测试日期：2026-01-26
> 基于 PRD v0.1 MVP 需求

---

## 1. API 端点测试结果汇总

### 1.1 Bitfinex Public API

**Base URL**: `https://api-pub.bitfinex.com/v2`

#### 1.1.1 Ticker API (价格数据) ✅ 可用

```bash
GET /ticker/tBTCUSD
```

**响应格式** (数组):
```
[BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHANGE, DAILY_CHANGE_PERC, LAST_PRICE, VOLUME, HIGH, LOW]
```

**测试结果**:
```json
[87567, 7.5391, 87580, 5.0429, -1483, -0.0166, 87590, 1880.35, 89086, 86045]
```

| 索引 | 字段 | 示例值 | 说明 |
|-----|-----|-------|-----|
| 0 | BID | 87567 | 最高买价 |
| 1 | BID_SIZE | 7.5391 | 买方挂单量 |
| 2 | ASK | 87580 | 最低卖价 |
| 3 | ASK_SIZE | 5.0429 | 卖方挂单量 |
| 4 | DAILY_CHANGE | -1483 | 24h涨跌额 |
| 5 | DAILY_CHANGE_PERC | -0.0166 | 24h涨跌幅 |
| 6 | LAST_PRICE | 87590 | 最新成交价 |
| 7 | VOLUME | 1880.35 | 24h成交量 |
| 8 | HIGH | 89086 | 24h最高价 |
| 9 | LOW | 86045 | 24h最低价 |

**支持的交易对**:
- `tBTCUSD` - BTC/USD
- `tETHUSD` - ETH/USD
- `tETHBTC` - ETH/BTC
- `tSOLUSD`, `tXRPUSD` 等 (共386个)

**批量获取**:
```bash
GET /tickers?symbols=tBTCUSD,tETHUSD,tETHBTC
GET /tickers?symbols=ALL  # 获取全部(386个)
```

---

#### 1.1.2 Stats API (仓位统计) ✅ 核心功能可用

##### BTC Margin Longs (巨鲸多头仓位)
```bash
GET /stats1/pos.size:1m:tBTCUSD:long/last    # 最新值
GET /stats1/pos.size:1m:tBTCUSD:long/hist    # 历史序列
GET /stats1/pos.size:1h:tBTCUSD:long/hist    # 小时级历史
```

**响应格式**:
```json
[1769401200000, 73191.12130659]
// [timestamp_ms, position_size_btc]
```

**测试结果 (当前)**:
| 指标 | 值 | 说明 |
|-----|---|-----|
| BTC Longs | 73,191.12 BTC | ~64亿美元 |
| BTC Shorts | 298.28 BTC | 多空比 245:1 |
| ETH/USD Longs | 82,557.33 ETH | |
| ETH/USD Shorts | 5,270.42 ETH | 多空比 15.7:1 |
| ETH/BTC Longs | 114,486.46 | |

**时间粒度参数**:
- `1m` - 分钟级 (实测可用)
- `1h` - 小时级 (实测可用)
- `1d` - 日级 (测试返回空数组,可能需要其他key)

**历史数据参数**:
```bash
?limit=100      # 返回条数,最大10000
?start=1609459200000  # 起始时间戳ms
?end=1609545600000    # 结束时间戳ms
?sort=1         # 1=升序, -1=降序(默认)
```

##### BTC/ETH Shorts (做空仓位)
```bash
GET /stats1/pos.size:1m:tBTCUSD:short/last
GET /stats1/pos.size:1m:tETHUSD:short/last
```

---

#### 1.1.3 Funding Stats API (资金费率/借贷) ✅ 可用

##### USD 总借贷规模
```bash
GET /stats1/credits.size:1m:fUSD/last
GET /stats1/credits.size:1m:fUSD/hist?limit=24
```

**测试结果**:
```json
[1769401200000, 5068879035.92099]
// 当前 USD 借贷规模: ~50.68亿美元
```

##### USDT 借贷规模
```bash
GET /stats1/credits.size:1m:fUST/last
```
**测试结果**: ~4.52亿 USDT

##### BTC/USD 交易对使用的 USD 资金
```bash
GET /stats1/credits.size.sym:1m:fUSD:tBTCUSD/last
```
**测试结果**: ~48.58亿美元 (占总USD借贷96%)

---

#### 1.1.4 Derivatives Status API (永续合约) ✅ 可用

```bash
GET /status/deriv?keys=tBTCF0:USTF0
GET /status/deriv?keys=tBTCF0:USTF0,tETHF0:USTF0
```

**响应格式** (关键字段):
```
[SYMBOL, MTS, null, DERIV_PRICE, SPOT_PRICE, null, INSURANCE_FUND, null,
 NEXT_FUNDING_EVT_TS, NEXT_FUNDING_ACCRUED, NEXT_FUNDING_STEP, null,
 CURRENT_FUNDING, null, null, MARK_PRICE, ...]
```

**测试结果**:
| 字段 | BTC永续 | ETH永续 |
|-----|--------|--------|
| 合约价格 | $87,638.13 | $2,868.14 |
| 现货价格 | $87,605 | $2,867.65 |
| Funding Rate | 0.0248% | 0.0138% |
| 下次结算 | 1769414400000 | |
| 保险基金 | $67,403,974 | |

---

#### 1.1.5 Liquidations API (清算事件) ✅ 可用

```bash
GET /liquidations/hist?limit=5
```

**响应格式**:
```json
[["pos", POS_ID, MTS, null, SYMBOL, AMOUNT, BASE_PRICE, null, IS_MATCH, IS_MARKET_SOLD, null, ACTUAL_PRICE]]
```

可用于监控市场极端行情下的清算潮。

---

#### 1.1.6 Candles API (K线数据) ✅ 可用

```bash
GET /candles/trade:1h:tBTCUSD/hist?limit=24
GET /candles/trade:1D:tBTCUSD/hist?limit=30
```

**响应格式**:
```json
[MTS, OPEN, CLOSE, HIGH, LOW, VOLUME]
```

**支持的时间周期**:
- `1m`, `5m`, `15m`, `30m` - 分钟
- `1h`, `3h`, `6h`, `12h` - 小时
- `1D`, `1W`, `1M` - 日/周/月

---

#### 1.1.7 Trades API (成交记录) ✅ 可用

```bash
GET /trades/tBTCUSD/hist?limit=100
```

**响应格式**:
```json
[ID, MTS, AMOUNT, PRICE]
// AMOUNT > 0 = 买入, < 0 = 卖出
```

---

#### 1.1.8 Order Book API ✅ 可用

```bash
GET /book/tBTCUSD/P0   # P0=聚合精度最高
GET /book/tBTCUSD/P1   # P1=次精度
```

**响应格式**:
```json
[PRICE, COUNT, AMOUNT]
// AMOUNT > 0 = bid, < 0 = ask
```

---

#### 1.1.9 Platform Status ✅ 可用

```bash
GET /platform/status
```
**响应**: `[1]` = 正常运行, `[0]` = 维护中

---

### 1.2 Coinbase API

#### 1.2.1 Spot Price API (无需鉴权) ✅ 可用

```bash
GET https://api.coinbase.com/v2/prices/BTC-USD/spot
GET https://api.coinbase.com/v2/prices/ETH-USD/spot
```

**响应格式**:
```json
{
  "data": {
    "amount": "87466.735",
    "base": "BTC",
    "currency": "USD"
  }
}
```

#### 1.2.2 Exchange Ticker API (更详细) ✅ 可用

```bash
GET https://api.exchange.coinbase.com/products/BTC-USD/ticker
```

**响应格式**:
```json
{
  "ask": "87531.99",
  "bid": "87531.98",
  "volume": "6521.72433282",
  "trade_id": 943430710,
  "price": "87531.98",
  "size": "0.00001142",
  "time": "2026-01-26T04:21:55.685172626Z"
}
```

#### 1.2.3 Candles API ✅ 可用

```bash
GET https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&limit=30
```

---

## 2. Premium 计算验证

### 2.1 实时计算示例

```python
# 测试时刻数据
bitfinex_btc = 87586.00  # tBTCUSD last_price
coinbase_btc = 87531.98  # BTC-USD spot

premium = (bitfinex_btc - coinbase_btc) / coinbase_btc * 100
# Premium = 0.0617% (正溢价,Bitfinex略贵)
```

### 2.2 Premium 计算建议

| 场景 | Premium | 解读 |
|-----|---------|-----|
| > +0.25% | 正溢价 | Bitfinex需求强劲/USDT溢价 |
| -0.25% ~ +0.25% | 正常 | 套利维持平衡 |
| < -0.25% | 负溢价 | Bitfinex抛压/资金出逃 |

---

## 3. Rate Limit 说明

### 3.1 Bitfinex 限流规则

| 端点类别 | 限制 | 说明 |
|---------|-----|-----|
| Public REST | 10-90 次/分钟 | 不同端点不同 |
| 触发限流 | 429 响应 | 封禁60秒 |
| Ticker | ~90次/分钟 | |
| Stats | ~30次/分钟 | |
| Candles | ~30次/分钟 | |

### 3.2 建议策略

```javascript
const POLL_INTERVALS = {
  ticker: 15000,      // 15秒 (价格数据)
  stats: 60000,       // 1分钟 (仓位数据)
  funding: 300000,    // 5分钟 (资金费率)
  candles: 60000,     // 1分钟 (K线)
};

// 退避策略
const backoff = {
  initial: 1000,
  max: 60000,
  multiplier: 2
};
```

### 3.3 Coinbase 限流

- Public endpoints: 10 次/秒
- IP-based rate limiting

---

## 4. 功能可行性评估

### 4.1 MVP 功能可行性

| 功能 | 数据源 | 可行性 | 说明 |
|-----|-------|-------|-----|
| BTC Margin Longs | `/stats1/pos.size:*:tBTCUSD:long/*` | ✅ 完全可用 | 分钟/小时级历史 |
| BTC Shorts | `/stats1/pos.size:*:tBTCUSD:short/*` | ✅ 完全可用 | |
| ETH/BTC Longs | `/stats1/pos.size:*:tETHBTC:long/*` | ✅ 完全可用 | |
| Bitfinex Price | `/ticker/tBTCUSD` | ✅ 完全可用 | 实时 |
| Coinbase Price | Coinbase API | ✅ 完全可用 | 实时 |
| Premium 计算 | 两个价格源 | ✅ 完全可用 | 需自行计算 |
| 历史数据存储 | Stats hist | ✅ 完全可用 | limit最大10000 |

### 4.2 增强功能可行性

| 功能 | 数据源 | 可行性 | 说明 |
|-----|-------|-------|-----|
| USD 借贷规模 | `/stats1/credits.size:*:fUSD/*` | ✅ 可用 | 资金面分析 |
| USDT 借贷规模 | `/stats1/credits.size:*:fUST/*` | ✅ 可用 | |
| BTC专用USD资金 | `/stats1/credits.size.sym:*:fUSD:tBTCUSD/*` | ✅ 可用 | |
| 永续Funding Rate | `/status/deriv` | ✅ 可用 | 市场情绪 |
| 清算监控 | `/liquidations/hist` | ✅ 可用 | 风险事件 |
| 多空比 | Long/Short计算 | ✅ 可用 | 自行计算 |

---

## 5. 扩展发现：高价值 API

### 5.1 多空比计算 (新增功能建议)

```python
btc_longs = 73191.12   # BTC
btc_shorts = 298.28    # BTC
long_short_ratio = btc_longs / btc_shorts  # = 245.4

# 极端多空比可能预示反转风险
```

### 5.2 Funding Rate 监控 (新增功能建议)

```python
# 从 /status/deriv 获取
funding_rate = 0.0248  # %
annual_rate = funding_rate * 3 * 365  # ≈27% APR

# 高资金费率 = 多头拥挤
# 负资金费率 = 空头拥挤
```

### 5.3 借贷资金流向 (新增功能建议)

```python
total_usd_funding = 5068879035.92  # ~50.68亿
btc_used_funding = 4858488440.30   # ~48.58亿
btc_funding_ratio = btc_used_funding / total_usd_funding  # 95.8%

# 资金高度集中在BTC = 杠杆风险
```

### 5.4 清算事件流 (新增功能建议)

监控 `/liquidations/hist` 可以：
- 检测清算潮开始
- 识别级联清算风险
- 作为"恐慌指标"

### 5.5 ETH/BTC 多头节奏检测

```python
# 历史数据
eth_btc_longs_history = [
    (1769400000000, 114486.46),
    (1769396400000, 114486.46),
    (1769392800000, 114476.65),
    # ...
]

# 检测建仓/平仓节奏
def detect_phase(history, window=24):
    recent = [x[1] for x in history[:window]]
    slope = (recent[0] - recent[-1]) / window
    if slope > threshold:
        return "BUILD"  # 建仓
    elif slope < -threshold:
        return "UNWIND"  # 平仓
    return "NEUTRAL"
```

---

## 6. 技术架构建议

### 6.1 数据采集层

```
┌─────────────────────────────────────────────────────────┐
│                    Data Collector                        │
├──────────────┬──────────────┬──────────────┬────────────┤
│   Bitfinex   │   Coinbase   │   Bitfinex   │  Bitfinex  │
│   Ticker     │   Spot       │   Stats      │  Deriv     │
│   (15s)      │   (15s)      │   (60s)      │  (300s)    │
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┘
       │              │              │             │
       └──────────────┴──────────────┴─────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  Redis/KV     │
                    │  (缓存层)      │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │  PostgreSQL   │
                    │  (持久化)      │
                    └───────────────┘
```

### 6.2 数据表结构

```sql
-- 价格表
CREATE TABLE prices (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    venue VARCHAR(10) NOT NULL,  -- 'bfx' / 'cb'
    symbol VARCHAR(20) NOT NULL, -- 'BTCUSD'
    bid DECIMAL(20,8),
    ask DECIMAL(20,8),
    last_price DECIMAL(20,8) NOT NULL,
    volume_24h DECIMAL(20,8),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prices_ts_venue ON prices(ts, venue, symbol);

-- 指标表
CREATE TABLE metrics (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    key VARCHAR(50) NOT NULL,  -- 'btc_longs', 'btc_shorts', 'premium', etc.
    value DECIMAL(30,8) NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_ts_key ON metrics(ts, key);

-- 事件表
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    ts_triggered TIMESTAMPTZ NOT NULL,
    type VARCHAR(30) NOT NULL,  -- 'PREMIUM_SPIKE', 'LONGS_BUILD', etc.
    severity VARCHAR(10) NOT NULL,  -- 'LOW', 'MED', 'HIGH'
    snapshot JSONB NOT NULL,
    explanation TEXT,
    outcome_1d JSONB,
    outcome_7d JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_ts_type ON events(ts_triggered, type);
```

### 6.3 计算服务

```python
# premium_calculator.py
class PremiumCalculator:
    def __init__(self, redis_client, pg_pool):
        self.redis = redis_client
        self.pg = pg_pool
        self.threshold = 0.0025  # 0.25%
        self.duration_threshold = 600  # 10分钟

    async def calculate(self):
        bfx_price = await self.redis.get('bfx:btcusd:last')
        cb_price = await self.redis.get('cb:btcusd:spot')

        premium = (bfx_price - cb_price) / cb_price

        # 存储
        await self.store_metric('premium', premium)

        # 检测触发
        if abs(premium) >= self.threshold:
            await self.check_duration_and_alert(premium)

        return premium
```

### 6.4 事件检测逻辑

```python
# event_detector.py
class WhaleEventDetector:

    async def detect_longs_change(self, current, history_7d, history_30d):
        """检测 Longs 变化趋势"""
        delta_7d = (current - history_7d[0]) / history_7d[0]
        delta_30d = (current - history_30d[0]) / history_30d[0]

        # 计算斜率
        slope = self.calculate_slope(history_7d)

        if delta_7d > 0.05 and slope > 0:  # 7天增长>5%且斜率为正
            return EventType.ACCUMULATION
        elif delta_7d < -0.05 and slope < 0:
            return EventType.DISTRIBUTION
        return None

    async def detect_ethbtc_phase(self, history_72h):
        """检测 ETH/BTC Longs 节奏"""
        slope = self.calculate_slope(history_72h)
        volatility = self.calculate_volatility(history_72h)

        if slope > threshold and volatility < vol_threshold:
            return Phase.BUILD  # 缓慢建仓
        elif slope < -threshold * 2:  # 快速下降
            return Phase.UNWIND
        return Phase.NEUTRAL
```

---

## 7. API 调用代码示例

### 7.1 TypeScript/Node.js

```typescript
// bitfinex-client.ts
import axios from 'axios';

const BFX_BASE = 'https://api-pub.bitfinex.com/v2';

interface TickerData {
  bid: number;
  bidSize: number;
  ask: number;
  askSize: number;
  dailyChange: number;
  dailyChangePerc: number;
  lastPrice: number;
  volume: number;
  high: number;
  low: number;
}

export async function getTicker(symbol: string): Promise<TickerData> {
  const { data } = await axios.get(`${BFX_BASE}/ticker/t${symbol}`);
  return {
    bid: data[0],
    bidSize: data[1],
    ask: data[2],
    askSize: data[3],
    dailyChange: data[4],
    dailyChangePerc: data[5],
    lastPrice: data[6],
    volume: data[7],
    high: data[8],
    low: data[9],
  };
}

export async function getLongs(symbol: string): Promise<{ts: number, value: number}> {
  const { data } = await axios.get(
    `${BFX_BASE}/stats1/pos.size:1m:t${symbol}:long/last`
  );
  return { ts: data[0], value: data[1] };
}

export async function getLongsHistory(
  symbol: string,
  timeframe: '1m' | '1h' = '1h',
  limit: number = 24
): Promise<Array<{ts: number, value: number}>> {
  const { data } = await axios.get(
    `${BFX_BASE}/stats1/pos.size:${timeframe}:t${symbol}:long/hist`,
    { params: { limit } }
  );
  return data.map((d: number[]) => ({ ts: d[0], value: d[1] }));
}

export async function getFundingSize(currency: string): Promise<number> {
  const { data } = await axios.get(
    `${BFX_BASE}/stats1/credits.size:1m:f${currency}/last`
  );
  return data[1];
}

export async function getDerivStatus(symbol: string) {
  const { data } = await axios.get(
    `${BFX_BASE}/status/deriv`,
    { params: { keys: symbol } }
  );
  const d = data[0];
  return {
    symbol: d[0],
    derivPrice: d[3],
    spotPrice: d[4],
    fundingRate: d[9],
    nextFundingTs: d[8],
  };
}
```

### 7.2 Coinbase Client

```typescript
// coinbase-client.ts
import axios from 'axios';

const CB_BASE = 'https://api.coinbase.com/v2';
const CB_EXCHANGE = 'https://api.exchange.coinbase.com';

export async function getSpotPrice(pair: string): Promise<number> {
  const { data } = await axios.get(`${CB_BASE}/prices/${pair}/spot`);
  return parseFloat(data.data.amount);
}

export async function getExchangeTicker(product: string) {
  const { data } = await axios.get(`${CB_EXCHANGE}/products/${product}/ticker`);
  return {
    bid: parseFloat(data.bid),
    ask: parseFloat(data.ask),
    price: parseFloat(data.price),
    volume: parseFloat(data.volume),
    time: new Date(data.time),
  };
}
```

### 7.3 Premium Calculator

```typescript
// premium-calculator.ts
import { getTicker } from './bitfinex-client';
import { getExchangeTicker } from './coinbase-client';

export async function calculatePremium(): Promise<{
  bfxPrice: number;
  cbPrice: number;
  premium: number;
  premiumPct: string;
  status: 'NORMAL' | 'ALERT';
}> {
  const [bfx, cb] = await Promise.all([
    getTicker('BTCUSD'),
    getExchangeTicker('BTC-USD'),
  ]);

  const premium = (bfx.lastPrice - cb.price) / cb.price;
  const threshold = 0.0025;

  return {
    bfxPrice: bfx.lastPrice,
    cbPrice: cb.price,
    premium,
    premiumPct: (premium * 100).toFixed(4) + '%',
    status: Math.abs(premium) >= threshold ? 'ALERT' : 'NORMAL',
  };
}
```

---

## 8. 开发路线图

### Phase 1: 数据采集 (Day 1-2)

- [ ] 搭建定时任务框架 (cron/scheduler)
- [ ] 实现 Bitfinex API 客户端
- [ ] 实现 Coinbase API 客户端
- [ ] 设置 Redis 缓存
- [ ] 设置 PostgreSQL 数据库
- [ ] 实现数据写入管道

### Phase 2: 指标计算 (Day 3-4)

- [ ] Premium 实时计算
- [ ] Longs Δ1D/Δ7D/Δ30D 计算
- [ ] 斜率/趋势计算
- [ ] 历史分位数计算
- [ ] ETH/BTC 节奏检测

### Phase 3: Dashboard (Day 5-6)

- [ ] BTC 巨鲸仓位模块
- [ ] Premium 模块
- [ ] ETH/BTC 节奏模块
- [ ] 事件卡片流

### Phase 4: 告警系统 (Day 7)

- [ ] Telegram Bot 集成
- [ ] 告警规则引擎
- [ ] 告警模板

### Phase 5: 增强功能 (v0.2)

- [ ] Funding Rate 监控
- [ ] 借贷资金流向
- [ ] 清算事件流
- [ ] 多空比可视化
- [ ] 自适应阈值

---

## 9. 注意事项

### 9.1 数据一致性

- Bitfinex 时间戳为毫秒级 Unix timestamp
- Coinbase 时间戳为 ISO 8601 格式
- 统一转换为 UTC 存储

### 9.2 错误处理

```typescript
// 带重试的请求
async function fetchWithRetry(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.response?.status === 429) {
        // Rate limited, 等待后重试
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw e;
    }
  }
}
```

### 9.3 数据口径说明

> 重要：`pos.size` 返回的是聚合后的仓位规模,与 TradingView 的 BTCUSDLONGS 口径一致。但"改良版 Margin Long Size (USD+USDT借贷规模)"需要结合 `credits.size` 数据计算。

---

## 10. 附录：完整 API 端点清单

### Bitfinex Public API

| 端点 | 用途 | 频率建议 |
|-----|-----|---------|
| `GET /ticker/t{SYMBOL}` | 实时价格 | 15s |
| `GET /tickers?symbols=...` | 批量价格 | 15s |
| `GET /stats1/pos.size:{TF}:t{SYMBOL}:long/last` | 多头仓位 | 60s |
| `GET /stats1/pos.size:{TF}:t{SYMBOL}:long/hist` | 多头历史 | 按需 |
| `GET /stats1/pos.size:{TF}:t{SYMBOL}:short/last` | 空头仓位 | 60s |
| `GET /stats1/credits.size:{TF}:f{CURRENCY}/last` | 借贷规模 | 300s |
| `GET /stats1/credits.size.sym:{TF}:f{CURRENCY}:t{SYMBOL}/last` | 交易对借贷 | 300s |
| `GET /status/deriv?keys=...` | 永续合约状态 | 300s |
| `GET /liquidations/hist` | 清算事件 | 60s |
| `GET /candles/trade:{TF}:t{SYMBOL}/hist` | K线数据 | 60s |
| `GET /trades/t{SYMBOL}/hist` | 成交记录 | 按需 |
| `GET /book/t{SYMBOL}/P0` | 订单簿 | 按需 |
| `GET /platform/status` | 平台状态 | 60s |

### Coinbase API

| 端点 | 用途 | 频率建议 |
|-----|-----|---------|
| `GET /v2/prices/{PAIR}/spot` | 现货价格 | 15s |
| `GET /products/{PRODUCT}/ticker` | Exchange Ticker | 15s |
| `GET /products/{PRODUCT}/candles` | K线数据 | 60s |

---

## 11. 当前市场快照 (测试时刻)

| 指标 | 值 | 时间 |
|-----|---|------|
| BTC Longs (BFX) | 73,191.12 BTC | 2026-01-26 04:20 UTC |
| BTC Shorts (BFX) | 298.28 BTC | |
| Long/Short Ratio | 245.4 | |
| ETH/USD Longs | 82,557.33 ETH | |
| ETH/BTC Longs | 114,486.46 | |
| USD Funding Size | $5.07B | |
| BTC使用的USD | $4.86B (96%) | |
| USDT Funding Size | $452M | |
| Bitfinex BTC | $87,586 | |
| Coinbase BTC | $87,532 | |
| Premium | +0.0617% | Normal |
| BTC Funding Rate | 0.0248% | |
| ETH Funding Rate | 0.0138% | |

---

**文档结束**
