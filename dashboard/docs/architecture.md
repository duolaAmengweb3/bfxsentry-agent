# Bitfinex Whale Console (BWC) - 产品架构文档

> 版本：v1.0
> 更新日期：2026-01-26
> 包含扩展功能：多空比、Funding Rate、借贷资金集中度、清算监控

---

## 1. 产品概述

### 1.1 产品定位

**一句话定义**：将 Bitfinex 巨鲸行为数据转化为可视化、可告警、可复盘的交易情报系统。

### 1.2 功能模块总览 (含扩展)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     BWC - Bitfinex Whale Console                     │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ 巨鲸仓位    │ │ 折溢价     │ │ ETH/BTC    │ │ 多空比      │   │
│  │ BTC Longs  │ │ Premium    │ │ 节奏检测    │ │ L/S Ratio  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Funding    │ │ 借贷资金    │ │ 清算监控    │ │ 巨鲸状态    │   │
│  │ Rate       │ │ 集中度      │ │ Liquidation │ │ Regime     │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                        事件卡片流 + 告警系统                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构

### 2.1 整体架构图

```
                                    用户层
                    ┌────────────────────────────────────┐
                    │           Web Browser              │
                    │    (Desktop / Mobile Responsive)   │
                    └─────────────────┬──────────────────┘
                                      │
                    ┌─────────────────▼──────────────────┐
                    │           CDN (Vercel Edge)        │
                    │         静态资源 + Edge Functions   │
                    └─────────────────┬──────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────┐
│                              应用层                                        │
│  ┌──────────────────────────────────┼────────────────────────────────┐   │
│  │                    Next.js Application                             │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐  │   │
│  │  │  Dashboard  │ │  Events     │ │  Settings   │ │  API Routes │  │   │
│  │  │  Pages      │ │  Feed       │ │  Page       │ │  /api/*     │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘  │   │
│  └───────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
┌─────────────────────────────────────┼─────────────────────────────────────┐
│                              服务层                                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │  Data Collector │  │  Signal Engine  │  │  Alert Service  │           │
│  │  (Cron Jobs)    │  │  (Calculator)   │  │  (Telegram/WS)  │           │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘           │
│           │                    │                    │                     │
│           └────────────────────┼────────────────────┘                     │
│                                │                                          │
└────────────────────────────────┼──────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────────┐
│                           数据层                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐           │
│  │     Redis       │  │   PostgreSQL    │  │   Supabase      │           │
│  │   (Upstash)     │  │  (Supabase DB)  │  │   Realtime      │           │
│  │   实时缓存       │  │   持久化存储     │  │   WebSocket     │           │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘           │
└───────────────────────────────────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼──────────────────────────────────────────┐
│                          外部数据源                                        │
│  ┌─────────────────────────┐  ┌─────────────────────────┐                │
│  │      Bitfinex API       │  │      Coinbase API       │                │
│  │  - Ticker (15s)         │  │  - Spot Price (15s)     │                │
│  │  - Stats (60s)          │  │  - Ticker (15s)         │                │
│  │  - Deriv Status (300s)  │  │                         │                │
│  │  - Liquidations (60s)   │  │                         │                │
│  └─────────────────────────┘  └─────────────────────────┘                │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈选型

| 层级 | 技术选型 | 理由 |
|-----|---------|-----|
| **前端框架** | Next.js 14 (App Router) | SSR/SSG、API Routes、Edge Runtime |
| **UI 框架** | Tailwind CSS + shadcn/ui | 快速开发、一致性设计系统 |
| **图表库** | Recharts / Lightweight Charts | 金融级图表、实时更新 |
| **状态管理** | Zustand + React Query | 轻量、实时数据同步 |
| **后端运行时** | Vercel Serverless + Cron | 零运维、自动扩展 |
| **数据库** | Supabase (PostgreSQL) | 免费额度高、Realtime 支持 |
| **缓存** | Upstash Redis | Serverless Redis、低延迟 |
| **告警推送** | Telegram Bot API | 即时、免费、用户习惯 |
| **部署** | Vercel | 全球 CDN、自动部署 |

---

## 3. 后端架构

### 3.1 数据采集服务架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Data Collector Service                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Scheduler (Cron)                       │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │   │
│  │  │ 15s tick │ │ 60s tick │ │ 300s tick│ │ 3600s    │     │   │
│  │  │ (价格)   │ │ (仓位)    │ │ (资金面) │ │ (聚合)   │     │   │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘     │   │
│  └───────┼────────────┼────────────┼────────────┼───────────┘   │
│          │            │            │            │                │
│  ┌───────▼────────────▼────────────▼────────────▼───────────┐   │
│  │                    Task Queue                             │   │
│  └───────────────────────────┬───────────────────────────────┘   │
│                              │                                   │
│  ┌───────────────────────────▼───────────────────────────────┐   │
│  │                    API Clients                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐         │   │
│  │  │ Bitfinex    │ │ Coinbase    │ │ Rate Limiter│         │   │
│  │  │ Client      │ │ Client      │ │ (per-host)  │         │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘         │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │   Redis     │
                        │  (缓存)     │
                        └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │ PostgreSQL  │
                        │  (持久化)   │
                        └─────────────┘
```

