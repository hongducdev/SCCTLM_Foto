# Đặc tả hành vi: Làm mịn da (nút "Làm mịn", lệnh LS)

> Chỉ ghi hành vi quan sát được từ bên ngoài. Không tên biến/hàm, không đoạn mã, không hằng số chép từ mã.
> Quy tắc đầy đủ: `PROCESS.md`.

- Người viết: agent đặc tả, 2026-10-25
- Người viết đã đọc mã gốc: **có** (đọc `jsx/ls.jsx` để hiểu hành vi, theo cho phép của gói 2; mã là bản decompile đã làm rối nên không dùng được làm nguồn trích). Không chép tên, cấu trúc, hằng số vào đặc tả này. Mọi số liệu dưới đây là số **đo từ ngoài** trên Photoshop 23.2.0 bằng tài liệu tổng hợp; số nào không đo được nằm ở mục 7.4.
- Người rà (không phải người viết): *(chưa có; xem "Điểm nghi ngờ khi rà" cuối file)*
- Mốc đối chứng: `tests/baselines/ls.before.json` (cấu hình mặc định, mục 6; chứa thêm lưới 256 điểm màu mỗi ảnh, trường `samples`)

## 1. Điểm vào

- Nút trong panel: tooltip "Làm mịn da", nhãn "Làm mịn", gọi `onClickButton('LS')`; panel chạy qua đường "ext" (`$._ext_LS.run`, gọi không đối số, giá trị trả về rỗng/undefined). **Không** nằm trong bảng `$.dr7Commands`.
- Điều kiện cần: tài liệu RGB (8-bit hoặc 16-bit đều chạy), **có vùng chọn** (mục 5). Layer đang chọn là layer thường.
- Panel tự chặn khi không có tài liệu: "Chưa mở ảnh" / "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." (hành vi panel; không thử gọi lệnh khi không có tài liệu).
- Lệnh **luôn chặn** (không trả về) cho đến khi người dùng đóng hộp thoại hiện ra (hộp thoại chính, hộp gợi ý hoặc hộp lỗi chế độ màu).
- Ghi chú cho bên cài đặt: `tests/photoshop-baseline-record.jsx` tra `$.dr7Commands[tên]` nên chưa gọi được lệnh ext; mốc được ghi bằng bản vá trong TEMP gọi `$._ext_LS.run`, một vòng lặp ngoài nhấn Enter mỗi khi hộp thoại hiện (Enter = `Áp dụng`), và lấy thêm lưới điểm màu. Bên cài đặt cần cùng cách đó để ghi `ls.after.json`.
- Lệnh **tự đứng độc lập**: quan sát không thấy phụ thuộc hàm của `li`, `ss`, `4.jsxbin` (xem báo cáo).

## 2. Hộp thoại chính (ScriptUI, modal)

Tiêu đề cửa sổ: `SCCTLM_Foto: Làm mịn cục bộ`. Cửa sổ rộng khoảng 346 px, cao khoảng 232 px (cả viền tiêu đề), nền tối. Nội dung trên xuống dưới:

| # | Điều khiển (nhãn nguyên văn) | Khoảng giá trị | Mặc định |
|---|---|---|---|
| 1 | Thanh trượt `Bán kính chi tiết:` + số hiện bên phải dạng `10 pixel` | 0,1 đến 50 px (xem ràng buộc dưới) | **10 px** |
| 2 | Thanh trượt `Bán kính làm mịn` + số `20 pixel` | 0,1 đến 200 px | **20 px** |
| 3 | Thanh trượt `Độ mạnh làm mịn:` + số `100 %` | 0 đến 100 % | **100 %** |
| 4 | Checkbox `Xem trước` | bật/tắt | **bật** |
| 5 | Nút `Áp dụng` (nút mặc định, Enter) | | |
| 6 | Nút `Huỷ` (Esc) | | |

