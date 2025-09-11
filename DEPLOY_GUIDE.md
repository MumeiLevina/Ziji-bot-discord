# Deploy Ziji Discord Bot lên Google Cloud

## Tổng quan
Hướng dẫn deploy Discord bot từ nhánh `test` lên Google Cloud Platform (Compute Engine).

## Điều kiện tiên quyết

### 1. Google Cloud Account
- Tài khoản Google Cloud Platform
- Billing được kích hoạt
- Project đã được tạo

### 2. VM Instance
Tạo VM instance với cấu hình tối thiểu:
- OS: Ubuntu 20.04 LTS
- Machine type: e2-medium (2 vCPU, 4GB RAM)
- Disk: 20GB SSD
- Firewall: Cho phép HTTP/HTTPS và custom port 2003

### 3. SSH Key
Thiết lập SSH key để kết nối:
```bash
# Tạo SSH key pair
ssh-keygen -t rsa -b 2048 -f ~/.ssh/google_cloud_key

# Upload public key lên VM
# Trong Google Cloud Console > Compute Engine > VM instances
# Click vào instance > Edit > SSH Keys > Add SSH Key
```

## Hướng dẫn Deploy

### Bước 1: Chuẩn bị VM
1. Tạo VM instance trên Google Cloud Console
2. Lưu địa chỉ IP external của VM
3. Thêm SSH key vào VM

### Bước 2: Cập nhật thông tin nhạy cảm
Trước khi deploy, bạn cần cập nhật file `.env` trên server với thông tin thật:

```bash
# Kết nối SSH vào VM
ssh xinloi@<VM_IP>

# Tạo file .env trong thư mục bot
nano ~/ziji-bot/.env
```

Nội dung file `.env`:
```env
# Token của bot (Required)
TOKEN="YOUR_BOT_TOKEN_HERE"

# URI cơ sở dữ liệu mongo (Optional)
MONGO="YOUR_MONGO_URI_HERE"

# OpenAI API Key
OPENAI_API_KEY="YOUR_OPENAI_API_KEY_HERE"

# Port API of bot
SERVER_PORT="2003"
```

### Bước 3: Chạy script deploy
Từ máy local của bạn:

```bash
# Chạy script deploy với địa chỉ IP của VM
./deploy_to_cloud.sh <VM_IP_ADDRESS>
```

Ví dụ:
```bash
./deploy_to_cloud.sh 34.102.136.180
```

## Quản lý Bot

### Kiểm tra trạng thái bot
```bash
ssh xinloi@<VM_IP> "pm2 status"
```

### Xem logs của bot
```bash
ssh xinloi@<VM_IP> "pm2 logs ziji-bot"
```

### Restart bot
```bash
ssh xinloi@<VM_IP> "pm2 restart ziji-bot"
```

### Stop bot
```bash
ssh xinloi@<VM_IP> "pm2 stop ziji-bot"
```

## Troubleshooting

### Bot không khởi động được
1. Kiểm tra logs: `pm2 logs ziji-bot`
2. Kiểm tra file .env có đầy đủ thông tin không
3. Kiểm tra kết nối MongoDB và OpenAI API

### Không thể kết nối SSH
1. Kiểm tra SSH key đã được thêm vào VM
2. Kiểm tra địa chỉ IP và username đúng
3. Kiểm tra firewall rules

### Bot bị crash
1. Xem logs chi tiết: `pm2 logs ziji-bot --lines 100`
2. Kiểm tra tài nguyên VM (CPU, RAM)
3. Kiểm tra kết nối mạng

## Cập nhật Bot

Để cập nhật bot với code mới từ nhánh test:

```bash
ssh xinloi@<VM_IP>
cd ~/ziji-bot
git pull origin test
npm install
pm2 restart ziji-bot
```

## Monitoring

### PM2 Monitoring
```bash
ssh xinloi@<VM_IP> "pm2 monit"
```

### System Resources
```bash
ssh xinloi@<VM_IP> "htop"
```

## Bảo mật

⚠️ **Quan trọng:**
- Không commit file `.env` vào Git
- Sử dụng SSH keys thay vì password
- Cấu hình firewall chỉ cho phép ports cần thiết
- Thường xuyên cập nhật system và dependencies

## Chi phí ước tính

- VM e2-medium: ~$30/tháng
- Lưu trữ 20GB: ~$2/tháng
- Network: ~$5/tháng
- **Tổng cộng: ~$37/tháng**