### 3.2 数据采集任务清单

| 任务 | 频率 | 数据源 | 写入目标 |
|-----|-----|-------|---------|
| `collect_ticker` | 15s | BFX + CB | Redis (实时) |
| `collect_longs` | 60s | BFX Stats | Redis + PG |
| `collect_shorts` | 60s | BFX Stats | Redis + PG |
| `collect_funding` | 300s | BFX Deriv | Redis + PG |
| `collect_credits` | 300s | BFX Stats | Redis + PG |
| `collect_liquidations` | 60s | BFX Liquidations | PG |
| `aggregate_metrics` | 3600s | PG | PG (hourly rollup) |

### 3.3 信号计算引擎

```typescript
// 信号引擎架构
interface SignalEngine {
  // 输入：实时数据流
  input: {
    prices: PriceStream;      // 15s 更新
    positions: PositionStream; // 60s 更新
    funding: FundingStream;    // 300s 更新
  };

  // 计算器
  calculators: {
    premium: PremiumCalculator;
    longShortRatio: LSRatioCalculator;
    fundingPressure: FundingCalculator;
    loanConcentration: LoanCalculator;
    phaseDetector: PhaseDetector;
    regimeClassifier: RegimeClassifier;
  };

  // 输出：信号事件
  output: {
    signals: Signal[];
    regime: WhaleRegime;
    alerts: Alert[];
  };
}
```

### 3.4 信号计算公式

```typescript
// 1. Premium 计算
const premium = (bfx_price - cb_price) / cb_price;
const premiumStatus = Math.abs(premium) >= 0.0025 ? 'ALERT' : 'NORMAL';

// 2. 多空比计算
const longShortRatio = btc_longs / btc_shorts;
const lsrStatus = longShortRatio > 100 ? 'EXTREME_LONG' :
                  longShortRatio < 1 ? 'EXTREME_SHORT' : 'BALANCED';

// 3. Funding Rate 年化
const fundingAnnualized = funding_rate * 3 * 365; // 8h 结算周期
const fundingStatus = fundingAnnualized > 50 ? 'OVERCROWDED' :
                      fundingAnnualized < -20 ? 'SHORTS_CROWDED' : 'NORMAL';

// 4. 借贷集中度
const loanConcentration = btc_usd_funding / total_usd_funding;
const concentrationStatus = loanConcentration > 0.9 ? 'HIGH_RISK' : 'NORMAL';

// 5. 综合状态机
const whaleRegime = calculateRegime({
  premium,
  longShortRatio,
  fundingRate,
  loanConcentration,
  longsSlope,
  ethBtcPhase,
});
```

### 3.5 数据库 Schema (扩展版)

