# Đặc tả hành vi: Trắng Răng (teeth whitening)

> Chỉ ghi hành vi quan sát được từ bên ngoài. Không tên biến/hàm, không đoạn mã, không hằng số chép từ mã.
> Quy tắc đầy đủ: `PROCESS.md`.

- Người viết: agent đặc tả (Claude)        - Ngày: 2026-10-24
- Người viết đã đọc mã gốc: **không** (không mở `jsx/wt.jsx`; mọi số liệu đo từ ngoài trên Photoshop 23.2.0)
- Người rà (không phải người viết): agent điều phối (Claude), 2026-10-24 — đã đọc lại, không thấy tên biến, đoạn mã hay hằng số chép từ mã; chưa từng mở jsx/wt.jsx
- Mốc đối chứng: `tests/baselines/wt.before.json`

## 1. Điểm vào

- Nút trong panel: "Trắng Răng", gọi `onClickButton('WT')`. Panel chạy lệnh qua đường "ext" của `js/panel.js`
  (không phải bảng `$.dr7Commands`). Không có phím tắt khác được quan sát.
- Điều kiện cần: tài liệu RGB (8-bit hoặc 16-bit). Vùng chọn là tuỳ chọn. Không cần layer cụ thể.
- Panel tự chặn khi không có tài liệu: hiện thông báo "Chưa mở ảnh" / "Hãy mở ảnh trong Photoshop trước khi chạy lệnh."
  (hành vi của panel, không phải của lệnh).
- Lưu ý cho bên cài đặt: lệnh phải gọi được như hàm không đối số, trả về khi người dùng đã đóng hộp thoại cuối (xem 3.6).
  `tests/photoshop-baseline-record.jsx` hiện tra `$.dr7Commands[tên]` nên chưa gọi được lệnh này; xem mục 7.

## 2. Đầu vào

| Tham số | Nguồn | Khoảng giá trị | Mặc định |
|---|---|---|---|
| Vùng răng | vùng chọn hiện có (mọi hình dạng, kể cả có feather) | bất kỳ hoặc không có | không có = toàn ảnh |
| "Đặt cọ theo thông số khuyến nghị" | checkbox trong hộp thoại cuối | bật/tắt | bật |
| "Không hiện lại cửa sổ này" | checkbox trong hộp thoại cuối | bật/tắt | tắt |

Không có hộp thoại nhập liệu trước khi xử lý; lệnh chạy ngay.

## 3. Hành vi quan sát được (theo thứ tự)

Toàn bộ thao tác (3.1 đến 3.5) gộp thành **đúng 1 mục History**, tên `DR7 Whiten Teeth`. Mục này chỉ hiện sau khi hộp thoại
ở 3.6 đóng (trong lúc hộp thoại mở, History chưa có mục mới).

1. Tạo layer group tên `Làm trắng răng`, đặt **ngay phía trên layer đang chọn** (đang chọn Background thì nằm trên
   Background; đang chọn layer giữa thì nằm ngay trên layer đó). Blend mode Pass Through, opacity 100%.
2. Trong group, tạo adjustment layer **Hue/Saturation** tên `Whiten Teeth` (tạo trước, nằm dưới), Normal, opacity 100%.
   Layer mask của nó chính là vùng chọn lúc chạy: trắng trong vùng chọn, đen ngoài; vùng chọn có feather thì mask mềm theo
   đúng feather (đo feather 8 px: giá trị chuyển mượt, rộng cỡ 16 px quanh biên). Không có vùng chọn: mask trắng toàn ảnh.
   Hiệu ứng đo được ở mục 7.1 (giảm bão hoà vùng vàng, hầu như không đổi màu xanh lục / xám).
3. Trong group, tạo adjustment layer **Curves** tên `Tăng độ bóng`, nằm **trên** `Whiten Teeth`, Normal, opacity **50%**.
   Mask của nó trắng toàn ảnh (không phụ thuộc vùng chọn). Đường cong làm sáng vùng giữa (số đo ở 7.2).
4. Layer mask của **chính group** `Làm trắng răng` được thêm vào và để **đen hoàn toàn** (che hết). Vì vậy ngay sau lệnh
   ảnh nhìn thấy **không đổi** so với trước; người dùng phải tô trắng lên mask group để lộ hiệu ứng.
