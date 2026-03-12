'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type Locale = 'en' | 'zh' | 'vi'

type Primitive = string | number | boolean | null | undefined
type MessageValue = Primitive | MessageTree | MessageValue[]
type MessageTree = { [key: string]: MessageValue }

const STORAGE_KEY = 'bitfinex-locale'
const DEFAULT_LOCALE: Locale = 'en'

const LOCALE_TAGS: Record<Locale, string> = {
  en: 'en-US',
  zh: 'zh-CN',
  vi: 'vi-VN',
}

const LANGUAGE_LABELS: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  vi: 'Tiếng Việt',
}

const MESSAGES: Record<Locale, MessageTree> = {
  en: {
    common: {
      live: 'Live',
      loading: 'Loading...',
      retry: 'Retry',
      reconnect: 'Reconnect',
      networkError: 'Network error',
      noData: 'No data',
      defaultError: 'Failed to load data',
      updatedAt: 'Updated',
      justNow: 'Just now',
      minutesAgo: '{count} min ago',
      hoursAgo: '{count} h ago',
      daysAgo: '{count} d ago',
      stable: 'Stable',
      comingSoon: 'Coming soon',
      support: 'Support',
      resistance: 'Resistance',
      target: 'Target',
      near: 'near',
      entries: '{count} entries',
    },
    meta: {
      title: 'Bitfinex Sentry · Whale Monitor',
      description:
        'Market microstructure monitor based on Bitfinex public data, tracking whale behavior and funding shifts.',
    },
    language: {
      label: 'Language',
      english: 'English',
      chinese: 'Chinese',
      vietnamese: 'Vietnamese',
    },
    shell: {
      title: 'Bitfinex Sentry',
      subtitle: 'Whale monitor',
      poweredBy: 'Powered by Bitfinex',
    },
    sidebar: {
      section: 'Main navigation',
      status: 'System status',
      dataChannel: 'Data channel',
      footer1: 'Data source: Bitfinex public API',
      footer2: 'For research only. Not investment advice.',
      items: {
        dataCenter: { label: 'Data Center', desc: 'Main overview' },
        agentCli: { label: 'Agent CLI', desc: 'Signal-driven auto trading' },
        agentTutorial: { label: 'Agent AI Guide', desc: 'Setup and usage' },
        rankings: { label: 'Rankings', desc: 'Profit leaderboard' },
        smartMoney: { label: 'Smart Money', desc: 'Direction inference' },
        fundingRadar: { label: 'Funding Radar', desc: 'Rates and usage' },
        liquidationHunter: { label: 'Liquidation Hunter', desc: 'Liquidation monitor' },
        orderbookSniper: { label: 'Orderbook Sniper', desc: 'Depth imbalance' },
        polymarketRadar: { label: 'PM Radar', desc: 'Signal-driven betting' },
        marketIntel: { label: 'Market Intel', desc: 'Planned module' },
        alerts: { label: 'Alerts', desc: 'Planned module' },
      },
    },
    floatingCard: {
      close: 'Close signup card',
      kicker: 'Sign up and trade on Bitfinex',
      headline: '0 trading fees',
      cta: 'Create account',
      slogans: [
        'Integrated funding market and margin trading',
        'Advanced order types like a professional terminal',
        'Keep your edge instead of giving it to fees',
      ],
    },
    pages: {
      alerts: {
        title: 'Alerts',
        desc: 'Reserved area for future alert strategies and subscriptions.',
      },
      marketIntel: {
        title: 'Market Intel',
        desc: 'Reserved area for upcoming modules.',
      },
      settings: {
        title: 'Settings',
        desc: 'Reserved area for permissions, preferences, and integrations.',
      },
      fundingRadar: {
        title: 'Funding Radar',
        desc: 'Real-time Bitfinex fUSD funding monitor: rates, utilization, and supply-demand.',
        footer:
          'Data source: Bitfinex public API. Funding rates are volatile. Not investment advice. Research use only.',
      },
      liquidationHunter: {
        title: 'Liquidation Hunter',
        desc: 'Real-time liquidation monitor with long/short comparison and squeeze or exhaustion signals.',
        footer:
          'Data source: Bitfinex public API. Liquidation signals may lag. Not investment advice. Research use only.',
      },
      orderbookSniper: {
        title: 'Orderbook Sniper',
        desc: 'Real-time order book depth, wall detection, and imbalance signals.',
        footer:
          'Data source: Bitfinex public API. Order book data is a live snapshot. Not investment advice. Research use only.',
      },
      polymarketRadar: {
        title: 'Polymarket Radar',
        desc: 'Short-term BTC prediction markets with Bitfinex signal-driven auto-betting and 4h hit rate of 55-67%.',
        footer:
          'Polymarket data from Gamma API / CLOB API. Signal-driven betting is based on Bitfinex multi-module aggregation. Not investment advice. Research use only.',
      },
      rankings: {
        title: 'Rankings',
        desc: 'Public Bitfinex trader leaderboards synced from the official API in real time.',
        footer:
          'Data source: Bitfinex public API. Leaderboard data may lag. Not investment advice. Research use only.',
      },
      smartMoney: {
        title: 'Smart Money Signals',
        desc:
          'Infer smart-money directional bias from the correlation between leaderboard unrealized PnL and BTC price.',
      },
    },
    dataCenterHero: {
      badge: 'Bitfinex Sentry Signal Hub',
      title: 'Bitfinex Sentry · Signal Hub',
      desc:
        'In noisy markets, watch capital before price. Based on Bitfinex public data, this hub combines positions, depth, funding, and liquidation signals to spot trend continuation and risk turns faster.',
      sideTitle: 'Data notes',
      sideCards: [
        'Long/short positions and order book depth are used to read capital direction and short-term pressure.',
        'Premium and funding help measure crowding and sentiment skew.',
        'Liquidations and trade flow help identify acceleration and possible reversal zones.',
      ],
      disclaimer:
        'All data comes from Bitfinex public APIs and is provided for research and study only. This is not investment advice.',
      cards: [
        {
          title: 'Data sources',
          desc: 'Bitfinex Public API + Coinbase Spot, with core metrics refreshed every 2-10 seconds.',
        },
        {
          title: 'Core metrics',
          desc: 'Longs/shorts, premium, funding, order book depth, liquidations, and live trade flow.',
        },
        {
          title: 'Decision use',
          desc: 'Observe whale positioning and market microstructure to support short- and medium-term risk judgement.',
        },
      ],
    },
    dashboard: {
      autoRefresh: 'Data refreshes every 2-5 seconds',
      realtimeConnected: 'Realtime connected',
      connectingSource: 'Connecting to data source...',
      connectionFailed: 'Connection failed',
      signalNames: {
        position24h: '24h positions',
        orderbook: 'Order book',
        buyPressure: 'Buy pressure',
        sellPressure: 'Sell pressure',
        overheating: 'Overheated',
        bidAskRatio: 'Bid/ask ratio',
        highLow24h: '24h range',
      },
      metricCards: {
        btcLongs: 'BTC Long Positions',
        ratio: 'Long/Short Ratio',
        premium: 'Premium',
        concentration: 'Funding Concentration',
        increasing: 'Building',
        decreasing: 'Reducing',
        steady: 'Stable',
        extremelyBullish: 'Extreme longs',
        normal: 'Normal',
        abnormal: 'Abnormal',
        highlyConcentrated: 'High concentration',
      },
      bottomStats: {
        totalUsdFunding: 'Total USD funding',
        btcUsed: 'BTC-used USD',
        btcShorts: 'BTC shorts',
        ethBtcLongs: 'ETH/BTC longs',
      },
    },
  },
  zh: {},
  vi: {},
}