```sql
-- 价格表 (高频)
CREATE TABLE prices (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    venue VARCHAR(10) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    bid DECIMAL(20,8),
    ask DECIMAL(20,8),
    last_price DECIMAL(20,8) NOT NULL,
    volume_24h DECIMAL(20,8)
);

-- 仓位表
CREATE TABLE positions (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    side VARCHAR(10) NOT NULL,  -- 'long' / 'short'
    size DECIMAL(30,8) NOT NULL
);

-- 资金面表
CREATE TABLE funding_stats (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    currency VARCHAR(10) NOT NULL,  -- 'USD' / 'UST'
    total_size DECIMAL(30,8),
    symbol_size DECIMAL(30,8),      -- 用于特定交易对
    symbol VARCHAR(20)
);

-- 永续合约表
CREATE TABLE derivatives (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    symbol VARCHAR(30) NOT NULL,
    deriv_price DECIMAL(20,8),
    spot_price DECIMAL(20,8),
    funding_rate DECIMAL(20,10),
    next_funding_ts TIMESTAMPTZ,
    open_interest DECIMAL(30,8)
);

-- 清算表
CREATE TABLE liquidations (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    pos_id BIGINT,
    symbol VARCHAR(30) NOT NULL,
    side VARCHAR(10),
    amount DECIMAL(30,8),
    price DECIMAL(20,8)
);

-- 计算指标表 (实时)
CREATE TABLE metrics (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    key VARCHAR(50) NOT NULL,
    value DECIMAL(30,8) NOT NULL,
    meta JSONB
);

-- 指标 key 枚举：
-- 'premium', 'long_short_ratio', 'funding_rate_btc', 'funding_rate_eth',
-- 'loan_concentration', 'btc_longs_slope', 'ethbtc_phase'

-- 事件表
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    ts_triggered TIMESTAMPTZ NOT NULL,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(10) NOT NULL,
    snapshot JSONB NOT NULL,
    explanation TEXT,
    outcome_1d JSONB,
    outcome_7d JSONB
);

-- 索引
CREATE INDEX idx_prices_ts ON prices(ts DESC);
CREATE INDEX idx_positions_ts_symbol ON positions(ts DESC, symbol, side);
CREATE INDEX idx_metrics_ts_key ON metrics(ts DESC, key);
CREATE INDEX idx_events_ts_type ON events(ts_triggered DESC, type);
CREATE INDEX idx_liquidations_ts ON liquidations(ts DESC);
```

### 3.6 API Routes 设计

```
/api
├── /metrics
│   ├── GET /current          # 获取所有当前指标
│   ├── GET /premium          # Premium 历史
│   ├── GET /longs            # Longs 历史
│   ├── GET /long-short-ratio # 多空比历史
│   ├── GET /funding          # Funding Rate 历史
│   └── GET /concentration    # 借贷集中度历史
│
├── /events
│   ├── GET /                 # 事件列表 (分页)
│   ├── GET /:id              # 单个事件详情
│   └── GET /stats            # 事件统计
│
├── /regime
│   └── GET /current          # 当前 Whale Regime
│
├── /liquidations
│   ├── GET /recent           # 最近清算
│   └── GET /stats            # 清算统计
│
├── /alerts
│   ├── POST /telegram/setup  # 设置 Telegram
│   ├── PUT /preferences      # 告警偏好
│   └── GET /history          # 告警历史
│
└── /health
    └── GET /                 # 健康检查
```

---

## 4. 前端架构

### 4.1 页面结构

```
app/
├── layout.tsx                 # 全局布局 (Header + Sidebar)
├── page.tsx                   # Dashboard 主页
├── events/
│   └── page.tsx              # 事件流页面
├── settings/
│   └── page.tsx              # 设置页面
├── api/
│   ├── metrics/
│   ├── events/
│   └── ...
└── components/
    ├── layout/
    │   ├── Header.tsx
    │   ├── Sidebar.tsx
    │   └── MobileNav.tsx
    ├── dashboard/
    │   ├── RegimeIndicator.tsx
    │   ├── MetricCard.tsx
    │   ├── PremiumModule.tsx
    │   ├── LongsModule.tsx
    │   ├── FundingModule.tsx
    │   ├── LSRatioModule.tsx
    │   ├── ConcentrationModule.tsx
    │   └── LiquidationModule.tsx
    ├── events/
    │   ├── EventCard.tsx
    │   ├── EventFeed.tsx
    │   └── EventFilter.tsx
    ├── charts/
    │   ├── PriceChart.tsx
    │   ├── AreaChart.tsx
    │   ├── GaugeChart.tsx
    │   └── HeatmapChart.tsx
    └── ui/
        ├── (shadcn components)
        └── ...
```

### 4.2 Dashboard 布局设计

