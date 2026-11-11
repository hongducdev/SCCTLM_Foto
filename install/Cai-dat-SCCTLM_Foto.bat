@echo off
chcp 65001 >nul
setlocal EnableExtensions
title SCCTLM_Foto : cai dat tu dong

rem ============================================================
rem  SCCTLM_Foto : cai dat tu dong vao Photoshop (CEP)
rem  - Bat PlayerDebugMode (sua loi "extension khong duoc phep chay")
rem  - Copy plugin vao thu muc CEP extensions cua nguoi dung hien tai
rem  - Canh bao go ban cu neu con (tranh xung dot $._ext_*)
rem  Nang cao (chi de test):
rem    set SCCTLM_FOTO_TARGET=<thu muc dich>   -> doi noi copy
rem    set SCCTLM_FOTO_SKIP_REG=1              -> khong ghi registry
rem ============================================================

for %%I in ("%~dp0..") do set "SRC=%%~fI"
if not defined SCCTLM_FOTO_TARGET set "SCCTLM_FOTO_TARGET=%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto"
set "EXTDIR=%APPDATA%\Adobe\CEP\extensions"

echo ============================================================
echo   SCCTLM_Foto : cai dat tu dong
echo   Nguon : %SRC%
echo   Dich  : %SCCTLM_FOTO_TARGET%
echo ============================================================
echo.

rem ---------- 0. Photoshop phai duoc dong ----------
tasklist /fi "imagename eq Photoshop.exe" 2>nul | find /i "Photoshop.exe" >nul
if not errorlevel 1 (
    echo [!] Photoshop dang chay. Hay DONG Photoshop roi chay lai file nay.
    echo.
    pause
    exit /b 1
)

rem ---------- 1. Cho phep extension khong ky ----------
if "%SCCTLM_FOTO_SKIP_REG%"=="1" (
    echo [1/3] Bo qua buoc registry ^(SCCTLM_FOTO_SKIP_REG=1^)
) else (
    echo [1/3] Bat PlayerDebugMode cho CSXS.4 - CSXS.15 ...
    reg import "%~dp0Fix-CEP-SCCTLM_Foto.reg" >nul 2>&1
    if errorlevel 1 (
        echo       [x] Khong ghi duoc registry. Thu bam chuot phai -^> Run as administrator.
    ) else (
        echo       [ok] Da bat. Photoshop se cho phep panel khong ky.
    )
)

