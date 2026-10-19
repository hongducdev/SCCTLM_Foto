<div align="center">

<img src="img/icon-large.png" alt="SCCTLM_Foto" width="96" />

# 🎨 SCCTLM_Foto

**Panel retouch chuyên nghiệp cho Adobe Photoshop — giao diện 100% tiếng Việt**

[![Release](https://img.shields.io/github/v/release/hongducdev/SCCTLM_Foto?style=flat-square&color=27b96a)](https://github.com/hongducdev/SCCTLM_Foto/releases/latest)
![Photoshop](https://img.shields.io/badge/Photoshop-CC%202015%2B-31a8ff?style=flat-square&logo=adobephotoshop&logoColor=white)
![CEP](https://img.shields.io/badge/Adobe%20CEP-6.0%2B-7a5cd6?style=flat-square)
![Platform](https://img.shields.io/badge/Windows%20%7C%20macOS-lightgrey?style=flat-square)

</div>

**SCCTLM_Foto** (_Sáng chơi chữ · Tối làm màu_) là tiện ích mở rộng (CEP Extension) dành cho Photoshop, gom quy trình làm đẹp chân dung, ảnh cưới, thời trang và thiết kế thumbnail vào một panel gọn gồm 5 tab: **Retouch** (làm da, Brush Lab, Rim Light, Action, bộ màu MHK), **Artboard**, **Khám phá** và **Ủng hộ**.

---

## 📑 Mục lục

- [✨ Điểm nổi bật](#-điểm-nổi-bật)
- [💻 Yêu cầu hệ thống](#-yêu-cầu-hệ-thống)
- [🚀 Cài đặt](#-cài-đặt)
- [🧰 Các tab chức năng](#-các-tab-chức-năng)
- [🎬 Nhóm Action](#-nhóm-action)
- [🔄 Hot Reload & Cập nhật](#-hot-reload--cập-nhật)
- [📁 Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [🛠️ Xử lý sự cố](#️-xử-lý-sự-cố)

---

## ✨ Điểm nổi bật

| | Tính năng | Mô tả |
|---|---|---|
| 🇻🇳 | **Tiếng Việt 100%** | Nút, nhãn và tooltip theo thuật ngữ nhiếp ảnh – đồ hoạ. |
| 🧩 | **Giao diện tab, nhóm thu gọn** | Thanh tab Retouch / Artboard / Khám phá / Ủng hộ; mỗi nhóm có mũi tên thu gọn, nút dạng viên thuốc icon trên nền xám tối của Adobe. |
| 🪄 | **Không phá huỷ** | Mọi thao tác sinh layer, mask hoặc adjustment layer riêng — chỉnh Opacity / Blend Mode / đảo ngược bất cứ lúc nào. |
| 🌈 | **RGB 8-bit & 16-bit** | Thuật toán màu và kết cấu chạy chính xác trên cả hai. |
| ⤓ | **Nạp Action 1 click** | Mỗi file `.atn` trong `presets/` thành một nút; không nạp trùng bộ đã có. |
| 💡 | **Rim Light** | Tự hiện khi ảnh có nhóm `Rim Light` > lớp `Color`: chọn màu (ô tròn, hex, hút Foreground, 7 màu mẫu) và Cường độ. |
| ⌨️ | **Phím tắt Action** | Gán F2–F12 (kèm Shift/Ctrl) để Play bất kỳ Action nào. |
| 🖌️ | **Brush Lab** | Bật Shape Dynamics + Pen Pressure bằng một nút; xem trước nét cọ, chỉnh Cỡ / Cứng ngay trên panel. |
| 🎨 | **Bộ màu & Mix màu** | 6 bộ màu MHK (165 màu): bấm 1 màu để áp ngay, hoặc bật Mix để chọn tối đa 4 màu, chỉnh độ mờ từng layer và pha thành màu mới. |
| 🧱 | **Artboard** | Tạo bộ artboard theo 27 mẫu album Facebook MHK / khổ YouTube / khổ tuỳ chỉnh, kèm guide vùng an toàn. |
| 🧭 | **Khám phá** | Xem playlist YouTube SCCTLM và link cộng đồng ngay trong panel. |
| 🎞️ | **Preset & kết cấu** | Preset Camera Raw `.xmp` đặt vào `presets/` tự thành nút; hoa văn Hạt phim có sẵn. |
| 🔒 | **Chạy cục bộ** | Adobe CEP + ExtendScript, không gửi dữ liệu qua mạng. |
| 🔁 | **Cập nhật từ GitHub** | Nút ⤓ trên panel tải bản phát hành mới nhất, không cần cài lại. |

---

## 💻 Yêu cầu hệ thống

| Hạng mục | Yêu cầu |
|---|---|
| 🅿️ Phần mềm | Adobe Photoshop CC 2015 trở lên (đến 2024+) |
| 🔌 Môi trường | Adobe CEP 6.0 trở lên |
| 🖥️ Hệ điều hành | Windows 10/11 (64-bit) hoặc macOS 10.13+ |
| 🖼️ Ảnh | Chế độ màu RGB (8-bit hoặc 16-bit) |

---

## 🚀 Cài đặt

### 🪟 Windows — tự động (khuyến nghị)

1. **Đóng hoàn toàn Photoshop.**
2. Chạy `install\Cai-dat-SCCTLM_Foto.bat` — script sẽ:
   - bật `PlayerDebugMode` cho CSXS.4 → CSXS.15 (cho phép extension chưa ký số);
   - chép plugin vào `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto`.
3. Mở Photoshop → **Window > Extensions > SCCTLM_Foto**.

<details>
<summary>🔧 Cài thủ công (Windows)</summary>

1. Nhấp đúp `install\Fix-CEP-SCCTLM_Foto.reg` để bật chế độ chạy extension (chỉ trong `HKEY_CURRENT_USER`, không cần Administrator).
2. Chép toàn bộ thư mục plugin vào một trong hai nơi:
   - Chỉ người dùng hiện tại: `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto\`
   - Mọi người dùng (cần Administrator): `C:\ProgramData\Adobe\CEP\extensions\SCCTLM_Foto\`
3. Mở Photoshop → `Window > Extensions > SCCTLM_Foto`.

</details>

<details>
<summary>🍎 Cài trên macOS</summary>

1. Mở **Terminal**, bật `PlayerDebugMode`:
   ```bash
   defaults write com.adobe.CSXS.9 PlayerDebugMode 1
   defaults write com.adobe.CSXS.10 PlayerDebugMode 1
   defaults write com.adobe.CSXS.11 PlayerDebugMode 1
   defaults write com.adobe.CSXS.12 PlayerDebugMode 1
   defaults write com.adobe.CSXS.13 PlayerDebugMode 1
   defaults write com.adobe.CSXS.14 PlayerDebugMode 1
   ```
2. Chép plugin vào `~/Library/Application Support/Adobe/CEP/extensions/SCCTLM_Foto/`.
3. Mở Photoshop → `Window > Extensions > SCCTLM_Foto`.

</details>

---

## 🧰 Các tab chức năng

Panel rộng khoảng 300px, thanh tab nằm ngay dưới tiêu đề; nút **⤓** (cập nhật) và **↻** (nạp lại) ở góc phải.

### 🎨 Tab Retouch

Gồm các nhóm có thể thu gọn: **Retouch**, **Brush Lab**, **Rim Light** (ẩn khi không có), **Action** và **Màu & Preset**.

#### Retouch

| Nút | Mã | Tác vụ |
|---|---|---|
| **Làm da** | `DS` | Làm mịn da thông minh, đều vùng sần sùi mà không mất lỗ chân lông và kết cấu tự nhiên (nút chính, dùng thiết lập đã lưu). |
| **Son môi** | `ZCZQ` | Tô sắc môi tự nhiên. |
| **Trắng răng** | `WT` | Loại ố vàng trên men răng. |
| **Tẩy lông** | `RE` | Xoá lông tơ, sợi tóc con trên trán, má, cằm. |
| **Highlight** | `GGXS` | Bắt sáng tự nhiên ở sống mũi, gò má, cằm, trán. |
| **Lông mi** | `JMXS` | Tăng độ dày và nét của hàng mi. |
| **Phủ phấn** | `TJSH` | Giảm bóng nhờn, da phủ phấn mịn như trang điểm thực. |
| **Đánh khối** | `DB` | Tạo nhóm Dodge & Burn kèm Curves và mặt nạ đen, sẵn sàng quét sáng/tối tạo khối gương mặt. |
| **Trắng da** | `MBPF` | Nâng tone sáng trong trẻo, giữ chi tiết khối (không xoá History). |
| **Hạt phim** | `MLXG` | Phủ hoa văn kết cấu hạt phim. |

#### Brush Lab

| Nút | Mã | Tác vụ |
|---|---|---|
| **Thiết lập cọ** | `BPP` | Bật Shape Dynamics cho cọ hiện tại và đặt Control của Size / Angle / Roundness Jitter về **Pen Pressure** (đang cầm công cụ khác thì tự chuyển sang Brush). Không cần mở ảnh. Xong thì nút thành **Cọ đã bật** (viền xanh) và hiện nút **Về mặc định** cùng hàng; trạng thái đọc lại từ cọ mỗi khi quay lại panel. |
| **Về mặc định** | `BPPRESET` | Trả cọ về mặc định: mọi Control = Off, tắt Shape Dynamics. |
| **Xem trước / Cỡ / Cứng** | `BRUSH` | Hai thanh trượt đọc và ghi trực tiếp Size (1–500 px) và Hardness (0–100%) của cọ hiện tại (`jsx/brush-size-hardness.jsx`); khung xem trước vẽ lại theo giá trị. Đọc lại khi quay lại panel. |
| **Màu cọ** | `BRUSH` | Ô màu tròn, mã hex, nút hút Foreground và 9 màu mẫu: chọn màu là đặt Foreground của Photoshop — màu mà action *Stroke Brush Path* dùng để tô nét. Đọc lại Foreground khi quay lại panel. |

#### Màu & Preset

- **6 bộ màu MHK (165 màu)** dạng thẻ icon: Fuji (71), Dazz (34), Kodak (12), Leica (7), Ricoh (7), Hồng Kông (34). Bấm thẻ để xem các màu nhỏ, bấm 1 màu là áp ngay (100%) thành layer `Color <bộ> <số>`.
- **Mix màu**: bật công tắc, chọn tối đa 4 màu, mỗi màu có thanh độ mờ riêng; **Áp dụng Mix** tạo mỗi màu một layer (render từ ảnh gốc) rồi hạ opacity để pha thành màu mới.
- **Look LUT**: bộ lọc Camera Raw bỏ qua bảng Look nên các màu dùng `crs:RGBTable` được áp bằng lớp Color Lookup (ICC device-link trong `presets/colors/<bộ>/NNN.icc`) đặt trên một Smart Object (ảnh gốc giữ nguyên vùng trong suốt, không bị nền đen; mở lại Camera Raw hoặc chỉnh Color Lookup để tinh chỉnh) — cả 165 màu đều đổi màu khi áp (`jsx/color-mix.jsx`).
- **Preset `.xmp` riêng:** chép file vào `presets/` của plugin (`%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto\presets`) rồi bấm **↻**; mỗi file thành một nút áp 1 click, render lên lớp gộp riêng `Preset - [tên]`, không phá huỷ ảnh gốc (`dr7ApplyPreset(file)`).

> 📌 Tên file preset chỉ dùng chữ không dấu, số, khoảng trắng, `-`, `_`, `(`, `)`; tên khác bị bỏ qua để an toàn. Nhiệt độ màu Kelvin của sidecar RAW bị bỏ qua khi áp lên ảnh thường.

### 🧱 Tab Artboard

**Tạo artboard**: tìm khổ, lọc theo chip *Tất cả / Album / YouTube / Tuỳ chỉnh*, chọn **một** thẻ mỗi lần (Hay dùng, album, YouTube, khổ tuỳ chỉnh); album là **27 mẫu Facebook MHK** chia 4 nhóm (1 ảnh & Story, 2–3, 4–5, 6–10 ảnh). Mỗi thẻ có mã (05A, 08B…), hình khối ghép; ảnh bổ sung từ 06 trở đi tô tím và nằm tách bên phải khối 5 ô đầu.

| Thiết lập | Ý nghĩa |
|---|---|
| **Tài liệu mới / File hiện tại** | Mở tài liệu mới chứa các artboard, hoặc thêm artboard vào bên phải tài liệu đang mở (nội dung cũ được gói vào artboard "Tài liệu gốc"). |
| **Tên bộ**, **Khoảng cách** | Đặt tên bộ artboard và khoảng cách `gap` (px) giữa các artboard. |
| **Nền** | Trắng / đen là lớp màu "NỀN TRẮNG" / "NỀN ĐEN" nằm trong artboard (Photoshop không cho đặt nền artboard qua script); "Trong suốt" không thêm lớp. |
| **Guide vùng an toàn** | Thêm guide lề 5%. |

Nút **Tạo N artboard** tạo cả mẫu đang chọn; ở File hiện tại cả lệnh là một bước History. Mẫu album ghép sát nhau (không có khe), mỗi artboard có thêm lớp trống "ĐẶT ẢNH / THIẾT KẾ TẠI ĐÂY" và đặt tên như PSD của gói: `NN_Anh_WxH` (ảnh bổ sung thêm `_Bo-sung`), vd `06_Anh_1200x1200_Bo-sung`; tên bộ tự gợi ý `MHK_FB_<mã>` khi chọn album, và khi thêm vào File hiện tại artboard có tiền tố mã (`05A_01_Anh_1800x1800`). Số pixel là cỡ làm việc của bộ mẫu, không phải thông số Meta; Facebook có thể cắt hoặc đổi cách hiển thị.

### 🧭 Tab Khám phá

Thẻ cộng đồng Facebook, thẻ kênh YouTube `@scctlm`, playlist "300 bài FX Typography thiếu nhi" và danh sách video (ảnh bìa, tìm kiếm, chip lọc *Tất cả / Typography / Photoshop / Illustrator*). Dữ liệu lấy từ feed RSS của playlist (không cần API key), lưu cache để mở lại có sẵn; offline thì hiện thông báo kèm nút **Thử lại**. Link mở bằng trình duyệt mặc định.

### ♡ Tab Ủng hộ

Thẻ **Đồng hành cùng SCCTLM**; mã QR ủng hộ chính thức đang chờ bổ sung.

<details>
<summary>🗑️ Chức năng đã gỡ khỏi giao diện</summary>

Bản đầu có 24 nút trên một trang; giao diện hiện tại có 21 nút Retouch (10 nút đầu + Tuỳ chỉnh, Hàng loạt, Chữ / Logo, Làm mịn, Màu tổng, Màu da, Bóng mắt, Hào quang, Làm nét, Hạt thô, Chấm). Các nút **Camera Raw** không còn trên panel (một số module `jsx/` tương ứng vẫn nằm trong mã nguồn). Trước đó đã gỡ hoàn toàn 31 chức năng cũ: Tần số 8/16, Lấy mẫu, Chọn Mắt, Mặt nạ da, Sửa mắt, Khử Vàng, Nền trắng/ấm, Cổ điển, Vải dệt, Hoa mai, Hoa Sen, Gộp lớp, Lật ngang… cùng thanh công cụ icon.

</details>

---

## 🎬 Nhóm Action

### ⤓ Nạp Action nhanh

Chép file bộ Action `.atn` vào `presets/` (cùng chỗ với preset `.xmp`, tên file theo cùng quy tắc) rồi bấm **↻** — mỗi file thành một nút có icon tải xuống kèm \<tên file\>.

- Bấm nút là nạp bộ Action vào bảng Actions, **không cần mở ảnh**.
- Bộ cùng tên đã có trong Photoshop → giữ nguyên bản của bạn, panel báo "đã có" (không nạp trùng).
- Bản đóng gói sẵn: `Thumbnail_action.atn` — bộ **Thumbnail action** gồm *Stroke Brush Path* (phím F5) và *YouTube Rim Light*.
- Phím F của bộ trùng phím menu (F2–F4) → Photoshop sẽ hỏi như mục phím tắt bên dưới.

### 💡 Rim Light

Nhóm **Rim Light** chỉ hiện khi ảnh đang mở có nhóm `Rim Light` chứa lớp `Color` (do Action *YouTube Rim Light* tạo); panel kiểm tra khi quay lại panel và mỗi vài giây, không có thì ẩn cả nhóm.

| Điều khiển | Tác vụ |
|---|---|
| Ô màu tròn / ô hex / 7 màu mẫu | Chọn màu và **tô lại lớp `Color` ngay**: giữ vùng trong suốt (lớp Solid Color thì đổi màu), 1 bước History. |
| Nút hút màu | Lấy màu **Foreground** của Photoshop rồi tô. |
| **Cường độ** | Độ mờ (0–100%) của cả nhóm `Rim Light`, áp ngay khi kéo; lấy giá trị thật của nhóm khi nhóm vừa hiện. |

### ⌨️ Phím tắt Play Action

1. Chọn Action trong danh sách (lấy từ bảng Actions, trừ bộ **SCCTLM_Foto** do panel tự dựng).
2. Bấm **⌨ Gán phím tắt** (nút chuyển xanh = đang nghe).
3. Ấn **F2–F12**, có thể kèm Shift và/hoặc Ctrl — ví dụ `F5`, `Shift+F3`, `Ctrl+Shift+F11`.

| Thao tác | Kết quả |
|---|---|
| **Backspace / Delete** | Xoá phím của Action đang chọn |
| **Esc** hoặc bấm nút lần nữa | Huỷ gán |
| Phím khác (chữ, số, Alt…) | Bị từ chối — Action của Photoshop chỉ nhận phím F |
| Gán phím đã dùng cho Action khác | Phím chuyển sang Action mới (1 phím = 1 Action) |

<details>
<summary>⚙️ Cách hoạt động & xung đột phím</summary>

Photoshop không cho script đặt phím lên Action có sẵn, nên panel dựng lại bộ **SCCTLM_Foto** gồm mỗi phím một Action `▶ <tên Action> (<bộ>)` có gắn phím, chỉ 1 bước Play Action gốc (hết phím thì bộ bị xoá). Action gốc của bạn không bị sửa. Danh sách phím lưu trong panel; xoá bộ SCCTLM_Foto bằng tay thì gán lại 1 phím bất kỳ để dựng lại. Bản cũ dùng tên bộ `MHK DR7`: panel tự thay bằng bộ mới (giữ nguyên phím) ở lần mở đầu tiên. Action mới tạo trong Photoshop xuất hiện trong danh sách khi quay lại panel.

Nếu phím trùng phím tắt menu (F2 = Cut, F3 = Copy, F4 = Paste), Photoshop hỏi *"Remove the conflicting action shortcuts?"* — chọn **No** để phím Play Action, **Yes** để giữ phím cho menu (Action khi đó không có phím).

</details>

---

## 🔄 Hot Reload & Cập nhật

### ↻ Nút nạp lại nhanh

Nút **↻** trên thanh tiêu đề nạp lại HTML, CSS, JS và các file `.jsx` từ thư mục cài ngay lập tức, không ngắt lệnh đang chạy dở.

**Máy dev (cài từ git checkout):** `Cai-dat-SCCTLM_Foto.bat` ghi đường dẫn thư mục nguồn vào `.dr7-dev-source` trong thư mục cài. Khi có file này, bấm **↻** sẽ tự chép file mới hơn từ nguồn (`index.html`, `style.css`, `loader.jsx`, `js/`, `jsx/`, `css/`, `img/`, `presets/`) sang bản cài rồi mới nạp lại — không cần `Hot-reload-SCCTLM_Foto.bat`. Không xoá file nào ở bản cài; muốn tắt thì xoá `.dr7-dev-source`.

### 👀 Hot-reload tự động (nhà phát triển)

```text
install\Hot-reload-SCCTLM_Foto.bat
```

*(Cần Node.js.)* Trình theo dõi sẽ: lắng nghe thay đổi HTML/CSS/JS/JSX và hình ảnh → chờ file ghi ổn định, kiểm tra Photoshop đang rảnh → đồng bộ vào `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto` → ra lệnh panel tự làm mới.

### ⤓ Cập nhật từ GitHub

Nút **⤓** trên thanh tiêu đề lấy GitHub Release mới nhất của `hongducdev/SCCTLM_Foto`:

- Mỗi lần mở panel tự kiểm tra im lặng; có bản mới thì nút hiện **chấm xanh**.
- Bấm nút → xác nhận → chỉ tải các file runtime đã đổi (`index.html`, `style.css`, `loader.jsx`, `CSXS/manifest.xml`, `js/ css/ jsx/ img/ presets/`), tải xong hết mới ghi đè, rồi tự nạp lại. Lỗi mạng giữa chừng không làm hỏng bản đang cài.
- `manifest.xml` đổi cấu trúc (không chỉ số phiên bản) → panel báo khởi động lại Photoshop.
- Bản ghi file đã cài: `.dr7-version.json` (bị xoá khi cài lại bằng `.bat` / watcher).

<details>
<summary>🏷️ Phát hành bản mới (người phát triển)</summary>

1. Tăng `ExtensionBundleVersion` và `Version` của panel trong `CSXS/manifest.xml` (phải trùng nhau, dạng `x.y.z`).
2. Commit, push lên `main`.
3. `gh release create v0.2.0 --title "SCCTLM_Foto 0.2.0" --notes "Nội dung thay đổi"` — tag phải là `v` + đúng số phiên bản.

</details>

Lịch sử thay đổi: [`docs/project-changelog.md`](docs/project-changelog.md) · Quy chuẩn giao diện: [`docs/design-guidelines.md`](docs/design-guidelines.md).

---

## 📁 Cấu trúc thư mục

```text
SCCTLM_Foto/
├── CSXS/
│   └── manifest.xml             # Cấu hình CEP, menu hiển thị & kích thước panel
├── .debug                       # Cổng Debugger Chromium (9004)
├── index.html                   # Giao diện HTML5 của panel
├── style.css                    # Định dạng cơ bản
├── loader.jsx                   # Trình nạp lõi ExtendScript
├── css/
│   ├── layout.css               # Bố cục, tab, nút viên thuốc, nhóm thu gọn
│   ├── button-icons.css         # Icon nút (SVG mask)
│   ├── color-presets.css        # Bộ màu MHK và Mix màu
│   ├── artboard.css             # Tab Artboard
│   └── explore.css              # Tab Khám phá
├── js/
│   ├── CSInterface.js           # Thư viện giao tiếp Adobe CEP
│   ├── panel.js                 # Cầu nối Panel ↔ Photoshop, header Nạp lại/Cập nhật, nút .atn / .xmp
│   ├── github-updater.js        # Kiểm tra & cài GitHub Release (cep.fs, không cần Node)
│   ├── dev-source-sync.js       # ↻ trên máy dev: chép code mới từ thư mục nguồn
│   ├── shortcut-key-capture.js  # Phím tắt Action: chọn Action, nghe phím F, lưu danh sách
│   ├── tab-switcher.js          # Chuyển tab Retouch / Artboard / Khám phá / Ủng hộ
│   ├── brush-setup-controls.js  # Brush Lab: Thiết lập cọ / Về mặc định
│   ├── brush-controls.js        # Brush Lab: xem trước nét cọ, thanh Cỡ / Cứng
│   ├── brush-color-controls.js  # Brush Lab: màu cọ (Foreground) cho Stroke Brush Path
│   ├── color-presets.js         # Bộ màu MHK: thẻ bộ màu, áp 1 màu, giỏ Mix
│   ├── artboard-facebook-album-presets.js # Artboard: 27 mẫu album Facebook MHK
│   ├── artboard-layout.js       # Artboard: dữ liệu khổ, thuật toán xếp, kiểm tra
│   ├── artboard-tab.js          # Artboard: giao diện tab
│   ├── explore-feed.js          # Khám phá: tải & parse RSS playlist YouTube
│   ├── explore-tab.js           # Khám phá: giao diện tab
│   ├── section-collapse.js      # Thu gọn / mở rộng từng nhóm
│   └── rim-color-controls.js    # Rim Light: màu, hex, hút màu, Cường độ; ẩn khi ảnh không có Rim Light
├── jsx/
│   ├── 4.jsxbin                 # Hộp thoại Chữ / Logo (WM, không còn nút trên panel)
│   ├── main.jsx                 # Hàm lõi: GGXS, TJSH, JMXS, TJYY, FSJH, MBPF, ZCZQ, DKACR
│   ├── mhk-replacements.jsx     # Hạt phim, Hào Quang, Hạt thô, Chấm, Chi tiết
│   ├── Photoshop.jsx            # Tiện ích Crash Bug Fix (chạy khi mở panel)
│   ├── preset-lut.jsx           # Áp Preset Camera Raw (.xmp)
│   ├── color-mix.jsx            # Áp màu MHK (Look LUT) và Mix màu: $.dr7ApplyColorMix
│   ├── artboard-create.jsx      # Tạo artboard: $._ext_ARTBOARD
│   ├── brush-pen-pressure.jsx   # BPP / BPPRESET / trạng thái cọ; chạy được độc lập
│   ├── action-set-import.jsx    # Nạp bộ Action .atn đóng gói (bỏ qua nếu đã có bộ cùng tên)
│   ├── brush-size-hardness.jsx  # BRUSH: đọc / ghi Size + Hardness của cọ
│   ├── rim-light-color.jsx      # RIMCOLOR: tô màu lớp Color, đọc/đặt cường độ nhóm Rim Light
│   ├── action-shortcut-setup.jsx # Liệt kê Action; sinh & nạp bộ "SCCTLM_Foto" (▶ Play Action có phím F)
│   ├── pj/                      # Tài nguyên cọ (.tpl) và hoa văn (.pat)
│   └── *.jsx                    # Module chuyên biệt: ds, ba, se, ls, ss, re, db, sh, li, tc, wt, pfsd2
├── presets/
│   ├── colors/                  # 6 bộ màu MHK: <bộ>/NNN.xmp + NNN.icc, manifest.json
│   ├── *.xmp                    # Preset Camera Raw riêng (mỗi file một nút)
│   └── *.atn                    # Bộ Action nạp nhanh (mỗi file một nút)
├── img/
│   ├── icon-large.png           # Biểu tượng panel
│   ├── logo.svg                 # Logo SCCTLM ở tiêu đề
│   └── colors/*.svg             # Icon thẻ bộ màu
├── install/
│   ├── Cai-dat-SCCTLM_Foto.bat          # Cài đặt tự động
│   ├── Fix-CEP-SCCTLM_Foto.reg          # Bật PlayerDebugMode
│   ├── Hot-reload-SCCTLM_Foto.bat       # Khởi động bộ theo dõi Hot Reload
│   └── watch-plugin.js          # Theo dõi file và nạp lại panel bằng Node.js
├── tests/                       # Kiểm thử tự động: script, updater, hot reload, bộ màu, artboard, Khám phá
├── docs/                        # Hướng dẫn thiết kế và nhật ký phát triển
└── README.md
```

---

## 🛠️ Xử lý sự cố

<details>
<summary>🚫 Panel không xuất hiện trong Window > Extensions</summary>

**Nguyên nhân:** Photoshop chưa cho chạy extension chưa ký số. **Cách xử lý:** nhấp đúp `install\Fix-CEP-SCCTLM_Foto.reg`, chọn **Yes**, rồi khởi động lại Photoshop.

</details>

<details>
<summary>🖱️ Bấm nút nhưng không có gì xảy ra</summary>

**Nguyên nhân:** chưa mở ảnh hoặc ảnh không ở chế độ RGB. **Cách xử lý:** mở ảnh và chuyển sang `Image > Mode > RGB Color`.

</details>

<details>
<summary>🔁 Sửa code nhưng giao diện chưa cập nhật</summary>

Bấm **↻** trên panel. Nếu sửa ở thư mục nguồn (vd `D:\DR7`) mà ↻ vẫn ra bản cũ: bản cài thiếu `.dr7-dev-source` → chạy lại `install\Cai-dat-SCCTLM_Foto.bat` từ git checkout, hoặc dùng `Hot-reload-SCCTLM_Foto.bat`.

</details>

<details>
<summary>💡 Không thấy nhóm Rim Light</summary>

Nhóm chỉ hiện khi ảnh đang mở có nhóm `Rim Light` chứa lớp `Color`. Nạp bộ Thumbnail action (nút **Thumbnail action** (icon tải xuống)) rồi chạy Action *YouTube Rim Light* trên ảnh.

</details>

---

<div align="center">

*Phát triển và tối ưu hoá cho cộng đồng nhiếp ảnh và đồ hoạ chuyên nghiệp.* 💜

</div>
