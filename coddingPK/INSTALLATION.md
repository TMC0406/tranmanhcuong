# Hướng dẫn cài đặt và chạy Mini PK Multiplayer

## Yêu cầu hệ thống
- Trình duyệt web hiện đại (Chrome, Firefox, Edge, Safari)
- Kết nối Internet để kết nối với Firebase
- Node.js và npm (nếu muốn phát triển)

## Cách chạy game

### Phương pháp 1: Sử dụng trình duyệt trực tiếp
1. Mở thư mục `coddingPK` trong máy tính của bạn
2. Mở file `index.html` bằng trình duyệt web

### Phương pháp 2: Sử dụng máy chủ HTTP đơn giản
1. Mở terminal hoặc command prompt
2. Di chuyển đến thư mục chứa thư mục `coddingPK`:
   ```
   cd đường/dẫn/đến/thư/mục/chứa/coddingPK
   ```
3. Chạy một máy chủ HTTP đơn giản:
   - Python 3:
     ```
     python3 -m http.server 8000
     ```
   - Python 2:
     ```
     python -m SimpleHTTPServer 8000
     ```
   - Node.js (cần cài http-server):
     ```
     npx http-server -p 8000
     ```
4. Mở trình duyệt và truy cập: `http://localhost:8000/coddingPK/`

### Phương pháp 3: Sử dụng VS Code Live Server
1. Cài đặt extension "Live Server" trong VS Code
2. Mở thư mục `coddingPK` trong VS Code
3. Nhấn chuột phải vào file `index.html` và chọn "Open with Live Server"

## Cấu hình Firebase (cho nhà phát triển)

Nếu bạn muốn sử dụng Firebase của riêng bạn:

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Tạo dự án mới
3. Trong mục "Project settings", tìm phần "Your apps" và chọn thêm ứng dụng web
4. Sao chép thông tin cấu hình Firebase
5. Mở file `static/js/firebase/firebase-config.js` và thay thế cấu hình hiện tại bằng cấu hình của bạn:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     databaseURL: "YOUR_DATABASE_URL",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

## Cấu trúc dự án

```
coddingPK/
├── index.html          # Tệp HTML chính
├── static/             # Thư mục tài nguyên tĩnh
│   ├── css/            # Tệp CSS theo module
│   │   ├── style.css   # CSS gốc
│   │   ├── base.css    # Kiểu cơ bản
│   │   ├── main.css    # Import và tổ chức CSS
│   │   └── animations.css # Định nghĩa hoạt ảnh
│   └── js/             # Module JavaScript
│       ├── main.js     # Điểm nhập chính
│       ├── debug.js    # Công cụ debug
│       ├── auth/       # Xác thực người dùng
│       │   └── auth.js # Chức năng xác thực
│       ├── config/     # Cấu hình game
│       │   └── game-config.js # Hằng số và cấu hình game
│       ├── firebase/   # Tích hợp Firebase
│       │   ├── firebase-config.js # Cấu hình Firebase
│       │   └── database.js # Thao tác cơ sở dữ liệu
│       ├── ui/         # Giao diện người dùng
│       │   ├── panels.js # Quản lý panel
│       │   └── rooms-ui.js # Chức năng UI phòng
│       └── game/       # Cơ chế game
│           ├── game.js # Điều phối game chính
│           ├── bullets.js # Cơ chế đạn
│           ├── game-loop.js # Vòng lặp game chính
│           ├── items.js # Cơ chế vật phẩm
│           ├── player.js # Chức năng người chơi
│           ├── renderer.js # Render game
│           └── rooms.js # Quản lý phòng
```

## Phát triển thêm

### Thêm nhân vật mới
1. Thêm định nghĩa nhân vật trong `static/js/config/game-config.js`
2. Thêm CSS cho nhân vật mới
3. Cập nhật UI chọn nhân vật trong `index.html`

### Thêm vũ khí mới
1. Thêm định nghĩa vũ khí trong `static/js/config/game-config.js`
2. Thêm logic đặc biệt cho vũ khí trong `static/js/game/bullets.js` nếu cần
3. Cập nhật UI chọn vũ khí trong `index.html`

### Thêm bản đồ mới
1. Thêm định nghĩa bản đồ trong `static/js/config/game-config.js`
2. Thêm CSS cho bản đồ mới nếu cần
3. Cập nhật UI chọn bản đồ trong `index.html`
