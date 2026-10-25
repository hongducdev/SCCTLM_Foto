# Đặc tả hành vi: Đánh khối (nút "Đánh khối", lệnh DB)

> Chỉ ghi hành vi quan sát được từ bên ngoài. Không tên biến/hàm, không đoạn mã, không hằng số chép từ mã.
> Quy tắc đầy đủ: `PROCESS.md`.

- Người viết: agent đặc tả (Claude)        - Ngày: 2026-10-25
- Người viết đã đọc mã gốc: **không**. Không mở `jsx/db.jsx`, `pfsd2`, `wt`, `li`, `ss`, `4.jsxbin`, `ba`, `ds`, `ls`, `re`, `se`, `sh`, `tc`, `skin-*`. Mọi số liệu đo từ ngoài trên Photoshop 23.2.0 bằng tài liệu tổng hợp. Chỉ đọc `index.html` và `js/panel.js` (mã panel) để biết nút và đường gọi. Hai spec mẫu `wt.md`, `btnpfsd2.md` chỉ đọc để lấy khuôn.
- Người rà (không phải người viết): agent điều phối (Claude), 2026-10-25 — đã đọc lại, không thấy tên biến, đoạn mã hay hằng số chép từ mã; chưa từng mở mã gốc
- Mốc đối chứng: `tests/baselines/db.before.json` (cấu hình mặc định của hộp thoại, mục 6)

## 1. Điểm vào

- Nút trong panel: tooltip và nhãn "Đánh khối", gọi `onClickButton('DB')`; panel chạy qua đường "ext" (`$._ext_DB.run`; đã xác nhận hàm này tồn tại, gọi được không đối số, giá trị trả về rỗng).
- Điều kiện cần: tài liệu **RGB** (8-bit hoặc 16-bit đều chạy được). Vùng chọn là tuỳ chọn và chỉ có tác dụng trong một tổ hợp hẹp (mục 3.4). Không cần layer cụ thể.
- Panel tự chặn khi không có tài liệu: thông báo "Chưa mở ảnh" / "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." (hành vi panel; không thử gọi lệnh khi không có tài liệu vì không thể đóng ảnh của người dùng).
- Lệnh **luôn mở một hộp thoại ScriptUI modal** (mục 2) và chỉ chạy tiếp sau khi người dùng bấm. Với tài liệu không phải RGB, hộp thoại ScriptUI **không** hiện mà hiện hộp thông báo lỗi chế độ màu (mục 5).
- Ghi chú cho bên cài đặt: lệnh phải gọi được như hàm không đối số. `tests/photoshop-baseline-record.jsx` hiện tra `$.dr7Commands[tên]` nên chưa gọi được lệnh ext; mốc được ghi bằng bản vá trong TEMP gọi `$._ext_DB.run`, chọn kênh composite trước khi lấy histogram, và một vòng lặp ngoài nhấn Enter mỗi khi hộp thoại hiện.

## 2. Hộp thoại (ScriptUI, modal)

Tiêu đề cửa sổ: `SCCTLM_Foto: Dodge & Burn`. Cửa sổ rộng khoảng 346 px, cao khoảng 317 px (đo cả viền), nền tối. Nội dung từ trên xuống:

1. Khối chữ trợ giúp (2 đến 4 dòng, chữ vàng nhạt). **Lúc mới mở**: `Dodge (làm sáng) và Burn (làm tối) là kỹ thuật retouch thường dùng cho da, trang điểm, tạo khối, chỉnh sáng. Rê chuột lên từng tuỳ chọn để xem chi tiết.` Khi rê chuột ra khỏi tuỳ chọn nó đổi thành bản `... thường dùng để làm đều màu da, tạo khối, chỉnh sáng. Rê chuột lên đây để xem thông tin từng tuỳ chọn.` (hai bản chữ gần giống nhau, không rõ quy luật chọn bản; bên cài đặt dùng một trong hai là đạt).
2. Khung nhóm tiêu đề `Tuỳ chọn` chứa 4 checkbox (trên xuống dưới, nhãn nguyên văn):

| # | Nhãn | Mặc định | Ghi chú |
|---|---|---|---|
| 1 | `Tạo nhóm lớp Dodge_Burn` | **bật** | |
| 2 | `Thêm nhóm lớp chỉnh màu` | tắt | **bị vô hiệu hoá (xám, không bấm được) khi #1 tắt**; khi #1 bật mới bấm được |
| 3 | `Thêm nhóm lớp quan sát` | tắt | |
| 4 | `Đặt thông số cọ theo giá trị khuyến nghị` | tắt | |

   Mặc định luôn là bộ trên mỗi lần mở (không nhớ lựa chọn lần trước; đã kiểm).