5. Vùng chọn bị bỏ (Deselect) khi lệnh xong. Layer đang chọn = mask của group (kênh mục tiêu là mask, nên
   foreground/background tự thành trắng/đen theo quy tắc của Photoshop khi chọn mask; màu cũ trở lại khi chọn layer khác).
6. Công cụ hiện hành đổi sang **Brush (Paintbrush)**. Rồi hiện hộp thoại modal (cửa sổ ScriptUI, tiêu đề
   `SCCTLM_Foto: Làm trắng răng`, khoảng 446x266 px, nền tối), nội dung theo thứ tự trên xuống:
   - Dòng 1: `Vẫn chưa thấy thay đổi!`
   - Dòng 2: `Hãy chọn mặt nạ lớp 'Làm trắng răng' rồi tô lên vùng răng.`
   - Dòng 3: `Bạn cũng có thể mở nhóm ra và chỉnh opacity của lớp để điều chỉnh hiệu ứng.`
   - Checkbox `Đặt cọ theo thông số khuyến nghị` (mặc định **bật**)
   - Checkbox `Không hiện lại cửa sổ này` (mặc định **tắt**)
   - Nút `Đồng ý` (nút mặc định: Enter đóng; Esc cũng đóng và kết quả y hệt Enter, History vẫn được ghi).
   Lệnh chặn (không trả về) cho đến khi hộp thoại đóng. Hộp thoại hiện ra dưới ~1 giây sau khi bấm nút.
   Hộp thoại **không** phụ thuộc `app.displayDialogs` (đặt NO vẫn hiện). Tự động hoá phải bấm Enter vào cửa sổ này.
7. Thông số cọ quan sát được lúc hộp thoại mở (cả khi checkbox thứ nhất bật lẫn tắt, hai trường hợp không phân biệt được
   trong thử nghiệm): Brush, đường kính 100 px, độ cứng 0%, opacity 100%, flow 15%, blend Normal. Không xác định được
   giá trị trước đó của cọ nên không biết lệnh có thật sự ghi đè hay không (xem mục 7.4).

## 4. Đầu ra

- Cây layer (đầu ra chuẩn, trên xuống dưới), kiểm bằng `tests/baselines/wt.before.json`:
  1. `Làm trắng răng`, layer group, Pass Through, 100%, có mask (đen toàn bộ), bounds DOM [0,0,w,h]
     1. `Tăng độ bóng`, Curves, Normal, 50%, mask trắng toàn ảnh, bounds [0,0,w,h]
     2. `Whiten Teeth`, Hue/Saturation, Normal, 100%, mask = vùng chọn; bounds bằng bbox vùng chọn
        (ví dụ chọn 16..112: bounds [16,16,112,112]; không chọn: [0,0,w,h])
  2. các layer sẵn có (không đổi, không bị ẩn hay đổi tên)
- Vùng chọn: bị bỏ. Layer đang chọn: mask của group. Công cụ: Brush. Số mục History thêm: 1.
- Ảnh tổng hợp không đổi (histogram trùng ảnh gốc; đã kiểm: khoảng cách 0 giữa 2 lần ghi mốc).
- Thông báo: chỉ hộp thoại ở 3.6 (lệnh không dùng alert khác).

## 5. Lỗi và trường hợp biên

