# Đặc tả hành vi: Màu da chung (nút "Màu tổng", lệnh BTNPFSD2)

> Chỉ ghi hành vi quan sát được từ bên ngoài. Không tên biến/hàm, không đoạn mã, không hằng số chép từ mã.
> Quy tắc đầy đủ: `PROCESS.md`.

- Người viết: agent đặc tả (Claude)        - Ngày: 2026-10-25
- Người viết đã đọc mã gốc: **không**. Không mở `jsx/pfsd2.jsx`, `li`, `ss`, `4.jsxbin`, `ba`, `db`, `ds`, `ls`, `re`, `se`, `sh`, `tc`. Mọi số liệu đo từ ngoài trên Photoshop 23.2.0 bằng tài liệu tổng hợp. Chỉ đọc `index.html` và `js/panel.js` (mã panel, không phải module gốc) để biết nút và đường gọi.
- Người rà (không phải người viết): agent điều phối (Claude), 2026-10-25 — đã đọc lại, không thấy tên biến, đoạn mã hay hằng số chép từ mã; chưa từng mở mã gốc
- Mốc đối chứng: `tests/baselines/btnpfsd2.before.json`

## 1. Điểm vào

- Nút trong panel: tooltip "Màu da chung", nhãn hiển thị "Màu tổng", gọi `onClickButton('BTNPFSD2')`. Panel chạy qua đường "ext" (`$._ext_BTNPFSD2.run`; đã xác nhận hàm này tồn tại và gọi được không đối số). Không quan sát được phím tắt khác.
- Điều kiện cần: tài liệu **RGB** (8-bit hoặc 16-bit). Vùng chọn là tuỳ chọn. Không cần layer cụ thể.
- Panel tự chặn khi không có tài liệu: thông báo "Chưa mở ảnh" / "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." (hành vi của panel, không phải của lệnh).
- Lệnh **không có hộp thoại ScriptUI nào** khi chạy bình thường; chạy xong là trả về (khoảng 0,7 đến 1,3 giây). Giá trị trả về rỗng.
- Lưu ý cho bên cài đặt: lệnh phải gọi được như hàm không đối số. `tests/photoshop-baseline-record.jsx` hiện tra `$.dr7Commands[tên]` nên chưa gọi được lệnh ext; mốc được ghi bằng bản vá trong TEMP gọi `$._ext_BTNPFSD2.run`, chọn kênh composite trước khi lấy histogram.

## 2. Đầu vào

| Tham số | Nguồn | Khoảng giá trị | Mặc định |
|---|---|---|---|
| Vùng chọn | vùng chọn hiện có (mọi hình dạng, kể cả feather) | bất kỳ hoặc không có | không có = toàn ảnh |
| Nội dung ảnh | ảnh tổng hợp (composite) hiện thấy lúc chạy | RGB | |
| Màu foreground/background | **không ảnh hưởng kết quả** (đã thử đổi, kết quả y hệt) | | |

Không có hộp thoại nhập liệu, không hỏi người dùng.

## 3. Hành vi quan sát được (theo thứ tự)

Toàn bộ thao tác gộp thành **đúng 1 mục History**, tên `SCCTLM_Foto Màu tổng` (xác nhận trên tài liệu mới; History mặc định giữ 50 mục nên chỉ đếm được khi tài liệu ít mục).

1. Tạo layer group tên `Skin Color`, đặt ngay phía trên layer đang chọn (khi chỉ có Background thì nằm trên Background). Pass Through, 100%.
2. Trong group, từ dưới lên trên, tạo 4 layer (tên là chuỗi hiển thị, giữ nguyên văn):
   1. `c_1`: adjustment **Curves**, blend Color, 100%. **Mask = vùng chọn lúc chạy** (trắng trong vùng chọn, đen ngoài; feather được giữ: feather 8 px trên vùng 32..200 x 32..150 cho mask mềm, bounds DOM [12,12,220,170]; biên cứng thì bounds bằng bbox vùng chọn). **Không có vùng chọn**: mask trắng toàn ảnh. Đường cong là **đường thẳng (không đổi ảnh)** (mục 7.3); layer để người dùng chỉnh tay.
   2. `Shadows`: layer **Solid Color Fill** màu **RGB 246,211,185** (hex F6D3B9), blend **Multiply**, opacity **50%**, **clipping mask vào `c_1`**. Mask = mặt nạ vùng tối theo độ sáng ảnh (mục 7.1), **tính một lần lúc chạy từ ảnh tổng hợp rồi cố định** (sửa ảnh về sau không làm đổi mask; đã kiểm). Vì clip vào `c_1`, hiệu ứng chỉ xuất hiện trong vùng chọn.
   3. `c_2`: adjustment **Curves**, blend Color, 100%, mask **trắng toàn ảnh** (không phụ thuộc vùng chọn), đường cong thẳng như `c_1`.
   4. `Midtones & Highlights`: layer **Solid Color Fill** màu **RGB 246,202,173** (hex F6CAAD), blend **Color**, opacity **50%**, **clipping mask vào `c_2`**, mask = mặt nạ vùng giữa/sáng theo độ sáng ảnh (mục 7.1), cố định. Vì clip vào `c_2` (mask trắng), hiệu ứng áp **toàn ảnh**, kể cả ngoài vùng chọn.
