# 🎵 Lotusquant Music Player

**Music Player nội bộ cho LotusQuant Company**

Ứng dụng nghe nhạc theo yêu cầu của các thành viên, hỗ trợ quản lý playlist từ Google Sheet, với các tính năng vui như Party Mode, Search, Achievements và nhiều hơn nữa!

---

## 🚀 Cài đặt & Sử dụng

### 📦 Cách 1: Sử dụng file EXE (Recommended cho User)

#### Tải về:
- File: `Lotusquant Music Setup 1.2.0.exe`
- Size: ~120 MB

#### Cài đặt:
1. Double-click file `.exe`
2. Chọn thư mục cài đặt
3. Chờ cài đặt hoàn tất
4. Shortcut sẽ xuất hiện trên Desktop
5. Double-click shortcut để mở app

#### Sử dụng:
- App sẽ tự động load playlist từ Google Sheet của công ty
- Click Play ▶️ để bắt đầu nghe nhạc
- Không cần internet sau khi đã load playlist

---

### 💻 Cách 2: Clone Project (Dành cho Developer)

#### Yêu cầu:
- Node.js v16+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))

#### Các bước:

1️⃣ **Clone repository:**
```bash
git clone <repository-url>
cd MusicLotusquant
```

2️⃣ **Cài đặt dependencies:**
```bash
npm install
```
*Note: Script sẽ tự động download yt-dlp.exe*

3️⃣ **Chạy app:**

**Development mode (Browser):**
```bash
npm run dev
```
→ Mở browser: http://localhost:7777

**Desktop app (Electron):**
```bash
npm start
```
→ App Electron tự động mở

4️⃣ **Build installer (Optional):**
```bash
npm run build
```
→ File .exe sẽ được tạo trong folder `dist/`

---

## 🎯 Hướng dẫn sử dụng

### Bước 1: Load Playlist
- URL Google Sheet đã được tự động load
- Hoặc dán URL mới → Click **Load**

### Bước 2: Chọn Filter
- Click vào tên người để bật/tắt
- Click **"🎶 Tổng hợp"** để chọn tất cả/không chọn ai

### Bước 3: Play Music
- Click **▶️** để bắt đầu
- Hoặc click vào bài bất kỳ trong playlist

### Bước 4: Search Bài (NEW!)
- Nhấn **Ctrl + F** hoặc click vào ô search
- Gõ tên bài / ca sĩ / người request
- Click vào kết quả để phát ngay

---

## ⌨️ Phím tắt

| Phím | Chức năng |
|------|-----------|
| `Ctrl + F` | 🔍 Search bài |
| `Space` | ⏯️ Play/Pause |
| `→` | ⏭️ Next |
| `←` | ⏮️ Previous |
| `↑` / `↓` | 🔊 Volume ±10% |
| `Ctrl + B` | 🕶️ Boss Mode (ẩn app) |
| `Esc` | ❌ Clear search |

---

## 🎉 Fun Features

### 🎊 Party Mode
Click nút **"🎉 Party Mode"** để bật:
- 🎆 Confetti bay xuống
- 🌈 Background đổi màu
- 💫 Đĩa quay nhanh hơn
- ✨ Hiệu ứng liên tục

### 🔔 Desktop Notifications
- Tự động thông báo khi bài mới phát
- Hiển thị: Tên bài - Ca sĩ - Người request

### 🏆 Achievement System
Unlock badges khi đạt mốc:
- 🎵 **First Song**: Bài đầu tiên
- 🔥 **Music Fan**: 10 bài
- 🌟 **Music Lover**: 50 bài
- 👑 **Music Master**: 100 bài

### 🕶️ Boss Mode
- Nhấn **Ctrl + B** → Giả lập Excel ngay lập tức
- Tự động pause nhạc
- Nhấn lại để quay lại app

### 🎮 Easter Eggs
1. **Click logo 10 lần** (trong 2 giây) → Rainbow Mode + Confetti
2. **Konami Code**: `↑↑↓↓←→←→BA` → Party Mode activated!

---

## 🔍 Search Feature

### Tìm kiếm nhanh:
- **Ctrl + F** để mở search
- Gõ tên bài, ca sĩ, hoặc người request
- Kết quả hiện realtime
- Click bài để phát ngay

### Clear search:
- Click nút **✕**
- Hoặc nhấn **Esc**
- Hoặc xóa hết text

---

## 📊 Google Sheet Format

