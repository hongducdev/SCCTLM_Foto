# Changelog

## v0.2.0 — Cập nhật có chữ ký, gỡ cài đặt, thông báo giới hạn GitHub

- **Gỡ cài đặt**: thêm `install/Go-cai-dat-SCCTLM_Foto.bat`. Script hỏi trước khi xoá thư mục cài (kể cả thư mục cũ `DR7` / `DR7.disabled` nếu manifest đúng Id `com.retouchpanel.panel`), và hỏi riêng có tắt `PlayerDebugMode` cho CSXS.4–15 không. README có mục Gỡ cài đặt (Windows, macOS) và ghi rõ `PlayerDebugMode` áp dụng cho mọi extension chưa ký.
- **Cập nhật**: GitHub trả 403/429 (giới hạn 60 lượt/giờ mỗi IP khi chưa đăng nhập) thì panel báo "GitHub tạm giới hạn lượt kiểm tra từ mạng này, hãy thử lại sau ít phút." thay vì mã lỗi thô.
- **Cập nhật có chữ ký**: bản phát hành kèm `release-manifest.json` (SHA-512 từng file runtime) và `release-manifest.json.sig` (Ed25519). Panel kiểm chữ ký bằng khoá công khai trong `js/release-keys.js` (tweetnacl vendor tại `js/vendor/`, vì Chromium của CEP không có Ed25519 trong WebCrypto), băm từng file tải về và chỉ ghi khi tất cả khớp; không còn gọi GitHub `git/trees` (mỗi lần kiểm tra/cập nhật chỉ 1 lượt API). Từ chối bản không mới hơn bản đang cài (chặn hạ cấp), manifest ký cho phiên bản khác tag, hoặc `minVersion` cao hơn bản đang cài. Bản ghi `.dr7-version.json` giờ lưu `{ sha512, mtime }`; lần đầu từ bản ghi cũ (git sha) panel băm file đang cài một lần (~4 giây cho ~20 MB) thay vì tải lại. Công cụ cho người phát hành: `scripts/release-keygen.js`, `release-sign.js`, `release-verify.js` (CI chạy verify trước khi tạo Release). Người dùng ở 0.1.9 trở xuống vẫn dùng updater cũ, không kiểm chữ ký. File: `js/github-updater.js`, `js/release-manifest-verifier.js`, `js/release-keys.js`, `js/vendor/tweetnacl.min.js`, `scripts/`, `.github/workflows/release.yml`, `tests/check-release-manifest.js`.
- **Cập nhật an toàn khi lỗi**: file tải về được ghi vào `.dr7-update/` và đọc lại kiểm SHA-512, rồi chuyển vào chỗ thật theo journal `.dr7-update.json` (`journalVersion: 1`, định dạng đóng băng). `index.html`, `js/github-updater.js`, các module kiểm chữ ký và `CSXS/manifest.xml` chuyển sau cùng. `dr7Staging.recover()` chạy đồng bộ trong `js/panel.js` ngay trước khi nạp `loader.jsx`: hoàn tất việc chuyển còn dở (và nạp lại panel một lần nếu mã panel đổi), hoặc huỷ sạch nếu journal hỏng/lạ/file tạm sai hash và báo cập nhật lại. Đo trong Photoshop: `cep.fs.rename` không ghi đè file có sẵn (kể cả đích chỉ-đọc), `deleteFile` không xoá được thư mục hay file chỉ-đọc (nên chmod trước, và thư mục `.dr7-update/` còn lại rỗng). Bộ cài `.bat`, `watch-plugin.js` và `dev-source-sync.js` dọn journal/thư mục tạm cùng chỗ xoá `.dr7-version.json`. File: `js/update-staging-journal.js`, `js/github-updater.js`, `js/panel.js`, `js/release-manifest-verifier.js` (thêm `sha512Sync`), `tests/check-github-updater.js`.
- **Đo thời gian nạp lõi**: `loader.jsx` lưu `$.dr7LoadTimes` (ms từng file) và `$.dr7LoadTotalMs`. Nạp lại 5 lần trong Photoshop: 148–183 ms tổng, `4.jsxbin` chiếm 73–103 ms, mỗi file `jsx/*.jsx` còn lại ≤ 9 ms; chưa cần lazy-load.
- **Khung clean-room cho các module jsx/ gốc**: `docs/clean-room/` (quy trình hai bên đặc tả/cài đặt, mẫu đặc tả, nhật ký), `tests/photoshop-baseline-record.jsx` ghi cây layer và histogram của một lệnh trên 3 ảnh tổng hợp, `tests/compare-baselines.js` so hai lần ghi (cấu trúc layer + ngưỡng histogram), `tests/photoshop-command-inventory.jsx` liệt kê lệnh đã đăng ký. Chưa viết lại module nào.
- **Nguồn gốc & bản quyền**: thêm `LICENSE` (All rights reserved, chỉ cho phần mã do hongducdev viết) và `NOTICE.md` phân loại file theo 4 nhóm: tự viết, thư viện bên thứ ba, mã có nguồn gốc từ plugin gốc (không thuộc `LICENSE`), chưa phân loại. README có mục Nguồn gốc & bản quyền.
- **Sửa nhỏ**: README không còn ghi "không gửi dữ liệu qua mạng" (panel có kết nối GitHub và YouTube, nhưng không gửi ảnh hay dữ liệu cá nhân); bộ cài in đúng "CSXS.4 - CSXS.15"; manifest `<Author>` là `SCCTLM` (thay đổi manifest nên lần lên 0.2.0 cần khởi động lại Photoshop).

