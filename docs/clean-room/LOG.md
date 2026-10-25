# Nhật ký clean-room

Mỗi dòng là một module đã đi hết quy trình. Chỉ ghi sự kiện đã xảy ra, không ghi dự kiến.

| Module | Bên đặc tả (ai, ngày) | Bên rà đặc tả | Bên cài đặt (ai, ngày) | Bên cài đặt đã từng mở mã gốc của module? | Đối chứng (file mốc, kết quả) |
|---|---|---|---|---|---|
| wt (Trắng Răng) | agent đặc tả, 2026-10-24 (không mở mã gốc) | agent điều phối, 2026-10-24 | agent cài đặt, 2026-10-24 | Không (chỉ gói bàn giao; ràng buộc bằng chỉ dẫn, không có cơ chế kỹ thuật chặn) | `wt.before.json` vs `wt.after.json`: PASS cấu trúc + histogram; Curves ≤1, Hue/Sat ≤3 mức |
| BTNPFSD2 (Màu tổng) | agent đặc tả, 2026-10-25 (không mở mã gốc) | agent điều phối, 2026-10-25 | agent cài đặt, 2026-10-25 | Không (chỉ gói bàn giao; ràng buộc bằng chỉ dẫn, không có cơ chế kỹ thuật chặn) | `btnpfsd2.before.json` vs `btnpfsd2.after.json`: PASS cấu trúc + histogram; composite mở mask ≤4 mức (ngưỡng 6) |
| DB (Đánh khối) | agent đặc tả, 2026-10-25 (không mở mã gốc) | agent điều phối, 2026-10-25 | agent cài đặt, 2026-10-25 | Không (chỉ gói bàn giao; ràng buộc bằng chỉ dẫn, không có cơ chế kỹ thuật chặn) | `db.before.json` vs `db.after.json`: PASS cấu trúc + histogram; đường cong ≤1 mức (ngưỡng 2); 6 tổ hợp đúng cây layer |
| LS (Làm mịn da) | agent đặc tả, 2026-10-25 (**có mở `ls.jsx`** để hiểu hành vi, ghi trong đầu `specs/ls.md`) | agent điều phối, 2026-10-25 | agent cài đặt, 2026-10-25 | Không (chỉ gói bàn giao; ràng buộc bằng chỉ dẫn, không có cơ chế kỹ thuật chặn; có đọc `dev-source-sync.js` bản cài và liệt kê thư mục CEP để nạp lại panel) | `ls.before.json` vs `ls.after.json`: PASS cấu trúc + histogram (`--max-histogram 0.8`); lưới `samples` TB 0,79/1,41/0,62 (ngưỡng 1,5), >4 mức 0%/1,2%/0% (ngưỡng 5%); ngưỡng không nới, đạt ở vòng cài đặt thứ hai. Thuật toán là xấp xỉ, không khớp từng điểm ảnh |