3. Layer mask của **chính group** `Skin Color` được thêm vào và **đen hoàn toàn** (che hết), có hay không có vùng chọn. Vì vậy ngay sau lệnh ảnh nhìn thấy **không đổi** so với trước; người dùng tô trắng lên mask group để lộ hiệu ứng (kết quả khi mở mask: mục 7.2).
4. Vùng chọn bị bỏ khi lệnh xong. Layer đang chọn = mask của group, nên foreground/background hiện tự thành trắng FFFFFF / đen 000000 (màu cũ của người dùng bị thay; quan sát đổi từ 336699/996633 sang FFFFFF/000000).
5. Công cụ hiện hành **không bị đổi** (đang Move thì vẫn Move). Tuỳ chọn cọ không thấy đổi (xem 7.4).

## 4. Đầu ra

- Cây layer chuẩn (trên xuống dưới), kiểm bằng `tests/baselines/btnpfsd2.before.json` (vùng chọn 16..112 trên ảnh 128x128):
  1. `Skin Color`, LayerSet, Pass Through, 100%, mask đen toàn bộ
     1. `Midtones & Highlights`, SOLIDFILL, Color, 50%, clip vào `c_2`, bounds [0,0,w,h] trên các ảnh mẫu
     2. `c_2`, CURVES, Color, 100%, mask trắng, bounds [0,0,w,h]
     3. `Shadows`, SOLIDFILL, Multiply, 50%, clip vào `c_1`. Bounds DOM co lại bbox vùng mask khác 0 (ví dụ ảnh 256x192 có 32 hàng trắng tinh dưới đáy: [0,0,256,160]); không dùng bounds này làm tiêu chí cứng.
     4. `c_1`, CURVES, Color, 100%, mask = vùng chọn; bounds = bbox vùng chọn (ví dụ [16,16,112,112]) hoặc [0,0,w,h] khi không chọn
  2. các layer sẵn có (không đổi, không ẩn, không đổi tên)
- Vùng chọn: bị bỏ. Layer đang chọn: mask của group. Công cụ: không đổi. History: +1 mục.
- Ảnh tổng hợp **không đổi** sau lệnh (histogram trùng ảnh gốc; hai lần ghi mốc cho kết quả y hệt, `compare-baselines.js` PASS).
- Thông báo cho người dùng: không có khi thành công (chỉ có thông báo lỗi chế độ màu, mục 5).

## 5. Lỗi và trường hợp biên