## v0.1.9 — Nút Tạo Brush / Rim Light kèm phím tắt, QR ủng hộ

- **Phím tắt gắn thẳng vào Thumbnail action**: không còn Action `▶ … (Thumbnail action)` trùng trong bộ SCCTLM_Foto; panel nạp lại bộ Thumbnail action từ `presets/` kèm phím (chỉnh sửa tay trong bộ này mất khi đổi phím). Bản trước gán theo cách cũ được tự chuyển khi mở panel.
- **Phím tắt trùng**: gán phím đang được dùng (Action khác của panel, phím mặc định của Photoshop, phím đã đánh dấu) thì hiện popup **Ghi đè** / **Không gán** thay vì báo lỗi; phím Action khác của bạn tự gắn trong Photoshop vẫn không kiểm được.
- **Nút Tạo Brush / Tạo Rim Light** + ô phím tắt cạnh nút: chạy Action *Stroke Brush Path* / *YouTube Rim Light* của bộ Thumbnail action, tự nạp bộ nếu Photoshop chưa có. Nhóm Rim Light luôn hiện (phần màu vẫn ẩn khi ảnh chưa có Rim Light). Bỏ nhóm **Action** (nút nạp `.atn`, nút nhập file, danh sách chọn Action, nút khoá phím); phím tắt chỉ gán qua ô cạnh nút Tạo.
- **`Thumbnail_action.atn`**: bỏ phím F5 gắn sẵn ở *Stroke Brush Path* (phím gắn sẵn thắng phím panel gán, nên F5 gán cho Action khác không chạy); tắt bước 1 của *YouTube Rim Light* (chọn layer theo ID lúc ghi → hỏi "The command Select is not currently available"), Action chạy trên layer đang chọn. Máy đã nạp bộ cũ: xoá bộ **Thumbnail action** trong bảng Actions, panel tự nạp bản mới và dựng lại phím ở lần bấm Tạo kế tiếp.
- **Tab Ủng hộ**: thêm mã QR TPBank cùng tên và số tài khoản.
- **Nút hút màu** (Rim Light, Brush Lab): không còn tự lấy màu Foreground. Bấm nút thì Photoshop chuyển sang công cụ Eyedropper, bấm vào ảnh để lấy màu rồi công cụ cũ được trả lại; bấm nút lần nữa hoặc chọn công cụ khác để huỷ. File: `js/eyedropper-picker.js`, `jsx/eyedropper-tool.jsx`.

## v0.1.8 — Đánh dấu phím dùng ngoài panel, hộp thoại chung, tách mã Da

- **Phím tắt Action**: thêm nút khoá cạnh nút bàn phím để đánh dấu phím bạn đã gán trực tiếp trong Photoshop; panel chặn gán phím đó cho Action khác (ấn lại phím đã đánh dấu để bỏ). File: `js/shortcut-reserved-keys.js`, `js/shortcut-key-capture.js`.
- **Hộp thoại chung** (`js/dialog.js`): lỗi từ Photoshop, hỏi cập nhật và thông báo phím dùng cùng một kiểu hộp thoại thay cho `alert`/`confirm` của trình duyệt.
- **Cấu trúc mã**: tách `jsx/main.jsx` (2.428 dòng) thành `main.jsx` (bọc `$.dr7SkinStep`, bảng lệnh Da) và 8 file `jsx/skin-*.jsx`, mỗi lệnh Da một file, di chuyển nguyên văn. Mỗi file tự đăng ký vào `$.dr7SkinFns`; `loader.jsx` dựng bảng lệnh sau khi nạp xong và báo lỗi nạp nếu thiếu file. Hành vi các lệnh không đổi (đã đối chứng cây layer và histogram trong Photoshop 2022).
- **Kiểm thử/CI**: thêm GitHub Actions chạy `tests/check-*.js` và tạo release từ tag; test ExtendScript chỉ ASCII; `check-live-reload` bỏ qua khi không có Photoshop (`DR7_LIVE=1` để chạy).

## v0.1.7 — Báo lỗi khi trùng phím tắt Action

- **Phím tắt Action**: gán phím đã dùng cho Action khác giờ hiện popup nêu đúng phím bị trùng và Action/bộ đang giữ phím đó, không còn tự lấy lại phím; nút trong popup dạng viên thuốc. File: `js/shortcut-key-capture.js`, `css/layout.css`.