MESSAGES.zh = JSON.parse(JSON.stringify(MESSAGES.en))
MESSAGES.vi = JSON.parse(JSON.stringify(MESSAGES.en))

const baseEn = MESSAGES.en as any

Object.assign(MESSAGES.zh, {
  common: {
    ...baseEn.common,
    live: '实时',
    loading: '加载中...',
    retry: '重试',
    reconnect: '重新连接',
    networkError: '网络错误',
    noData: '暂无数据',
    defaultError: '数据加载失败',
    updatedAt: '更新时间',
    justNow: '刚刚',
    minutesAgo: '{count} 分钟前',
    hoursAgo: '{count} 小时前',
    daysAgo: '{count} 天前',
    stable: '稳定',
    comingSoon: '即将上线',
    support: '支撑',
    resistance: '阻力',
    target: '目标',
    near: '附近',
    entries: '{count} 笔',
  },
  meta: {
    title: 'Bitfinex 哨兵 · 鲸鱼监控台',
    description: '基于 Bitfinex 公开数据的市场微结构监控工具，追踪巨鲸行为与资金异动。',
  },
  language: {
    label: '语言',
    english: 'English',
    chinese: '中文',
    vietnamese: 'Tiếng Việt',
  },
  shell: {
    title: 'Bitfinex 哨兵',
    subtitle: '鲸鱼监控台',
    poweredBy: 'Powered by Bitfinex',
  },
  sidebar: {
    section: '主导航',
    status: '系统状态',
    dataChannel: '数据通道',
    footer1: '数据来源 Bitfinex 公开 API',
    footer2: '仅供研究参考，不构成投资建议。',
    items: {
      dataCenter: { label: '数据中心', desc: '首页入口' },
      agentCli: { label: 'Agent CLI', desc: '信号驱动自动交易' },
      agentTutorial: { label: 'Agent AI 教程', desc: '部署与使用指南' },
      rankings: { label: '交易龙虎榜', desc: '盈利排行' },
      smartMoney: { label: '聪明钱信号', desc: '方向推断' },
      fundingRadar: { label: '融资雷达', desc: '利率/利用率' },
      liquidationHunter: { label: '爆仓猎人', desc: '清算监控' },
      orderbookSniper: { label: '盘口狙击', desc: '深度失衡' },
      polymarketRadar: { label: 'PM 雷达', desc: '信号驱动下注' },
      marketIntel: { label: '市场情报', desc: '后续功能' },
      alerts: { label: '告警中心', desc: '后续功能' },
    },
  },
  floatingCard: {
    close: '关闭邀请卡片',
    kicker: '立即注册登录 Bitfinex',
    headline: '0交易手续费',
    cta: '立即注册',
    slogans: ['融资市场 + 杠杆交易一体化', '高级订单类型齐全：更像专业交易终端', '让策略的边际优势不被手续费吃掉'],
  },
  pages: {
    alerts: { title: '告警中心', desc: '预留板块，后续接入告警策略与订阅。' },
    marketIntel: { title: '市场情报', desc: '预留板块，后续接入新功能模块。' },
    settings: { title: '系统设置', desc: '预留板块，后续接入权限、偏好与集成配置。' },
    fundingRadar: {
      title: '融资雷达',
      desc: 'Bitfinex fUSD 融资市场实时监控 · 利率/利用率/供需分析',
      footer: '数据来源 Bitfinex 公开 API · 融资利率存在波动，不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    liquidationHunter: {
      title: '爆仓猎人',
      desc: '实时爆仓监控 · 多空清算对比 · 挤仓/耗尽信号',
      footer: '数据来源 Bitfinex 公开 API · 清算信号存在延迟，不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    orderbookSniper: {
      title: '盘口狙击',
      desc: '实时盘口深度分析 · 大单墙检测 · 失衡信号',
      footer: '数据来源 Bitfinex 公开 API · 盘口数据为实时快照，不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    polymarketRadar: {
      title: 'Polymarket 雷达',
      desc: 'BTC 短周期预测市场 · Bitfinex 信号驱动自动下注 · 4h 准确率 55-67%',
      footer: 'Polymarket 数据来源 Gamma API / CLOB API · 信号驱动下注基于 Bitfinex 多模块聚合 · 不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    rankings: {
      title: '交易龙虎榜',
      desc: 'Bitfinex 平台公开交易者盈利排行，数据实时同步自官方 API',
      footer: '数据来源 Bitfinex 公开 API · 排行榜数据存在滞后，不构成任何投资建议，仅供研究参考 · Bitfinex',
    },
    smartMoney: {
      title: '聪明钱信号',
      desc: '基于排行榜群体浮盈与 BTC 价格的相关性分析，推断聪明钱的多空方向倾向',
    },
  },
  dataCenterHero: {
    badge: 'Bitfinex 哨兵 Signal Hub',
    title: 'Bitfinex 哨兵 · 信号中枢',
    desc:
      '在噪音市场里，先看资金，再看价格。基于 Bitfinex 公开数据，聚合仓位、深度、资金费率与清算信号，帮助你更快识别趋势延续和风险拐点。',
    sideTitle: '数据说明',
    sideCards: ['多空仓位与订单簿用于观测资金方向和短时压力。', 'Premium 与 Funding 用于判断交易拥挤度和情绪偏差。', '清算和成交流用于识别波动加速与潜在反转区间。'],
    disclaimer: '本工具所有数据均来源于 Bitfinex 公开 API，仅供研究学习参考，不构成任何投资建议。',
    cards: [
      { title: '数据来源', desc: 'Bitfinex Public API + Coinbase Spot，核心指标按 2-10 秒级刷新。' },
      { title: '核心指标', desc: 'Longs/Shorts、Premium、Funding、订单簿深度、清算和实时成交流。' },
      { title: '决策用途', desc: '用于观察巨鲸仓位和市场微结构变化，辅助短中线风险判断。' },
    ],
  },
  dashboard: {
    autoRefresh: '数据每 2-5 秒自动刷新',
    realtimeConnected: '实时连接',
    connectingSource: '连接数据源...',
    connectionFailed: '连接失败',
    signalNames: {
      position24h: '24h仓位',
      orderbook: '订单簿',
      buyPressure: '买压',
      sellPressure: '卖压',
      overheating: '过热',
      bidAskRatio: '买卖比',
      highLow24h: '24h高低',
    },
    metricCards: {
      btcLongs: 'BTC 多头仓位',
      ratio: '多空比',
      premium: 'Premium',
      concentration: '借贷集中度',
      increasing: '增仓中',
      decreasing: '减仓中',
      steady: '平稳',
      extremelyBullish: '极度偏多',
      normal: '正常',
      abnormal: '异常',
      highlyConcentrated: '高集中',
    },
    bottomStats: {
      totalUsdFunding: 'USD 总借贷',
      btcUsed: 'BTC 使用',
      btcShorts: 'BTC 空头',
      ethBtcLongs: 'ETH/BTC 多头',
    },
  },
})