- Thanh trượt rộng khoảng 300 px; bấm chuột vào thanh nhảy thẳng tới vị trí bấm (không cần kéo). Thang bán kính **không tuyến tính** (nhạy hơn ở giá trị nhỏ), thang độ mạnh tuyến tính.
- Bảng đo (bấm tại x px tính từ mép trái cửa sổ, ra số hiện trên nhãn): bán kính chi tiết x=30: 0,1; 60: 1,1; 100: 3,9; 140: 8,5; 180: 15; 220: 23; 260: 33; 300: 45; 316 (cuối): 50 (khi bán kính làm mịn lớn). Bán kính làm mịn x=30: 0,1; 60: 3,2; 100: 14; 140: 32; 180: 58; 220: 91; 260: 131; 316 (cuối): 200. Độ mạnh x=30: 0; 60: 11; 100: 25; 140: 39; 180: 53; 220: 67; 260: 80; 316: 100.
- Ràng buộc: bán kính chi tiết **không được lớn hơn** bán kính làm mịn. Kéo vượt thì thanh bị kẹp lại ở giá trị của thanh kia và hiện dòng chữ **đỏ** dưới thanh trượt thứ ba (đọc được: `Bán kính làm mịn không được nhỏ hơn bán kính chi tiết` khi kéo thanh làm mịn xuống dưới; thanh chi tiết bị kẹp thì có dòng tương ứng "chi tiết không được lớn hơn làm mịn", đọc được không trọn vì chữ đỏ nhỏ).
- Chữ số bên phải: lúc mở là `<số> pixel` có dấu cách; sau khi đổi giá trị đôi khi hiện `<số>pixel` (không dấu cách); số làm tròn một chữ số thập phân khi ≤ 10, nguyên khi > 10. Không phải yêu cầu cứng.
- **Nhớ giá trị**: sau `Áp dụng`, lần mở sau hộp thoại hiện đúng ba giá trị vừa dùng (đã thấy: chi tiết 20 / làm mịn 200 giữ sang lần sau). Sau `Huỷ`/Esc **không** lưu (đã kiểm: kéo độ mạnh tới 46 % rồi Esc, lần mở sau về 100 %). Khoá lưu và chỗ lưu không được xác định từ ngoài (7.4); bên cài đặt chọn cơ chế lưu của riêng mình, nhưng giá trị khi chưa lưu bao giờ phải là 10 / 20 / 100. Trạng thái "Xem trước" **không** thấy được nhớ (chưa kiểm kỹ).
- Có xem trước (chỉ đo kết quả cuối, chưa quan sát ảnh lúc xem trước): có checkbox `Xem trước` bật mặc định. Tắt `Xem trước` rồi `Áp dụng` cho kết quả **y hệt** (đã đo trên ảnh sọc, mục 7.1: 170/158 ở sọc 64).
- Hộp thoại **không** phụ thuộc `app.displayDialogs`.

## 3. Hành vi quan sát được (theo thứ tự)

Toàn bộ thao tác gộp thành **một mục History tên `DR7 Local Smoother`** (tên lấy từ History; mục này cũng có khi Huỷ, xem 3.4).

### 3.1 `Áp dụng`
1. Tạo **một layer ảnh (pixel) duy nhất** tên `Làm mịn cục bộ`: ArtLayer thường, Normal, opacity 100%, fill 100%, **không mask, không clipping**, bounds DOM = toàn canvas (vd [0,0,128,128]), mờ đục 100% trên toàn canvas (vùng chọn trong suốt = bounds toàn canvas). Sau lệnh không còn layer tạm nào (đã kiểm cây layer).
2. Vị trí: **ngay phía trên layer đang chọn** (đang chọn Background, trên Background; đang chọn layer ở giữa thì ngay trên layer đó, dưới các layer cao hơn). Đã đo: khi chọn Background và có layer `Top` ở trên, layer mới nằm giữa hai layer đó; khi chọn `Top`, layer mới nằm trên cùng.
3. Nội dung: là ảnh **gộp của layer đang chọn và các layer dưới nó** (layer cao hơn layer đang chọn không có mặt: pixel đỏ của layer `Top` không có trong layer mới khi đang chọn Background; có mặt khi đang chọn `Top`). Bên ngoài vùng làm mịn (3.2) pixel **bằng ảnh nguồn**; bên trong là kết quả làm mịn.
4. Vùng chọn bị bỏ (Deselect). Công cụ hiện hành, màu foreground/background **không đổi** (đã kiểm: Move giữ nguyên, 336699/996633 giữ nguyên). Layer đang chọn sau lệnh: layer mới.
5. Lệnh trả về khi hộp thoại đã đóng.

