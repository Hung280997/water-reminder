# Water Reminder (Vite + React)

Ứng dụng nhắc uống nước theo khung giờ, **tự động tránh** thời gian quanh bữa chính. Có theo dõi ml đã uống và hỗ trợ **Web Notifications**.

## 🚀 Cách chạy
```bash
npm install
npm run dev
```
Mở địa chỉ hiển thị (thường là http://localhost:5173). Nhấn **Bật Notifications** để trình duyệt cho phép gửi nhắc.

## 🧩 Cấu trúc chính
- `src/WaterReminderApp.tsx`: Thành phần chính (logic lịch nhắc, tránh bữa, tiến độ, notifications)
- `src/App.tsx`: nạp WaterReminderApp
- `src/main.tsx`: khởi tạo React
- `index.html`: có Tailwind CDN cho giao diện gọn

> Lưu ý: Dùng Tailwind qua CDN cho đơn giản (không cần cấu hình build).

## 📦 Build sản phẩm
```bash
npm run build
npm run preview
```

## 🌐 Triển khai (Deploy)
### GitHub Pages (thủ công nhanh)
1. Cài: `npm install gh-pages --save-dev`
2. Thêm vào `package.json`:
```json
"homepage": "https://<username>.github.io/water-reminder",
"scripts": { "predeploy": "npm run build", "deploy": "gh-pages -d dist" }
```
3. Chạy: `npm run deploy`

### Vercel (đề xuất)
- Đăng nhập bằng GitHub trên https://vercel.com
- Import repo và nhấn **Deploy** (tự build).

## 🔒 Ghi chú Notifications
- Trình duyệt sẽ hỏi quyền, bạn phải chấp nhận.
- Một số trình duyệt/chế độ tiết kiệm pin có thể giới hạn thông báo nền.
- Nếu muốn hoạt động nền bền vững, cân nhắc Service Worker + Push (nâng cao).

## 🚀 Tính năng
- Nhắc nhở uống nước theo khung giờ tùy chỉnh
- Tự động bỏ qua giờ ăn
- Theo dõi lượng nước đã uống trong ngày
- Hỗ trợ thông báo (Web Notifications)
- Triển khai dễ dàng trên GitHub Pages hoặc Vercel

## 🖼️ Demo
![Screenshot](docs/screenshot.png)

👉 Trải nghiệm ngay: [Demo trên Vercel](https://your-vercel-link)

## ⚙️ Cài đặt
```bash
git clone https://github.com/Hung280997/water-reminder.git
cd water-reminder
npm install
npm run dev