```
┌─────────────────────────────────────────────────────────────────────────┐
│ HEADER: Logo | BWC | 当前时间 | 连接状态 | 设置                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  WHALE REGIME: 🟩 吸筹阶段                                        │    │
│  │  "巨鲸正在逢低建仓，Funding Rate 健康，Premium 正常"                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ BTC 多头仓位     │ │ Premium        │ │ 多空比          │           │
│  │ ═══════════════ │ │ ═══════════════ │ │ ═══════════════ │           │
│  │ 73,191 BTC      │ │ +0.06%         │ │ 245:1          │           │
│  │ 7D: +2.3%       │ │ 状态: 正常      │ │ 状态: 极度偏多  │           │
│  │ [━━━━━━━━░░] 吸筹│ │ ● ○ ○ ○ ○      │ │ [=====>    ]   │           │
│  │ [面积图]         │ │ [折线图]        │ │ [仪表盘]        │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                          │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐           │
│  │ Funding Rate   │ │ 借贷集中度      │ │ ETH/BTC 节奏    │           │
│  │ ═══════════════ │ │ ═══════════════ │ │ ═══════════════ │           │
│  │ BTC: 0.0248%   │ │ BTC占用: 96%   │ │ 阶段: 建仓中    │           │
│  │ 年化: ~27%      │ │ 风险: 高集中    │ │ 持续: 5天       │           │
│  │ ETH: 0.0138%   │ │ [饼图]          │ │ [节奏图]        │           │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 清算监控                                                          │    │
│  │ 24h清算: $1.2M | 最近: DOT -$18.5k @$1.846 (2分钟前)              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ 事件流                                                   [筛选 ▼] │    │
│  │ ─────────────────────────────────────────────────────────────── │    │
│  │ 🟡 15:32  Premium 异常 -0.31% 持续12分钟  BTC $87,320  [查看]    │    │
│  │ 🟢 14:15  Longs 突破 73,000  7D+3.2%  触发: 吸筹信号  [查看]      │    │
│  │ 🔴 12:48  Regime 切换: 黄→红  多重风险触发           [查看]      │    │
│  │ ...                                                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 移动端响应式设计

```
┌──────────────────────┐
│ BWC  🟩 吸筹  ⚙️     │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ Whale Regime     │ │
│ │ 🟩 吸筹阶段       │ │
│ │ 巨鲸正在逢低建仓  │ │
│ └──────────────────┘ │
│                      │
│ ┌────────┐┌────────┐ │
│ │BTC多头 ││Premium │ │
│ │73,191  ││+0.06%  │ │
│ │+2.3%   ││正常    │ │
│ └────────┘└────────┘ │
│                      │
│ ┌────────┐┌────────┐ │
│ │多空比  ││Funding │ │
│ │245:1   ││0.0248% │ │
│ │极度偏多││~27%APR │ │
│ └────────┘└────────┘ │
│                      │
│ ━━━ 事件流 ━━━━━━━━ │
│ 🟡 Premium异常-0.31% │
│ 🟢 Longs突破73,000   │
│ 🔴 Regime黄→红      │
│                      │
│ [更多事件...]        │
└──────────────────────┘
```

### 4.4 组件设计规范

#### 4.4.1 指标卡片 (MetricCard)

```typescript
interface MetricCardProps {
  title: string;           // 标题
  value: string | number;  // 主数值
  unit?: string;           // 单位
  change?: {               // 变化
    value: number;
    period: '1D' | '7D' | '30D';
  };
  status: 'positive' | 'negative' | 'neutral' | 'warning' | 'danger';
  statusLabel?: string;    // 状态文字
  chart?: React.ReactNode; // 迷你图表
  tooltip?: string;        // 解释性提示
}
```

#### 4.4.2 状态指示器颜色规范

| 状态 | 颜色 | 使用场景 |
|-----|-----|---------|
| 🟢 吸筹/正常 | `#22c55e` (green-500) | Regime=吸筹, Premium正常, Funding健康 |
| 🟡 观望/警告 | `#eab308` (yellow-500) | Regime=混沌, 接近阈值, 需关注 |
| 🔴 风险/派发 | `#ef4444` (red-500) | Regime=风险, Premium异常, Funding过热 |
| 🔵 信息 | `#3b82f6` (blue-500) | 中性数据展示 |
| ⚪ 无效 | `#6b7280` (gray-500) | 无数据/不适用 |

#### 4.4.3 图表规范