### 3.2 Đặc tính làm mịn (đo ngoài, xem 7.1, 7.2)

Ảnh sau lệnh = ảnh nguồn đã **giảm các biến thiên cục bộ có kích thước lớn hơn bán kính chi tiết** (đốm màu, loang tông), còn **giữ chi tiết mịn nhỏ hơn bán kính chi tiết** (lỗ chân lông, nét mảnh). Cụ thể:
- Với bán kính chi tiết 10 và làm mịn 20 (mặc định), sọc có chu kỳ 2 đến 16 px gần như **không đổi**; sọc chu kỳ 64 px giảm biên độ từ 32 xuống khoảng 12 mức (170/158 so với 180/148).
- Bán kính chi tiết **bằng hoặc lớn hơn** bán kính làm mịn: **hầu như không có thay đổi**.
- Bán kính chi tiết rất nhỏ (0,1) và làm mịn 20: mọi chu kỳ (2 đến 64 px) bị làm phẳng gần hết (biên độ 32 xuống khoảng 2).
- Độ mạnh tác động gần **tuyến tính** lên mức giảm: 0 % không đổi gì; 53 % giảm cỡ một nửa mức giảm của 100 % (sọc 64: mức giảm 10 so với 20).
- **Vùng áp dụng** = bên trong vùng chọn cộng một mép mềm lan **ra ngoài vùng chọn** cỡ **15 đến 20 px** (đo: vùng chọn cứng bắt đầu x=32, ảnh sọc 64 px, tại x=28 thay đổi 3 mức, tại x=20 thay đổi 2 mức, tại x=8 thay đổi 1 mức; ở phía dưới vùng chọn kết thúc y=330, cách 22 px: không đổi). Vùng chọn có feather vẫn hợp lệ nếu không phủ cả canvas.
- Kết quả **tất định** (hai lần ghi mốc cho histogram và cây layer y hệt, khoảng cách 0,0000).

### 3.3 Hộp gợi ý khi không có vùng chọn
Nếu **không có vùng chọn**, hoặc vùng chọn **phủ toàn bộ canvas** (đã thử: không chọn; Select All; vùng chọn feather 16 px nở ra toàn canvas), hộp thoại chính **không hiện**; thay vào đó là hộp ScriptUI modal cùng tiêu đề `SCCTLM_Foto: Làm mịn cục bộ` (khoảng 429 x 230 px, nền tối): bên trái một ảnh minh hoạ (khuôn mặt có vòng lasso quanh mắt), bên phải hai đoạn chữ nguyên văn:
- `Trước khi dùng công cụ, hãy dùng Lasso tạo vùng chọn quanh khu vực cần làm mịn.`
- `Để tránh biến dạng, đừng chọn cả khuôn mặt hay cả cơ thể, chỉ chọn từng vùng nhỏ để giữ độ trung thực của ảnh.`
- Một nút `Đóng` (rộng, dưới cùng). **Esc đóng; Enter không đóng** (đã thử, không có nút mặc định). Không có checkbox.
Sau khi đóng: không tạo layer, không đổi công cụ/màu/vùng chọn.

### 3.4 `Huỷ` / Esc ở hộp thoại chính
Không tạo layer (cây layer sau Esc chỉ còn layer gốc), công cụ, foreground/background không đổi. **Vùng chọn bị bỏ** (đã kiểm: sau Esc không còn vùng chọn; khác hẳn `Huỷ` của lệnh DB). Giá trị ba thanh không được lưu (mục 2). Mục History `DR7 Local Smoother` vẫn có (đã thấy tên này là mục cuối sau Esc; không đếm chắc số mục).

## 4. Đầu ra

- Cây layer sau `Áp dụng` (ảnh một layer Background): `Làm mịn cục bộ` (ArtLayer, NORMAL, Normal, 100, bounds [0,0,w,h]) trên `Background` (không đổi). Mốc: `ls.before.json` ba ảnh đều có cây này.
- Ảnh tổng hợp: thay đổi **nhỏ** so với ảnh gốc (mục 6: lưới điểm lệch trung bình 0,4 đến 2,8 mức, tối đa 18 mức tại nét tối hẹp). Histogram của ảnh tổng hợp **khác nhiều** histogram ảnh chưa xử lý về khoảng cách chuẩn hoá (0,42 đến 0,69) vì ảnh mẫu phẳng chỉ có vài đỉnh nên lệch 1 mức đã đổi bin; do đó **không** dùng histogram làm tiêu chí mềm (mục 6).
- Thông báo cho người dùng: chỉ các hộp thoại ở mục 2, 3.3, 5.