| Tình huống | Hành vi quan sát được |
|---|---|
| Không có tài liệu mở | Panel hiện "Chưa mở ảnh" - "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." và không gọi lệnh. (Không gọi trực tiếp lệnh khi không có tài liệu: không thể đóng ảnh của người dùng.) |
| Không có vùng chọn | Chạy bình thường, đủ 4 layer, 1 mục History. `c_1` mask trắng toàn ảnh (bounds [0,0,w,h]). |
| Có vùng chọn (biên cứng) | `c_1` mask đúng hình vùng chọn (đo theo hàng ngang: đổi hẳn giữa pixel 15 và 16 với vùng chọn bắt đầu tại 16). `Shadows` chỉ có tác dụng trong vùng chọn; `Midtones & Highlights` vẫn toàn ảnh. |
| Vùng chọn có feather | `c_1` mask mềm theo feather, bounds mở ra ngoài vùng chọn khoảng 20 px mỗi phía với feather 8. |
| 16-bit RGB | Chạy y hệt 8-bit (cùng cây layer, tên, blend, opacity). |
| CMYK, Grayscale | **Không tạo layer, không History, không đổi màu/công cụ/vùng chọn**; thay vào đó hiện hộp thoại hệ thống Windows (MessageBox, tiêu đề `Thông báo`, biểu tượng thông tin, một nút `OK`) với nội dung nguyên văn: `Xin lỗi, script chỉ chạy ở chế độ màu RGB. Muốn đổi chế độ màu, vào Image/Mode/RGB Color.` Lệnh chặn tới khi đóng. Enter hoặc Esc đều đóng, kết quả như nhau. Lab/Indexed/Multichannel chưa thử. |
| Ảnh phẳng đúng xám 50% (808080) | Photoshop tự hiện cảnh báo gốc của nó "Warning: No pixels are more than 50% selected. The selection edges will not be visible." (nút OK; khoảng thời gian chặn tới khi đóng). Đóng bằng Enter thì lệnh chạy tiếp, ra kết quả bình thường (mask `Midtones & Highlights` = 128, `Shadows` = 169 trên mọi pixel). Hiệu ứng phụ của cách tạo vùng chọn từ độ sáng; bên cài đặt không bắt buộc sinh cảnh báo này. |
| Chạy lần 2 ngay sau lần 1 (group `Skin Color` đang là layer đang chọn, không còn vùng chọn) | Tạo thêm một group `Skin Color` mới **nằm lồng bên trong** group cũ, ở trên cùng, đủ 4 layer, `c_1` mask trắng toàn ảnh. Group cũ không đổi. Không khuyến nghị đưa vào test. |
| Hộp thoại ScriptUI / Esc | **Không có hộp thoại ScriptUI**; nên không có điều khiển, giá trị mặc định hay thứ tự tab để ghi. Chỉ có hộp thông báo lỗi chế độ màu ở trên. |

## 6. Ngưỡng chấp nhận

- Cây layer: khớp mốc đúng về số layer, loại (LayerSet / ArtLayer), kind (CURVES / SOLIDFILL / NORMAL), blend mode, opacity, thứ tự, clipping (`Midtones & Highlights` clip vào `c_2`; `Shadows` clip vào `c_1`). Tên layer **khớp nguyên văn**: `Skin Color`, `Midtones & Highlights`, `c_2`, `Shadows`, `c_1`. Bounds `c_1` theo vùng chọn; bounds các layer còn lại không kiểm chặt (mục 4). Mask group đen toàn bộ; `c_2` mask trắng; `c_1` mask theo vùng chọn.
- Màu 2 layer fill: đúng F6CAAD (`Midtones & Highlights`) và F6D3B9 (`Shadows`), sai số 0 (đọc từ thông tin layer, không phải đo ảnh).
- History: đúng 1 mục mới, tên `SCCTLM_Foto Màu tổng`.
- Histogram ảnh tổng hợp sau lệnh: khoảng cách chuẩn hoá trung bình ≤ **0.005** (ảnh không đổi; hai lần ghi mốc cho khoảng cách 0, nên ngưỡng chỉ để dự phòng làm tròn). Lưu ý: histogram không kiểm được mask/hiệu ứng, nên phần hiệu ứng phải kiểm bằng bảng 7.1 và 7.2.
- Hiệu ứng (bên cài đặt kiểm bằng script như mục 7): mask độ sáng trên dải xám lệch ≤ **±2** mức so với bảng 7.1, trên màu bất kỳ lệch ≤ **±8**; ảnh tổng hợp sau khi tô trắng mask group (bảng 7.2) lệch ≤ **±6** mức mỗi kênh. Phép đo của đặc tả là tất định (lặp lại cho kết quả y hệt, nhiễu đo 0); ngưỡng ±2/±8/±6 là dung sai cho cách tạo mask khác.
- Không có hộp thoại ScriptUI. Hộp thông báo chế độ màu: đúng chuỗi ở mục 5, Enter/Esc đều đóng.
- Thời gian: 0,74 s (256x192, 16-bit), 1,3 s (256x192, lần đầu), 0,94 s (3000x2000 có vùng chọn). Yêu cầu ≤ 3 s trên ảnh 3000x2000.
- Sau lệnh: vùng chọn bị bỏ, công cụ không đổi, ảnh nhìn thấy không đổi.

## 7. Cách đo các số liệu không có sẵn

Phương pháp chung: tạo tài liệu tổng hợp có ô màu phẳng 32x32 px, chọn toàn ảnh (hoặc vùng chọn cần thử), chạy lệnh, rồi (a) lần lượt chọn mask từng layer làm kênh đích và lấy mẫu giá trị xám bằng color sampler để biết mask; (b) tô trắng mask group (ngay sau lệnh mask group đang là kênh đích), chọn lại kênh RGB và lấy mẫu ảnh tổng hợp; (c) tắt/bật từng layer, đổi blend sang Normal để tách hiệu ứng từng layer.

