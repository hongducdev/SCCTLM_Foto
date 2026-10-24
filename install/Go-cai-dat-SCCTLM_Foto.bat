@echo off
chcp 65001 >nul
setlocal EnableExtensions
title SCCTLM_Foto : go cai dat

rem ============================================================
rem  SCCTLM_Foto : go cai dat
rem  - Xoa thu muc plugin trong CEP extensions cua nguoi dung hien tai
rem  - Hoi rieng co tat PlayerDebugMode khong (extension chua ky khac co the van can)
rem  Chi dung HKEY_CURRENT_USER, khong can Administrator.
rem  Nang cao (chi de test):
rem    set DR7_TARGET=<thu muc>         -> doi thu muc can xoa (bo qua kiem tra Photoshop)
rem    set DR7_SKIP_REG=1               -> khong hoi / khong sua registry
rem    set DR7_REG_ROOT=<khoa>          -> doi khoa goc (mac dinh HKCU\Software\Adobe)
rem    set DR7_ASSUME_YES=1             -> tra loi Y cho moi cau hoi
rem ============================================================

rem DR7_TARGET set by hand = test folder, not the one Photoshop loads: the Photoshop check is skipped.
set "CUSTOM_TARGET=%DR7_TARGET%"
if not defined DR7_TARGET set "DR7_TARGET=%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto"
if not defined DR7_REG_ROOT set "DR7_REG_ROOT=HKCU\Software\Adobe"
for %%I in ("%DR7_TARGET%\..") do set "EXTDIR=%%~fI"

echo ============================================================
echo   SCCTLM_Foto : go cai dat
echo   Thu muc : %DR7_TARGET%
echo ============================================================
echo.

rem ---------- 0. Photoshop phai duoc dong ----------
if not defined CUSTOM_TARGET tasklist /fi "imagename eq Photoshop.exe" 2>nul | find /i "Photoshop.exe" >nul
if not defined CUSTOM_TARGET if not errorlevel 1 (
    echo [!] Photoshop dang chay. Hay DONG Photoshop roi chay lai file nay.
    echo.
    pause
    exit /b 1
)

rem ---------- 1. Xoa thu muc plugin ----------
if not exist "%DR7_TARGET%\CSXS\manifest.xml" (
    echo [1/2] Chua cai SCCTLM_Foto tai thu muc tren, khong co gi de xoa.
) else (
    echo [1/2] Se XOA toan bo thu muc: %DR7_TARGET%
    set "ANSWER=Y"
    if not "%DR7_ASSUME_YES%"=="1" (
        choice /c YN /n /m "      Xoa ? [Y/N] "
        if errorlevel 2 set "ANSWER=N"
    )
    call :remove_target
)

rem ---------- 1b. Thu muc cai dat cu (ban DR7 truoc khi doi ten), cung Extension Id ----------
for %%L in (DR7 DR7.disabled) do call :remove_legacy "%EXTDIR%\%%L"

rem ---------- 2. PlayerDebugMode ----------
if "%DR7_SKIP_REG%"=="1" (
    echo [2/2] Bo qua buoc registry ^(DR7_SKIP_REG=1^)
) else (
    echo [2/2] PlayerDebugMode cho phep MOI extension chua ky chay, khong rieng SCCTLM_Foto.
    echo       Chi tat neu ban khong con dung extension chua ky nao khac.
    set "ANSWER=Y"
    if not "%DR7_ASSUME_YES%"=="1" (
        choice /c YN /n /m "      Tat PlayerDebugMode cho CSXS.4 - CSXS.15 ? [Y/N] "
        if errorlevel 2 set "ANSWER=N"
    )
    call :reset_debug_mode
)

echo.
echo ============================================================
echo   XONG.
echo ============================================================
echo.
pause
exit /b 0

rem Subroutines read ANSWER after the caller's block has ended, so the value is current (no delayed expansion needed).
:remove_target
if /i not "%ANSWER%"=="Y" (
    echo       Giu nguyen thu muc.
    exit /b 0
)
rmdir /s /q "%DR7_TARGET%" >nul 2>&1
if exist "%DR7_TARGET%" (
    echo       [x] Khong xoa het duoc ^(co file dang bi mo^). Xoa thu cong: %DR7_TARGET%
) else (
    echo       [ok] Da xoa.
)
exit /b 0

:remove_legacy
if /i "%~f1"=="%DR7_TARGET%" exit /b 0
if not exist "%~1\CSXS\manifest.xml" exit /b 0
findstr /c:"com.retouchpanel.panel" "%~1\CSXS\manifest.xml" >nul 2>&1 || exit /b 0
echo       [!] Con thu muc cai dat cu: %~1
set "ANSWER=Y"
if not "%DR7_ASSUME_YES%"=="1" (
    choice /c YN /n /m "          Xoa luon ? [Y/N] "
    if errorlevel 2 set "ANSWER=N"
)
if /i not "%ANSWER%"=="Y" (
    echo           Giu nguyen.
    exit /b 0
)
rmdir /s /q "%~1" >nul 2>&1
if exist "%~1" ( echo           [x] Khong xoa het duoc. Xoa thu cong: %~1 ) else ( echo           [ok] Da xoa. )
exit /b 0

:reset_debug_mode
if /i not "%ANSWER%"=="Y" (
    echo       Giu nguyen PlayerDebugMode.
    exit /b 0
)
for /l %%N in (4,1,15) do reg delete "%DR7_REG_ROOT%\CSXS.%%N" /v PlayerDebugMode /f >nul 2>nul
echo       [ok] Da tat. Panel chua ky se khong chay nua cho toi khi bat lai.
exit /b 0
