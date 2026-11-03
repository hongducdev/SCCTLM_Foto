#!/bin/bash
# SCCTLM_Foto: gỡ cài đặt trên macOS.
# Kiểm thử: SCCTLM_FOTO_TARGET=<thư mục> đổi thư mục cần xoá (bỏ qua kiểm tra Photoshop);
#           SCCTLM_FOTO_SKIP_DEFAULTS=1 không hỏi / không sửa PlayerDebugMode;
#           SCCTLM_FOTO_ASSUME_YES=1 trả lời Y cho mọi câu hỏi.

CUSTOM_TARGET="$SCCTLM_FOTO_TARGET"
TARGET="${SCCTLM_FOTO_TARGET:-$HOME/Library/Application Support/Adobe/CEP/extensions/SCCTLM_Foto}"

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
echo "  SCCTLM_Foto : gỡ cài đặt"
echo "  Thư mục : $TARGET"
echo "============================================================"
echo

if [ -z "$CUSTOM_TARGET" ] && pgrep -f "Adobe Photoshop" >/dev/null 2>&1; then
    echo "[!] Photoshop đang chạy. Hãy ĐÓNG Photoshop (Cmd+Q) rồi chạy lại file này."
    pause_and_exit 1
fi

if [ ! -f "$TARGET/CSXS/manifest.xml" ]; then
    echo "[1/2] Không thấy SCCTLM_Foto ở đường dẫn trên, không có gì để xoá."
else
    if ask_yes "[1/2] Xoá thư mục $TARGET ?"; then
        if rm -rf "$TARGET"; then
            echo "      [ok] Đã xoá."
        else
            echo "      [x] Không xoá được. Xoá thủ công thư mục trên."
        fi
    else
        echo "      Giữ nguyên."
    fi
fi

if [ -n "$SCCTLM_FOTO_SKIP_DEFAULTS" ]; then
    echo "[2/2] Bỏ qua PlayerDebugMode (SCCTLM_FOTO_SKIP_DEFAULTS=1)"
else
    echo "[2/2] PlayerDebugMode cho phép MỌI extension CEP chưa ký chạy."
    echo "      Chỉ tắt nếu bạn không dùng extension chưa ký nào khác."
    if ask_yes "      Tắt PlayerDebugMode ?"; then
        for n in 4 5 6 7 8 9 10 11 12 13 14 15; do
            defaults delete "com.adobe.CSXS.$n" PlayerDebugMode >/dev/null 2>&1
        done
        killall cfprefsd >/dev/null 2>&1
        echo "      [ok] Đã tắt."
    else
        echo "      Giữ nguyên."
    fi
fi

echo
echo "XONG."
pause_and_exit 0
