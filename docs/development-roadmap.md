# Lộ trình phát triển

## Nền tảng

SCCTLM_Foto là extension **CEP** (`CSXS/manifest.xml`, `RequiredRuntime CSXS 6.0`, host `PHSP`/`PHXS`).
Adobe đang đưa Photoshop sang **UXP**; CEP ở chế độ duy trì, không có tính năng mới.

### Tín hiệu kích hoạt việc chuyển sang UXP

Chỉ bắt đầu chuyển đổi khi xảy ra một trong hai điều:

1. Adobe công bố ngày bỏ hỗ trợ CEP trong Photoshop.
2. Một bản Photoshop mới không nạp được panel (mở panel, `$.scctlmFotoLoadErrors` khác rỗng hoặc panel
   không hiện trong Window > Extensions).

Chưa có tín hiệu nào xảy ra thì không viết mã UXP (YAGNI).

### Nguyên tắc giữ trong lúc chờ

- Logic xử lý ảnh nằm trong `jsx/` (ExtendScript); UI nằm trong `js/` và `index.html`.
- Không thêm API CEP (`cep.fs`, `CSInterface`) vào lõi ảnh trong `jsx/`. Nhờ vậy khi chuyển chỉ
  phải viết lại UI và lớp cầu nối (`loader.jsx`, `js/`), không phải viết lại phần lõi.

### Kiểm tra khi Photoshop ra bản lớn

Mỗi lần có bản Photoshop mới: mở panel, bấm **Chẩn đoán** ở cuối panel, lấy dòng "Lỗi khi nạp lõi" (phải là
"không có") và "Thời gian nạp lõi" (cùng nguồn với `$.scctlmFotoLoadErrors` và `$.scctlmFotoLoadTotalMs`),
ghi kết quả vào bảng dưới.

| Ngày | Photoshop | `$.scctlmFotoLoadErrors` | `$.scctlmFotoLoadTotalMs` | Ghi chú |
|---|---|---|---|---|
| 2026-11-03 | 23.2.0 (Windows 10 64-bit) | không có | 125 ms | Đọc từ nút Chẩn đoán; chậm nhất `4.jsxbin` 67 ms |