3. Hai nút: `Huỷ` (trái), `Đồng ý` (phải). Enter = `Đồng ý` (nút mặc định); Esc = `Huỷ`.

Thứ tự Tab (bấm Tab liên tiếp từ lúc mở): #1 -> #2 -> #3 -> #4 -> `Huỷ` -> `Đồng ý`. (Tab từ #2 sang #3 diễn ra cả khi #2 bị vô hiệu hoá là chưa kiểm; ở trạng thái mặc định #2 bấm được.)

Khi rê chuột lên một checkbox, khối chữ trợ giúp đổi thành mô tả của checkbox đó (nguyên văn, đo bằng ảnh chụp cửa sổ):

- #1: `Tạo hai lớp (Dodge và Burn). Chọn mặt nạ của lớp Dodge hoặc Burn rồi tô cọ lên ảnh để làm sáng hay làm tối vùng mong muốn. Muốn xoá hiệu ứng thì đổi cọ sang màu đen (bấm "X" hoặc chọn biểu tượng cọ trên panel).`
- #2: `Thêm lớp Dodge_Burn cùng lớp Hue/Saturation. Tô cọ lên mặt nạ lớp để áp dụng Dodge/Burn. Sau đó có thể dùng lớp Hue/Saturation để chỉnh lại sai lệch màu phát sinh.`
- #3: `Thêm nhóm lớp quan sát tạm. Khi Dodge/Burn, hãy bật nhóm lớp này để thấy hiệu ứng rõ hơn.`
- #4: `Gợi ý: đặt cọ theo thông số Dodge_Burn khuyến nghị, flow 1%, hardness 0%, spacing 25%.`

(Tooltip kiểu hệ điều hành không chụp được; các mô tả trên là chữ trong khối trợ giúp.)

## 3. Hành vi quan sát được

Mọi thao tác của một lần chạy (kể cả khi người dùng không bật gì, bấm `Huỷ`, hay có lỗi chế độ màu) tạo **đúng 1 mục History tên `DR7 Dodge & Burn`**. Mục này tồn tại cả khi không có thay đổi nào (Esc, không tuỳ chọn nào bật, lỗi chế độ màu) - bên cài đặt cứ tạo mục này ngay khi lệnh bắt đầu.

### 3.1 `Huỷ` / Esc
Không tạo layer, không đổi công cụ, màu foreground/background, tuỳ chọn cọ; **vùng chọn được giữ nguyên**. (Chỉ còn mục History rỗng nói trên.)

### 3.2 `Đồng ý` với #1 tắt
Dù #2/#3/#4 thế nào, **#1 tắt thì chỉ #3 có tác dụng** (mục 3.5). Nếu #3 cũng tắt thì không có gì thay đổi: không layer, công cụ/màu/vùng chọn không đổi (vùng chọn **giữ**), chỉ còn mục History. #4 một mình (không có #1) cũng không làm gì quan sát được trên layer/công cụ/vùng chọn/màu (có đổi cọ hay không thì chưa kiểm được, xem mục 7).

### 3.3 Cấu hình mặc định (#1 bật, các ô khác tắt)
Tạo 2 layer Curves ở **gốc của tài liệu**, ngay phía trên layer đang chọn (khi chỉ có Background thì nằm trên Background). Từ trên xuống:
1. `Dodge [làm sáng]`: adjustment **Curves**, Normal, 100%, có layer mask. 
2. `Burn [làm tối]`: adjustment **Curves**, Normal, 100%, có layer mask.

Cả hai mask **đen hoàn toàn** (đo 0 ở mọi điểm, kể cả khi có vùng chọn cứng hay feather), nên ảnh nhìn thấy không đổi; bounds DOM của hai layer là [0,0,0,0] (mask đen). Hai đường cong có tác dụng khi người dùng tô trắng mask (mục 7.1). Khi chạy lúc layer đang chọn là một layer bên trong group, 2 layer được tạo bên trong group đó, ngay phía trên layer đang chọn (đã thử chạy 2 lần liên tiếp: lần 2 hai layer mới nằm trong group `Dodge (làm sáng)` của lần 1, trên cùng group).

