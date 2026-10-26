# Phát hành & cập nhật

## Nạp lại nhanh (↻) và Hot Reload

Nút **↻** trên thanh tiêu đề nạp lại HTML, CSS, JS và các file `.jsx` từ thư mục cài ngay lập tức, không ngắt lệnh đang chạy dở.

**Máy dev (cài từ git checkout):** `Cai-dat-SCCTLM_Foto.bat` ghi đường dẫn thư mục nguồn vào `.dr7-dev-source` trong thư mục cài. Khi có file này, bấm **↻** sẽ tự chép file mới hơn từ nguồn (`index.html`, `style.css`, `loader.jsx`, `js/`, `jsx/`, `css/`, `img/`, `presets/`) sang bản cài rồi mới nạp lại — không cần `Hot-reload-SCCTLM_Foto.bat`. Không xoá file nào ở bản cài; muốn tắt thì xoá `.dr7-dev-source`.

### 👀 Hot-reload tự động (nhà phát triển)

```text
install\Hot-reload-SCCTLM_Foto.bat
```

*(Cần Node.js.)* Trình theo dõi sẽ: lắng nghe thay đổi HTML/CSS/JS/JSX và hình ảnh → chờ file ghi ổn định, kiểm tra Photoshop đang rảnh → đồng bộ vào `%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto` → ra lệnh panel tự làm mới.

## Bộ cập nhật GitHub (⤓)

Nút **⤓** trên thanh tiêu đề lấy GitHub Release mới nhất của `hongducdev/SCCTLM_Foto`:

- Mỗi lần mở panel tự kiểm tra im lặng; có bản mới thì nút hiện **chấm xanh**.
- Bấm nút → xác nhận → panel tải `release-manifest.json` và chữ ký `.sig` của bản đó, kiểm chữ ký Ed25519 bằng khoá công khai trong `js/release-keys.js`, rồi chỉ tải các file runtime đã đổi (`index.html`, `style.css`, `loader.jsx`, `CSXS/manifest.xml`, `js/ css/ jsx/ img/ presets/`). Mỗi file tải về phải khớp SHA-512 trong manifest đã ký; tải và kiểm xong hết mới ghi vào thư mục tạm `.dr7-update/`, đọc lại kiểm hash, rồi mới chuyển từng file vào chỗ thật theo journal `.dr7-update.json` và tự nạp lại. Chữ ký sai, file bị đổi hoặc lỗi mạng/đĩa giữa chừng đều không làm thay đổi bản đang cài.
- Nếu việc chuyển file bị đứt giữa chừng (mất điện, đóng Photoshop, antivirus khoá file), lần mở panel sau tự hoàn tất hoặc huỷ trước khi nạp lõi ExtendScript; huỷ thì panel báo "Cập nhật lần trước bị gián đoạn, hãy bấm ⤓ để cập nhật lại". `index.html`, `js/github-updater.js` và `CSXS/manifest.xml` được chuyển sau cùng. `cep.fs` không xoá được thư mục nên `.dr7-update/` còn lại dạng thư mục rỗng.
- Chỉ nhận bản **mới hơn** bản đang cài (không bị ép xuống bản cũ dù chữ ký hợp lệ).
- Lần cập nhật đầu tiên từ bản cũ phải băm toàn bộ file đang cài (~20 MB, khoảng 4 giây, panel hiện "Đang kiểm tra file..."); các lần sau chỉ băm file có mtime đổi.
- `manifest.xml` đổi cấu trúc (không chỉ số phiên bản) → panel báo khởi động lại Photoshop.
- File đích chỉ-đọc (lỗi `ERR_CANT_WRITE`) được bỏ cờ chỉ-đọc rồi ghi lại một lần; lỗi ghi vẫn hiện kèm tên mã để dễ chẩn đoán.
- Bản ghi file đã cài: `.dr7-version.json` (hash và mtime từng file; bị xoá khi cài lại bằng `.bat` / watcher, cùng với `.dr7-update.json` và `.dr7-update/`).

## Phát hành bản mới

Làm một lần: `node scripts/release-keygen.js` tạo khoá ký Ed25519 tại `%USERPROFILE%\.scctlm\release-ed25519.pem` (đổi chỗ bằng biến `SCCTLM_SIGNING_KEY`). Dán public key in ra vào `js/release-keys.js` (`k1`), commit, và **sao lưu file `.pem` ở hai nơi offline**. Khoá riêng không bao giờ vào repo (`*.pem` đã nằm trong `.gitignore`).

Mỗi bản phát hành:

1. Tăng `ExtensionBundleVersion` và `Version` của panel trong `CSXS/manifest.xml` (phải trùng nhau, dạng `x.y.z`) và thêm mục `## vX.Y.Z` vào `docs/project-changelog.md`.
2. Commit mọi thay đổi (script ký từ chối khi cây làm việc còn thay đổi chưa commit).
3. `node scripts/release-sign.js` ghi `release-manifest.json` + `release-manifest.json.sig` (SHA-512 của mọi file runtime git đang theo dõi), rồi commit hai file đó. Thêm `--min-version x.y.z` nếu bản này không cập nhật tự động được từ bản cũ hơn x.y.z.
4. `node scripts/release-verify.js` (không cần khoá riêng, CI cũng chạy), rồi đặt tag `vX.Y.Z` và push tag. Workflow `release.yml` tạo GitHub Release và đính kèm `SCCTLM_Foto-vX.Y.Z.zip` (`git archive` của tag, dùng để cài thủ công). Tag phải là `v` + đúng số phiên bản.

**Xem lượt tải:** chỉ file zip đính kèm được GitHub đếm (bộ cập nhật trong panel đọc raw file nên không làm tăng số). `gh api repos/hongducdev/SCCTLM_Foto/releases --jq '.[] | {tag: .tag_name, downloads: [.assets[].download_count] | add}'`. Zip của release 0.2.2 trở về trước được đính kèm sau, nên số đếm chỉ tính từ lúc đó.

**Giới hạn bảo mật cần biết**
- Chữ ký bảo vệ khỏi việc ai đó chiếm tài khoản/repo GitHub rồi đẩy mã lạ; nó không bảo vệ nếu **khoá riêng bị lộ**. Khoá lộ thì mọi bản đang tin khoá đó đều hết được bảo vệ: chỉ còn cách phát bản mới có khoá mới và báo người dùng cài lại thủ công.
- Xoay khoá có kế hoạch: bản N nhúng cả `k1` và `k2` trong `js/release-keys.js`; từ bản N+1 trở đi ký bằng `k2` (`--key-id k2`).
- Mất khoá riêng thì không phát hành tiếp qua nút cập nhật được (người dùng cài lại thủ công).
- Người dùng còn ở **0.1.9 trở xuống không bao giờ được bảo vệ**: updater cũ vẫn lấy danh sách file từ GitHub API mà không kiểm chữ ký. Khuyến nghị mọi người lên 0.2.0.
