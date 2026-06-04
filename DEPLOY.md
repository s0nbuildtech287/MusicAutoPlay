# 🚀 Hướng dẫn Deploy lên Render

## Tổng quan

App này dùng `yt-dlp` để stream audio từ YouTube. Do YouTube yêu cầu xác thực, cần export cookies từ browser để deploy lên Render.

---

## 📋 Bước 1: Export cookies từ browser

### 1.1. Cài extension "Get cookies.txt LOCALLY"

- **Chrome:** https://chromewebstore.google.com/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
- **Firefox:** https://addons.mozilla.org/en-US/firefox/addon/get-cookies-txt-locally/

### 1.2. Export cookies

1. Mở **YouTube.com**, đăng nhập tài khoản
2. Click icon extension "Get cookies.txt LOCALLY"
3. Chọn **"Export"** → chọn domain `youtube.com`
4. File `youtube.com_cookies.txt` sẽ được tải về

---

## 🔐 Bước 2: Upload cookies lên Gist

### 2.1. Tạo Secret Gist trên GitHub

1. Vào https://gist.github.com
2. Tạo **Secret Gist** mới (KHÔNG public)
3. Tên file: `cookies.txt`
4. Mở file `youtube.com_cookies.txt` vừa export → **Copy toàn bộ nội dung**
5. Paste vào Gist
6. Click **"Create secret gist"**

### 2.2. Lấy Raw URL

1. Sau khi tạo xong, click nút **"Raw"** ở góc phải
2. Copy URL trên address bar (dạng: `https://gist.githubusercontent.com/username/abc123.../raw/.../cookies.txt`)
3. **Lưu URL này lại** — sẽ dùng ở bước tiếp theo

**Lưu ý:** URL này có chứa token secret, không share public!

---

## 🌐 Bước 3: Deploy lên Render

### 3.1. Push code lên GitHub

```bash
git add .
git commit -m "Ready for Render deployment with cookies"
git push origin main
```

### 3.2. Tạo Web Service trên Render

1. Vào https://render.com → Sign up (miễn phí)
2. Click **"New"** → **"Web Service"**
3. Connect GitHub account
4. Chọn repository: `company-music-player` (hoặc tên repo của bạn)
5. Click **"Connect"**

### 3.3. Cấu hình service

Render sẽ tự động detect config từ `render.yaml`, nhưng cần thêm **Environment Variable**:

1. Trong màn hình config, scroll xuống phần **"Environment"**
2. Click **"Add Environment Variable"**
3. Thêm:
   - **Key:** `COOKIES_URL`
   - **Value:** Paste **Raw URL** từ Gist (bước 2.2)
4. Click **"Create Web Service"**

### 3.4. Đợi deploy

- Render sẽ build & deploy (3-5 phút)
- Khi xong sẽ có URL: `https://your-app-name.onrender.com`
- Click vào để test

---

## 🔄 Cập nhật cookies khi hết hạn

Cookies YouTube thường hết hạn sau **6 tháng - 1 năm**.

Khi bị lỗi "Sign in to confirm you're not a bot":

1. Export cookies mới từ browser (lặp lại Bước 1)
2. Vào Gist cũ → Click **"Edit"**
3. Paste nội dung cookies mới
4. Save → Render tự động dùng cookies mới (không cần redeploy)

---

## ⚠️ Lưu ý Render Free Tier

- ✅ **Miễn phí hoàn toàn**
- ⚠️ **App ngủ** sau 15 phút không dùng
- ⚠️ **Cold start** lần đầu truy cập sau khi ngủ: ~30-50 giây
- ✅ Sau khi khởi động: hoạt động bình thường

### Giải pháp giữ app luôn thức:

**Cách 1:** Dùng cron service (UptimeRobot) ping app mỗi 10 phút  
**Cách 2:** Upgrade lên Render Paid ($7/tháng) → app chạy 24/7

---

## 🐛 Troubleshooting

### Lỗi: "Sign in to confirm you're not a bot"

→ Cookies hết hạn hoặc sai. Export lại cookies mới.

### Lỗi: "spawn /opt/render/project/src/yt-dlp ENOENT"

→ `yt-dlp` chưa được cài. Check build logs xem `install-yt-dlp.sh` có chạy không.

### Lỗi: "All songs skipped"

→ Mở **Render Logs**, tìm dòng `[Stream] yt-dlp stderr:` để xem lỗi chi tiết.

### App chạy chậm

→ Cold start của Render Free tier. Upgrade lên Paid hoặc dùng UptimeRobot.

---

## 📱 Kiểm tra deployment

1. Vào URL của app: `https://your-app.onrender.com`
2. Web tự động load sheet mặc định
3. Click Play → nếu phát nhạc = thành công ✅
4. Nếu skip liên tục → check logs trên Render

---

## 🔒 Bảo mật

- **KHÔNG commit** file `cookies.txt` vào Git (đã có trong `.gitignore`)
- **KHÔNG share** Raw URL của Gist (có chứa cookies)
- Cookies chỉ dùng để xác thực với YouTube, không chứa password

---

**Chúc deploy thành công!** 🎵

Nếu có vấn đề, check Render Logs hoặc issue trên GitHub repo.