Sau lệnh: công cụ hiện hành đổi thành **Brush**; layer đang chọn = mask của `Dodge [làm sáng]`; foreground/background hiện thành **trắng FFFFFF / đen 000000** (màu mặc định của mask, màu cũ của người dùng mất; vd 336699/996633 -> FFFFFF/000000). Vùng chọn bị bỏ. Tuỳ chọn cọ **không đổi** (đã thấy cọ 100 px, hardness 0, opacity 100, flow 15 giữ nguyên trước và sau khi chạy mặc định).

### 3.4 #2 bật (cùng #1): bọc mỗi layer trong một group có Hue/Saturation
Thay vì 2 layer trần ở gốc, tạo (trên xuống dưới):
1. Group `Dodge (làm sáng)`: LayerSet, Pass Through, 100%, có mask **đen hoàn toàn** (đo 0).
   1. `Lớp Hue/Saturation`: adjustment Hue/Saturation, Normal, 100%, mask trắng (255).
   2. `Dodge [làm sáng]`: Curves, Normal, 100%, mask **trắng** (255).
2. Group `Burn (làm tối)`: như trên, trong đó `Lớp Hue/Saturation` rồi `Burn [làm tối]` (Curves, mask trắng).

(Trong trường hợp này mask chặn nằm ở group, không ở layer Curves; mask trắng/đen khớp bảng đo ở trên với mọi vùng chọn.) `Lớp Hue/Saturation` ở trạng thái gần trung tính: đổi ảnh tối đa 1 mức (vd cam 255,128,0 thành 255,127,0), không khả kiến trên xám. Layer đang chọn sau lệnh = mask của group `Dodge (làm sáng)`; tool = Brush; fg/bg = FFFFFF/000000; vùng chọn bỏ; tuỳ chọn cọ không đổi.

### 3.5 #3 bật: nhóm lớp quan sát
Tạo group `Lớp quan sát đen trắng`: LayerSet, Pass Through, 100%, **ẩn (không nhìn thấy)**, **không có mask**. Bên trong (trên xuống dưới):
1. `Tăng tương phản`: adjustment Curves, Normal, 100%, ẩn, mask trắng 255.
2. `Lớp đen trắng`: **Solid Color Fill** màu **xám 128,128,128** (đọc từ thông tin layer), blend **Color**, 100%, ẩn, mask như dưới.

Nhóm này nằm **trên cùng** của mọi thứ lệnh tạo ra (trên các group/layer ở 3.3 hoặc 3.4) và là **layer đang chọn** sau lệnh. Vì layer đang chọn là group không mask nên foreground/background **không đổi**. Mask của `Lớp đen trắng`:

- Khi #1 bật: trắng toàn ảnh, bất kể vùng chọn (đo 255 ở các điểm trong lẫn ngoài vùng chọn cứng).
- Khi #1 tắt: **bằng vùng chọn** nếu có (cứng: đo 0 ở x=2,6,7 và 255 từ x=8 với vùng chọn bắt đầu tại 8; feather 6 px: mask mềm, đo 66, 126, 126, 157, 171, 184, 208, 239, 255 tại x=2,6,7,8,9,10,12,16,32 trên hàng giữa); trắng toàn ảnh nếu không có vùng chọn. Bounds DOM theo bbox vùng chọn (vd [8,8,56,56]).
- `Tăng tương phản` luôn mask trắng.

Công cụ: **không đổi** nếu #1 tắt (đã thấy Move giữ nguyên); đổi sang Brush nếu #1 bật. Vùng chọn bị bỏ khi #3 có tác dụng.

### 3.6 #4 bật (cùng #1)
Đặt tuỳ chọn cọ của công cụ Brush: **đường kính 300 px, hardness 0%, opacity 100%, flow 1%, spacing 25%** (đọc lại từ tuỳ chọn công cụ sau lệnh: diameter 300, hardness 0, opacity 100, flow 1, spacing 25, mode Normal). Công cụ hiện hành đổi thành Brush. Không có dấu hiệu quan sát khác.

### 3.7 Tổ hợp
Các khối cộng gộp: #1+#2+#3(+#4) cho 3 nhóm từ trên xuống `Lớp quan sát đen trắng`, `Dodge (làm sáng)`, `Burn (làm tối)` rồi layer sẵn có; layer đang chọn = nhóm quan sát; fg/bg không đổi. #1+#3 (không #2): nhóm quan sát, rồi `Dodge [làm sáng]`, `Burn [làm tối]` trần. #3 không #1: chỉ nhóm quan sát. Đã kiểm các tổ hợp: {#1}, {#1,#2}, {#1,#3}, {#1,#4}, {#1,#2,#3,#4}, {#1,#3,#4}, {} , {#3}, {#3,#4}, {#4}.

