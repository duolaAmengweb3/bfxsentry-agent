#!/bin/bash
# ============================================
# Bitfinex 哨兵 一键部署脚本
# 在服务器上执行: bash deploy.sh
# ============================================
set -e

SERVER_IP=$(hostname -I | awk '{print $1}')
APP_DIR="/opt/bfxsentry"
PORT=3000

echo "===== Bitfinex 哨兵 部署开始 ====="
echo "服务器 IP: $SERVER_IP"

# 1. 系统更新 + 安装依赖
echo ">>> [1/7] 安装系统依赖..."
apt-get update -qq
apt-get install -y -qq curl git nginx ufw > /dev/null 2>&1
echo "OK"

# 2. 安装 Node.js 20 LTS
echo ">>> [2/7] 安装 Node.js 20..."
if ! command -v node &> /dev/null || [[ $(node -v) != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y -qq nodejs > /dev/null 2>&1
fi
echo "Node $(node -v) / npm $(npm -v)"

# 3. 安装 PM2
echo ">>> [3/7] 安装 PM2..."
npm install -g pm2 > /dev/null 2>&1
echo "PM2 $(pm2 -v)"

# 4. 部署项目代码
echo ">>> [4/7] 部署项目代码..."
pm2 delete bfxsentry 2>/dev/null || true
rm -rf "$APP_DIR"
mkdir -p "$APP_DIR"

# 如果 tarball 存在就用它，否则提示手动上传
if [ -f /tmp/bfxsentry-deploy.tar.gz ]; then
  tar xzf /tmp/bfxsentry-deploy.tar.gz -C "$APP_DIR"
else
  echo "ERROR: /tmp/bfxsentry-deploy.tar.gz 不存在"
  echo "请先上传: scp bfxsentry-deploy.tar.gz root@$SERVER_IP:/tmp/"
  exit 1
fi

cd "$APP_DIR"

# 创建 .env.local
cat > .env.local << 'EOF'
NEXT_PUBLIC_APP_URL=http://SERVER_IP_PLACEHOLDER:3000
EOF
sed -i "s/SERVER_IP_PLACEHOLDER/$SERVER_IP/" .env.local

echo "OK"

# 5. 安装依赖 + 构建
echo ">>> [5/7] 安装依赖并构建 (需要几分钟)..."
npm install --production=false 2>&1 | tail -3
npm run build 2>&1 | tail -5
echo "构建完成"

# 6. PM2 启动
echo ">>> [6/7] PM2 启动应用..."
pm2 start npm --name bfxsentry -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true
sleep 3
pm2 list
echo "OK"

# 7. 配置 Nginx 反向代理
echo ">>> [7/7] 配置 Nginx..."
cat > /etc/nginx/sites-available/bfxsentry << NGINX
server {
    listen 80;
    server_name $SERVER_IP;

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/bfxsentry /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
echo "OK"

# 8. 防火墙
echo ">>> 开放防火墙端口..."
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
echo "OK"

echo ""
echo "============================================"
echo "  Bitfinex 哨兵 部署完成!"
echo "============================================"
echo "  访问地址: http://$SERVER_IP"
echo "  PM2 管理: pm2 list / pm2 logs bfxsentry"
echo "  Nginx:    systemctl status nginx"
echo "============================================"