```typescript
// 统一图表配置
const chartConfig = {
  colors: {
    primary: '#3b82f6',    // 主线
    secondary: '#10b981',  // 辅助线
    danger: '#ef4444',     // 风险区
    area: 'rgba(59, 130, 246, 0.1)',
  },
  grid: {
    stroke: '#e5e7eb',
    strokeDasharray: '3 3',
  },
  tooltip: {
    background: '#1f2937',
    color: '#fff',
  },
  animation: {
    duration: 300,
  },
};
```

### 4.5 前端状态管理

```typescript
// stores/metricsStore.ts
import { create } from 'zustand';

interface MetricsState {
  // 实时指标
  current: {
    btcLongs: number;
    btcShorts: number;
    premium: number;
    fundingRate: number;
    loanConcentration: number;
    whaleRegime: 'accumulation' | 'mixed' | 'distribution';
  };

  // 历史数据
  history: {
    longs: TimeSeriesData[];
    premium: TimeSeriesData[];
    funding: TimeSeriesData[];
  };

  // 状态
  isConnected: boolean;
  lastUpdate: Date | null;

  // Actions
  updateCurrent: (data: Partial<MetricsState['current']>) => void;
  appendHistory: (key: string, point: TimeSeriesData) => void;
}

// stores/eventsStore.ts
interface EventsState {
  events: WhaleEvent[];
  filters: EventFilter;
  isLoading: boolean;

  fetchEvents: (params?: EventParams) => Promise<void>;
  setFilter: (filter: Partial<EventFilter>) => void;
}
```

### 4.6 实时数据更新策略

```typescript
// hooks/useRealTimeData.ts
export function useRealTimeData() {
  // 方案1: Polling (MVP)
  const { data, refetch } = useQuery({
    queryKey: ['metrics', 'current'],
    queryFn: () => fetch('/api/metrics/current').then(r => r.json()),
    refetchInterval: 15000, // 15秒轮询
  });

  // 方案2: Supabase Realtime (推荐)
  useEffect(() => {
    const channel = supabase
      .channel('metrics')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'metrics',
      }, (payload) => {
        updateMetrics(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
}
```

---

## 5. 用户体验设计

### 5.1 信息层级设计

```
┌─────────────────────────────────────────────────────────────────┐
│ 第一层：一眼看懂                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ • Whale Regime 大色块 (🟩🟡🔴)                                    │
│ • 一句话解读                                                      │
│ • 最重要的1-2个数字                                               │
├─────────────────────────────────────────────────────────────────┤
│ 第二层：快速扫描                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ • 6个指标卡片 (3列 x 2行)                                         │
│ • 每个卡片：数值 + 状态 + 迷你趋势                                 │
│ • 颜色编码一目了然                                                │
├─────────────────────────────────────────────────────────────────┤
│ 第三层：深入分析                                                  │
│ ─────────────────────────────────────────────────────────────── │
│ • 点击卡片展开详细图表                                            │
│ • 事件流提供历史记录                                              │
│ • 每个事件有完整的"为什么"解释                                    │
├─────────────────────────────────────────────────────────────────┤
│ 第四层：个性化                                                    │
│ ─────────────────────────────────────────────────────────────── │
│ • 设置页面调整阈值                                                │
│ • 告警偏好设置                                                    │
│ • 历史复盘统计                                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 用户引导设计

#### 5.2.1 首次访问引导

```
┌─────────────────────────────────────────────────────────────┐
│                    欢迎使用 BWC                              │
│                                                              │
│  BWC 帮你追踪 Bitfinex 巨鲸的仓位变化                         │
│  让你在第一时间发现市场异动                                    │
│                                                              │
│  核心功能：                                                   │
│  ├─ 🐋 巨鲸仓位追踪 - 多头/空头实时数据                        │
│  ├─ 📊 折溢价监控 - Bitfinex vs Coinbase                     │
│  ├─ ⚡ Funding Rate - 市场情绪晴雨表                          │
│  └─ 🔔 智能告警 - Telegram 实时推送                           │
│                                                              │
│  [开始使用] [了解更多]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.2 指标解释 Tooltip

每个指标卡片右上角有 `?` 图标，hover 显示：