## 4. Đầu ra (cây layer chuẩn)

Mặc định (ghi trong mốc): `Dodge [làm sáng]` (CURVES, Normal, 100%, bounds [0,0,0,0]) trên `Burn [làm tối]` (CURVES, Normal, 100%, [0,0,0,0]) trên `Background` (không đổi). Composite **không đổi** sau lệnh (histogram trùng ảnh gốc ở mọi cấu hình, vì mọi mask Dodge/Burn đều ẩn hiệu ứng; nhóm quan sát ẩn). Hai lần ghi mốc cho kết quả y hệt, `compare-baselines.js` PASS.

## 5. Lỗi và trường hợp biên

| Tình huống | Hành vi quan sát được |
|---|---|
| Không có tài liệu mở | Panel hiện "Chưa mở ảnh" - "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." và không gọi lệnh |
| Không có vùng chọn | Mọi cấu hình chạy như mục 3; riêng `Lớp đen trắng` trắng toàn ảnh |
| Vùng chọn cứng / feather | Chỉ ảnh hưởng mask `Lớp đen trắng` khi #1 tắt, #3 bật (3.5). Các layer khác không phụ thuộc vùng chọn. Vùng chọn bị bỏ sau khi lệnh có tạo gì; được giữ khi Huỷ hoặc khi không tạo gì |
| 16-bit RGB | Chạy y hệt 8-bit (cùng cây layer, tên, blend, opacity) |
| CMYK, Grayscale | Không hiện hộp thoại ScriptUI; hiện MessageBox hệ thống Windows (tiêu đề `Thông báo`, biểu tượng thông tin, một nút `OK`) nội dung nguyên văn `Xin lỗi, script chỉ chạy ở chế độ màu RGB. Muốn đổi chế độ màu, vào Image/Mode/RGB Color.` Lệnh chặn tới khi đóng (Enter hoặc Esc đều đóng). Không layer, không đổi công cụ/màu/vùng chọn; có mục History `DR7 Dodge & Burn` rỗng. Lab/Indexed/Multichannel chưa thử |
| `Huỷ` (nút) hoặc Esc | 3.1 |
| Chạy lần 2 ngay sau lần 1 | Không lỗi, không hỏi lại; layer mới vào trong group đang chọn nếu có (3.3). Không khuyến nghị đưa vào test |
| Hộp thoại | Đủ ở mục 2. Khi mở, chưa bấm gì thì Enter cho kết quả mặc định (3.3) |

## 6. Ngưỡng chấp nhận

- Cây layer: khớp mốc đúng về số layer, loại (LayerSet / ArtLayer), kind (CURVES / HUESATURATION / SOLIDFILL / NORMAL), blend mode, opacity, thứ tự, trạng thái ẩn/hiện, có/không mask, và tên **nguyên văn**: `Dodge [làm sáng]`, `Burn [làm tối]`, `Dodge (làm sáng)`, `Burn (làm tối)`, `Lớp Hue/Saturation`, `Lớp quan sát đen trắng`, `Tăng tương phản`, `Lớp đen trắng`. Mask: giá trị 0/255 như mục 3 (sai số 0; feather: ±8 mức so với bảng 3.5, cách làm mềm khác nhau).
- History: đúng 1 mục mới `DR7 Dodge & Burn` mỗi lần chạy (cả Huỷ).
- Histogram composite sau lệnh: khoảng cách chuẩn hoá trung bình ≤ **0.005** (ảnh không đổi; hai lần ghi mốc cho khoảng cách 0).
- Hiệu ứng (kiểm bằng script như mục 7): bảng 7.1 sai lệch ≤ **±2** mức mỗi kênh (phép đo tất định; ±2 cho dung sai làm tròn của đường cong khác); `Lớp đen trắng` trên màu bất kỳ ≤ **±3** (cách tính độ sáng khác nhau).
- Hộp thoại: đúng tiêu đề, văn bản nhãn, mặc định, thứ tự Tab, nút Huỷ/Đồng ý, nút mặc định Enter, #2 vô hiệu khi #1 tắt; khối trợ giúp đổi theo rê chuột là **nên có** (không kiểm tự động).
- Thời gian (từ lúc nhấn Enter tới lúc lệnh trả về, đo bằng script nhấn Enter ngoài, đã trừ khoảng trễ của script nhấn): khoảng 1 s trên ảnh 64x64 và khoảng 2 s trên ảnh 3000x2000 có vùng chọn. Yêu cầu ≤ 3 s trên 3000x2000.
- Sau lệnh: xem 3.3-3.6 (công cụ, fg/bg, vùng chọn, layer đang chọn).

