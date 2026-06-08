# 📖 Project Information - Lotusquant Music Player

## 🎯 Giới thiệu dự án

**Lotusquant Music Player** là ứng dụng nghe nhạc nội bộ được phát triển riêng cho LotusQuant Company, cho phép các thành viên request bài hát yêu thích và nghe theo hàng đợi công bằng.

---

## 💡 Mục đích

### Vấn đề:
- Các thành viên muốn nghe nhạc trong giờ làm việc
- Cần hệ thống công bằng để mọi người đều có cơ hội nghe bài của mình
- Quản lý playlist phức tạp nếu dùng YouTube trực tiếp
- Cần tích hợp với công cụ quản lý (Google Sheet)

### Giải pháp:
✅ Music player với playlist từ Google Sheet  
✅ 2 chế độ phát: Round-Robin (luân phiên) và Burst (liên tục)  
✅ Filter theo người request  
✅ Search nhanh bài hát  
✅ Desktop app, không cần browser  
✅ Fun features (Party Mode, Achievements, Easter Eggs)  
✅ Tính năng Order Nhạc qua Apps Script public: Đồng nghiệp mở link Google Apps Script để gửi yêu cầu bài hát YouTube.  

---

## 🏗️ Kiến trúc Technical

### Stack:
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **Desktop**: Electron
- **Streaming**: yt-dlp (YouTube audio extractor)
- **Storage**: LocalStorage (client-side)
- **Data Source**: Google Sheets (CSV export)

### Architecture:

```
┌───────────────────────────────────────────┐
│       Electron Window (Desktop App)       │
│  ┌─────────────────────────────────────┐  │
│  │  Browser (Chromium)                 │  │
│  │  ┌───────────────────────────────┐  │  │
│  │  │  Frontend (HTML/JS)           │  │  │
│  │  │  - index.html                 │  │  │
│  │  │  - search-feature.js          │  │  │
│  │  │  - fun-features.js            │  │  │
│  │  └──────────────┬────────────────┘  │  │
│  └─────────────────┼───────────────────┘  │
└────────────────────┼──────────────────────┘
                     │ HTTP (localhost:7777)
                     ↓
┌───────────────────────────────────────────┐
│       Express Server (Node.js)            │
│  ┌─────────────────────────────────────┐  │
│  │  /api/stream?id=VIDEO_ID            │  │
│  │  /api/order (POST - submit request) │  │
│  │  /api/orders (GET - current queue)  │  │
│  │  /api/orders/next (GET next song)   │  │
│  │  → yt-dlp → YouTube audio stream     │  │
│  └─────────────────────────────────────┘  │
│  ┌─────────────────────────────────────┐  │
│  │  Static files (/public)             │  │
│  └───────────▲─────────────────────────┘  │
└──────────────┼────────────────────────────┘
               │ Apps Script API + Orders CSV
               │ (Public order & queue updates)
        ┌──────┴────────────────────────┐
        │   Public Order Web App        │
        │  (Google Apps Script)         │
        └───────────────────────────────┘
                     ↓
┌───────────────────────────────────────────┐
│     Google Sheets (CSV Export)            │
│     STT | Tên | Bài | Ca sĩ | URL         │
└───────────────────────────────────────────┘
```

---

## 🎨 Tính năng chính

### 1. Playlist Management
- **Google Sheet Integration**: Load playlist từ CSV export
- **Auto-save URL**: Lưu URL sheet để auto-load lần sau
- **Member Filter**: Chọn/bỏ chọn thành viên để filter playlist
- **Two Modes**:
  - **Round-Robin**: Mỗi người 1 bài luân phiên
  - **Burst**: Mỗi người N bài liên tục (2-5 bài)

### 2. Player Controls
- **Play/Pause**: Space hoặc click button
- **Next/Previous**: Arrow keys hoặc buttons
- **Seek**: Click vào progress bar
- **Volume**: Slider + keyboard shortcuts (↑/↓)
- **Resume**: Tự động nhớ vị trí dừng gần nhất

### 3. Search Feature 🔍
- **Realtime search**: Gõ là thấy kết quả ngay
- **Multi-field search**: Tìm theo tên bài, ca sĩ, người request
- **Keyboard shortcut**: Ctrl+F để focus
- **Smart filtering**: Case-insensitive, highlight results

### 4. Fun Features 🎉
- **Party Mode**: Confetti + rainbow effects + fast spinning
- **Desktop Notifications**: Thông báo khi bài mới phát
- **Achievement System**: Unlock badges theo milestone
- **Boss Mode**: Ctrl+B ẩn app ngay (fake Excel)
- **Easter Eggs**: Click logo 10x, Konami Code

### 5. UI/UX
- **Dark Theme**: Purple accent, modern design
- **Spinning Disc**: Hiển thị ảnh thành viên
- **Now Playing**: Info bài đang phát rõ ràng
- **Playlist View**: Status (playing/done), click to jump
- **Responsive**: Auto-adjust theo window size

