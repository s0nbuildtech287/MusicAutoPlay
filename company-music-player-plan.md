# Company Music Player — Full Plan v2

---

## 1. Stack & Lý do chọn

| Layer | Tech | Lý do |
|-------|------|-------|
| Frontend | HTML/CSS/JS thuần | Nhẹ, không cần build step, dễ maintain |
| Backend | Node.js Vercel Serverless | Free tier đủ dùng, deploy 1 lệnh |
| Audio extraction | `@distube/ytdl-core` | Fork của ytdl-core, maintain tốt hơn, ít bị YouTube block |
| Data source | Google Sheet → CSV | Không cần API key, ai cũng biết dùng |
| Hosting | Vercel | Free, HTTPS tự động, CI/CD từ GitHub |

---

## 2. Cấu trúc thư mục

```
music-company/
├── api/
│   └── stream.js          ← Serverless function: extract + stream audio
├── public/
│   └── index.html         ← Toàn bộ UI
├── package.json
└── vercel.json            ← Config route /api/* và static /public
```

---

## 3. Google Sheet Format

Mỗi hàng = 1 bài hát, không cần header cố định, chỉ cần đúng thứ tự cột:

| STT | Tên | Bài hát | Ca sĩ | Link |
|-----|-----|---------|-------|------|
| 1 | AnhTD | Người Và Ta | Rhymastic & Thanh Huyền | https://youtube.com/... |
| 2 | AnhTD | 'Tally' | BLACKPINK | https://youtube.com/... |
| 3 | MinhNT | Shape of You | Ed Sheeran | https://youtube.com/... |

**Cách publish sheet:**
1. File → Share → Publish to web
2. Chọn **Entire document** + **CSV** → Publish
3. Copy URL vừa publish (hoặc paste URL edit bình thường đều được — web tự convert)

**Lưu ý URL YouTube:** Web tự xử lý mọi dạng URL, kể cả có `&list=` hay `&start_radio=`, chỉ extract `?v=` là đủ.

---

## 4. Tính năng chi tiết

### 4.1 Playlist Engine — 2 chế độ phát

**Chế độ Round-Robin (mặc định)**

Mỗi người lần lượt 1 bài, xoay vòng:

```
AnhTD[1] → MinhNT[1] → HoaLT[1]
→ AnhTD[2] → MinhNT[2] → HoaLT[2]
→ ... → lặp lại từ đầu
```

**Chế độ Burst**

Phát N bài liên tiếp của từng người rồi mới sang người tiếp:

```
N = 3:
AnhTD[1,2,3] → MinhNT[1,2,3] → HoaLT[1,2,3]
→ AnhTD[4,5,6] → MinhNT[4,5,6] → ...
```

N do user chọn: **2 / 3 / 4 / 5 bài/người**

Cả 2 chế độ đều loop lại từ đầu khi hết playlist.

---

### 4.2 Resume — Ghi nhớ vị trí

Tự động lưu vào `localStorage` mỗi 5 giây:

```json
{
  "playlistIndex": 42,
  "currentTime": 134.5,
  "sheetUrl": "https://...",
  "savedAt": "2024-01-15 09:23"
}
```

Khi mở lại web → hiện banner:

> **"Hôm qua dừng ở AnhTD - Người Và Ta (2:14) — Tiếp tục?"**
> `[✅ Tiếp tục]`  `[🔄 Phát từ đầu]`

---

### 4.3 Filter — Lọc theo người

Hiển thị danh sách nhân viên dạng tag/chip, click để toggle:

```
[✓ AnhTD]  [✓ MinhNT]  [✗ HoaLT]  [✓ ThuPT]
```

- Bỏ tick → loại người đó khỏi playlist
- Rebuild playlist ngay lập tức, giữ nguyên chế độ phát hiện tại
- Nếu bỏ hết tất cả → hiện warning, không rebuild

---

### 4.4 Audio Backend

```
GET /api/stream?id=dQw4w9WgXcQ
```

- Dùng `@distube/ytdl-core` extract audio stream từ YouTube
- Trả về audio stream trực tiếp → **không có quảng cáo**
- Set header `Content-Type: audio/webm`
- Validate `videoId` trước khi xử lý (chỉ cho ký tự hợp lệ)

