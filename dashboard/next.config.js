const { ProxyAgent, setGlobalDispatcher } = require('undici')

// 让 Node.js fetch 自动走系统代理
const proxyUrl = process.env.http_proxy || process.env.HTTP_PROXY
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl))
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