## 5. Lỗi và trường hợp biên

| Tình huống | Hành vi quan sát được |
|---|---|
| Không có tài liệu mở | Panel hiện "Chưa mở ảnh" - "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." và không gọi lệnh |
| Không có vùng chọn / chọn toàn bộ | Hộp gợi ý 3.3, không thay đổi gì |
| Có vùng chọn (cứng hoặc feather) | 3.1 |
| 16-bit RGB | Chạy y hệt 8-bit: hộp thoại chính, một layer `Làm mịn cục bộ`, mục History `DR7 Local Smoother`, ảnh vẫn 16-bit |
| CMYK, Grayscale | Không hộp thoại chính. Hiện MessageBox hệ thống (tiêu đề `Thông báo`, biểu tượng thông tin, một nút `OK`) nội dung nguyên văn: `Xin lỗi, script chỉ chạy ở chế độ màu RGB. Muốn đổi chế độ màu, vào Image/Mode/RGB Color.` Lệnh chặn tới khi đóng. Sau đó: không layer, công cụ/vùng chọn **giữ nguyên**, có mục History `DR7 Local Smoother` rỗng (đã thấy với Grayscale). Enter/Esc gửi bằng PostMessage không đóng được hộp này trong thử nghiệm (đóng bằng gửi lệnh Cancel tới cửa sổ); không phải yêu cầu hành vi. Lab/Indexed/Multichannel chưa thử |
| Chọn một layer ở giữa | Layer mới ngay trên layer đó; nội dung gộp từ layer đó trở xuống |
| Layer ẩn, group, layer có mask, smart object, nhiều layer trộn blend mode | **Chưa đo** (7.4) |
| Chạy hai lần liên tiếp | Mỗi lần thêm một layer `Làm mịn cục bộ` mới (không ghi đè); đã thấy hai layer cùng tên. Không khuyến nghị đưa vào test |
| Lỗi bên trong | Không kích hoạt được từ ngoài, không đo |

## 6. Ngưỡng chấp nhận

- Cây layer: số layer, loại (ArtLayer), kind (NORMAL), blend (Normal), opacity (100), thứ tự khớp mốc cho cả 3 ảnh mẫu; tên layer **khớp nguyên văn** `Làm mịn cục bộ` (hiển thị cho người dùng). Không mask, không layer tạm sót lại.
- History: đúng 1 mục mới `DR7 Local Smoother`.
- Vùng chọn bị bỏ sau `Áp dụng` và sau `Huỷ`; công cụ và màu không đổi.
- Hiệu ứng trên mốc (lưới 16x16 điểm tại 8k+4,5, đọc RGB ảnh tổng hợp, trường `samples` của `ls.before.json`): **khoảng cách trung bình** (lấy max ba kênh mỗi điểm) ≤ **1,5 mức** và **không quá 5 % điểm lệch quá 4 mức** so với mốc, trên cả 3 ảnh; điểm lệch tối đa ≤ **20** mức. Lý do: mốc xa ảnh chưa xử lý chỉ 0,4 đến 2,8 mức trung bình (tối đa 18), nên ngưỡng này loại được "không làm gì" ở ảnh 2 nhưng cho phép thuật toán khác chút. Cần chủ repo xác nhận hoặc thay bằng ngưỡng khác sau khi có bản cài đặt đầu tiên.
- Histogram: `compare-baselines.js` mặc định (0,02) **không** đạt được trừ khi khớp từng điểm ảnh (mục 4); bên cài đặt có thể dùng cờ `--max-histogram 0.8` chỉ để xác nhận cấu trúc, không dùng làm tiêu chí hiệu ứng. Cần chủ repo quyết định có thêm kiểm `samples` vào `compare-baselines.js` hay không.
- Đáp ứng tần số (tài liệu sọc, mục 7.1): với cấu hình mặc định, biên độ ở sọc 64 px trong khoảng 8 đến 16 mức (đo 12), sọc 2 đến 16 px giữ nguyên ±2 mức; với bán kính chi tiết 0,1 / làm mịn 20, mọi chu kỳ biên độ ≤ 6 mức; độ mạnh 0 không đổi; chi tiết ≥ làm mịn không đổi ±2 mức.
- Hộp thoại: đúng tiêu đề, nhãn, mặc định 10/20/100/bật, thứ tự điều khiển, ràng buộc chi tiết ≤ làm mịn, `Huỷ` không lưu, `Áp dụng` lưu; hộp gợi ý có đúng chữ và đóng bằng Esc.
- Thời gian: hộp thoại hiện ≤ 3 s sau khi nhấn nút (đo ~2 s gồm cả đợi khởi chạy). Thời gian áp dụng trên ảnh lớn **chưa đo**.