### Cấu trúc Sheet:

| STT | Tên | Tên bài hát | Ca sĩ | URL YouTube |
|-----|-----|-------------|-------|-------------|
| 1 | SonBX | Lạc Trôi | Sơn Tùng M-TP | https://youtube.com/watch?v=... |
| 2 | AnhTD | Em Của Ngày Hôm Qua | Sơn Tùng M-TP | https://youtube.com/watch?v=... |

### Lưu ý:
- Cột URL phải là link YouTube hợp lệ
- Tên phải khớp với tên file ảnh trong folder `people/` (nếu có)
- Sheet phải là Public hoặc "Anyone with link can view"

---

## 🐛 Troubleshooting

### App không mở được?
- Kiểm tra Windows Defender/Antivirus
- Click chuột phải → Run as Administrator

### Bài hát không phát?
- Kiểm tra kết nối internet
- Kiểm tra URL YouTube còn hoạt động
- Thử skip sang bài khác

### Port 7777 bị chiếm?
```bash
# Tìm process
netstat -ano | findstr :7777

# Kill process
taskkill /F /PID <PID>
```

### Search không hoạt động?
- F5 để refresh
- Clear browser cache
- Kiểm tra Console (F12) xem có lỗi không

---

## 🔧 Build từ Source

### Requirements:
- Node.js v16+
- npm hoặc yarn

### Build Steps:

1. Clone & Install:
```bash
git clone <repo-url>
cd MusicLotusquant
npm install
```

2. Build installer:
```bash
npm run build
```

3. Output:
- File: `dist/Lotusquant Music Setup 1.2.0.exe`
- Size: ~120 MB

### Build Config:
- File: `package.json` → `build` section
- ASAR: Disabled (để tránh lỗi require)
- Icon: `public/favicon.ico`
- Target: NSIS (Windows installer)

---

## 📁 Project Structure

```
MusicLotusquant/
├── public/
│   ├── index.html           # Main UI
│   ├── search-feature.js    # Search module
│   ├── fun-features.js      # Fun features module
│   ├── favicon.png          # Logo
│   └── favicon.ico          # Windows icon
├── people/                  # Member photos (16 images)
├── api/
│   └── stream.js            # YouTube streaming API
├── server.js                # Express server
├── electron-main.js         # Electron main process
├── package.json             # Dependencies & scripts
└── yt-dlp.exe              # YouTube downloader (auto-downloaded)
```

---

## 🎨 Features Overview

### Core Features:
✅ Round-Robin / Burst playback modes  
✅ Google Sheet CSV integration  
✅ Member filter system  
✅ Resume playback  
✅ Progress bar with seek  
✅ Volume control  
✅ Playlist management  
✅ Member photos on spinning disc  

### Fun Features:
✅ Realtime search (Ctrl+F)  
✅ Party Mode with confetti  
✅ Desktop notifications  
✅ Boss Mode (Ctrl+B)  
✅ Achievement system  
✅ Easter eggs  
✅ Keyboard shortcuts  

---

## 🔐 Security & Privacy

- ✅ Chỉ sử dụng nội bộ trong công ty
- ✅ Không thu thập dữ liệu người dùng
- ✅ Không gửi dữ liệu ra ngoài
- ✅ LocalStorage chỉ lưu: playlist state, volume, progress
- ✅ Không có tracking/analytics

---

## 📄 License

**Internal Use Only** - LotusQuant Company  
© 2026 LotusQuant. All rights reserved.

---

## 👥 Contributors

- **SonBX** - Lead Developer
- **LotusQuant Team** - Testing & Feedback

---

## 📞 Support

Nếu gặp vấn đề, liên hệ:
- **Email**: [IT Support Email]
- **Slack**: #lotusquant-music-player
- **GitHub Issues**: [Repository Issues]

---

## 🚀 Version History

### v1.2.0 (Current - 2026-06-05)
- ✨ Added: Search feature (Ctrl+F)
- ✨ Added: Fun features package
- 🎨 Improved: Modular architecture
- 📚 Docs: Complete documentation

### v1.1.0 (2026-06-04)
- ✨ Added: Member photos on disc
- 🏗️ Added: Desktop app builder
- 🎨 Improved: Filter logic

### v1.0.0 (2026-06-03)
- 🎉 Initial release
- ✅ Core player functionality
- ✅ Google Sheet integration
- ✅ YouTube streaming

---

**🎵 Enjoy your music! 🎶**
