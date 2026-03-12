# BWC API Quick Reference

> 快速查阅手册 - 已验证可用

---

## Bitfinex API

Base: `https://api-pub.bitfinex.com/v2`

### 价格

```bash
# BTC/USD 价格
curl "https://api-pub.bitfinex.com/v2/ticker/tBTCUSD"
# 返回: [BID, BID_SIZE, ASK, ASK_SIZE, DAILY_CHG, DAILY_CHG_PCT, LAST, VOL, HIGH, LOW]

# 批量获取
curl "https://api-pub.bitfinex.com/v2/tickers?symbols=tBTCUSD,tETHUSD,tETHBTC"
```

### 多头仓位 (核心)

```bash
# BTC 多头 - 最新
curl "https://api-pub.bitfinex.com/v2/stats1/pos.size:1m:tBTCUSD:long/last"
# 返回: [timestamp_ms, size]  当前: ~73,191 BTC

# BTC 多头 - 历史 (小时级)
curl "https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tBTCUSD:long/hist?limit=24"

# ETH/BTC 多头 (节奏检测用)
curl "https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tETHBTC:long/hist?limit=72"
```

### 空头仓位

```bash
# BTC 空头
curl "https://api-pub.bitfinex.com/v2/stats1/pos.size:1m:tBTCUSD:short/last"
# 当前: ~298 BTC (多空比 245:1)

# ETH 空头
curl "https://api-pub.bitfinex.com/v2/stats1/pos.size:1m:tETHUSD:short/last"
```

### 借贷资金

```bash
# USD 总借贷
curl "https://api-pub.bitfinex.com/v2/stats1/credits.size:1m:fUSD/last"
# 当前: ~$5.07B

# USDT 总借贷
curl "https://api-pub.bitfinex.com/v2/stats1/credits.size:1m:fUST/last"
# 当前: ~$452M

# BTC交易对使用的USD
curl "https://api-pub.bitfinex.com/v2/stats1/credits.size.sym:1m:fUSD:tBTCUSD/last"
# 当前: ~$4.86B (96%)
```

### 永续合约 Funding Rate

```bash
curl "https://api-pub.bitfinex.com/v2/status/deriv?keys=tBTCF0:USTF0,tETHF0:USTF0"
# 返回索引: [3]=合约价格, [4]=现货价格, [9]=funding_rate
# BTC Funding: 0.0248%, ETH: 0.0138%
```

### 清算事件

```bash
curl "https://api-pub.bitfinex.com/v2/liquidations/hist?limit=10"
```

### K线

```bash
# 日线
curl "https://api-pub.bitfinex.com/v2/candles/trade:1D:tBTCUSD/hist?limit=30"
# 返回: [MTS, OPEN, CLOSE, HIGH, LOW, VOLUME]

# 小时线
curl "https://api-pub.bitfinex.com/v2/candles/trade:1h:tBTCUSD/hist?limit=24"
```

---

## Coinbase API

### 现货价格

```bash
# Spot Price (简单)
curl "https://api.coinbase.com/v2/prices/BTC-USD/spot"
# 返回: {"data": {"amount": "87466.735", "base": "BTC", "currency": "USD"}}

# Exchange Ticker (详细)
curl "https://api.exchange.coinbase.com/products/BTC-USD/ticker"
# 返回: {"ask", "bid", "price", "volume", "time"}
```

### K线

```bash
curl "https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400"
# granularity: 60, 300, 900, 3600, 21600, 86400
```

---

## Premium 计算

```javascript
const bfx = 87586;  // Bitfinex last_price
const cb = 87532;   // Coinbase spot
const premium = ((bfx - cb) / cb) * 100;  // = 0.0617%

// 阈值: |premium| >= 0.25% 触发告警
```

---

## 轮询频率建议

| 数据 | 间隔 | 原因 |
|-----|-----|-----|
| Ticker (价格) | 15s | Premium 计算需要 |
| Longs/Shorts | 60s | 仓位变化缓慢 |
| Funding Size | 5min | 资金面变化缓慢 |
| Deriv Status | 5min | Funding Rate 8h结算一次 |
| Liquidations | 60s | 监控极端行情 |

---

## 快速代码片段

### Node.js/TypeScript

```typescript
import axios from 'axios';

// Bitfinex BTC Longs
const { data } = await axios.get(
  'https://api-pub.bitfinex.com/v2/stats1/pos.size:1h:tBTCUSD:long/hist?limit=24'
);
const longs = data.map(([ts, val]) => ({ ts, value: val }));

// Coinbase Price
const { data: cb } = await axios.get(
  'https://api.coinbase.com/v2/prices/BTC-USD/spot'
);
const cbPrice = parseFloat(cb.data.amount);

// Premium
const bfxPrice = longs[0].value;  // 需要从ticker获取
const premium = ((bfxPrice - cbPrice) / cbPrice) * 100;
```

### Python

```python
import requests

# Bitfinex Longs
r = requests.get('https://api-pub.bitfinex.com/v2/stats1/pos.size:1m:tBTCUSD:long/last')
ts, longs = r.json()
print(f"BTC Longs: {longs:,.2f}")

# Coinbase
r = requests.get('https://api.coinbase.com/v2/prices/BTC-USD/spot')
cb_price = float(r.json()['data']['amount'])

# Bitfinex Price
r = requests.get('https://api-pub.bitfinex.com/v2/ticker/tBTCUSD')
bfx_price = r.json()[6]  # LAST_PRICE

# Premium
premium = (bfx_price - cb_price) / cb_price * 100
print(f"Premium: {premium:.4f}%")
```

---

## 当前市场快照

```
BTC Longs:      73,191 BTC (~$6.4B)
BTC Shorts:     298 BTC
Long/Short:     245:1
USD Funding:    $5.07B
Premium:        +0.062% (Normal)
BTC Funding Rate: 0.0248%
```

---

## 错误处理

```
429 Too Many Requests → 等待60秒后重试
500 Internal Error → 退避重试
连接超时 → 10秒后重试
```

**Rate Limit**:
- Ticker: ~90 req/min
- Stats: ~30 req/min
- 触发后封禁60秒