## 7. Cách đo các số liệu không có sẵn

Phương pháp chung: mỗi phép đo mở hộp thoại bằng lệnh ext, dùng chuột thật bấm vào thanh trượt (nhảy tới vị trí), chụp cửa sổ để đọc số, nhấn Enter hoặc Esc, rồi lấy mẫu RGB bằng color sampler trên ảnh tổng hợp. Mỗi lần đặt lại giá trị nhớ về mặc định trước khi đo. Kết quả lặp lại y hệt.

### 7.1 Đáp ứng theo chu kỳ sọc
Tài liệu RGB 256x384: nền `B89470` (G=148), sọc dọc `E8B490` (G=180) rộng nửa chu kỳ, 6 dải cao 64 px với chu kỳ 2, 4, 8, 16, 32, 64 px. Vùng chọn: x từ 32 đến 224 trên toàn chiều cao. Lấy mẫu G ở đỉnh/đáy giữa mỗi dải (x≥64). Bảng `G đỉnh/đáy` (gốc 180/148, biên độ 32):

| Cấu hình (chi tiết / làm mịn / độ mạnh) | P2 | P4 | P8 | P16 | P32 | P64 |
|---|---|---|---|---|---|---|
| 10 / 20 / 100 (mặc định) | 179/148 | 180/148 | 180/149 | 180/148 | 178/150 | 170/158 |
| 10 / 14 / 100 | 180/148 | 180/148 | 180/148 | 181/148 | 178/150 | 176/152 |
| 10 / 32 / 100 | 180/148 | 180/149 | 181/148 | 181/148 | 178/150 | 168/160 |
| 10 / 58 / 100 | 180/149 | 181/149 | 180/148 | 181/148 | 179/150 | 171/158 |
| 10 / 91 / 100 | 180/148 | 180/148 | 180/149 | 181/147 | 178/149 | 173/156 |
| 3,9 / 20 / 100 | 179/148 | 180/148 | 180/149 | 175/154 | 165/164 | 166/162 |
| 15 / 20 / 100 | 179/148 | 180/148 | 180/149 | 180/148 | 180/148 | 176/152 |
| 10 / 20 / 53 | 180/148 | 180/148 | 180/148 | 180/148 | 179/149 | 175/153 |
| 10 / 20 / 0 | 180/148 | 180/148 | 180/148 | 180/148 | 180/148 | 180/148 |
| 20 / 20 / 100 (chi tiết = làm mịn) | gốc, không đổi (khác nhau tối đa 1 mức) | | | | | |
| 0,1 / 20 / 100 | 165/162 | 166/162 | 166/164 | 166/163 | 165/164 | 166/162 |
| 0,1 / 14 / 100 | gần phẳng (≈165/163) ở P2 đến P32 | | | | | 172/156 |
| 0,1 / 200 / 100 | 176/152 | 176/152 | 176/152 | 176/152 | 176/153 | 175/153 |
| 20 / 200 / 100 | gốc | | | | | 179/149 |

Sai số đo: ±1 mức (làm tròn 8-bit, ±1 do vị trí lấy mẫu). Các hàng chỉ mô tả cách mức giảm thay đổi; không có công thức suy ra từ ngoài, bên cài đặt có thể xấp xỉ bằng lọc Gaussian chọn lọc theo tần số và nên kiểm lại bằng chính bảng này.

