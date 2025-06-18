# Multiplayer Game

## Cài đặt

1. Clone repository này
2. Vào thư mục coddingPK
3. Sao chép file `firebase-config.example.js` thành `firebase-config.js`
4. Thay thế các giá trị trong `firebase-config.js` với thông tin Firebase của bạn

## Cấu hình Firebase

Để có thể chạy game, bạn cần:
1. Tạo project trên Firebase Console
2. Kích hoạt Authentication và Realtime Database
3. Điền thông tin cấu hình Firebase vào file `firebase-config.js`

## Bảo mật
- File `firebase-config.js` đã được thêm vào .gitignore để không push lên repository
- Không bao giờ commit file chứa thông tin nhạy cảm lên git