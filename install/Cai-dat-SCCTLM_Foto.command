#!/bin/bash
# SCCTLM_Foto: cài đặt tự động vào Photoshop (CEP) trên macOS.
# Kiểm thử: SCCTLM_FOTO_TARGET=<thư mục đích> đổi nơi chép;
#           SCCTLM_FOTO_SKIP_DEFAULTS=1 không ghi PlayerDebugMode;
#           SCCTLM_FOTO_ASSUME_YES=1 trả lời Y cho mọi câu hỏi.

SRC="$(cd "$(dirname "$0")/.." && pwd)"
EXTDIR="$HOME/Library/Application Support/Adobe/CEP/extensions"
TARGET="${SCCTLM_FOTO_TARGET:-$EXTDIR/SCCTLM_Foto}"

pause_and_exit() {
    echo
    [ -t 0 ] && [ -z "$SCCTLM_FOTO_ASSUME_YES" ] && read -r -n 1 -s -p "Bấm phím bất kỳ để đóng..." && echo
    exit "$1"
}

ask_yes() {
    [ -n "$SCCTLM_FOTO_ASSUME_YES" ] && return 0
    local reply
    read -r -n 1 -p "$1 [Y/N] " reply
    echo
    [ "$reply" = "y" ] || [ "$reply" = "Y" ]
}

echo "============================================================"
echo "  SCCTLM_Foto : cài đặt tự động"
echo "  Nguồn : $SRC"
echo "  Đích  : $TARGET"
echo "============================================================"
echo

if [ ! -f "$SRC/CSXS/manifest.xml" ]; then
    echo "[x] Không thấy CSXS/manifest.xml trong thư mục nguồn. Hãy giải nén đủ file zip rồi chạy lại."
    pause_and_exit 1
fi

if [ -z "$SCCTLM_FOTO_TARGET" ] && pgrep -f "Adobe Photoshop" >/dev/null 2>&1; then
    echo "[!] Photoshop đang chạy. Hãy ĐÓNG Photoshop (Cmd+Q) rồi chạy lại file này."
    pause_and_exit 1
fi

if [ -n "$SCCTLM_FOTO_SKIP_DEFAULTS" ]; then
    echo "[1/3] Bỏ qua bước PlayerDebugMode (SCCTLM_FOTO_SKIP_DEFAULTS=1)"
else
    echo "[1/3] Bật PlayerDebugMode cho CSXS.4 - CSXS.15 ..."
    failed=0
    for n in 4 5 6 7 8 9 10 11 12 13 14 15; do
        defaults write "com.adobe.CSXS.$n" PlayerDebugMode 1 || failed=1
    done
    if [ "$failed" -eq 1 ]; then
        echo "      [x] Không ghi được cấu hình PlayerDebugMode."
    else
        echo "      [ok] Đã bật. Photoshop sẽ cho phép panel chưa ký."
        # cfprefsd giữ bản cache cũ; nạp lại để Photoshop đọc đúng giá trị mới.
        killall cfprefsd >/dev/null 2>&1
    fi
fi

echo "[2/3] Chép plugin ..."
mkdir -p "$TARGET" || { echo "      [x] Không tạo được $TARGET"; pause_and_exit 1; }
if ! rsync -a \
    --exclude '/_dev' --exclude '/.git' --exclude '/install' --exclude '/scripts' --exclude '/site' \
    --exclude '.gitignore' --exclude '.gitattributes' --exclude '.DS_Store' \
    "$SRC/" "$TARGET/"; then
    echo "      [x] Chép thất bại. Đóng Photoshop hết rồi thử lại."
    pause_and_exit 1
fi
if [ ! -f "$TARGET/CSXS/manifest.xml" ]; then
    echo "      [x] Thiếu CSXS/manifest.xml trong bản chép. Kiểm tra lại thư mục nguồn."
    pause_and_exit 1
fi
# Trình cập nhật GitHub ghi nhớ file đã cài; bản chép mới làm các ghi nhớ đó lỗi thời.
rm -f "$TARGET/.scctlm-foto-version.json" "$TARGET/.scctlm-foto-update.json"
rm -rf "$TARGET/.scctlm-foto-update"
# Cài từ git checkout (máy dev): nút ↻ trên panel tự chép code mới từ thư mục nguồn.
if [ -d "$SRC/.git" ]; then
    printf '%s\n' "$SRC" > "$TARGET/.scctlm-foto-dev-source"
else
    rm -f "$TARGET/.scctlm-foto-dev-source"
fi
xattr -dr com.apple.quarantine "$TARGET" >/dev/null 2>&1
echo "      [ok] Đã chép vào $TARGET"

echo "[3/3] Kiểm tra bản cũ ..."
found_old=0
for dir in "$EXTDIR"/*/; do
    dir="${dir%/}"
    [ "$dir" = "$TARGET" ] && continue
    name="$(basename "$dir")"
    legacy=0
    [ -f "$dir/ext.js" ] && legacy=1
    [ "$name" = "DR7" ] && [ -f "$dir/CSXS/manifest.xml" ] && legacy=1
    [ "$legacy" -eq 1 ] || continue
    found_old=1
    echo "      [!] Phát hiện bản cũ: $dir"
    echo "          Bản cũ và SCCTLM_Foto dùng chung Extension Id / biến \$._ext_*, nên panel sẽ trùng hoặc lỗi nút bấm."
    if ask_yes "          Đổi tên thành $name.disabled ?"; then
        if mv "$dir" "$dir.disabled"; then
            echo "          [ok] Đã đổi tên thành $name.disabled"
        else
            echo "          [x] Không đổi tên được. Xoá thủ công: $dir"
        fi
    else
        echo "          Giữ nguyên bản cũ."
    fi
done
[ "$found_old" -eq 0 ] && echo "      [ok] Không có bản cũ."

echo
echo "============================================================"
echo "  XONG. Các bước tiếp theo:"
echo "    1) Mở Photoshop"
echo "    2) Window > Extensions > SCCTLM_Foto"
echo
echo "  Mac chip Apple Silicon gặp lỗi? Bật Rosetta cho Photoshop:"
echo "    Finder > Applications > Photoshop > Get Info > Open using Rosetta"
echo
echo "  Gỡ cài đặt: chạy install/Go-cai-dat-SCCTLM_Foto.command"
echo "============================================================"
pause_and_exit 0