### 7.2 Mép vùng áp dụng (mục 3.2)
Hàng giữa dải P64 (y=352), vùng chọn cứng x từ 32 đến 224, cấu hình mặc định. Gốc > sau, G, mỗi 4 px: x=8: 180>179; 12: 180>179; 16: 180>178; 20: 180>178; 24: 180>177; 28: 180>177; (biên) 32: 148>145; 36: 148>146; 40: 148>148; 44: 148>150; 48: 148>151; 52: 148>153; 56: 148>151; 60: 148>150; ... bên phải: 216: 180>180; 220: 180>182; 224: 148>151; 228: 148>151; 236: 148>150; 244: 148>149; 252: 148>148. Tức mép mềm ra ngoài khoảng 15 đến 20 px; không thấy cạnh gấp tại biên vùng chọn.

### 7.3 Mốc ảnh mẫu
`ls.before.json`: ba ảnh tổng hợp 128x128 của `photoshop-baseline-record.jsx`, vùng chọn 16..112 (cứng), cấu hình mặc định. Lưới `samples` (256 điểm, tâm 8k+4,5): lệch so với ảnh gốc trung bình 0,91 / 2,78 / 0,45 mức (skin-gradient / two-tone-and-line / stripes), tối đa 3 / 18 / 3. Mẫu: ảnh skin-gradient hàng 7 tại x=4,28,52,76,100,124: (232,196,168) (230,195,165) (220,179,148) (208,164,133) (198,153,124) (196,151,122).

### 7.4 Không quan sát được / chủ repo xác nhận
- **Thuật toán chính xác** (loại lọc, bán kính hiệu dụng, cách trộn chi tiết, cách làm mềm mép): không đo được từ ngoài; chỉ có đáp ứng ở 7.1/7.2 và lưới `samples`. Bản cài đặt sẽ không khớp từng điểm; ngưỡng ở mục 6 là đề xuất cần chủ repo xác nhận.
- Mép mềm ngoài vùng chọn: chỉ biết cỡ 15 đến 20 px ở cấu hình mặc định; chưa đo phụ thuộc vào bán kính làm mịn.
- Nơi và cách lưu ba giá trị nhớ; có lưu trạng thái `Xem trước` hay không.
- Với layer ẩn, group, mask, smart object, blend mode phức tạp, Lab/Indexed/Multichannel, ảnh lớn (thời gian), tài liệu nhiều layer cao hơn layer đang chọn có ẩn không: chưa đo. Quy tắc "layer đang chọn trở xuống" suy ra từ hai thử nghiệm duy nhất.
- Quy tắc chính xác coi vùng chọn là "không có": chỉ thử không chọn, Select All và feather phủ toàn canvas. Vùng chọn phủ gần hết canvas (còn chừa vài px) chưa thử.
- Số mục History khi Huỷ/hộp gợi ý/lỗi chế độ màu (chỉ thấy tên mục cuối).
- Trạng thái của người dùng đã ghi và khôi phục: foreground/background (000000/FFFFFF), công cụ Brush, cọ không bị lệnh đổi. Giá trị nhớ của hộp thoại đã đặt lại về mặc định (10/20/100); không rõ người dùng có giá trị khác trước đó (lần mở đầu tiên đã hiện 10/20/100).

## Điểm nghi ngờ khi rà (do người viết tự liệt kê, bên rà thật sự phải kiểm lại)

1. Mục 2 "Trạng thái nhớ khi `Áp dụng`" và mục 3.4 "Vùng chọn bị bỏ khi Huỷ" là hành vi đo được, nhưng người rà nên kiểm xem cách diễn đạt có gợi cấu trúc điều khiển của mã gốc không.
2. Mục 3.2 nêu "giảm biến thiên lớn hơn bán kính chi tiết, giữ chi tiết mịn" và "chi tiết ≥ làm mịn thì không đổi": đây là mô tả hiện tượng đo được ở 7.1, nhưng tôi biết cấu trúc mã nên mô tả có thể bị ảnh hưởng; người rà đối chiếu với bảng 7.1.
3. Tên History `DR7 Local Smoother`, tên layer `Làm mịn cục bộ`, chuỗi hộp thoại: lấy từ giao diện Photoshop, không phải bình luận mã.
4. Cỡ 15 đến 20 px của mép mềm là từ đo; người viết không dùng hằng số trong mã.
5. Khoảng giá trị thanh trượt (0,1 đến 50 / 200) lấy từ số hiện trên nhãn khi bấm hai đầu thanh, không từ mã.
