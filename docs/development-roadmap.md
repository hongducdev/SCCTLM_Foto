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

Mỗi lần có bản Photoshop mới: mở panel, đọc `$.scctlmFotoLoadErrors` (phải rỗng) và `$.scctlmFotoLoadTotalMs`,
ghi kết quả vào bảng dưới.

| Ngày | Photoshop | `$.scctlmFotoLoadErrors` | `$.scctlmFotoLoadTotalMs` | Ghi chú |
|---|---|---|---|---|
| — | — | — | — | Chưa có bản ghi |
