# Quy trình clean-room cho các module jsx/ gốc

Mục tiêu: thay từng module có nguồn gốc là mã decompile bằng mã **viết mới từ hành vi quan sát được**, để mã mới
không phải là tác phẩm phái sinh của mã gốc. Đổi tên biến hay cấu trúc mã decompile **không** đạt mục tiêu này.

Tài liệu này không phải tư vấn pháp lý. Muốn dùng kết quả vào mục đích thương mại hoặc nhận ủng hộ, hãy hỏi luật sư
về sở hữu trí tuệ ở nơi bạn cư trú.

## Hai bên, và chỉ hai bên

| Bên | Được thấy | Được tạo ra |
|---|---|---|
| **Đặc tả** | Mã gốc, bản chạy thật trong Photoshop | Đặc tả hành vi (`docs/clean-room/specs/<module>.md`) và mốc đối chứng (`tests/baselines/`) |
| **Cài đặt** | Chỉ gói bàn giao (xem dưới) | Mã mới, test mới |

Hai bên phải là **hai người khác nhau**, hoặc hai agent khác nhau chạy trong hai phiên riêng, không dùng chung ngữ cảnh
hội thoại. Bên cài đặt **chưa từng** mở mã gốc của module đó, dù chỉ để xem thử. Một người đã đọc mã gốc thì không làm
bên cài đặt cho module đó nữa.

## Đặc tả được ghi gì và không được ghi gì

Được ghi: những gì quan sát được từ bên ngoài. Đầu vào, thao tác Photoshop quan sát được (filter nào, blend mode, opacity,
mask, thứ tự layer), cây layer đầu ra, histogram, giá trị hộp thoại và mặc định, thông báo lỗi, thời gian.

Không được ghi: tên biến, tên hàm, cấu trúc điều khiển, hằng số "ma thuật" chép từ mã, đoạn mã dù ngắn, chú thích gốc.
Nếu một số liệu chỉ lấy được bằng cách đọc mã (vd hệ số lọc), hãy đo lại từ ngoài (chạy ở nhiều đầu vào, vẽ đường đáp ứng)
và ghi số đo cùng khoảng sai số, không ghi số đọc từ mã.

Mẫu: `docs/clean-room/spec-template.md`.

## Gói bàn giao cho bên cài đặt

Tạo từ thư mục sạch, **không** chép `.git` (lịch sử vẫn chứa mã gốc) và bỏ các đường dẫn cấm:

- `jsx/4.jsxbin`, `jsx/ba.jsx`, `jsx/db.jsx`, `jsx/ds.jsx`, `jsx/li.jsx`, `jsx/ls.jsx`, `jsx/pfsd2.jsx`, `jsx/re.jsx`,
  `jsx/se.jsx`, `jsx/sh.jsx`, `jsx/ss.jsx`, `jsx/tc.jsx`, `jsx/wt.jsx`, `jsx/pj/*`, phần lõi của `jsx/skin-*.jsx`
- `js/ex-stigmata2-core.js`, `_dev/`, `.git/`, mọi bản diff hay log chứa nội dung các file trên

Gói gồm: phần còn lại của repo (panel, `index.html`, `loader.jsx`, test), `specs/<module>.md` của module đang làm,
file mốc `tests/baselines/*.json`, và `tests/compare-baselines.js`. Module đang viết lại được đăng ký vào
`$.dr7Commands` như cũ để `index.html` không phải đổi.

## Các bước cho mỗi module (khớp phase 06)

1. **Kiểm kê** (bên đặc tả): chạy `tests/photoshop-command-inventory.jsx` trong Photoshop đang mở panel để lấy tên lệnh đã
   đăng ký; `grep -o "onClickButton('[A-Z0-9_]*')" index.html` để biết nút nào gọi lệnh nào.
2. **Mốc hành vi** (bên đặc tả): đặt tên lệnh vào `COMMANDS` trong `tests/photoshop-baseline-record.jsx`, chạy, lưu JSON
   vào `tests/baselines/<module>.before.json`. Lệnh mở hộp thoại thì ghi tay giá trị hộp thoại vào đặc tả, hoặc đặt
   `app.displayDialogs = DialogModes.NO` nếu lệnh hỗ trợ.
3. **Đặc tả** (bên đặc tả): điền `spec-template.md`; bên thứ hai (không phải người viết) đọc lại để xoá chi tiết nào
   trông như chép từ mã.
4. **Viết mới** (bên cài đặt): từ gói bàn giao, tên rõ nghĩa, file kebab-case, mỗi file ≤ 200 dòng nếu được.
5. **Đối chứng**: chạy lại cùng script trên mã mới, lưu `<module>.after.json`, rồi
   `node tests/compare-baselines.js <module>.before.json <module>.after.json` (sai lệch histogram nằm trong ngưỡng của đặc tả).
6. **Thay thế**: xoá file gốc khỏi cây làm việc, cập nhật README mục Cấu trúc thư mục và changelog, ghi vào `LOG.md`.

## Việc quy trình này không giải quyết

- Lịch sử git của repo public hiện tại vẫn chứa mã gốc. Muốn phân phối công khai bản sạch, cần repo mới với lịch sử sạch;
  đó là thao tác phá huỷ và chỉ làm khi chủ repo xác nhận riêng.
- `js/ex-stigmata2-core.js` là phần liên quan tới gỡ DRM của bản gốc; phải loại khỏi bản phân phối sạch, không viết lại.
- Mốc hành vi chỉ chứng minh kết quả giống nhau, không chứng minh mã mới sạch. Sổ `LOG.md` mới là bằng chứng quy trình.

Nhật ký: `docs/clean-room/LOG.md`.
