<div align="center">

<img src="img/icon-large.png" alt="SCCTLM_Foto" width="96" />

# 🎨 SCCTLM_Foto

**Panel retouch cho Adobe Photoshop — giao diện 100% tiếng Việt**

[![Release](https://img.shields.io/github/v/release/hongducdev/SCCTLM_Foto?style=flat-square&color=27b96a)](https://github.com/hongducdev/SCCTLM_Foto/releases/latest)
![Photoshop](https://img.shields.io/badge/Photoshop-CC%202015%2B-31a8ff?style=flat-square&logo=adobephotoshop&logoColor=white)
![CEP](https://img.shields.io/badge/Adobe%20CEP-6.0%2B-7a5cd6?style=flat-square)
![Platform](https://img.shields.io/badge/Windows%20%7C%20macOS-lightgrey?style=flat-square)

</div>

**SCCTLM_Foto** (_Sáng chơi chữ · Tối làm màu_) là CEP Extension cho Photoshop, gom quy trình làm đẹp chân dung, ảnh cưới, thời trang và thumbnail vào một panel 4 tab: **Retouch**, **Artboard**, **Khám phá**, **Ủng hộ**.

## ✨ Tính năng

- **Retouch** — Làm da, Son môi, Trắng răng, Tẩy lông, Highlight, Lông mi, Phủ phấn, Đánh khối, Trắng da, Hạt phim. Mọi thao tác tạo layer/mask riêng, không phá huỷ ảnh gốc; chạy trên RGB 8/16-bit.
- **Brush Lab** — bật Shape Dynamics + Pen Pressure bằng một nút; chỉnh Cỡ, Cứng, màu cọ và Độ sáng ngay trên panel.
- **Rim Light** — nút **Tạo Rim Light**; khi ảnh có nhóm `Rim Light` > lớp `Color` thì chọn màu (hex, hút màu, 8 màu mẫu) và Độ sáng.
- **Màu & Preset** — 6 bộ màu MHK (165 màu): bấm để áp, hoặc **Mix** tối đa 4 màu. File `.xmp` đặt vào `presets/` tự thành nút.
- **Artboard** — 27 mẫu album Facebook MHK, khổ YouTube hoặc khổ tuỳ chỉnh, kèm guide vùng an toàn.
- **Khám phá** — playlist YouTube SCCTLM và link cộng đồng ngay trong panel.
- **Phím tắt Action** — gán F2–F12 (kèm Shift/Ctrl) cho nút **Tạo Brush** / **Tạo Rim Light**.
- **Cập nhật một chạm** — nút **⤓** tải bản mới từ GitHub, kiểm chữ ký Ed25519 trước khi cài. Nút **↻** nạp lại panel.
- **Chạy cục bộ** — không gửi ảnh hay dữ liệu cá nhân; chỉ kết nối GitHub (cập nhật) và YouTube (tab Khám phá).

## 💻 Yêu cầu

Photoshop CC 2015 trở lên · Windows 10/11 (64-bit) hoặc macOS 10.13+ · ảnh chế độ RGB.

## 🚀 Cài đặt

**Windows:** đóng Photoshop → chạy `install\Cai-dat-SCCTLM_Foto.bat` → mở Photoshop → **Window > Extensions > SCCTLM_Foto**.

> ⚠️ Panel chưa ký số nên script bật `PlayerDebugMode` — cho phép **mọi** extension CEP chưa ký chạy trên tài khoản đó. Tắt lại khi gỡ cài đặt.

<details>
<summary>🍎 macOS / cài thủ công</summary>

1. Bật `PlayerDebugMode`:
   - Windows: nhấp đúp `install\Fix-CEP-SCCTLM_Foto.reg`.
   - macOS: `for n in 9 10 11 12 13 14 15; do defaults write com.adobe.CSXS.$n PlayerDebugMode 1; done`
2. Chép thư mục plugin vào:
   - Windows: `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto\`
   - macOS: `~/Library/Application Support/Adobe/CEP/extensions/SCCTLM_Foto/`
3. Mở Photoshop → **Window > Extensions > SCCTLM_Foto**.

</details>

**Gỡ cài đặt:** Windows chạy `install\Go-cai-dat-SCCTLM_Foto.bat` (hỏi trước khi xoá và tắt `PlayerDebugMode`). macOS xoá thư mục ở bước 2; chỉ tắt `PlayerDebugMode` (`defaults delete com.adobe.CSXS.$n PlayerDebugMode`) khi không còn extension chưa ký nào khác.

## 🛠️ Xử lý sự cố

| Triệu chứng | Cách xử lý |
|---|---|
| Panel không có trong **Window > Extensions** | Nhấp đúp `install\Fix-CEP-SCCTLM_Foto.reg`, khởi động lại Photoshop. |
| Bấm nút không có gì xảy ra | Mở ảnh và chuyển sang `Image > Mode > RGB Color`. |
| Không thấy màu Rim Light | Bấm **Tạo Rim Light** trên ảnh đang mở; phần màu chỉ hiện khi có nhóm `Rim Light` > lớp `Color`. |
| Gán phím F2–F4 bị Photoshop hỏi *"Remove the conflicting action shortcuts?"* | Chọn **No** để phím chạy Action. |

## 📚 Tài liệu

[Lịch sử thay đổi](docs/project-changelog.md) · [Cấu trúc mã nguồn](docs/codebase-summary.md) · [Phát hành & cập nhật](docs/deployment-guide.md) · [Quy chuẩn giao diện](docs/design-guidelines.md)

## ⚖️ Bản quyền

Mã do **hongducdev** viết giữ bản quyền theo [`LICENSE`](LICENSE) (All rights reserved). Một số file `jsx/` có nguồn gốc từ plugin gốc, không thuộc phạm vi `LICENSE` và đang được viết lại theo quy trình clean-room — xem [`NOTICE.md`](NOTICE.md).

## ♡ Ủng hộ

Nếu SCCTLM_Foto giúp ích cho công việc của bạn, hãy đồng hành cùng SCCTLM:

<img src="img/support-qr.png" alt="Mã QR ủng hộ TPBank" width="220" />

**TPBank** · TRAN THI THUONG · `9897.6386.789`
