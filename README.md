# 🎵 Company Music Player

Web app nghe nhạc nội bộ công ty — quản lý playlist qua Google Sheet, stream audio từ YouTube không quảng cáo.

## ✨ Tính năng

- **2 chế độ phát:** Round-Robin (luân phiên) hoặc Burst (nhiều bài liên tiếp/người)
- **Filter theo người:** Bật/tắt từng nhân viên bằng 1 click
- **Resume:** Tự động nhớ vị trí dừng, tiếp tục khi mở lại
- **Không quảng cáo:** Stream audio trực tiếp qua `yt-dlp`
- **Quản lý đơn giản:** Cập nhật playlist qua Google Sheet, không cần code

## 📋 Yêu cầu

- **Node.js** >= 18
- **yt-dlp** (hướng dẫn cài bên dưới)

## 🚀 Cài đặt

### 1. Clone repo

```bash
git clone https://github.com/your-username/company-music-player.git
cd company-music-player
```

### 2. Cài dependencies

```bash
npm install
```

### 3. Cài dependencies

```bash
npm install
```

`yt-dlp.exe` sẽ được tự động tải về.

### 4. Chạy app

**Cách 1: Desktop App (Khuyến nghị)**

Double-click file **`start-app.bat`** hoặc chạy:

```bash
npm start
```

→ App sẽ mở trong cửa sổ riêng, không cần browser.

**Cách 2: Web Browser**

```bash
npm run dev
```

→ Mở browser vào: **http://localhost:7777**

## 📊 Cấu hình Google Sheet

### Format Sheet

Tạo Google Sheet với format:

| STT | Tên    | Bài hát       | Ca sĩ      | Link                          |
|-----|--------|---------------|------------|-------------------------------|
| 1   | AnhTD  | Người Và Ta   | Rhymastic  | https://youtube.com/watch?v=... |
| 2   | AnhTD  | Tally         | BLACKPINK  | https://youtu.be/...          |
| 3   | MinhNT | Shape of You  | Ed Sheeran | https://youtube.com/watch?v=... |

### Publish Sheet

1. **File** → **Share** → **Publish to web**
2. Chọn **Entire document** + **CSV**
3. Click **Publish**
4. Copy URL → paste vào web app

**Lưu ý:** 
- Tên nhân viên phải viết nhất quán (VD: `AnhTD` ≠ `Anh TD`)
- Link YouTube paste nguyên, web tự xử lý mọi dạng URL
- Không giới hạn số bài/người

## 🎮 Hướng dẫn sử dụng

### Load Playlist
1. Paste Google Sheet URL vào ô input
2. Click **Load** (hoặc nhấn Enter)
3. Click 💾 để lưu URL cho lần sau

### Chế độ phát

**Round-Robin:** Mỗi người 1 bài, xoay vòng
```
AnhTD[1] → MinhNT[1] → HoaLT[1] → AnhTD[2] → ...
```

**Burst:** Phát N bài liên tiếp/người (chọn 2–5 bài)
```
AnhTD[1,2,3] → MinhNT[1,2,3] → HoaLT[1,2,3] → ...
```

### Filter
- Click vào chip tên người để bật/tắt
- Playlist tự động rebuild ngay lập tức
- Phải giữ ít nhất 1 người

### Resume
- Web tự lưu vị trí mỗi 5 giây
- Mở lại → hỏi "Tiếp tục?"
- Click ✅ để resume hoặc 🔄 để phát từ đầu

## 🛠️ Tech Stack

| Layer | Tech | Lý do |
|-------|------|-------|
| Frontend | HTML/CSS/JS | Không cần build, dễ maintain |
| Backend | Node.js + Express | Đơn giản, deployment linh hoạt |
| Audio | yt-dlp | Robust, bypass YouTube restrictions |
| Data | Google Sheet CSV | Không cần database, ai cũng dùng được |

## 📁 Cấu trúc project

```
company-music-player/
├── api/
│   └── stream.js          # API endpoint stream audio
├── public/
│   └── index.html         # Frontend UI
├── server.js              # Express server
├── package.json
├── vercel.json            # Vercel deployment config
└── yt-dlp.exe             # yt-dlp binary (gitignored)
```

## 🚀 Chạy Desktop App

### Windows

Double-click file **`start-app.bat`** hoặc chạy lệnh:

```bash
npm start
```

App sẽ mở trong cửa sổ riêng, tự động load nhạc từ Google Sheet.

### Chạy server web (không cần Electron)

```bash
npm run dev
```

Mở browser: **http://localhost:7777**

## 🔧 Troubleshooting

### "Failed to find any playable formats"
- `yt-dlp` cần update: tải binary mới nhất từ GitHub releases
- YouTube có thể đã thay đổi API → đợi `yt-dlp` update

### Video bị skip
- Video private/deleted → bình thường, web tự skip
- Check terminal log để xem lỗi chi tiết

### Autoplay bị block
- Click nút "Bắt đầu" để unlock audio
- Browser policy: cần user interaction trước khi phát

## 📝 License

MIT License — thoải mái sử dụng nội bộ công ty.

---

**LotusQuant Internal** | Made with ❤️ for the team