rem ---------- 2. Copy plugin ----------
echo [2/3] Copy plugin ...
rem Chi chep file panel can khi chay (cung danh sach voi RUNTIME trong js\release-manifest-verifier.js) + giay phep.
rem Khong chep .debug cho nguoi dung: no mo cong go loi 9004 vao panel.
set "COPYFAIL="
robocopy "%SRC%" "%SCCTLM_FOTO_TARGET%" index.html style.css loader.jsx LICENSE NOTICE.md /NFL /NDL /NJH /NJS /R:1 /W:1 >nul
if errorlevel 8 set "COPYFAIL=1"
for %%F in (CSXS js jsx css img presets) do (
    robocopy "%SRC%\%%F" "%SCCTLM_FOTO_TARGET%\%%F" /E /NFL /NDL /NJH /NJS /R:1 /W:1 >nul
    if errorlevel 8 set "COPYFAIL=1"
)
if defined COPYFAIL (
    echo       [x] Copy that bai. Dong Photoshop het roi thu lai.
    echo.
    pause
    exit /b 1
)
if not exist "%SCCTLM_FOTO_TARGET%\CSXS\manifest.xml" (
    echo       [x] Thieu CSXS\manifest.xml trong ban copy. Kiem tra lai thu muc nguon.
    echo.
    pause
    exit /b 1
)
rem Ban ghi cua trinh cap nhat GitHub khong con khop file vua copy -> xoa de lan sau tai lai du.
if exist "%SCCTLM_FOTO_TARGET%\.scctlm-foto-version.json" del /q "%SCCTLM_FOTO_TARGET%\.scctlm-foto-version.json" >nul 2>&1
rem Cap nhat do dang (journal + thu muc tam) khong duoc ghi de len file vua copy.
if exist "%SCCTLM_FOTO_TARGET%\.scctlm-foto-update.json" del /q "%SCCTLM_FOTO_TARGET%\.scctlm-foto-update.json" >nul 2>&1
if exist "%SCCTLM_FOTO_TARGET%\.scctlm-foto-update" rmdir /s /q "%SCCTLM_FOTO_TARGET%\.scctlm-foto-update" >nul 2>&1
echo       [ok] Da copy vao %SCCTLM_FOTO_TARGET%
rem Cai tu git checkout (may dev): nut Nap lai tren panel tu chep code moi tu thu muc nguon.
rem Khong dung khoi ( ... ): duong dan nhu "SCCTLM_Foto (1)" co dau ) se dong khoi som.
if exist "%SRC%\.git" >"%SCCTLM_FOTO_TARGET%\.scctlm-foto-dev-source" echo(%SRC%
if not exist "%SRC%\.git" del /q "%SCCTLM_FOTO_TARGET%\.scctlm-foto-dev-source" >nul 2>&1
rem Cong go loi 9004 (.debug) chi danh cho may dev; ban cai cu cua nguoi dung co file nay thi xoa.
if /i not "%SRC%"=="%SCCTLM_FOTO_TARGET%" (
    if exist "%SRC%\.git" (
        copy /y "%SRC%\.debug" "%SCCTLM_FOTO_TARGET%\.debug" >nul 2>&1
    ) else (
        del /q "%SCCTLM_FOTO_TARGET%\.debug" >nul 2>&1
    )
    rem Ban cai cu chep ca tai lieu va kiem thu; panel khong dung chung.
    for %%D in (tests docs .github) do if exist "%SCCTLM_FOTO_TARGET%\%%D" rmdir /s /q "%SCCTLM_FOTO_TARGET%\%%D" >nul 2>&1
    for %%X in (README.md DESIGN.md .gitignore .gitattributes) do if exist "%SCCTLM_FOTO_TARGET%\%%X" del /q "%SCCTLM_FOTO_TARGET%\%%X" >nul 2>&1
)

rem ---------- 3. Ban cu con cai se xung dot ----------
echo [3/3] Kiem tra ban cu ...
set "OLD="
for /d %%D in ("%EXTDIR%\*") do (
    if /i not "%%~fD"=="%SCCTLM_FOTO_TARGET%" if exist "%%D\ext.js" set "OLD=%%~fD" & set "OLDNAME=%%~nxD"
)
if defined OLD (
    echo       [!] Phat hien ban cu: %OLD%
    echo           Ban cu va SCCTLM_Foto cung dang ky bien $._ext_* trong Photoshop,
    echo           nen go ban cu de tranh loi nut bam.
    choice /c YN /n /m "          Doi ten ban cu thanh .disabled ? [Y/N] "
    if errorlevel 2 (
        echo           Giu nguyen ban cu.
    ) else (
        ren "%OLD%" "%OLDNAME%.disabled" >nul 2>&1
        if errorlevel 1 (
            echo           [x] Khong doi ten duoc ^(co the dang bi Photoshop mo^). Xoa thu cong: %OLD%
        ) else (
            echo           [ok] Da doi ten ban cu thanh %OLDNAME%.disabled
        )
    )
) else (
    echo       [ok] Khong co ban cu.
)

rem ---------- 4. Thu muc cai dat cu cua ban DR7 ----------
set "LEGACY=%EXTDIR%\DR7"
if /i not "%LEGACY%"=="%SCCTLM_FOTO_TARGET%" if exist "%LEGACY%\CSXS\manifest.xml" (
    echo       [!] Phat hien thu muc cai dat cu: %LEGACY%
    echo           Ban cu dung chung Extension Id, panel se hien trung lap.
    choice /c YN /n /m "          Doi ten thanh DR7.disabled ? [Y/N] "
    if not errorlevel 2 (
        ren "%LEGACY%" "DR7.disabled" >nul 2>&1
        if errorlevel 1 ( echo           [x] Khong doi ten duoc ^(co the dang bi Photoshop mo^). Dong Photoshop roi chay lai. ) else ( echo           [ok] Da doi ten thanh DR7.disabled )
    )
)

echo.
echo ============================================================
echo   XONG. Cac buoc tiep theo:
echo     1^) Mo Photoshop
echo     2^) Window ^> Extensions ^> SCCTLM_Foto
echo.
echo   Kiem tra hien thi tieng Viet: File ^> Scripts ^> Browse...
echo     chon %SRC%\_dev\tools\test-vietnamese.jsx
echo.
echo   Go cai dat: chay install\Go-cai-dat-SCCTLM_Foto.bat
echo ============================================================
echo.
pause
