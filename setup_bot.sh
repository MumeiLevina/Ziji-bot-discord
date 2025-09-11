#!/bin/bash

# Script cài đặt cho Discord bot
echo "===== Bắt đầu cài đặt Ziji Discord Bot ====="

# Cập nhật hệ thống
echo "Cập nhật hệ thống..."
sudo apt-get update
sudo apt-get upgrade -y

# Cài đặt các công cụ cần thiết
echo "Cài đặt các công cụ cần thiết..."
sudo apt-get install -y git curl wget build-essential ffmpeg

# Cài đặt Node.js và npm
echo "Cài đặt Node.js và npm..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Tạo thư mục cho bot và đảm bảo quyền truy cập
echo "Tạo thư mục cho bot..."
mkdir -p ~/ziji-bot

# Clone repository vào thư mục đích (nhánh test)
echo "Clone repository từ nhánh test..."
git clone -b test https://github.com/MumeiLevina/Ziji-bot-discord.git ~/ziji-bot

# Vào thư mục và cài đặt dependencies
echo "Cài đặt dependencies..."
cd ~/ziji-bot
npm install

# Tạo file .env với nội dung phù hợp
echo "Tạo file .env..."
cat > ~/ziji-bot/.env << EOL
# Token của bot (Required) - Thay YOUR_BOT_TOKEN_HERE bằng token thật
TOKEN="YOUR_BOT_TOKEN_HERE"

# URI cơ sở dữ liệu mongo (Optional) - Thay YOUR_MONGO_URI_HERE bằng URI thật
MONGO="YOUR_MONGO_URI_HERE"

# OpenAI API Key - Thay YOUR_OPENAI_API_KEY_HERE bằng key thật
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# Port API of bot
SERVER_PORT="2003"
EOL

# Cài đặt PM2 để quản lý process
echo "Cài đặt PM2..."
sudo npm install -g pm2

# Kiểm tra cấu trúc thư mục
echo "Kiểm tra cấu trúc thư mục..."
ls -la ~/ziji-bot

# Khởi chạy bot với PM2
echo "Khởi chạy bot..."
cd ~/ziji-bot
pm2 start index.js --name ziji-bot

# Thiết lập để bot tự động chạy khi VM khởi động lại
echo "Thiết lập để bot tự động chạy khi VM khởi động lại..."
pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME
pm2 save

echo "===== Hoàn tất cài đặt Ziji Discord Bot ====="
echo "Kiểm tra trạng thái bot:"
pm2 status