### 6. Public Music Order 📱
- **Google Apps Script Web App**: Đồng nghiệp mở link public để gửi order, không phụ thuộc IP LAN của máy host.
- **Google Sheet Orders**: Sheet `Orders` là hàng đợi trung gian cho web app và desktop app.
- **Desktop Queue Sync**:
  - Desktop tự đồng bộ order từ Apps Script/Google Sheet.
  - Admin có thể bật/tắt order, xóa bài chờ, và thêm order nội bộ từ desktop.
  - Cập nhật hàng đợi định kỳ, tự động ghi nhớ tên bài đã resolve.
- **Thuật toán xếp lịch (Round-Robin Queue scheduler)**:
  - Tự động ưu tiên phát nhạc order trước, khi hàng đợi rỗng tự động quay về nhạc Google Sheet.
  - Cơ chế chống "chiếm sóng": Giới hạn tối đa **2 bài liên tiếp** cho cùng một người order (nếu một người gửi liên tục nhiều bài, hệ thống sẽ tự động xen kẽ bài của người khác lên trước).
  - Trích xuất tiêu đề tự động bằng `yt-dlp` sử dụng cơ chế `execFile` an toàn và cấu hình `--encoding utf-8` để hiển thị chuẩn tiếng Việt có dấu.

### 7. Bảng Vàng Âm Nhạc & Thống kê 📊
- **Đếm số lượng phát**: Đếm tổng số bài đã phát, phân tích tỷ lệ phát nhạc Google Sheet (📄) và nhạc Order (📱).
- **Leaderboard "Chiếm Sóng"**: Xếp hạng Top 5 thành viên yêu cầu nhiều nhạc nhất được phát, hiển thị ảnh đại diện tròn xoay mini.
- **Lịch sử phát gần đây**: Xem lại 10 bài hát đã chạy qua kèm mốc thời gian tương đối ("Vừa xong", "5 phút trước"...).
- **Lưu trữ bảo mật**: Sử dụng `localStorage` của máy chủ nên dữ liệu tồn tại vĩnh viễn kể cả khi restart ứng dụng. Có nút đặt lại (Reset) để xóa lịch sử khi sang tuần/ngày mới.

---

## 📊 Thống kê dự án

### Số liệu:
- **Lines of Code**: ~2,000 LOC
- **Files**: 15+ files (JS, HTML, CSS, MD)
- **Features**: 25+ tính năng
- **Supported Members**: 16 người
- **Playlist Capacity**: Unlimited
- **App Size**: ~120 MB (installer)

### Development Time:
- **Phase 1** (Core): 3 days
- **Phase 2** (Desktop App): 1 day
- **Phase 3** (Photos + Filters): 1 day
- **Phase 4** (Fun Features): 1 day
- **Phase 5** (Search + Refactor): 1 day
- **Total**: ~7 days

---

## 🔧 Technical Details

### Frontend Modules:

#### 1. `index.html` (Core - 1500 LOC)
**Responsibilities:**
- State management
- Playlist building (Round-Robin/Burst)
- Player controls
- UI rendering
- Google Sheet loading
- LocalStorage persistence

#### 2. `search-feature.js` (Search - 150 LOC)
**Responsibilities:**
- Search input handling
- Playlist filtering
- Keyboard shortcut (Ctrl+F)
- Results display
- Custom events (searchChanged, searchCleared)

#### 3. `fun-features.js` (Fun - 320 LOC)
**Responsibilities:**
- Party Mode animations
- Desktop notifications
- Achievement tracking
- Boss Mode
- Easter eggs
- Keyboard shortcuts (Space, arrows, Ctrl+B)

### Backend & Desktop App:

#### `electron-main.js` (Electron Main Process & Integrated Server - 320 LOC)
- **Electron Window**: Khởi tạo cửa sổ Chromium hiển thị giao diện Player chính.
- **Express Server**: Khởi chạy web server local trên cổng `7777` để phục vụ giao diện desktop và API nội bộ.
- **YouTube Streaming (`/api/stream`)**: Sử dụng `spawn` chạy ngầm `yt-dlp` để trích xuất và pipe luồng âm thanh định dạng `.webm` trực tiếp về client.
- **Order Management APIs**:
  - `POST /api/order`: Tiếp nhận yêu cầu, phân tích video ID, gọi `execFile` của `yt-dlp` lấy tiêu đề với bảng mã UTF-8.
  - `GET /api/orders`: Trả về hàng đợi đang chờ.
  - `POST /api/orders/next`: Lập lịch Round-Robin và giới hạn tối đa 2 bài liên tiếp của một người order.

---

## 🎯 Design Decisions

### 1. Why Google Sheets?
✅ Dễ sử dụng cho non-technical users  
✅ Real-time collaboration  
✅ No database setup needed  
✅ CSV export built-in  
✅ Có thể edit trên mobile  

### 2. Why yt-dlp over API?
✅ Không cần YouTube API key  
✅ Không giới hạn quota  
✅ Support nhiều format  
✅ Stable, well-maintained  
✅ Offline-capable (cache)  

### 3. Why Electron?
✅ Desktop app experience  
✅ No browser tabs clutter  
✅ System tray integration potential  
✅ Native notifications  
✅ Cross-platform (Windows/Mac/Linux)  

