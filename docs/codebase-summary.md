# Cấu trúc mã nguồn

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
│   ├── exif-frame.css           # Tab Watermark
│   └── explore.css              # Tab Khám phá
├── js/
│   ├── CSInterface.js           # Thư viện giao tiếp Adobe CEP
│   ├── panel.js                 # Cầu nối Panel ↔ Photoshop, header Nạp lại/Cập nhật, nút .xmp
│   ├── github-updater.js        # Kiểm tra & cài GitHub Release (cep.fs, không cần Node)
│   ├── update-staging-journal.js # Thư mục tạm + journal + tự phục hồi khi cập nhật bị đứt
│   ├── release-manifest-verifier.js # Kiểm chữ ký Ed25519 của release-manifest.json, băm SHA-512
│   ├── release-keys.js          # Khoá công khai tin cậy để ký bản phát hành
│   ├── vendor/tweetnacl.min.js  # tweetnacl 1.0.3 (public domain), chỉ dùng để kiểm chữ ký
│   ├── dev-source-sync.js       # ↻ trên máy dev: chép code mới từ thư mục nguồn
│   ├── create-action-buttons.js # Nút Tạo Brush / Tạo Rim Light: nạp bộ Action nếu thiếu rồi chạy
│   ├── shortcut-conflicts.js    # Tìm nơi phím F đang được dùng (panel, phím mặc định Photoshop, phím đã đánh dấu)
│   ├── shortcut-key-capture.js  # Ô phím tắt cạnh nút Tạo: nghe phím F, lưu danh sách
│   ├── tab-switcher.js          # Chuyển tab Retouch / Artboard / Watermark / Khám phá / Ủng hộ
│   ├── brush-setup-controls.js  # Brush Lab: Thiết lập cọ / Về mặc định
│   ├── brush-controls.js        # Brush Lab: xem trước nét cọ, thanh Cỡ / Cứng
│   ├── brush-color-controls.js  # Brush Lab: màu cọ (Foreground) cho Stroke Brush Path
│   ├── color-presets.js         # Bộ màu MHK: thẻ bộ màu, áp 1 màu, giỏ Mix
│   ├── artboard-facebook-album-presets.js # Artboard: 27 mẫu album Facebook MHK
│   ├── artboard-layout.js       # Artboard: dữ liệu khổ, thuật toán xếp, kiểm tra
│   ├── artboard-tab.js          # Artboard: giao diện tab
│   ├── exif-frame-fields.js     # Khung ảnh: đọc EXIF thành các trường (tiêu cự, khẩu độ, tốc độ, ISO, ống kính, ngày)
│   ├── exif-frame-layout.js     # Khung ảnh: hình học 3 kiểu khung và bo góc, màu chữ tương phản, kiểm tra spec
│   ├── exif-frame-compose.js    # Khung ảnh: ghép giá trị trên form thành spec gửi Photoshop
│   ├── exif-frame-presets.js    # Khung ảnh: lưu/nạp mẫu vào localStorage (lọc theo SCHEMA)
│   ├── exif-frame-templates.js  # Khung ảnh: 3 mẫu Hasselblad dựng sẵn và danh sách logo hãng trong img/logos
│   ├── wm-templates-data.js     # Watermark mẫu gốc: 54 mẫu 徕卡一瞬 (sinh bởi scripts/build-watermark-templates.py, không sửa tay)
│   ├── wm-vars.js               # Watermark mẫu gốc: biến chữ (tên máy, thông số, ngày giờ theo i18n của mẫu, GPS)
│   ├── wm-layout.js             # Watermark mẫu gốc: bản port bộ render gốc, trả về danh sách thao tác vẽ
│   ├── wm-spec.js               # Watermark mẫu gốc: kiểm tra dữ liệu gửi sang Photoshop
│   ├── wm-tab.js                # Watermark mẫu gốc: chọn mẫu, đọc EXIF, đo chữ trong Photoshop rồi vẽ
│   ├── exif-frame-fonts.js      # Khung ảnh: nạp danh sách font của Photoshop
│   ├── exif-frame-form.js       # Khung ảnh: các ô của form, giá trị, chụp/khôi phục mẫu, logo
│   ├── exif-frame-preview.js    # Khung ảnh: xem trước gần đúng bằng HTML/CSS từ spec
│   ├── exif-frame-tab.js        # Khung ảnh: nối form với EXIF, xem trước, mẫu và lệnh vẽ
│   ├── explore-feed.js          # Khám phá: tải & parse RSS playlist YouTube
│   ├── explore-tab.js           # Khám phá: giao diện tab
│   ├── section-collapse.js      # Thu gọn / mở rộng từng nhóm
│   ├── slider-precision.js      # Bấm số bên thanh trượt để gõ giá trị chính xác
│   ├── eyedropper-picker.js     # Nút hút màu dùng chung: bật Eyedropper, chờ bấm vào ảnh
│   └── rim-color-controls.js    # Rim Light: màu, hex, hút màu, Độ sáng; ẩn khi ảnh không có Rim Light
├── jsx/
│   ├── 4.jsxbin                 # Hộp thoại Chữ / Logo (WM, không còn nút trên panel)
│   ├── main.jsx                 # cTID/sTID, $.dr7SkinStep (1 bước undo, chỉ RGB) và bảng lệnh Da ($.dr7BuildSkinCommands)
│   ├── skin-*.jsx               # Mỗi lệnh Da một file: GGXS (highlight), TJSH (blusher), JMXS (mascara), TJYY (eyeshadow), FSJH (giảm đỏ), MBPF (trắng da), ZCZQ (môi), DKACR (Camera Raw); tự đăng ký vào $.dr7SkinFns
│   ├── mhk-replacements.jsx     # Hạt phim, Hào Quang, Hạt thô, Chấm, Chi tiết
│   ├── Photoshop.jsx            # Tiện ích Crash Bug Fix (chạy khi mở panel)
│   ├── preset-lut.jsx           # Áp Preset Camera Raw (.xmp)
│   ├── color-mix.jsx            # Áp màu MHK (Look LUT) và Mix màu: $.dr7ApplyColorMix
│   ├── artboard-create.jsx      # Tạo artboard: $._ext_ARTBOARD
│   ├── exif-frame.jsx           # Khung ảnh: $._ext_EXIFFRAME (đọc EXIF và font, nới canvas, vẽ chữ)
│   ├── wm-measure.jsx           # Watermark mẫu gốc: đo độ rộng chữ bằng font thật của Photoshop
│   ├── wm-draw.jsx              # Watermark mẫu gốc: vẽ nền, chữ, logo, khung bo, chữ dọc thành layer
│   ├── exif-frame-decor.jsx     # Khung ảnh: $._ext_EXIFFRAME_DECOR (bo góc ảnh, đặt logo)
│   ├── brush-pen-pressure.jsx   # BPP / BPPRESET / trạng thái cọ; chạy được độc lập
│   ├── action-set-import.jsx    # Nạp bộ Action .atn đóng gói khi thiếu, rồi chạy Action (bỏ qua nạp nếu đã có)
│   ├── brush-size-hardness.jsx  # BRUSH: đọc / ghi Size + Hardness của cọ
│   ├── eyedropper-tool.jsx      # EYEDROPPER: bật/trả công cụ Eyedropper, đọc Foreground
│   ├── rim-light-color.jsx      # RIMCOLOR: tô màu lớp Color, đọc/đặt cường độ nhóm Rim Light
│   ├── action-shortcut-setup.jsx # Nạp phím: gắn thẳng vào bộ đóng gói, Action khác qua bộ "SCCTLM_Foto" (▶ Play)
│   ├── pj/                      # Tài nguyên cọ (.tpl) và hoa văn (.pat)
│   └── *.jsx                    # Module chuyên biệt: ds, ba, se, ss, re, sh, li, tc
│   ├── white-teeth.jsx          # Trắng Răng (WT), viết lại theo clean-room
│   ├── white-teeth-dialog.jsx   # Hộp thoại hướng dẫn của Trắng Răng
│   ├── tone-group.jsx           # Màu tổng (BTNPFSD2), viết lại theo clean-room
│   ├── tone-group-masks.jsx     # Mặt nạ độ sáng của Màu tổng
│   ├── dodge-burn.jsx           # Đánh khối (DB), viết lại theo clean-room
│   ├── dodge-burn-layers.jsx    # Hàm tạo layer/mask của Đánh khối
│   ├── dodge-burn-dialog.jsx    # Hộp thoại Dodge & Burn
│   ├── local-smoother.jsx       # Làm mịn da (LS), viết lại theo clean-room
│   ├── local-smoother-layers.jsx # Hàm lọc/layer/mask của Làm mịn da
│   ├── local-smoother-dialog.jsx # Hộp thoại và hộp gợi ý của Làm mịn da
├── presets/
│   ├── colors/                  # 6 bộ màu MHK: <bộ>/NNN.xmp + NNN.icc, manifest.json
│   ├── *.xmp                    # Preset Camera Raw riêng (mỗi file một nút)
│   └── *.atn                    # Bộ Action đi kèm (Thumbnail action)
├── img/
│   ├── icon-large.png           # Biểu tượng panel
│   ├── logo.svg                 # Logo SCCTLM ở tiêu đề
│   └── colors/*.svg             # Icon thẻ bộ màu
├── install/
│   ├── Cai-dat-SCCTLM_Foto.bat          # Cài đặt tự động
│   ├── Go-cai-dat-SCCTLM_Foto.bat       # Gỡ cài đặt, tắt PlayerDebugMode (hỏi trước)
│   ├── Fix-CEP-SCCTLM_Foto.reg          # Bật PlayerDebugMode
│   ├── Hot-reload-SCCTLM_Foto.bat       # Khởi động bộ theo dõi Hot Reload
│   └── watch-plugin.js          # Theo dõi file và nạp lại panel bằng Node.js
├── scripts/                     # Công cụ người phát hành: release-keygen / release-sign / release-verify + build-watermark-templates.py (chuyển pack 徕卡一瞬 thành js/wm-templates-data.js và img/wm) + install-watermark-fonts.ps1 (cài font MiSans / LG1056 / Oxanium từ `fonts/` cho người dùng hiện tại)
├── tests/                       # Kiểm thử tự động: script, updater, hot reload, bộ màu, artboard, Khám phá
├── docs/                        # Hướng dẫn thiết kế và nhật ký phát triển
└── README.md
```
