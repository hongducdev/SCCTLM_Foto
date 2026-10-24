# Đặc tả hành vi: <tên module / nút trong panel>

> Chỉ ghi hành vi quan sát được từ bên ngoài. Không tên biến/hàm, không đoạn mã, không hằng số chép từ mã.
> Quy tắc đầy đủ: `PROCESS.md`.

- Người viết: <tên>        - Ngày: <YYYY-MM-DD>
- Người rà (không phải người viết): <tên>
- Mốc đối chứng: `tests/baselines/<module>.before.json`

## 1. Điểm vào

- Nút trong panel: <nhãn, tên lệnh trong `index.html`>
- Phím tắt / lệnh khác: <nếu có>
- Điều kiện cần: <chế độ màu, độ sâu bit, có vùng chọn không, có layer nào>

## 2. Đầu vào

| Tham số | Nguồn (hộp thoại / vùng chọn / mặc định) | Khoảng giá trị | Mặc định |
|---|---|---|---|

## 3. Hành vi quan sát được (theo thứ tự)

Mỗi bước: thao tác Photoshop nhìn thấy trong History, tham số đo được, layer tạo ra.

1. <bước>

## 4. Đầu ra

- Cây layer (tên, loại, blend mode, opacity, mask, thứ tự): <mô tả hoặc trỏ tới mốc>
- Thay đổi tài liệu khác (vùng chọn, màu foreground, history): <...>
- Thông báo cho người dùng (nguyên văn chuỗi hiển thị): <...>

## 5. Lỗi và trường hợp biên

| Tình huống | Hành vi quan sát được |
|---|---|
| Không có tài liệu mở | |
| Không có vùng chọn | |
| 16-bit / chế độ màu khác RGB | |

## 6. Ngưỡng chấp nhận

- Cây layer: số layer, loại, blend mode, opacity phải khớp mốc; tên layer: <khớp / chỉ tiền tố>
- Histogram: khoảng cách trung bình chuẩn hoá ≤ <ngưỡng> trên cả 3 ảnh mẫu
- Hộp thoại: <giá trị mặc định, thứ tự điều khiển>

## 7. Cách đo các số liệu không có sẵn

<mô tả phép đo từ bên ngoài, vd chạy ở 5 mức, ghi đường đáp ứng>