Object.assign(MESSAGES.vi, {
  common: {
    ...baseEn.common,
    live: 'Trực tiếp',
    loading: 'Đang tải...',
    retry: 'Thử lại',
    reconnect: 'Kết nối lại',
    networkError: 'Lỗi mạng',
    noData: 'Không có dữ liệu',
    defaultError: 'Tải dữ liệu thất bại',
    updatedAt: 'Cập nhật lúc',
    justNow: 'Vừa xong',
    minutesAgo: '{count} phút trước',
    hoursAgo: '{count} giờ trước',
    daysAgo: '{count} ngày trước',
    stable: 'Ổn định',
    comingSoon: 'Sắp ra mắt',
    support: 'Hỗ trợ',
    resistance: 'Kháng cự',
    target: 'Mục tiêu',
    near: 'gần',
    entries: '{count} mục',
  },
  meta: {
    title: 'Bitfinex Sentry · Bảng Theo Dõi Cá Voi',
    description: 'Công cụ theo dõi vi cấu trúc thị trường dựa trên dữ liệu công khai của Bitfinex để quan sát cá voi và dòng vốn.',
  },
  language: {
    label: 'Ngôn ngữ',
    english: 'English',
    chinese: '中文',
    vietnamese: 'Tiếng Việt',
  },
  shell: {
    title: 'Bitfinex Sentry',
    subtitle: 'Bảng theo dõi cá voi',
    poweredBy: 'Powered by Bitfinex',
  },
  sidebar: {
    section: 'Điều hướng chính',
    status: 'Trạng thái hệ thống',
    dataChannel: 'Kênh dữ liệu',
    footer1: 'Nguồn dữ liệu: API công khai Bitfinex',
    footer2: 'Chỉ phục vụ nghiên cứu, không phải tư vấn đầu tư.',
    items: {
      dataCenter: { label: 'Trung tâm dữ liệu', desc: 'Tổng quan chính' },
      agentCli: { label: 'Agent CLI', desc: 'Giao dịch tự động theo tín hiệu' },
      agentTutorial: { label: 'Hướng dẫn Agent AI', desc: 'Thiết lập và sử dụng' },
      rankings: { label: 'Bảng xếp hạng', desc: 'Bảng lợi nhuận' },
      smartMoney: { label: 'Smart Money', desc: 'Suy luận hướng đi' },
      fundingRadar: { label: 'Radar Funding', desc: 'Lãi suất và mức dùng' },
      liquidationHunter: { label: 'Liquidation Hunter', desc: 'Giám sát thanh lý' },
      orderbookSniper: { label: 'Orderbook Sniper', desc: 'Mất cân bằng độ sâu' },
      polymarketRadar: { label: 'PM Radar', desc: 'Đặt cược theo tín hiệu' },
      marketIntel: { label: 'Thông tin thị trường', desc: 'Mô-đun kế tiếp' },
      alerts: { label: 'Cảnh báo', desc: 'Mô-đun kế tiếp' },
    },
  },
  floatingCard: {
    close: 'Đóng thẻ đăng ký',
    kicker: 'Đăng ký và giao dịch trên Bitfinex',
    headline: '0 phí giao dịch',
    cta: 'Đăng ký ngay',
    slogans: ['Tích hợp thị trường funding và margin', 'Đầy đủ loại lệnh nâng cao như terminal chuyên nghiệp', 'Giữ lợi thế chiến lược thay vì để phí bào mòn'],
  },
  pages: {
    alerts: { title: 'Cảnh báo', desc: 'Khu vực dành sẵn cho chiến lược cảnh báo và đăng ký sau này.' },
    marketIntel: { title: 'Thông tin thị trường', desc: 'Khu vực dành sẵn cho các mô-đun sắp tới.' },
    settings: { title: 'Cài đặt', desc: 'Khu vực dành sẵn cho quyền hạn, tùy chọn và tích hợp.' },
    fundingRadar: {
      title: 'Radar Funding',
      desc: 'Theo dõi thời gian thực thị trường funding fUSD của Bitfinex: lãi suất, mức sử dụng và cung cầu.',
      footer: 'Nguồn dữ liệu: API công khai Bitfinex. Lãi suất funding biến động mạnh. Không phải tư vấn đầu tư. Chỉ dành cho nghiên cứu.',
    },
    liquidationHunter: {
      title: 'Liquidation Hunter',
      desc: 'Theo dõi thanh lý thời gian thực với so sánh long/short và tín hiệu squeeze hoặc exhaustion.',
      footer: 'Nguồn dữ liệu: API công khai Bitfinex. Tín hiệu thanh lý có thể trễ. Không phải tư vấn đầu tư. Chỉ dành cho nghiên cứu.',
    },
    orderbookSniper: {
      title: 'Orderbook Sniper',
      desc: 'Phân tích độ sâu sổ lệnh theo thời gian thực, phát hiện tường lệnh và tín hiệu mất cân bằng.',
      footer: 'Nguồn dữ liệu: API công khai Bitfinex. Dữ liệu sổ lệnh là ảnh chụp thời gian thực. Không phải tư vấn đầu tư. Chỉ dành cho nghiên cứu.',
    },
    polymarketRadar: {
      title: 'Polymarket Radar',
      desc: 'Thị trường dự đoán BTC ngắn hạn với tự động đặt cược theo tín hiệu Bitfinex, tỷ lệ đúng 4h khoảng 55-67%.',
      footer: 'Dữ liệu Polymarket từ Gamma API / CLOB API. Đặt cược theo tín hiệu dựa trên tổng hợp nhiều mô-đun Bitfinex. Không phải tư vấn đầu tư. Chỉ dành cho nghiên cứu.',
    },
    rankings: {
      title: 'Bảng xếp hạng',
      desc: 'Bảng xếp hạng công khai của trader trên Bitfinex, đồng bộ thời gian thực từ API chính thức.',
      footer: 'Nguồn dữ liệu: API công khai Bitfinex. Dữ liệu bảng xếp hạng có thể trễ. Không phải tư vấn đầu tư. Chỉ dành cho nghiên cứu.',
    },
    smartMoney: {
      title: 'Tín hiệu Smart Money',
      desc: 'Suy ra thiên hướng direction của smart money từ tương quan giữa unrealized PnL trên leaderboard và giá BTC.',
    },
  },
  dataCenterHero: {
    badge: 'Bitfinex Sentry Signal Hub',
    title: 'Bitfinex Sentry · Trung tâm tín hiệu',
    desc:
      'Trong thị trường nhiều nhiễu, hãy nhìn dòng tiền trước giá. Dựa trên dữ liệu công khai của Bitfinex, bảng này kết hợp vị thế, độ sâu, funding và thanh lý để phát hiện sớm diễn biến xu hướng và điểm ngoặt rủi ro.',
    sideTitle: 'Ghi chú dữ liệu',
    sideCards: ['Vị thế long/short và sổ lệnh giúp quan sát hướng vốn và áp lực ngắn hạn.', 'Premium và funding dùng để đo mức crowding và độ lệch tâm lý.', 'Thanh lý và dòng khớp lệnh giúp nhận diện tăng tốc biến động và vùng có thể đảo chiều.'],
    disclaimer: 'Toàn bộ dữ liệu đến từ API công khai Bitfinex và chỉ phục vụ mục đích nghiên cứu, học tập. Đây không phải tư vấn đầu tư.',
    cards: [
      { title: 'Nguồn dữ liệu', desc: 'Bitfinex Public API + Coinbase Spot, với chỉ số cốt lõi làm mới mỗi 2-10 giây.' },
      { title: 'Chỉ số cốt lõi', desc: 'Longs/shorts, premium, funding, độ sâu sổ lệnh, thanh lý và dòng khớp lệnh trực tiếp.' },
      { title: 'Mục đích sử dụng', desc: 'Quan sát vị thế cá voi và vi cấu trúc thị trường để hỗ trợ đánh giá rủi ro ngắn và trung hạn.' },
    ],
  },
  dashboard: {
    autoRefresh: 'Dữ liệu tự động làm mới mỗi 2-5 giây',
    realtimeConnected: 'Kết nối thời gian thực',
    connectingSource: 'Đang kết nối nguồn dữ liệu...',
    connectionFailed: 'Kết nối thất bại',
    signalNames: {
      position24h: 'Vị thế 24h',
      orderbook: 'Sổ lệnh',
      buyPressure: 'Áp lực mua',
      sellPressure: 'Áp lực bán',
      overheating: 'Quá nóng',
      bidAskRatio: 'Tỷ lệ bid/ask',
      highLow24h: 'Biên độ 24h',
    },
    metricCards: {
      btcLongs: 'Vị thế long BTC',
      ratio: 'Tỷ lệ long/short',
      premium: 'Premium',
      concentration: 'Mức tập trung funding',
      increasing: 'Đang tăng vị thế',
      decreasing: 'Đang giảm vị thế',
      steady: 'Ổn định',
      extremelyBullish: 'Long cực mạnh',
      normal: 'Bình thường',
      abnormal: 'Bất thường',
      highlyConcentrated: 'Tập trung cao',
    },
    bottomStats: {
      totalUsdFunding: 'Tổng funding USD',
      btcUsed: 'USD dùng cho BTC',
      btcShorts: 'Short BTC',
      ethBtcLongs: 'Long ETH/BTC',
    },
  },
})

