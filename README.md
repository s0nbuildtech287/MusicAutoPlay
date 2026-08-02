# MyMusic Player 🚀
> Tốt hơn mỗi ngày với âm nhạc chất lượng và sự kết nối đồng đội.

MyMusic Player là ứng dụng nghe nhạc nội bộ cho phép các thành viên yêu cầu bài hát yêu thích từ YouTube, lên lịch phát tự động và nghe nhạc thông qua hàng đợi thông minh, công bằng. Ứng dụng tích hợp Google Sheets để quản lý danh sách phát và ứng dụng Google Apps Script cho phép đặt nhạc từ xa cực kỳ tiện lợi.

---

## 🌟 Chức năng nổi bật

### 1. Quản lý danh sách phát linh hoạt (Playlist Management)
* Tích hợp Google Sheets: Tự động tải danh sách bài hát từ đường dẫn CSV xuất bản công khai của Google Sheet.
* Bộ lọc thành viên: Bật hoặc tắt phát nhạc theo tên người yêu cầu một cách nhanh chóng.
* Hai chế độ phát nhạc:
  * Chế độ luân phiên (Round-Robin): Mỗi người phát 1 bài lần lượt, đảm bảo tính công bằng cao nhất.
  * Chế độ liên tục (Burst): Phát liên tiếp từ 2 đến 5 bài của cùng một người trước khi chuyển sang người tiếp theo.

### 2. Trình phát nhạc nội bộ (Player Controls)
* Khởi chạy trình phát: Phát/Tạm dừng nhạc, chuyển bài kế tiếp hoặc bài trước đó, thay đổi tiến độ phát trực quan.
* Bộ nhớ vị trí: Tự động lưu và phát tiếp tục từ bài hát và vị trí giây dừng gần nhất khi khởi động lại ứng dụng.
* Công cụ streaming thông qua yt-dlp: Lấy luồng âm thanh trực tiếp từ YouTube mà không bị giới hạn lưu lượng hay cần cài đặt khóa API của YouTube.

### 3. Đặt nhạc từ xa (Public Music Order)
* Google Apps Script Web App: Đồng nghiệp chỉ cần mở một liên kết web công khai trên điện thoại hoặc máy tính để gửi yêu cầu bài hát (nhập link YouTube) mà không cần chung mạng LAN với máy chủ phát nhạc.
* Hàng đợi đồng bộ: Desktop app tự động đồng bộ danh sách nhạc yêu cầu theo thời gian thực từ Google Sheets hàng đợi trung gian.
* Thuật toán sắp xếp hàng đợi chống chiếm sóng:
  * Tự động ưu tiên phát nhạc order trước, khi hết nhạc order sẽ tự động chuyển về nhạc có sẵn trên Google Sheet.
  * Giới hạn tối đa phát 2 bài liên tiếp của cùng một người gửi order (nếu gửi dồn dập, hệ thống sẽ tự động chèn xen kẽ bài hát của người khác).
  * Sử dụng yt-dlp tự động nhận diện và chuyển đổi tiêu đề bài hát tiếng Việt chuẩn mã UTF-8.

### 4. Bảng vàng âm nhạc & Thống kê (Leaderboard & Stats)
* Thống kê hiệu suất: Đếm tổng số bài đã chạy, thống kê tỷ lệ phần trăm giữa nhạc có sẵn (Google Sheet) và nhạc yêu cầu thêm (Order).
* Top Chiếm Sóng: Bảng xếp hạng Top 5 thành viên gửi yêu cầu bài hát nhiều nhất được phát kèm đĩa xoay mini của thành viên đó.
* Nhật ký lịch sử: Hiển thị danh sách 10 bài hát đã phát gần nhất kèm mốc thời gian tương đối (ví dụ: vừa xong, 5 phút trước...).
* Reset dữ liệu nhanh: Lưu dữ liệu vĩnh viễn trong LocalStorage và cho phép admin xóa lịch sử bất cứ lúc nào.

### 5. Chức năng giải trí & Tiện ích (Fun Features)
* Chế độ tiệc tùng (Party Mode): Bật hiệu ứng pháo hoa giấy (Confetti) rơi lung linh kết hợp đĩa nhạc xoay tốc độ cao và đổi màu nền cầu vồng liên tục.
* Thông báo hệ thống: Gửi thông báo trực tiếp trên màn hình desktop Windows/Mac khi ứng dụng chuyển bài hát mới.
* Danh hiệu kỷ luật (Achievements): Mở khóa các huy hiệu âm nhạc thú vị khi nghe đạt mốc 1, 10, 50, 100 bài hát.
* Phím tắt khẩn cấp Boss Mode: Nhấn Ctrl+B để lập tức ẩn giao diện phát nhạc, chuyển sang màn hình giả lập bảng tính Excel công việc và tự động tạm dừng phát nhạc ngay.
* Trứng phục sinh (Easter Eggs): Nhấp logo 10 lần liên tục hoặc nhập mã Konami huyền thoại để kích hoạt các hiệu ứng đặc biệt ẩn.

---

## ⌨️ Bảng phím tắt ứng dụng

| Phím tắt | Chức năng |
|---|---|
| Ctrl + F | Mở ô tìm kiếm bài hát nhanh |
| Space | Phát hoặc tạm dừng bài hát |
| Arrow Right (Phím mũi tên phải) | Chuyển sang bài hát tiếp theo |
| Arrow Left (Phím mũi tên trái) | Quay lại bài hát phía trước |
| Arrow Up / Down (Mũi tên lên/xuống) | Tăng / giảm âm lượng phát nhạc (mỗi lần tăng giảm 10%) |
| Ctrl + B | Kích hoạt Boss Mode (Ẩn nhanh màn hình player, hiện file Excel giả lập) |
| Esc | Xóa bộ lọc hoặc đóng ô tìm kiếm nhanh |