## v0.1.6 — Sửa lỗi cập nhật không ghi được manifest

- Cập nhật từ GitHub: khi ghi file báo `ERR_CANT_WRITE` (vd `CSXS/manifest.xml` đang chỉ-đọc), updater bỏ cờ chỉ-đọc bằng `cep.fs.chmod` rồi ghi lại một lần; thông báo lỗi giờ kèm tên mã (`lỗi 6 ERR_CANT_WRITE`), kể cả lỗi tạo thư mục. File: `js/github-updater.js`.

## v0.1.5 — Màu cọ cho Brush Lab và Album Facebook MHK

- **Brush Lab**: thêm ô màu dạng viên thuốc (icon bảng màu căn trái), mã hex, hút màu Foreground, 9 màu mẫu và thanh **Độ sáng**. Chọn màu là đặt Foreground của Photoshop, Độ sáng là Opacity của cọ; cả hai là thứ action *Stroke Brush Path* dùng để tô nét, và được đọc lại khi quay lại panel.
- **Rim Light** đổi sang cùng kiểu viên thuốc, dùng chung CSS với Brush Lab.
- File: `js/brush-color-controls.js` (mới), `jsx/brush-size-hardness.jsx` (`getColor` / `setColor` / `getOpacity` / `setOpacity`), `js/rim-color-controls.js`, `css/layout.css`.

### Album Facebook MHK trong tab Artboard

- Thêm 27 mẫu album Facebook (01A–11B, 121 artboard) thay cho 4 mẫu "Bộ nhiều ảnh": tọa độ tuyệt đối, ghép sát, ảnh bổ sung (06+) tách bên phải; thẻ hiện mã, số ảnh, khối ghép, ô bổ sung tô tím.
- Tên artboard như PSD của gói: `NN_Anh_WxH[_Bo-sung]` (thêm tiền tố `<mã>_` khi chọn nhiều mẫu hoặc dùng File hiện tại); tên bộ gợi ý `MHK_FB_<mã>`. Mỗi artboard album có thêm lớp trống "ĐẶT ẢNH / THIẾT KẾ TẠI ĐÂY"; lớp nền đổi tên "NỀN TRẮNG" / "NỀN ĐEN". Chip lọc **Album**; thẻ album hiện "5 ô đầu + N bổ sung" và kích thước khối ghép.
- Chỉ chọn một mẫu mỗi lần (bấm lại để bỏ chọn); bỏ nhóm và chip Facebook (Bài ngang, Cover Trang, Cover Nhóm); thứ tự nhóm: Hay dùng, Album, YouTube, Tùy chỉnh.
- Nút Tạo bị khóa và báo rõ khi chọn quá 40 artboard.
- Lớp ẩn "HƯỚNG DẪN" của gói chưa làm: Photoshop chỉ cho đổi lớp thành chữ (`layer.kind = TEXT`) trong artboard đầu tiên, các artboard sau báo "The layer cannot contain text".
- File: `js/artboard-facebook-album-presets.js`; sửa `js/artboard-layout.js`, `js/artboard-tab.js`, `css/artboard.css`; test đối chiếu `tests/fixtures/facebook-album-layouts.json` (parse từ danh sách của gói).

## v0.1.4 — Bộ màu MHK và Mix màu

- Nhóm **Màu & Preset** có 6 bộ màu dạng thẻ icon (Fuji 71, Dazz 34, Kodak 12, Leica 7, Ricoh 7, Hồng Kông 34 màu); bấm thẻ để xem các màu nhỏ bên dưới, bấm 1 màu là áp ngay (100%) thành layer `Color <bộ> <số>`.
- **Mix màu**: bật công tắc, chọn tối đa 4 màu, mỗi màu có thanh độ mờ riêng; "Áp dụng Mix" tạo mỗi màu 1 layer (mỗi layer render từ ảnh gốc) rồi hạ opacity để pha thành màu mới.
- **Look LUT**: bộ lọc Camera Raw bỏ qua bảng Look (`crs:RGBTable`) nên trước đây nhiều màu áp xong không đổi. `_dev/tools/xmp-rgbtable-to-cube.js` giải mã bảng theo định dạng DNG SDK và `build-color-presets.js` ghi ra `presets/colors/<nhóm>/NNN.icc` (ICC device-link). `jsx/color-mix.jsx` áp bằng lớp Color Lookup đặt trên Smart Object (không gộp xuống pixel), cả nhóm gói trong một group `Color <bộ> NNN`; ảnh tách nền không còn bị nền đen và vẫn mở lại Camera Raw để chỉnh. Look gốc của Adobe ("Camera Canon…") lấy bảng từ `Camera Raw.8bi` qua `_dev/tools/extract-stock-look-tables.js`; preset "Bản 2" (Stubbed) mượn bảng của preset anh em cùng UUID. Cả 165 màu đều đổi màu khi áp.
- Dữ liệu: `presets/colors/<bộ>/NNN.xmp` + `presets/colors/manifest.json` (id ASCII, tên tiếng Việt), icon `img/colors/*.svg`; sinh lại bằng `node _dev/tools/build-color-presets.js "<thư mục bộ màu>" "<thư mục icon>"`.
- File: `js/color-presets.js` (giao diện), `css/color-presets.css`, `jsx/color-mix.jsx` (`$.dr7ApplyColorMix`, cầu nối `dr7ApplyColorMix` trong `js/panel.js`).