| Tình huống | Hành vi quan sát được |
|---|---|
| Không có tài liệu mở | Panel hiện "Chưa mở ảnh" - "Hãy mở ảnh trong Photoshop trước khi chạy lệnh." và không gọi lệnh. (Không gọi trực tiếp lệnh khi không có tài liệu: không thể đóng ảnh của người dùng.) |
| Không có vùng chọn | Chạy bình thường, đủ 3 layer, 1 mục History, hộp thoại vẫn hiện. Mask `Whiten Teeth` trắng toàn ảnh, bounds [0,0,w,h]. |
| Có vùng chọn | Như mục 3. Mask `Whiten Teeth` theo hình vùng chọn, biên cứng nếu không feather. |
| Vùng chọn feather | Mask `Whiten Teeth` mềm, bounds mở rộng ra cả ảnh (feather 8 px trên vùng 16..112: bounds [0,0,128,128]). |
| 16-bit RGB | Chạy y hệt 8-bit (cùng cây layer, cùng History, cùng hộp thoại). |
| CMYK, Grayscale | **Không làm gì**: không layer, không History, không hộp thoại, không báo lỗi, không đổi công cụ, vùng chọn giữ nguyên, giá trị trả về rỗng. Lab/Indexed/Multichannel chưa thử. |
| Đóng hộp thoại bằng Esc | Giống bấm `Đồng ý`. |
| Chạy lại trên ảnh đã có group `Làm trắng răng` | Tạo thêm một group mới (không cập nhật/ghi đè group cũ); thử nghiệm cho thấy cây có thể lồng nhau, không dựa vào được. Không khuyến nghị đưa vào test. |
| Tích "Không hiện lại cửa sổ này" | **Không thử** (có thể ghi cấu hình vĩnh viễn trên máy người dùng). Dự đoán: lần sau không hiện hộp thoại; cần chủ dự án xác nhận. |

## 6. Ngưỡng chấp nhận

- Cây layer: khớp mốc đúng về số layer, loại (LayerSet / ArtLayer), kind (CURVES / HUESATURATION / NORMAL), blend mode,
  opacity, thứ tự. Tên layer: **khớp nguyên văn** `Làm trắng răng`, `Tăng độ bóng`, `Whiten Teeth` (là chuỗi hiển thị
  cho người dùng). Mask: group có mask đen toàn bộ; Curves mask trắng; Hue/Sat mask theo vùng chọn.
- History: đúng 1 mục mới, tên `DR7 Whiten Teeth`.
- Histogram (ảnh tổng hợp sau lệnh): khoảng cách chuẩn hoá trung bình ≤ **0.005**. Hai lần ghi mốc cho khoảng cách
  **0.0000** (kết quả tất định, vì ảnh không đổi khi mask group đen), nên ngưỡng 0.005 chỉ để dự phòng làm tròn.
  (Ngưỡng mặc định 0.02 của `compare-baselines.js` cũng đạt nhưng lỏng hơn mức cần.)
- Số đo hiệu ứng (khi mở mask group; bên cài đặt kiểm thêm bằng tay hoặc script): đầu ra Curves (7.2) lệch ≤ **±2** mức
  trên 0..255 so với bảng; đầu ra Hue/Saturation (7.1) lệch ≤ **±3** mức trên mỗi kênh so với bảng.
- Hộp thoại: nội dung và thứ tự điều khiển như 3.6; mặc định: checkbox 1 bật, checkbox 2 tắt; Enter/Esc đóng.
- Thời gian: hộp thoại hiện ≤ 2 giây trên ảnh 128x128; ảnh lớn chưa đo.
- Vùng chọn bị bỏ sau lệnh; công cụ cuối là Brush; ảnh nhìn thấy không đổi.

## 7. Cách đo các số liệu không có sẵn

Phương pháp chung: tạo tài liệu tổng hợp có các ô màu phẳng 32x32 px, chọn toàn ảnh, chạy lệnh, đóng hộp thoại bằng Enter,
**xoá mask của group** (để lộ hiệu ứng), rồi lấy mẫu màu giữa từng ô bằng color sampler, ở bốn trạng thái: (a) tắt cả
2 layer điều chỉnh, (b) chỉ Curves ở 100%, (c) chỉ Hue/Saturation, (d) cả hai (Curves 50%).

### 7.1 Hue/Saturation `Whiten Teeth` (giữ opacity 100%)

- Xám trung tính (mọi mức): **không đổi**. Lightness/hue toàn cục không đổi.
- Hiệu ứng là giảm bão hoà tập trung ở **dải vàng**. Đo trên ô S=100%, V=100% (HSB), cột: hue nguồn -> RGB sau:
  0°: 255,0,0 -> 242,12,12; 15°: 255,64,0 -> 242,69,12; 30°: 255,128,0 -> 185,127,69; 45°: 255,191,0 -> 128,127,126;
  60°: 255,255,0 -> 127,127,127; 75°: 191,255,0 -> 127,127,127; 90°: 128,255,0 -> 127,190,64; 105°: 64,255,0 -> 64,254,1;
  120°: 0,255,0 -> 0,255,0; 135°: 0,255,64 -> không đổi; 150°: 0,255,127 -> 12,242,126; 165°: 0,255,191 -> 25,230,178;
  180°: 0,255,255 -> 25,228,229; 210°: 0,128,255 -> 25,127,229; 240°: 0,0,255 -> 25,25,229; 270°: 127,0,255 -> 126,19,235;
  300°: 255,0,255 -> 242,12,241; 330°: 255,0,128 -> 242,12,127.