---

## 🛠️ Yêu cầu cài đặt hệ thống

* Node.js phiên bản >= 16.0.0
* Hệ điều hành Windows (khuyên dùng) hoặc macOS/Linux

---

## 🚀 Hướng dẫn khởi chạy & Phát triển (dành cho Developer)

### Bước 1: Cài đặt mã nguồn và thư viện phụ thuộc
Di chuyển vào thư mục dự án và chạy lệnh sau:
```bash
npm install
```
Sau khi quá trình cài đặt thư viện Node kết thúc, hệ thống sẽ tự động gọi tập tin `download-ytdlp.js` để tải công cụ trích xuất âm thanh `yt-dlp.exe` phiên bản mới nhất về thư mục gốc của bạn.

### Bước 2: Chạy dự án ở chế độ phát triển
Bạn có hai tùy chọn khởi chạy:

* Lựa chọn 1: Chạy dưới dạng ứng dụng Web truyền thống trên trình duyệt:
  ```bash
  npm run dev
  ```
  Truy cập liên kết [http://localhost:8888](http://localhost:8888) trên trình duyệt để sử dụng.

* Lựa chọn 2: Khởi chạy ứng dụng Desktop hoàn chỉnh (sử dụng Electron):
  ```bash
  npm start
  ```
  Trình mô phỏng Electron sẽ tự động khởi động giao diện máy nghe nhạc gọn gàng độc lập.

### Bước 3: Đóng gói ứng dụng thành file cài đặt Windows (.exe)
Nếu muốn build bộ cài đặt gọn nhẹ để chia sẻ cho các máy tính khác trong văn phòng:
```bash
npm run build
```
Bộ cài đặt cài đặt tự động `MyMusic Player Setup 1.1.0.exe` (dung lượng khoảng 120MB) sẽ được tạo ra tại thư mục `dist/`.

---

## 📁 Cấu trúc thư mục dự án

```text
├── api/
│   └── stream.js            # API endpoint pipe luồng âm thanh YouTube trực tiếp về máy trạm
├── google-apps-script/      # Code Google Apps Script phục vụ web nhận order bài hát từ xa
├── people/                  # Thư mục chứa hình ảnh đại diện của 16 thành viên
├── public/
│   ├── index.html           # Giao diện HTML chính của trình phát nhạc
│   ├── search-feature.js    # Module xử lý tìm kiếm bài hát thời gian thực
│   ├── fun-features.js      # Module hiệu ứng đặc biệt (Party Mode, Boss Mode, Achievements...)
│   └── favicon.ico          # Icon hiển thị ứng dụng
├── server.js                # Server phụ trợ Node.js + Express cổng 8888
├── electron-main.js         # Core cấu trúc khởi chạy Electron và tích hợp hàng đợi order từ Google Sheet
├── download-ytdlp.js        # Script tự động download bộ giải mã âm thanh yt-dlp
└── package.json             # Danh sách thư viện và cấu hình electron-builder đóng gói .exe
```

---

## 📊 Định dạng Google Sheet Danh sách phát mặc định

Để liên kết playlist của bạn vào ứng dụng, Google Sheet cần được cấu hình công khai (Anyone with link can view) và có các tiêu đề cột sau ở dòng đầu tiên:

| STT | Tên | Tên bài hát | Ca sĩ | URL YouTube |
|---|---|---|---|---|
| 1 | SonBX | Lạc Trôi | Sơn Tùng M-TP | https://www.youtube.com/watch?v=Llw9Q6akRo4 |
| 2 | AnhTD | Em Của Ngày Hôm Qua | Sơn Tùng M-TP | https://www.youtube.com/watch?v=525t587t1X0 |

* Lưu ý: Cột Tên phải khớp chính xác với tên file ảnh định dạng `.jpg` hoặc `.png` đặt trong thư mục `people/` để đĩa nhạc tròn có thể hiển thị chính xác ảnh đại diện của người yêu cầu khi phát bài hát của họ.

---

## ❓ Xử lý một số sự cố thường gặp (Troubleshooting)

### 1. Trình phát bị báo lỗi cổng 8888 hoặc 7777 bị chiếm dụng (EADDRINUSE)
Nguyên nhân là do có một ứng dụng khác hoặc một instance của MyMusic đang chạy ngầm chiếm cổng. Xử lý bằng cách mở Command Prompt/PowerShell và nhập:
```bash
# Tìm mã tiến trình (PID) đang chạy ở cổng 8888
netstat -ano | findstr :8888

# Tắt tiến trình đó đi
taskkill /F /PID <MÃ_PID_TÌM_ĐƯỢC>
```

### 2. Bài hát YouTube tải chậm hoặc không phản hồi
* Hãy kiểm tra lại kết nối đường truyền Internet của bạn.
* Đảm bảo tệp tin `yt-dlp.exe` trong thư mục gốc đã được tải đầy đủ. Bạn có thể tải lại thủ công bằng cách chạy lệnh `node download-ytdlp.js`.

---
Chúc các bạn có những giờ làm việc hiệu quả và tràn đầy năng lượng cùng MyMusic Player! 🎵