### 7.1 Mặt nạ độ sáng của `Midtones & Highlights` (M) và `Shadows` (S)

Cả hai là hàm của cùng một "độ sáng" Y của pixel ảnh tổng hợp: M gần bằng chính Y (trên xám, M(v) = v ± 1); S là hàm giảm dần theo Y.

Xám (ô 32x32; giá trị v: M, S): 0: 0, 255; 8: 8, 249; 16: 15, 246; 24: 24, 242; 32: 32, 238; 40: 39, 234; 48: 47, 229; 56: 56, 224; 64: 64, 219; 72: 71, 214; 80: 80, 208; 88: 88, 202; 96: 96, 196; 104: 104, 189; 112: 112, 183; 120: 120, 176; 128: 128, 169; 136: 135, 162; 144: 144, 154; 152: 152, 146; 160: 160, 137; 168: 167, 129; 176: 175, 121; 184: 183, 112; 192: 192, 101; 200: 199, 92; 208: 208, 80; 216: 216, 69; 224: 223, 58; 232: 232, 43; 240: 240, 29; 255: 255, 0.

Với màu không xám, Y không phải trung bình đơn giản: đỏ thuần 255,0,0 cho M=128; lục thuần M=212; lam thuần M=60; vàng 239; lục lam (0,255,255) 223; tím đỏ (255,0,255) 142. Mô hình xấp xỉ khớp 64 điểm (sai số hiệu dụng 2,2 mức, lớn nhất 8): Y = 255 x căn bậc hai của (0,245 R^2 + 0,693 G^2 + 0,062 B^2) với R,G,B thuộc [0,1]; M = Y; S tra theo bảng xám ở trên (nội suy tuyến tính theo Y). Cũng có thể dùng thẳng bảng 64 màu ở 7.2 (nội suy 3 chiều).

### 7.2 Bảng 64 màu: mask và ảnh tổng hợp khi mở mask group

Chọn toàn ảnh trước lệnh (nên `c_1` mask trắng). Cột: màu nguồn R,G,B | M | S | màu tổng hợp sau khi tô trắng mask group (cả 4 layer bật). Thứ tự: R, rồi G, rồi B tăng dần (B đổi nhanh nhất), mỗi kênh lấy 0, 85, 170, 255.