## 7. Cách đo các số liệu không có sẵn

Phương pháp chung: tạo tài liệu tổng hợp có dải xám 32 ô (0, 8, 16 ... 240, 255) hoặc 40 ô màu phẳng 32x32 px, chạy lệnh với cấu hình cần đo (bấm checkbox bằng chuột thật vào cửa sổ; bấm Enter), rồi (a) lấy mẫu giá trị xám của từng mask bằng color sampler sau khi chọn mask làm kênh đích; (b) tô trắng mask của layer/group cần đo, ẩn các layer khác, chọn lại kênh RGB, lấy mẫu composite; (c) bật nhóm quan sát (nó ẩn lúc đầu) và lấy mẫu. Phép đo lặp lại cho kết quả y hệt (nhiễu 0).

### 7.1 Đáp ứng đường cong trên xám (ô xám v, giá trị sau khi layer ở mask trắng, các layer khác ẩn)

Dải v = 0, 8, 16 ... 240, 255 (32 mức):

- `Dodge [làm sáng]`: 0 12 23 35 47 58 69 81 92 102 113 123 133 142 151 160 168 176 183 190 196 203 208 214 219 224 229 234 238 243 247 255 (vd 32->47, 64->92, 96->133, 128->168, 160->196, 192->219, 224->238).
- `Burn [làm tối]`: 0 4 9 13 17 22 27 31 36 42 47 53 59 66 73 80 88 96 105 114 124 133 144 154 165 176 187 198 210 221 233 255 (vd 32->17, 64->36, 96->59, 128->88, 160->124, 192->165, 224->210).
- `Tăng tương phản` (nhóm quan sát bật, chỉ layer này): 0 2 5 8 11 15 20 26 34 43 53 64 76 89 102 116 129 143 157 170 182 194 205 215 223 230 236 241 245 248 251 255 (đường chữ S: tối đi ở vùng tối, sáng lên ở vùng sáng; 128->129).

Cả ba áp **theo từng kênh R/G/B độc lập** (không theo độ sáng): trên màu 255,128,0 Dodge cho 255,168,0, Burn cho 255,88,0, Tăng tương phản cho 255,129,0; trên 217,130,130 Dodge cho 234,170,170, Burn cho 200,90,90.

### 7.2 `Lớp đen trắng` (khi bật cùng `Tăng tương phản`)
Solid fill xám 128 ở blend Color: chuyển ảnh về xám giữ độ sáng. Trên xám không đổi (ô xám 0..255 vẫn y nguyên). Trên màu: 255,0,0 -> 76; 255,128,0 -> 152; 255,255,0 -> 227; 128,255,0 -> 189; 0,255,0 -> 150; 0,255,127 -> 164; 0,255,255 -> 179; 0,128,255 -> 104; 0,0,255 -> 28; 127,0,255 -> 66; 255,0,255 -> 105; 255,0,128 -> 91 (nhiễu 0, giá trị xám). Khi cả hai layer của nhóm bật: kết quả bằng đen trắng rồi tăng tương phản (vd đỏ 255,0,0 -> 48; vàng -> 246).

### 7.3 Không quan sát được

- Dữ liệu điểm neo của các đường cong: chỉ có đáp ứng đo (7.1). `Lớp Hue/Saturation`: giá trị thông số không đọc được; chỉ biết gần trung tính (≤1 mức).
- Lệnh có đặt cọ khi #4 bật mà #1 tắt hay không: chưa kiểm được (xem báo cáo, không đặt lại được cọ từ ngoài).
- Quy luật chọn bản chữ trợ giúp lúc đầu (mục 2), tooltip OS, vị trí cửa sổ.
- Hành vi với Lab, Indexed, Multichannel, nhiều tài liệu mở, layer đang chọn là smart object.
- Giá trị foreground/background/công cụ/cọ ban đầu của phiên người dùng (000000/FFFFFF, Brush, 100/0/100/15) đã ghi lại; fg/bg và công cụ đã đặt lại; **cọ không đặt lại được** (hiện 300/0/100/flow 1; không đặt được tuỳ chọn công cụ từ ngoài, "Set" báo không khả dụng).