## v0.1.3 — Tab Artboard và Brush Lab

- Nhóm **Cọ vẽ** đổi tên thành **Brush Lab**; tiêu đề nhóm không còn in hoa toàn bộ.
- Tab **Artboard** ("Tạo artboard"): tìm khổ, chip lọc Tất cả/Facebook/YouTube/Tùy chỉnh, chọn nhiều thẻ khổ (Hay dùng, Facebook,
  YouTube, Bộ nhiều ảnh, khổ tùy chỉnh), thiết lập Tài liệu mới / File hiện tại, tên bộ, khoảng cách, nền, guide vùng an toàn
  (lề 5%). Nút "Tạo N artboard" xếp các mẫu chồng dọc, mỗi mẫu xếp ngang theo hàng, cách nhau `gap` px.
- File hiện tại: nếu chưa có artboard thì nội dung cũ được gói vào artboard "Tài liệu gốc", artboard mới nối bên phải; cả lệnh là một bước History.
- Nền trắng/đen là lớp màu "Nền" nằm trong artboard (Photoshop không cho đặt nền artboard qua script); "Trong suốt" không thêm lớp.
- File: `js/artboard-layout.js` (dữ liệu + xếp + kiểm tra spec), `js/artboard-tab.js` (giao diện), `css/artboard.css`,
  `jsx/artboard-create.jsx` (lệnh `$._ext_ARTBOARD`); kiểm tra bằng `tests/check-artboard-layout.js`.

## v0.1.3 — Tab Khám phá

- Tab **Khám phá**: thẻ cộng đồng Facebook (liên kết tĩnh), thẻ kênh YouTube `@scctlm`, playlist "300 bài FX Typography
  thiếu nhi" và danh sách video (ảnh bìa, tìm kiếm, chip lọc Tất cả/Typography/Photoshop/Illustrator). Link mở bằng trình duyệt mặc định.
- Dữ liệu lấy từ feed RSS playlist YouTube (không cần API key), lưu cache `localStorage` để mở lại có sẵn danh sách; offline thì hiện
  thông báo kèm nút "Thử lại". Facebook không đọc được nội dung bài đăng nếu chưa đăng nhập nên chỉ là liên kết.
- File: `js/explore-feed.js` (tải/parse), `js/explore-tab.js` (giao diện), `css/explore.css`; kiểm tra bằng `tests/check-explore-feed.js`.

## v0.1.2 — Đổi tên thành SCCTLM_Foto

- Plugin và repo GitHub đổi tên từ "MHK DR7" / `hongducdev/DR7` thành **SCCTLM_Foto** (`hongducdev/SCCTLM_Foto`): menu
  Window > Extensions, tiêu đề panel, `Abstract` trong manifest, thông báo, updater (`REPO`), README, tên History/hộp thoại
  trong Photoshop (`SCCTLM_Foto: ...`), thư mục preset Camera Raw (`SCCTLM_Foto Presets`).
- Thư mục cài đổi thành `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto`; script cài đổi tên thành `Cai-dat-SCCTLM_Foto.bat`,
  `Fix-CEP-SCCTLM_Foto.reg`, `Hot-reload-SCCTLM_Foto.bat`. `Cai-dat-SCCTLM_Foto.bat` hỏi đổi tên thư mục cài cũ `DR7`
  thành `DR7.disabled` (cùng Extension Id nên sẽ hiện trùng panel nếu để cả hai).
- Bộ Action phím tắt đổi từ `MHK DR7` thành `SCCTLM_Foto`; lần mở panel đầu tiên tự dựng lại bộ mới từ danh sách phím
  đã lưu và xoá bộ cũ (`LEGACY_SET_NAME`).
- Giữ nguyên: Extension Id `com.retouchpanel.*`, tiền tố mã `dr7*` / `DR7_*`, file `.dr7-*`, tên preset cọ/lớp bên trong
  file `.tpl` và script (vd `DR7 Soft Brush`) vì mã tra cứu theo tên đó. Các mục bên dưới giữ tên cũ vì là lịch sử.

## Chưa phát hành — Cọ vẽ và Rim Light đầy đủ chức năng