function getNestedValue(tree: MessageTree, path: string): MessageValue | undefined {
  return path.split('.').reduce<MessageValue | undefined>((acc, key) => {
    if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return undefined
    return (acc as MessageTree)[key]
  }, tree)
}

function interpolate(template: string, vars?: Record<string, Primitive>) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? ''))
}

interface I18nContextValue {
  locale: Locale
  localeTag: string
  setLocale: (locale: Locale) => void
  t: (path: string, vars?: Record<string, Primitive>) => string
  tm: (path: string) => MessageValue
  languageLabel: (locale: Locale) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (stored && stored in MESSAGES) {
      setLocaleState(stored)
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = LOCALE_TAGS[locale]
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const tree = MESSAGES[locale] || MESSAGES[DEFAULT_LOCALE]
    return {
      locale,
      localeTag: LOCALE_TAGS[locale],
      setLocale: setLocaleState,
      t: (path, vars) => {
        const raw = getNestedValue(tree, path) ?? getNestedValue(MESSAGES[DEFAULT_LOCALE], path)
        if (typeof raw !== 'string') return path
        return interpolate(raw, vars)
      },
      tm: (path) => {
        const raw = getNestedValue(tree, path) ?? getNestedValue(MESSAGES[DEFAULT_LOCALE], path)
        return raw as MessageValue
      },
      languageLabel: (nextLocale) => LANGUAGE_LABELS[nextLocale],
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
