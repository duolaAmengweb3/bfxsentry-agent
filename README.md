# BFXSentry Agent

Real-time Bitfinex whale-watching toolkit — a **CLI trading agent** and a **web dashboard**, unified in one repo.

**Live Dashboard**: [bfxsentry.duckdns.org](https://bfxsentry.duckdns.org)

---

## Repository Structure

```
bfxsentry-agent/
├── cli/          # CLI trading agent (TypeScript / Node.js)
├── dashboard/    # Next.js web dashboard
└── README.md
```

---

## CLI Agent (`cli/`)

An autonomous trading agent that monitors Bitfinex margin positions, order books, funding rates, liquidations, and Polymarket prediction markets — then generates signals and (optionally) executes trades.

### Features

- **6 built-in strategies**: Orderbook Sniper, Liquidation Hunter, Funding Arbitrage, Smart-Money Follow, Polymarket Hedge, Basis Monitor
- **Real-time data**: Bitfinex REST + WebSocket, Polymarket CLOB API
- **Risk management**: Position limits, stop-loss, daily loss caps, configurable via YAML
- **Decision logging**: Every signal, order, and fill is recorded to `~/.bfxsentry/logs/`
- **Backtesting**: Historical replay with fill simulation and parameter optimization
- **Interactive CLI**: `scan`, `signal`, `status`, `trade`, `logs`, `strategy` commands

### Quick Start

```bash
cd cli
npm install
npm run build

# Set API keys
export BITFINEX_API_KEY=your_key
export BITFINEX_API_SECRET=your_secret

# Interactive mode
npx bfxsentry

# Or run specific commands
npx bfxsentry scan          # Market overview
npx bfxsentry signal        # Current signals
npx bfxsentry status        # Position & P/L
npx bfxsentry trade         # Execute strategy
npx bfxsentry logs          # View decision log
npx bfxsentry strategy      # Strategy config
```

### Configuration

Copy and edit the default config:

```bash
cp config/default.yaml ~/.bfxsentry/config.yaml
```

Key settings:
- `strategies.*`: Enable/disable strategies and set parameters
- `risk.maxPositionUsd`: Maximum position size
- `risk.dailyLossLimit`: Stop trading after this daily loss
- `polling.intervalMs`: Data refresh rate

---

## Web Dashboard (`dashboard/`)

A Next.js real-time dashboard for monitoring Bitfinex whale activity, built with React, TailwindCSS, and shadcn/ui.

### Features

- **Whale Console**: BTC margin longs/shorts, long-short ratio, premium spread, loan concentration
- **Order Book Depth**: Real-time bid/ask visualization with spread tracking
- **Liquidation Hunter**: Live liquidation feed with cascade detection
- **Funding Radar**: Lending rate analysis with APY calculations
- **Orderbook Sniper**: Wall detection and iceberg order identification
- **Polymarket Radar**: Prediction market signals correlated with BTC price
- **Smart Money Tracker**: Large-position movement monitoring
- **Multi-language**: English, Chinese (中文), Vietnamese (Tiếng Việt)

### Quick Start

```bash
cd dashboard
npm install
npm run dev
# Open http://localhost:3000
```

### Environment Variables

Create `dashboard/.env.local`:

```env
# Optional: Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

No API keys needed — the dashboard reads public Bitfinex data.

### Production Deployment

```bash
cd dashboard
npm run build
npm start
# Or use PM2:
pm2 start npm --name bfxsentry -- start
```

---

## Tech Stack

| Component | Stack |
|-----------|-------|
| CLI Agent | TypeScript, Node.js, Bitfinex REST/WS API, Polymarket CLOB |
| Dashboard | Next.js 14, React, TailwindCSS, shadcn/ui, TanStack Query |
| Data | Bitfinex public API (margin stats, order book, trades, funding) |

## License

MIT