- Giao diện: nhóm có mũi tên thu gọn (`js/section-collapse.js`), nút trung tính tối, nút chính đỏ (`css/layout.css`).
- **Cọ vẽ**: khung xem trước nét cọ + thanh Kích thước / Độ cứng đọc-ghi trực tiếp cọ hiện tại (`js/brush-controls.js`,
  `jsx/brush-size-hardness.jsx`, lệnh `$._ext_BRUSH`); nút Thiết lập cọ thành "✓ Cọ đã bật", "Về mặc định" hiện cùng hàng khi cọ đã bật.
  Phím tắt Play Action vẫn ở nhóm Action (không gắn vào Cọ vẽ).
- Icon nút vẽ bằng SVG mask (`css/button-icons.css`): bánh răng / dấu tích (Thiết lập cọ), mũi tên hoàn tác (Về mặc định), bàn phím (Gán phím tắt), tải xuống (nạp `.atn`), ống hút màu (Rim Light); bỏ ký tự ⚙ ✓ ⤓ ⌨ trong chữ nút.
- **Rim Light** (nhóm mới, thay hàng "Màu Rim Light"): ô màu tròn, hex, hút Foreground, 7 màu mẫu, thanh Cường độ (độ mờ nhóm).
  Chỉ hiện khi ảnh có nhóm `Rim Light` > lớp `Color`; đổi màu tô lại lớp Color ngay (`RIMCOLOR`), không có nút tạo Rim Light.
- Kiểm chứng trên Photoshop thật: đọc/ghi Size-Hardness, đọc/đặt cường độ nhóm Rim Light.

## v0.1.1 (2026-10-15) — Nút nạp bộ Action và màu Rim Light

- Nhóm **Action** (gộp nút nạp bộ Action, màu Rim Light và Phím tắt Action vào một card, gọn hơn ~100px): mỗi file `.atn` trong `presets/` thành một nút **⤓ <tên file>**, bấm là nạp bộ Action vào
  bảng Actions (`app.load`), không cần mở ảnh. Đọc tên bộ từ đầu file `.atn`; Photoshop đã có bộ cùng tên thì giữ
  nguyên và báo "đã có" thay vì nạp trùng.
- Đóng gói sẵn `presets/Thumbnail_action.atn` (bộ Thumbnail action: Stroke Brush Path, YouTube Rim Light).
  Để trong `presets/` nên cơ chế cập nhật GitHub, đồng bộ máy dev và `watch-plugin.js` tự mang theo.
- Mã: `jsx/action-set-import.jsx` (`$.dr7ImportBundledAtn`), kiểu lệnh `atn` trong `js/panel.js` (bridge trả thêm
  `DR7_EXISTS`), `window.dr7RefreshActions` để danh sách Phím tắt Action cập nhật ngay sau khi nạp.
- Hàng **Màu Rim Light** (chỉ hiện khi ảnh đang mở có nhóm `Rim Light` chứa lớp `Color` — `$._ext_RIMCOLOR.available()`, panel hỏi lại khi focus và mỗi 2,5 giây): ô chọn màu (mặc định theo Foreground, giữ màu người
  dùng đã chọn) + nút **Màu Rim Light** tô lớp `Color` trong nhóm `Rim Light` (`jsx/rim-light-color.jsx`, lệnh `RIMCOLOR`,
  `js/rim-color-controls.js`; bridge `run` nhận thêm tham số màu `#rrggbb`). Lớp `Color` do Action tạo là lớp pixel nên
  được tô lại giữ vùng trong suốt (lớp Solid Color thì đổi màu); 1 bước History, giữ nguyên layer đang chọn.
- Test: `tests/check-script-stability.js` kiểm tra tên file bị từ chối, đọc đúng tên bộ từ `.atn` thật, nạp /
  bỏ qua khi đã có, không alert với `DR7_EXISTS`.

## 2026-10-13 — Header panel, cập nhật từ GitHub Release

- Nút nạp lại `↻` nổi đè card được thay bằng thanh tiêu đề: "MHK DR7 v<phiên bản>" + nút icon SVG Cập nhật
  và Nạp lại cùng phong cách card; dòng trạng thái nhỏ bên dưới (tự giãn chiều cao panel).
- `js/github-updater.js` (mới): đọc `releases/latest` của `hongducdev/DR7`, so tag `vX.Y.Z` với `Version`
  trong `CSXS/manifest.xml`; cập nhật bằng cây file của tag, chỉ tải file runtime có blob sha khác
  `.dr7-version.json`, tải hết rồi mới ghi (`cep.fs`, Base64), xoá đúng file của bản trước đã bị gỡ,
  chặn path ngoài whitelist / `..`, báo khởi động lại khi manifest đổi cấu trúc.
- Panel tự kiểm tra khi mở (im lặng nếu offline), chấm xanh khi có bản mới; cập nhật cần xác nhận và
  khoá các nút lệnh trong lúc tải.
- `Cai-dat-DR7.bat` và `watch-plugin.js` xoá `.dr7-version.json` sau khi chép file.
- Test: `tests/check-github-updater.js` (GitHub + cep.fs giả, chạy module thật); `check-script-stability.js`
  kiểm tra 2 số phiên bản trong manifest trùng nhau.