---

## 5. UI Layout

```
┌──────────────────────────────────────────────────┐
│  🎵 Company Music Player                         │
│  [ Google Sheet URL...          ] [Load] [💾]    │
├──────────────────────────────────────────────────┤
│  Chế độ: [● Round-Robin] [○ Burst: [3▼] bài]    │
│  Filter:  [✓AnhTD] [✓MinhNT] [✗HoaLT] [✓ThuPT]│
├──────────────────────────────────────────────────┤
│                                                  │
│           👤  AnhTD                             │
│           🎵  Người Và Ta                       │
│           🎤  Rhymastic & Thanh Huyền           │
│                                                  │
│    [⏮]  [⏸]  [⏭]         🔊 ──●── 80%        │
│    ████████████░░░░░  2:34 / 4:12               │
│                                                  │
├──────────────────────────────────────────────────┤
│  Playlist  (#42 / 180)                          │
│  ✓  AnhTD - Người Và Ta                         │
│  ▶  AnhTD - Tally              ← đang phát      │
│  ·  MinhNT - Shape of You                       │
│  ·  MinhNT - Blinding Lights                    │
└──────────────────────────────────────────────────┘
```

---

## 6. Edge Cases

| Case | Xử lý |
|------|-------|
| Link có `&list=` hay `&start_radio=` | Strip params, chỉ lấy `?v=` |
| Ô Link trống | Skip bài đó khi build playlist |
| Video bị xóa / private | Skip + hiện toast "Bỏ qua: [tên bài]" |
| Stream lỗi giữa chừng | Retry 1 lần, nếu vẫn lỗi thì skip sau 2 giây |
| ytdl-core bị rate limit | Trả 429, frontend hiện thông báo, thử lại sau 5 giây |
| Filter bỏ hết người | Hiện warning, không rebuild playlist |
| Đổi chế độ phát giữa chừng | Rebuild playlist, giữ nguyên bài đang phát |
| Burst N > số bài của người | Phát hết bài còn lại rồi sang người tiếp |
| Browser chặn autoplay | Hiện overlay "▶ Click để bắt đầu" |

---

## 7. Deploy Flow

```
1. Tạo GitHub repo, push code lên
2. Vào vercel.com → Import repo → Deploy
3. Vercel tự detect Node.js, build và deploy
4. Nhận URL cố định: https://music-company.vercel.app
5. Mỗi lần update code: git push → Vercel tự redeploy
6. Mỗi lần update sheet: Load lại trên web là xong, không cần redeploy
```

---

## 8. Rủi ro & Giới hạn

| Rủi ro | Mức độ | Giải pháp |
|--------|--------|-----------|
| YouTube block ytdl-core | Trung bình | `@distube/ytdl-core` được update thường xuyên, theo dõi GitHub issues |
| Vercel function timeout (10s free tier) | Thấp | Stream bắt đầu ngay, không cần chờ download xong |
| Vercel bandwidth (100GB/tháng free) | Thấp | Dùng nội bộ công ty, lưu lượng nhỏ |
| YouTube ToS | Có | Dùng nội bộ, không public ra ngoài, rủi ro thực tế rất thấp |

---

## 9. Hướng dẫn nhân viên điền sheet

```
Format mỗi hàng:
| STT | Tên      | Tên bài        | Ca sĩ      | Link YouTube      |
|-----|----------|----------------|------------|-------------------|
| 1   | AnhTD    | Người Và Ta    | Rhymastic  | https://youtu.be/ |
| 2   | AnhTD    | 'Tally'        | BLACKPINK  | https://youtu.be/ |

Lưu ý:
- Tên viết nhất quán (AnhTD ≠ Anh TD — sẽ ra 2 người khác nhau)
- Link YouTube dán nguyên, không cần sửa
- Không cần giới hạn số bài, mỗi người bao nhiêu bài cũng được
- Không cần header row cố định, chỉ cần đúng thứ tự cột
```

---

*Plan v2 — Company Music Player / LotusQuant Internal*