```
┌─────────────────────────────────────────────────┐
│ BTC Margin Longs                                │
│ ─────────────────────────────────────────────── │
│ 这是什么？                                       │
│ Bitfinex 交易所的 BTC 杠杆多头总仓位。            │
│                                                  │
│ 为什么重要？                                     │
│ Bitfinex 聚集了大量"老牌巨鲸"，                   │
│ 他们的仓位变化往往领先市场。                      │
│                                                  │
│ 如何解读？                                       │
│ • 震荡/下跌时 Longs 上升 → 可能在吸筹             │
│ • 上涨时 Longs 下降 → 可能在派发                  │
│                                                  │
│ 数据来源：Bitfinex Public API                    │
└─────────────────────────────────────────────────┘
```

### 5.3 告警设计

#### 5.3.1 告警级别

| 级别 | 触发条件 | 通知方式 |
|-----|---------|---------|
| 🔴 紧急 | Regime 切换到红色 / Premium >0.5% / 大额清算 | 立即推送 + 声音 |
| 🟡 警告 | Premium >0.25% / Funding >30% APR / Regime 切换 | 推送 |
| 🔵 信息 | 日报 / 周报 / 阶段总结 | 定时推送 |

#### 5.3.2 Telegram 告警模板

```
🐋 BWC Alert

📍 Premium Risk Triggered
━━━━━━━━━━━━━━━━
Premium: -0.32%
持续时间: 18 分钟
当前 BTC: $87,320

💡 解读:
Bitfinex 相对 Coinbase 出现异常折价
可能表示 Bitfinex 端有抛压

📊 相关指标:
• 多空比: 245:1 (极度偏多)
• Funding: 0.0248% (~27% APR)
• Longs 7D变化: +2.3%

🔗 查看详情: https://bwc.app/event/123
```

### 5.4 事件卡片设计

```
┌─────────────────────────────────────────────────────────────────┐
│ 🟡 Premium 异常                                    15:32 UTC    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  触发条件：Premium < -0.25% 持续 > 10 分钟                       │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  当时市场状态：                                                   │
│  ┌───────────┬───────────┬───────────┬───────────┐              │
│  │ Premium   │ BTC Price │ Longs     │ Funding   │              │
│  │ -0.31%    │ $87,320   │ 73,150    │ 0.025%    │              │
│  └───────────┴───────────┴───────────┴───────────┘              │
│                                                                  │
│  解读：                                                          │
│  Bitfinex 相对 Coinbase 出现 0.31% 折价，已持续 18 分钟。        │
│  这可能表示 Bitfinex 端有较大卖压，需要关注后续走势。             │
│                                                                  │
│  历史统计：                                                       │
│  过去 180 天出现过 23 次类似情况                                  │
│  • 1D 后下跌概率：61%                                            │
│  • 7D 后下跌概率：48%                                            │
│                                                                  │
│  后续表现：                                    [待更新 / 已更新]  │
│  +1D: -2.1% ($85,486)  +7D: +1.3% ($88,455)                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 开发优先级

### 6.1 Phase 1: MVP Core (Day 1-3)

```
优先级 P0 - 必须完成
─────────────────────
□ 数据采集服务
  ├─ Bitfinex Ticker (15s)
  ├─ Bitfinex Longs/Shorts (60s)
  └─ Coinbase Price (15s)

□ 基础计算
  ├─ Premium 实时计算
  ├─ 多空比计算
  └─ Longs 变化率

□ Dashboard 基础
  ├─ Regime 状态指示器
  ├─ 3个核心指标卡片
  └─ 基础图表
```

### 6.2 Phase 2: 扩展指标 (Day 4-5)

```
优先级 P1 - 重要
─────────────────────
□ 扩展数据采集
  ├─ Funding Rate (300s)
  ├─ 借贷规模 (300s)
  └─ 清算事件 (60s)

□ 扩展计算
  ├─ Funding 年化
  ├─ 借贷集中度
  └─ ETH/BTC 节奏检测

□ Dashboard 扩展
  ├─ 新增3个指标卡片
  ├─ 清算监控条
  └─ 完善图表
```

### 6.3 Phase 3: 事件系统 (Day 6)

```
优先级 P1 - 重要
─────────────────────
□ 事件检测引擎
  ├─ Premium 触发
  ├─ Regime 切换
  ├─ Longs 突破
  └─ 清算潮检测

□ 事件展示
  ├─ 事件卡片组件
  ├─ 事件流列表
  └─ 事件详情页