## 2026-10-13 — Sửa nhóm Da

- `MBPF` (Trắng Da) **không còn xoá History**: action gốc kết thúc bằng "chọn state hiện tại" + "Clear History",
  làm mất toàn bộ Undo của người dùng. Đã bỏ 2 bước đó trong `jsx/main.jsx`.
- Highlight / Giảm Vàng / Trắng Da / Màu tổng chạy qua `$.dr7SkinStep` (`jsx/main.jsx`): mỗi lần bấm là **1 bước
  History** (trước đây 8–17 bước, Ctrl+Z không hoàn tác được 1 lần bấm), và chỉ chạy ở RGB — ảnh Gray/Lab/CMYK
  trước đây chết giữa chừng, để lại layer dở. Lỗi thật vẫn lên bridge kèm file/dòng.
- `db.jsx` (Đánh Khối) thêm kiểm tra chế độ RGB trước khi mở hộp thoại, như các script Da khác.
- `ls/ss/re/db/tc.jsx`: lỗi thật không còn bị báo nhầm "Bạn chưa mở file nào cả" (giống bản sửa nhóm Quy trình).
- `tests/check-script-stability.js` kiểm tra thêm: không lệnh nào `clearEvent` History, guard RGB của 5 script
  hộp thoại, wrapper rethrow của LS/SS/RE/DB/TC, và chạy thật `$.dr7SkinStep` (RGB / lỗi / non-RGB).
  `tests/photoshop-skin-color-audit.jsx` nạp `loader.jsx` vì `pfsd2.jsx` cần `$.dr7SkinStep`.

## 2026-10-13 — Sửa nhóm Quy trình

- `BUGFIX` (workaround treo Photoshop khi mở hộp thoại ScriptUI từ panel CEP) trước đây gọi từ `body onload`,
  luôn chạy trước khi lõi ExtendScript sẵn sàng nên bị bỏ qua lặng lẽ. Nay `js/panel.js` gọi ngay sau khi loader báo
  `DR7_READY`; các hộp thoại Làm Da / Tuỳ chỉnh / Hàng loạt / Chữ-Logo được bảo vệ đúng.
- Nút `SE` đổi nhãn "Tự động" → "Tuỳ chỉnh" (đúng chức năng: hộp thoại bán kính/chi tiết/bảo vệ vùng sáng), xếp cạnh
  nút chính; tooltip DS/SE/BA mô tả đúng việc làm.
- `BA` xử lý mọi ảnh đang mở nên không còn được miễn kiểm tra "chưa mở ảnh"; báo lỗi thống nhất với các nút khác.
- `ds/se/ba.jsx`: lỗi thật không còn bị báo nhầm "Bạn chưa mở file nào cả"; được ném lên bridge để hiện nội dung,
  file, dòng (Huỷ thì im lặng). Chỉ báo "chưa mở file" khi thật sự không có ảnh.
- `install/watch-plugin.js` bỏ thư mục `assets/` đã xoá, thêm `presets/`; `tests/check-live-reload.js` chờ
  `dr7IsBusy` thay cho `mhkPP` đã gỡ.

## 2026-10-13 — Nút preset tự sinh từ thư mục, gỡ 3D LUT

- Mỗi file `.xmp` trong `presets/` thành một nút trên card "Màu & Preset" (`renderPresets()` trong
  `js/panel.js`, dùng `cep.fs.readdir`). Thêm/xoá màu chỉ cần chép file, không sửa code.
- Bridge có thêm `dr7ApplyPreset(file)` → `$.dr7ApplyBundledXmp(file)`. Tên file kiểm tra bằng regex
  ở cả panel lẫn ExtendScript (chỉ chữ không dấu, số, khoảng trắng, `-_()`, đuôi `.xmp`), nên không thể
  thoát khỏi `presets/` hay chèn mã vào chuỗi lệnh.
- Gỡ nút 3D LUT và `applyLUT`: Photoshop không render LUT nạp qua script (cần ICC device-link tự sinh).
- Gỡ lệnh cố định `XMP_MHK05451` (nay là nút tự sinh) và `presets/Fuji_ceremony.xmp` (trùng màu MHK05451).
- Audit live đổi tên `tests/photoshop-preset-audit.jsx`: kiểm tra chọn file, nút tự sinh, và chặn tên ngoài `presets/`.

## 2026-10-13 — Panel chia nhóm dạng card

- Toàn bộ nút chia thành 5 card có tiêu đề: Quy trình (vàng), Da (xanh lá), Chân dung (hồng),
  Hoa văn (xanh dương), Màu & Preset (tím). Mỗi nhóm đủ hàng 3 cột, không còn ô trống.
- Nút trong card: nền mờ cùng tông + viền màu nhấn, đổ đầy khi rê chuột; `Làm Da V5.0` là nút chính
  đổ đầy rộng cả hàng; preset áp nhanh tím có chấm màu, lưới 2 cột cho tên dài.
