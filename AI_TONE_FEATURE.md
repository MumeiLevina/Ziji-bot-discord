# Tính năng Thay đổi Ngữ điệu Bot

## Tổng quan
Tính năng này cho phép người dùng thay đổi cách bot Discord trả lời, tạo ra trải nghiệm tương tác đa dạng và cá nhân hóa hơn.

## Các ngữ điệu có sẵn

### 1. Thân thiện (Friendly)
- **Mô tả**: Bot sẽ trả lời một cách thân thiện và gần gũi
- **Phong cách**: Sử dụng ngôn ngữ gần gũi, thêm emoji phù hợp để làm cho cuộc trò chuyện trở nên vui vẻ hơn

### 2. Chuyên nghiệp (Professional)
- **Mô tả**: Bot sẽ trả lời một cách chuyên nghiệp và trang trọng
- **Phong cách**: Sử dụng ngôn ngữ formal, cung cấp thông tin chính xác và chi tiết

### 3. Bình thường (Casual)
- **Mô tả**: Bot sẽ trả lời một cách bình thường, tự nhiên
- **Phong cách**: Trò chuyện như với bạn bè, không quá formal cũng không quá thân mật

### 4. Hài hước (Humorous)
- **Mô tả**: Bot sẽ trả lời một cách hài hước và dí dỏm
- **Phong cách**: Thêm chút hài hước vào câu trả lời để làm cho cuộc trò chuyện trở nên thú vị hơn

## Cách sử dụng

### 1. Thay đổi ngữ điệu
```
/settone tone:<tên_ngữ_điệu>
```

**Ví dụ:**
```
/settone tone:friendly
/settone tone:professional
/settone tone:casual
/settone tone:humorous
```

### 2. Xem ngữ điệu hiện tại
```
/toneinfo
```

### 3. Reset về mặc định
```
/resettone
```

## Lưu ý kỹ thuật

- Ngữ điệu được lưu riêng cho từng server và user
- Nếu không đặt ngữ điệu, bot sẽ sử dụng ngữ điệu mặc định từ cấu hình
- Thay đổi ngữ điệu sẽ ảnh hưởng đến tất cả phản hồi AI của bot trong tương lai
- Tính năng này hoạt động với tất cả lệnh AI của bot

## Cấu hình

Bạn có thể thay đổi ngữ điệu mặc định trong file `config.js`:

```javascript
DevConfig: {
    // ... các cấu hình khác
    defaultAITone: "friendly", // Có thể là: friendly, professional, casual, humorous
}
```

## Phát triển thêm

Tính năng này có thể được mở rộng bằng cách:
- Thêm nhiều ngữ điệu hơn
- Lưu trữ ngữ điệu trong database
- Tạo giao diện web để quản lý ngữ điệu
- Thêm tính năng học máy để tự động điều chỉnh ngữ điệu dựa trên người dùng
