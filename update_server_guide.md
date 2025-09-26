# Hướng dẫn cập nhật code lên SSH Server

## Cách 1: Pull từ GitHub Repository (Khuyến nghị)

### 1. Kết nối SSH đến server
```bash
ssh username@your-server-ip
```

### 2. Di chuyển đến thư mục bot
```bash
cd /path/to/your/bot/directory
```

### 3. Fetch các thay đổi mới từ remote
```bash
git fetch origin
```

### 4. Chuyển sang nhánh test
```bash
git checkout test
```

### 5. Pull các thay đổi mới nhất
```bash
git pull origin test
```

### 6. Cài đặt dependencies nếu cần
```bash
npm install
```

### 7. Restart bot
```bash
# Nếu sử dụng PM2
pm2 restart bot-name

# Hoặc nếu sử dụng systemctl
sudo systemctl restart your-bot-service

# Hoặc nếu chạy manual
# Tắt bot hiện tại (Ctrl+C) và chạy lại
node index.js
```

---

## Cách 2: Upload trực tiếp file (Backup method)

### 1. Tạo archive từ local
```bash
# Trên máy local (Windows)
tar -czf bot-update.tar.gz --exclude=node_modules --exclude=.git functions/ commands/ events/ utility/ config.js package.json
```

### 2. Upload lên server
```bash
scp bot-update.tar.gz username@your-server-ip:/path/to/your/bot/
```

### 3. Trên server, extract và thay thế
```bash
ssh username@your-server-ip
cd /path/to/your/bot/
tar -xzf bot-update.tar.gz
rm bot-update.tar.gz
```

### 4. Restart bot (như bước 7 ở trên)

---

## Cách 3: Sử dụng rsync (Đồng bộ file)

### Từ máy local, đồng bộ toàn bộ thư mục
```bash
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='jsons' /path/to/local/bot/ username@your-server-ip:/path/to/server/bot/
```

---

## Kiểm tra sau khi cập nhật

### 1. Kiểm tra log để đảm bảo bot chạy không lỗi
```bash
# Nếu dùng PM2
pm2 logs bot-name

# Hoặc xem log file
tail -f /path/to/log/file.log
```

### 2. Test các tính năng đã sửa
- Test phát nhạc từ link playlist
- Test game Blackjack (đã xóa chức năng cho vay)
- Test lệnh /rankbj

---

## Lưu ý quan trọng

1. **Backup trước khi cập nhật**: Luôn tạo backup của code cũ trước khi cập nhật
```bash
cp -r /path/to/bot /path/to/bot-backup-$(date +%Y%m%d)
```

2. **Kiểm tra dependencies**: Đảm bảo tất cả npm packages được cài đặt đúng

3. **Permissions**: Đảm bảo file permissions đúng sau khi upload
```bash
chmod -R 755 /path/to/bot
```

4. **Environment variables**: Đảm bảo các biến môi trường (token, database URL, etc.) vẫn đúng

5. **Database**: Nếu có thay đổi về database schema, cần migration