- Màu nhấn khai báo một chỗ qua biến `--accent` trên từng `.group-*` trong `css/layout.css`.
- `panel.js` tính chiều cao panel theo `.panel` thay vì `.action-grid` đầu tiên, để các card không bị cắt.

## 2026-10-13 — Dọn module preset, gỡ bản vá biến `C` sai chẩn đoán

- Gỡ bản vá xoá biến toàn cục `C` trong `loader.jsx` (commit `89c2cba`). Kiểm chứng lại: Camera Raw Filter
  chạy bình thường dù `4.jsxbin` để lại `C`; lỗi `Panel() is not a function` lúc trước do script thử nghiệm
  tự khai báo `C` rồi bị `4.jsxbin` ghi đè. Nguyên nhân thật khiến preset không đổi màu là key `LCs ` sai.
- `jsx/preset-lut.jsx`: gộp phần chọn file (`resolveFile`, `cancelled`), bỏ đường dẫn cá nhân viết cứng,
  bỏ đăng ký lệnh trùng (loader đã chép `$.presetLutCommands`), chỉ copy preset vào Camera Raw khi người dùng
  tự chọn file và ghi log thay vì nuốt lỗi, `decodeURI` an toàn với tên file có `%`.
- `applyLUT`: dựng đủ descriptor + `setd` + dọn layer khi lỗi. Vẫn chưa render màu — xem "Còn tồn đọng".

**Còn tồn đọng:** nút 3D LUT tạo layer Color Lookup nhưng ảnh không đổi. Photoshop render LUT từ ICC
device-link (key `profile`) tự sinh khi nạp qua giao diện; script chưa tạo được dữ liệu này.

## 2026-10-13 — Nút màu nhanh MHK05451 + sửa Camera Raw Filter

- Thêm nút `MHK05451` (`XMP_MHK05451`): áp preset đóng gói `presets/MHK05451.xmp` bằng 1 click,
  không hỏi file, không mở hộp thoại. Helper `quickPreset()` trong `jsx/preset-lut.jsx` dùng lại cho nút sau.
- Preset XMP truyền thiết lập qua key `XMPp` (XMPParameters) thay cho `LCs ` (LocalAdjustments — sai key)
  + `Previous.xmp`. Trước đây preset không đổi màu ảnh; nay áp đúng. Không còn ghi đè `Previous.xmp` của người dùng.
- `sanitizeAcrXmp()` bỏ `crs:Temperature/Tint` dạng Kelvin (chỉ có nghĩa với RAW) khi áp lên ảnh đã render.
- Test: unit test sanitizer cho sidecar RAW; audit live kiểm tra nút MHK05451 đổi màu điểm ảnh.

## 2026-09-16 — Preset XMP áp dụng tự động (không cần thao tác)

- `APPLY_PRESET_XMP` chạy hoàn toàn tự động: đặt thiết lập XMP làm "previous conversion" của Camera Raw
  rồi gọi bộ lọc với `Sett = Prev` và `DialogModes.NO`. Camera Raw tự render vào layer `Preset - [tên]`
  và tự đóng — không còn hộp thoại phải bấm OK.
- Sửa lỗi **"Unsupported Edits — edited in a newer version of Camera Raw"**:
  descriptor trước đây khai báo cứng `CrVe = "15.0"` (Camera Raw 15) trong khi máy đang chạy Camera Raw 14.2,
  khiến ACR coi thiết lập là "từ phiên bản tương lai". Log ACR xác nhận:
  `Settings are from future ACR version 0f000000 (15.0.0.0). Current version is 0e020000 (14.2.0.0)`.
  Đã bỏ `CrVe` hoàn toàn và thêm `sanitizeAcrXmp()` loại bỏ mọi khai báo `crs:Version` trước khi đưa
  thiết lập vào Camera Raw, nên preset xuất từ ACR mới hơn cũng không còn gây cảnh báo.
- Giữ nguyên dữ liệu preset: `crs:Exposure2012`, `crs:ToneCurvePV2012`, `crs:PresetName`… không bị thay đổi;
  thiết lập được đánh dấu `crs:HasSettings="True"` nếu file gốc thiếu.
- Nếu cả hai lần chạy tự động đều lỗi, chỉ khi đó mới mở Camera Raw để người dùng tự xác nhận
  (`withDialog: false` sẽ tắt hẳn đường dự phòng này).
- Kiểm chứng: `tests/check-script-stability.js` chạy thẳng module để kiểm tra bộ làm sạch payload
  (assertion thất bại nếu còn `crs:Version`); `tests/photoshop-preset-lut-audit.jsx` kiểm tra trên
  Photoshop thật rằng preset đổi màu điểm ảnh và file staging không còn khai báo phiên bản.

## 2026-09-16 — Áp dụng Preset XMP và 3D LUT

