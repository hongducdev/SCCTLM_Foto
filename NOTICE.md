# NOTICE — Nguồn gốc & bản quyền

Tệp này mô tả trung thực ai giữ bản quyền phần nào trong repo. Nó **không** tuyên bố
bản quyền với mã không do tác giả repo viết.

## 1. Phần do hongducdev viết (xem `LICENSE`)

Copyright (c) 2026 hongducdev. All rights reserved.

- `js/github-updater.js`, `js/release-manifest-verifier.js`, `js/release-keys.js`,
  `js/update-staging-journal.js`: bộ cập nhật có chữ ký, cập nhật qua thư mục tạm
- `scripts/release-*.js`: tạo khoá, ký và kiểm tra bản phát hành
- `install/Go-cai-dat-SCCTLM_Foto.bat`: gỡ cài đặt
- `tests/check-release-manifest.js`, `tests/check-baseline-compare.js`, `tests/compare-baselines.js`,
  `tests/photoshop-baseline-record.jsx`, `tests/photoshop-command-inventory.jsx`
- `docs/clean-room/`, `docs/development-roadmap.md`
- Phần đo thời gian nạp trong `loader.jsx`
- Mọi module viết lại theo quy trình clean-room (`docs/clean-room/PROCESS.md`) sau khi được
  ghi vào `docs/clean-room/LOG.md`

## 2. Thư viện bên thứ ba (giữ giấy phép riêng)

| File | Nguồn | Giấy phép |
|---|---|---|
| `js/vendor/tweetnacl.min.js` | TweetNaCl.js 1.0.3 | Unlicense (xem `js/vendor/tweetnacl.NOTICE.txt`) |
| `js/CSInterface.js` | Adobe CEP | Giấy phép của Adobe, kèm trong file |

## 3. Mã có nguồn gốc từ một plugin gốc — **không** thuộc phần được cấp ở mục 1

Các file dưới đây được dựng lại từ một plugin Photoshop có sẵn qua gỡ obfuscation
(JSXBIN, packer, sojson), như ghi trong `_dev/README.md`. Repo này **không có** giấy phép
bằng văn bản của tác giả gốc để sửa hay phân phối lại chúng, và `LICENSE` không áp dụng cho chúng:

- `jsx/4.jsxbin`, `jsx/ba.jsx`, `jsx/db.jsx`, `jsx/ds.jsx`, `jsx/li.jsx`, `jsx/ls.jsx`,
  `jsx/pfsd2.jsx`, `jsx/re.jsx`, `jsx/se.jsx`, `jsx/sh.jsx`, `jsx/ss.jsx`, `jsx/tc.jsx`, `jsx/wt.jsx`
- `jsx/pj/*`
- phần lõi của `jsx/skin-*.jsx` (tách nguyên văn từ `main.jsx` cũ)

Lộ trình thay thế: phase 06 của `plans/261024-2003-risk-remediation/` viết lại từng module
theo clean-room. Mỗi module viết lại xong thì chuyển từ mục 3 sang mục 1.

## 4. Chưa phân loại

Các file còn lại (UI trong `js/`, `css/`, `index.html`, các file `jsx/` khác, `img/`, `presets/`)
chưa được rà soát nguồn gốc từng file. Chúng **không** được khẳng định ở mục 1 cho tới khi
chủ repo rà soát và chuyển vào đúng mục.
