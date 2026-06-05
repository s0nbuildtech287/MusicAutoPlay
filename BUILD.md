# 📦 Hướng dẫn Build Installer (.exe)

## 🎯 Tại sao cần build installer?

### ❌ Không có installer (phức tạp cho người dùng):
```
User cần cài:
1. Node.js (80MB)
2. Git (50MB)  
3. Clone repo
4. Chạy npm install (chờ 2-3 phút)
5. Chạy npm start

→ Khó khăn, cần kiến thức kỹ thuật
```

### ✅ Có installer (đơn giản):
```
User chỉ cần:
1. Download file .exe (~150MB)
2. Double-click → Next → Install
3. Click vào shortcut desktop

→ Đơn giản như cài game/app thông thường!
```

---

## 🚀 Cách build installer

### Bước 1: Chuẩn bị

Đảm bảo đã có `yt-dlp.exe`:

```bash
node download-ytdlp.js
```

### Bước 2: Build

```bash
npm run build
```

**Lần đầu:** ~5 phút (tải Electron binaries)  
**Lần sau:** ~1-2 phút

### Bước 3: Lấy file installer

File output nằm trong folder `dist/`:

```
dist/
├── Lotusquant Music Setup 1.0.0.exe  ← Installer (~150MB)
└── win-unpacked/                      ← Portable version (không cần cài)
```

---

## 📤 Phát hành cho team

### Cách 1: Share installer (khuyến nghị)

1. Upload `Lotusquant Music Setup 1.0.0.exe` lên:
   - Google Drive
   - OneDrive
   - Hoặc USB

2. Share link/file cho đồng nghiệp

3. Họ chỉ cần:
   - Download → Double-click
   - Next → Next → Install
   - Done! Shortcut tự động tạo trên Desktop

### Cách 2: Portable version (không cần cài)

1. Zip folder `dist/win-unpacked/`
2. Share file zip
3. Người dùng:
   - Giải nén ra Desktop
   - Chạy `Lotusquant Music.exe`

---

## 🛠️ Troubleshooting

### ❗ Lỗi: "A required privilege is not held by the client"

**Nguyên nhân:** Windows cần quyền tạo symbolic link khi build.

**Giải pháp 1:** Bật Developer Mode

```
Settings → Update & Security → For developers → Developer Mode: ON
```

**Giải pháp 2:** Chạy as Administrator

```bash
# Mở PowerShell/CMD as Administrator
npm run build
```

**Giải pháp 3:** Skip code signing (nhanh nhất)

Thêm vào `package.json`:

```json
"build": {
  "win": {
    "target": "nsis",
    "icon": "public/favicon.ico",
    "forceCodeSigning": false
  }
}
```

### ❗ Build chậm

→ Bình thường! Electron-builder cần đóng gói:
- Chromium engine (~100MB)
- Node.js runtime (~20MB)
- App code + dependencies (~30MB)

### ❗ Icon không hiển thị

→ Kiểm tra `public/favicon.ico` tồn tại và đúng format `.ico` (không phải `.png`).

Convert online: https://convertio.co/png-ico/

---

## 📊 So sánh file size

| Phương pháp | Size | Cần cài | Độ khó |
|-------------|------|---------|---------|
| Clone + npm | ~30MB | Node.js, Git | ⭐⭐⭐⭐ |
| Portable zip | ~150MB | Không | ⭐⭐ |
| Installer .exe | ~150MB | Không | ⭐ (dễ nhất) |

---

## 🎉 Kết luận

**Installer .exe = Cách tốt nhất để phát hành nội bộ!**

✅ Người dùng không cần biết code  
✅ Không cần cài Node.js, Git  
✅ Tự động tạo shortcut  
✅ Uninstall dễ dàng qua Control Panel  

**Developer chỉ cần build 1 lần → Share file → Done!**