### 4. Why Vanilla JS over Framework?
✅ No build step needed  
✅ Faster development  
✅ Smaller bundle size  
✅ No framework learning curve  
✅ Direct DOM control for music player  

### 5. Why Modular Architecture?
✅ Separation of concerns  
✅ Easy to maintain/debug  
✅ Reusable modules  
✅ Scalable for future features  
✅ Team collaboration friendly  

---

## 🚀 Future Roadmap

### Version 1.3.0 (Planned)
- [ ] **Lyrics Display**: Fetch & display lyrics từ API
- [ ] **Equalizer**: Bass/Treble adjustment, presets
- [ ] **Music Visualizer**: Canvas animation theo beat
- [ ] **Queue Management**: Add/remove/reorder songs
- [ ] **Shuffle Mode**: Random playback

### Version 2.0.0 (Ideas)
- [ ] **Custom Playlists**: User-created playlists
- [ ] **Social Features**: Chat, reactions, voting
- [ ] **Themes**: Dark/Light/Custom themes
- [ ] **Mobile App**: React Native version
- [ ] **Cloud Sync**: Sync state across devices
- [ ] **Last.fm Integration**: Scrobbling
- [ ] **Discord Rich Presence**: Show what you're listening

---

## 🏆 Challenges & Solutions

### Challenge 1: YouTube Blocking
**Problem**: YouTube blocks requests từ Render.com IPs  
**Solution**: Chuyển sang desktop app, chạy local

### Challenge 2: Electron Build Errors
**Problem**: ASAR packaging gây lỗi require()  
**Solution**: Disable ASAR, embed server trong main process

### Challenge 3: Filter Logic Complexity
**Problem**: Toggle logic khó hiểu cho users  
**Solution**: Simplify: Click = toggle on/off, Tổng hợp = all/none

### Challenge 4: Search Performance
**Problem**: Re-render playlist mỗi keystroke  
**Solution**: Efficient filtering, virtual DOM concepts

### Challenge 5: Module Communication
**Problem**: Tight coupling giữa search và core  
**Solution**: Custom events, API export qua window.*

---

## 📈 Performance Metrics

### Load Times:
- **App Launch**: ~2s (Electron startup)
- **Sheet Load**: ~1-2s (depends on sheet size)
- **Search**: <50ms (realtime)
- **Song Switch**: <1s (streaming buffer)

### Bundle Sizes:
- **index.html**: 45 KB
- **search-feature.js**: 5 KB
- **fun-features.js**: 12 KB
- **Total JS**: ~62 KB (unminified)

### Memory Usage:
- **Idle**: ~150 MB
- **Playing**: ~200 MB
- **Party Mode**: ~250 MB

---

## 🔐 Security & Privacy

### Data Collection:
❌ Không thu thập dữ liệu cá nhân  
❌ Không tracking  
❌ Không analytics  
❌ Không gửi data ra ngoài  

### Data Storage:
✅ LocalStorage only (client-side)  
✅ Lưu: playlist state, volume, progress  
✅ Không lưu: user info, passwords  

### Network:
✅ Chỉ request: Google Sheet CSV, YouTube audio  
✅ Không có third-party tracking scripts  
✅ Localhost only (không expose ra internet)  

---

## 🤝 Contributing Guidelines

### For Internal Developers:

1. **Clone & Setup**:
```bash
git clone <repo>
npm install
npm run dev
```

2. **Make Changes**:
- Create feature branch: `feature/your-feature`
- Follow existing code style
- Test thoroughly

3. **Commit**:
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

4. **Pull Request**:
- Create PR với description rõ ràng
- Request review từ team
- Merge sau khi approved

### Code Style:
- **Indentation**: 2 spaces
- **Quotes**: Single quotes for JS
- **Comments**: Vietnamese OK, English preferred
- **Functions**: Descriptive names
- **Variables**: camelCase

---

## 📞 Contact & Support

### Maintainer:
- **Name**: SonBX
- **Email**: [Email]
- **Slack**: @sonbx

### Team:
- **IT Support**: [Support channel]
- **Feature Requests**: [Slack channel]
- **Bug Reports**: [GitHub Issues]

---

## 📜 License & Credits

### License:
**Internal Use Only** - LotusQuant Company  
© 2026 LotusQuant. All rights reserved.

### Credits:
- **yt-dlp**: YouTube audio extraction
- **Electron**: Desktop app framework
- **Express.js**: Web server
- **Google Sheets**: Data source

### Special Thanks:
- LotusQuant Team: Testing & feedback
- IT Department: Infrastructure support
- All contributors: Feature ideas & bug reports

---

## 📊 Project Stats

```
Repository     : MusicLotusquant
Language       : JavaScript (95%), HTML (3%), CSS (2%)
Total Commits  : 50+
Contributors   : 1 (SonBX)
Stars          : ⭐⭐⭐⭐⭐ (Internal)
Version        : 1.2.0
Status         : ✅ Production Ready
```

---

**🎵 Made with ❤️ by LotusQuant Team**