| Nguồn | M | S | Sau |
|---|---|---|---|
| 0,0,0 | 0 | 255 | 0,0,0 |
| 0,0,85 | 14 | 247 | 1,1,73 |
| 0,0,170 | 38 | 235 | 4,3,143 |
| 0,0,255 | 60 | 221 | 7,5,209 |
| 0,85,0 | 70 | 215 | 11,78,4 |
| 0,85,85 | 75 | 212 | 15,80,74 |
| 0,85,170 | 83 | 206 | 18,82,142 |
| 0,85,255 | 95 | 197 | 21,83,207 |
| 0,170,0 | 141 | 157 | 35,148,17 |
| 0,170,85 | 144 | 154 | 39,152,82 |
| 0,170,170 | 147 | 150 | 43,154,143 |
| 0,170,255 | 155 | 143 | 47,156,203 |
| 0,255,0 | 212 | 73 | 74,208,45 |
| 0,255,85 | 214 | 71 | 79,212,100 |
| 0,255,170 | 217 | 66 | 85,215,153 |
| 0,255,255 | 223 | 58 | 92,219,206 |
| 85,0,0 | 38 | 235 | 82,1,0 |
| 85,0,85 | 43 | 232 | 85,3,73 |
| 85,0,170 | 56 | 224 | 85,5,140 |
| 85,0,255 | 73 | 212 | 88,8,208 |
| 85,85,0 | 82 | 207 | 91,81,8 |
| 85,85,85 | 85 | 204 | 93,83,77 |
| 85,85,170 | 93 | 198 | 95,85,143 |
| 85,85,255 | 104 | 189 | 98,87,209 |
| 85,170,0 | 147 | 150 | 107,155,25 |
| 85,170,85 | 149 | 148 | 109,157,87 |
| 85,170,170 | 155 | 143 | 113,160,149 |
| 85,170,255 | 161 | 136 | 117,163,209 |
| 85,255,0 | 217 | 66 | 137,218,57 |
| 85,255,85 | 219 | 64 | 141,221,110 |
| 85,255,170 | 223 | 58 | 147,225,164 |
| 85,255,255 | 227 | 51 | 152,228,214 |
| 170,0,0 | 84 | 205 | 158,6,2 |
| 170,0,85 | 86 | 203 | 159,7,70 |
| 170,0,170 | 94 | 198 | 162,11,138 |
| 170,0,255 | 104 | 189 | 162,14,203 |
| 170,85,0 | 108 | 186 | 166,85,14 |
| 170,85,85 | 112 | 183 | 167,87,80 |
| 170,85,170 | 118 | 178 | 169,90,145 |
| 170,85,255 | 127 | 170 | 171,93,209 |
| 170,170,0 | 162 | 135 | 176,160,34 |
| 170,170,85 | 166 | 131 | 180,164,96 |
| 170,170,170 | 169 | 128 | 183,166,155 |
| 170,170,255 | 175 | 121 | 186,169,214 |
| 170,255,0 | 226 | 53 | 199,227,71 |
| 170,255,85 | 229 | 49 | 204,231,123 |
| 170,255,170 | 232 | 43 | 208,235,174 |
| 170,255,255 | 237 | 33 | 210,241,230 |
| 255,0,0 | 128 | 169 | 222,14,8 |
| 255,0,85 | 130 | 167 | 226,18,73 |
| 255,0,170 | 134 | 163 | 227,20,136 |
| 255,0,255 | 142 | 156 | 228,26,198 |
| 255,85,0 | 147 | 151 | 232,93,26 |
| 255,85,85 | 148 | 149 | 234,97,88 |
| 255,85,170 | 152 | 146 | 236,100,149 |
| 255,85,255 | 158 | 139 | 237,103,207 |
| 255,170,0 | 188 | 105 | 240,168,52 |
| 255,170,85 | 191 | 102 | 243,173,110 |
| 255,170,170 | 193 | 99 | 246,176,164 |
| 255,170,255 | 200 | 90 | 250,181,218 |
| 255,255,0 | 239 | 30 | 255,238,95 |
| 255,255,85 | 242 | 24 | 255,243,150 |
| 255,255,170 | 247 | 12 | 255,249,207 |
| 255,255,255 | 255 | 0 | 255,255,255 |

Xám sau khi mở mask (cả 4 layer bật, chọn toàn ảnh): 0->0,0,0; 8->8,8,7; 16->16,15,14; 24->25,22,20; 32->33,29,27; 48->49,44,40; 64->66,58,54; 96->99,89,82; 128->133,120,111; 160->167,152,141; 192->202,184,172; 224->236,217,203; 232->242,227,216; 240->247,236,229; 255->255,255,255 (ngả cam ấm, nhiều hơn ở vùng sáng).

Tách hiệu ứng ở xám 128 khi mở mask: chỉ `Midtones & Highlights` cho 135,126,120; chỉ `Shadows` cho 127,122,118. Khi vùng chọn không phủ ô, chỉ còn phần `Midtones & Highlights` (ví dụ lúc chọn một góc ảnh: xám 128 ngoài vùng chọn 135,126,120; xám 32 trong vùng chọn 35,31,29).

### 7.3 Đường cong `c_1`, `c_2`

Đặt từng layer Curves về blend Normal, tắt các layer khác, chọn toàn ảnh: 64 màu và 32 mức xám đều ra đúng màu nguồn. Vậy đường cong là đường thẳng (không đổi ảnh) ở cả 3 kênh hoặc tương đương. Không đo được điểm neo; chỉ cần layer Curves hợp lệ, mở lên chỉnh được.

### 7.4 Không quan sát được

- Tham số cọ trước lệnh và việc lệnh có đặt cọ hay không: không đặt được tuỳ chọn công cụ từ ngoài nên chỉ biết cọ là 100 px, độ cứng 0%, opacity 100%, flow 15% trước và sau lệnh khi công cụ là Brush. Bên cài đặt không đổi cọ và không đổi công cụ (cần chủ dự án xác nhận).
- Công thức chính xác của mặt nạ độ sáng (7.1) và dữ liệu đường cong dựng sẵn: chỉ có đáp ứng đo.
- Hành vi với Lab, Indexed, Multichannel, nhiều tài liệu mở, layer đang chọn là smart object hoặc nằm trong group khác.
- Giá trị foreground/background ban đầu của phiên người dùng đã được ghi lại (000000/FFFFFF, Brush, 100/0/100/15) và đặt lại cuối phiên đo.