- Thêm 2 nút điều khiển `Preset XMP` và `3D LUT` vào hàng cuối của panel (lấp đầy 3 cột, giữ nguyên chuẩn 235px).
- Thêm module lõi `jsx/preset-lut.jsx`:
  - `APPLY_PRESET_XMP`: Tải trước thiết lập XMP vào `Previous.xmp` và Camera Raw Settings, mở giao diện bộ lọc Camera Raw với thông số từ file XMP nạp sẵn; khi bấm OK, Camera Raw áp dụng hiệu ứng lên layer gộp độc lập (`Preset - [tên preset]`) rồi đóng lại; nếu bấm Cancel, layer tạm được tự động thu hồi.
  - `APPLY_LUT`: Tạo lớp điều chỉnh Color Lookup và nạp dữ liệu nhị phân file 3D LUT (.cube, .3dl, .look).
- Tích hợp sẵn preset mẫu `presets/Fuji_ceremony.xmp`.
- Cập nhật `loader.jsx` và đồng bộ bộ kiểm thử tự động `tests/check-script-stability.js`.

## 2026-09-16 — Keep only working functions (26 buttons)

- Remove every unavailable (dimmed) action button and the whole icon toolbar + logo from index.html.
  Panel now has exactly 26 action buttons plus the ↻ reload button; content height shrinks to fit.
- Delete the scripts that only served removed features: js/pp.js, css/icons.css, css/style.css,
  jsx/5.jsxbin (Tần số 8/16), jsx/{002,004,007,014,015,017,br,cr,dark,dv,ee,fade,fit,fs,light,liq,mid,sm,st,vw}.jsx.
- Trim jsx/main.jsx from 21,511 to 2,432 lines: keep only GGXS, TJSH, JMXS, TJYY, FSJH, MBPF, ZCZQ, DKACR
  (reachability from those roots, including string-form calls, removes 72 top-level blocks: other commands,
  panel_* wrapper dialogs and the leftover stigmata/DRM code).
- Trim jsx/mhk-replacements.jsx to CGYSB, MLXG, mcwl, sfb and PP_DETAIL; drop backgrounds, hide-texture,
  mixer-brush and the unused pattern helpers.
- Trim jsx/Photoshop.jsx to the BUGFIX startup helper (ZO/SP/HB/PA/CL/PC/SA/MA/BW/FW/LA tools removed).
- Remove unused resources: assets/ and every img/ theme folder; only img/icon-large.png (panel icon) remains.
- Loader no longer evaluates jsx/5.jsxbin; verify_plugin.js accepts commands defined in $.mhkReplacements.
- Checks: _dev/tools/check_syntax.js (15/15 files), _dev/tools/check-autorun.js (16 core files, 0 side effects),
  _dev/tools/verify_plugin.js (12 doa + 15 onClickButton commands, bridge payloads valid), verify_assets.js.

## 2026-09-16 — Original MHK resources and hot reload

- Add eight original PAT tiles (100,654 bytes) with stable UUIDs and a dependency-free generator.
- Replace 13 unavailable actions; add pp.js for backgrounds, detail, texture visibility and Mixer Brush.
- Native Photoshop 23.2 verification: PAT import and 36/36 replacement command cases on RGB 8/16-bit; output layers are named and nonempty.
- Fix stamped-layer identity handling and Find Edges action call; avoid preset name collisions.
- Add manual reload and Node watcher for runtime source sync. Busy panel commands defer copying/reload.
- Live installed CEP verification passed manual reload, source save, automatic copy/reload and restoration.
- Refit restored actions: 57 buttons, 738px content height, 6px bottom spacing.
- New effects intentionally differ from DR6. Manifest/CEP configuration changes still require Photoshop restart.
- Checks: tests/check-script-stability.js, tests/check-hot-reload.js, tests/check-live-reload.js, tests/photoshop-replacements-audit.jsx.

## 2026-09-15 — Compact panel layout

- Reflow working actions into a dense three-column grid at the 235px CEP width.
- Reduce button height and spacing; soften the existing category colors and interaction states.
- Hide confirmed unavailable controls and shorten five long labels with full tooltips retained.
- Visual content ends at 607px; no clipped, wrapped or horizontally overflowing labels.

## 2026-09-15 — Script stability

- High: fix evalFile caller-scope loss of 33 main command functions with explicit namespace exports.
- Preserve loader helpers; report all loading errors and require confirmed readiness.
- Prevent overlapping commands; report host error context and restore dialog/ruler preferences.
- Restore 10 script resources and matching binary preset names; resolve paths from CEP root.
- Repair typeof token typos; use native eyedropper when optional preset absent; material file picker.
- Disable 13 confirmed unsupported legacy pattern/source-layer actions, retaining explanatory tooltips.
- Verification: 72 callable entries, 36 loaded files, 16 image operations and 11 tools passed in Photoshop 23.2.
- Limit: missing original pattern assets; interactive/batch flows and other image modes not fully verified.
- Regression checks: tests/check-script-stability.js and tests/photoshop-script-audit.jsx.