- Tóm tắt: bão hoà về 0 (tức xám) cho hue khoảng 45° đến 75°; giảm dần về ~50% ở 30° và 90°; gần như không đổi từ ~105° đến ~135°;
  ở các hue còn lại giảm nhẹ 5% đến 11% (sâu nhất quanh 165°-255° với bão hoà cao).
- Ô bão hoà vừa (S=50%, V=90%): 60°: 229,229,115 -> 172,172,172; 30°: 229,172,115 -> 198,172,146; 120°: không đổi;
  180°: 115,229,229 -> 126,217,217; 0°: 229,115,115 -> 223,120,120.
- Ô "răng" (hex nguồn -> sau): E8D8A0 -> C4C4C4; F0E0B0 -> D0D0D0; D8C080 -> AEADAA; C8B070 -> 9E9D9A (giá trị 158,157,154);
  FFF8E0 -> EFEFEF; F5F0E6 -> 238,237,236.
- Số đo đầy đủ trên 3 bộ ô nằm trong các lần chạy nháp (không lưu trong repo); bảng trên đủ để tái tạo bằng cách thử
  tham số Hue/Saturation (dải Yellows, giảm bão hoà) cho đến khi khớp trong ngưỡng ±3.

### 7.2 Curves `Tăng độ bóng` (đo ở opacity 100%; trong lệnh thực tế layer ở 50%)

Đường cong áp chung cho 3 kênh RGB (kênh độc lập: đo trên màu thuần cho cùng đáp ứng), nguồn -> sau, cho mức xám:
0->0; 16->16; 32->32; 48->49; 64->66; 80->84; 96->103; 112->123; 128->142; 144->160; 160->178; 176->194; 192->208;
208->219; 224->230; 240->241; 255->255. (Tức làm sáng vùng giữa, tối đa khoảng +18 quanh 160, giữ nguyên đen và trắng.)
Ở opacity 50% của layer, độ lệch giảm một nửa (ví dụ 128 -> 135; 160 -> 169; 192 -> 200).

### 7.3 Mask và thời gian

- Mask group: đọc bounds DOM của group; lấy mẫu ảnh tổng hợp với mask còn nguyên cho kết quả đúng bằng ảnh gốc, nên mask đen.
- Mask `Whiten Teeth`: lấy mẫu dọc một hàng ngang qua biên vùng chọn khi chỉ bật layer đó (biên cứng: đổi hẳn giữa pixel
  x=15 và x=16 với vùng chọn bắt đầu tại 16).
- Thời gian đến khi hộp thoại hiện: ~1.4 giây đo từ ngoài gồm cả khởi động công cụ đo; thực tế dưới ~1 giây.

### 7.4 Không quan sát được

- Giá trị cọ (kích thước/độ cứng/opacity/flow) trước lệnh và việc checkbox "Đặt cọ theo thông số khuyến nghị" có thật sự
  thay đổi chúng: DOM/ActionManager không cho ghi tuỳ chọn công cụ trong thử nghiệm nên không đặt được giá trị đầu để so.
  Bên cài đặt nên đặt cọ về đúng các giá trị ở 3.7 khi checkbox bật, và để nguyên cọ khi tắt (cần chủ dự án xác nhận).
- Tác dụng của "Không hiện lại cửa sổ này" (nơi lưu cờ, cách xoá).
- Tham số chính xác của Curves/Hue-Saturation (không đọc được từ ngoài, chỉ có đáp ứng đo ở 7.1/7.2).
- Hành vi với Lab, Indexed, Multichannel, ảnh rất lớn, nhiều tài liệu mở, layer đang chọn là group hoặc smart object.
- Giá trị foreground/background ban đầu của phiên người dùng không được ghi lại trước khi thử (đã đặt lại mặc định đen/trắng).