```

### 6.4 Phase 4: 告警系统 (Day 7)

```
优先级 P1 - 重要
─────────────────────
□ Telegram Bot
  ├─ Bot 创建与配置
  ├─ 用户绑定流程
  └─ 消息推送

□ 告警引擎
  ├─ 规则配置
  ├─ 频率控制
  └─ 告警历史
```

### 6.5 Phase 5: 优化 (v0.2)

```
优先级 P2 - 增强
─────────────────────
□ 用户体验
  ├─ 引导流程
  ├─ Tooltip 完善
  └─ 移动端优化

□ 高级功能
  ├─ 自适应阈值
  ├─ 多时间框架
  └─ 历史复盘页

□ 性能优化
  ├─ 数据缓存策略
  ├─ 图表性能
  └─ 加载优化
```

---

## 7. 部署架构

### 7.1 Vercel 部署配置

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/collect-ticker",
      "schedule": "*/1 * * * *"
    },
    {
      "path": "/api/cron/collect-stats",
      "schedule": "*/1 * * * *"
    },
    {
      "path": "/api/cron/collect-funding",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/aggregate",
      "schedule": "0 * * * *"
    }
  ]
}
```

### 7.2 环境变量

```bash
# .env.local
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://bwc.app
```

### 7.3 监控与告警

```
┌─────────────────────────────────────────────────────────────────┐
│                     运维监控                                     │
├─────────────────────────────────────────────────────────────────┤
│ Vercel Analytics    │ 页面性能、错误追踪                         │
│ Sentry             │ 异常监控、错误报告                          │
│ Upstash Console    │ Redis 使用量、延迟监控                      │
│ Supabase Dashboard │ 数据库性能、存储使用                        │
│ Telegram 自监控    │ 数据采集失败时自动告警                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. 成本估算

### 8.1 免费额度估算 (MVP)

| 服务 | 免费额度 | 预估使用 | 状态 |
|-----|---------|---------|-----|
| Vercel | 100GB带宽/月 | ~5GB | ✅ 充足 |
| Supabase | 500MB存储, 2GB出站 | ~200MB, 1GB | ✅ 充足 |
| Upstash Redis | 10k命令/天 | ~8k | ✅ 充足 |
| Telegram Bot | 无限制 | - | ✅ 免费 |

### 8.2 扩展成本 (v1.0)

| 服务 | 付费档位 | 月费 |
|-----|---------|-----|
| Vercel Pro | $20/月 | $20 |
| Supabase Pro | $25/月 | $25 |
| Upstash Pay-as-you-go | $0.2/100k | ~$5 |
| **总计** | | **~$50/月** |

---

## 附录 A: 文件结构

```
bitfinex-whale-console/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── events/
│   ├── settings/
│   ├── api/
│   │   ├── metrics/
│   │   ├── events/
│   │   ├── cron/
│   │   └── ...
│   └── globals.css
├── components/
│   ├── layout/
│   ├── dashboard/
│   ├── events/
│   ├── charts/
│   └── ui/
├── lib/
│   ├── api/
│   │   ├── bitfinex.ts
│   │   └── coinbase.ts
│   ├── db/
│   │   ├── supabase.ts
│   │   └── redis.ts
│   ├── services/
│   │   ├── collector.ts
│   │   ├── calculator.ts
│   │   ├── detector.ts
│   │   └── alerter.ts
│   └── utils/
├── stores/
│   ├── metricsStore.ts
│   └── eventsStore.ts
├── types/
│   └── index.ts
├── public/
├── docs/
│   ├── prd.md
│   ├── technical-spec.md
│   ├── api-reference.md
│   └── architecture.md
├── package.json
├── tailwind.config.js
├── next.config.js
└── vercel.json
```

---

## 附录 B: 快速启动

```bash
# 1. 创建项目
npx create-next-app@latest bwc --typescript --tailwind --app --src-dir=false

# 2. 安装依赖
npm install @supabase/supabase-js @upstash/redis zustand @tanstack/react-query
npm install recharts lucide-react
npx shadcn-ui@latest init

# 3. 配置环境变量
cp .env.example .env.local
# 填入 Supabase, Upstash, Telegram 凭证

# 4. 创建数据库表
# 在 Supabase SQL Editor 中运行 schema.sql

# 5. 启动开发
npm run dev

# 6. 部署
vercel deploy
```

---

**文档结束**
