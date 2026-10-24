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
rem    set DR7_TARGET=<thu muc dich>   -> doi noi copy
rem    set DR7_SKIP_REG=1              -> khong ghi registry
rem ============================================================

for %%I in ("%~dp0..") do set "SRC=%%~fI"
if not defined DR7_TARGET set "DR7_TARGET=%APPDATA%\Adobe\CEP\extensions\SCCTLM_Foto"
set "EXTDIR=%APPDATA%\Adobe\CEP\extensions"

echo ============================================================
echo   SCCTLM_Foto : cai dat tu dong
echo   Nguon : %SRC%
echo   Dich  : %DR7_TARGET%
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
if "%DR7_SKIP_REG%"=="1" (
    echo [1/3] Bo qua buoc registry ^(DR7_SKIP_REG=1^)
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
robocopy "%SRC%" "%DR7_TARGET%" /E /XD _dev .git install scripts /XF .gitignore .gitattributes /NFL /NDL /NJH /NJS /R:1 /W:1 >nul
if errorlevel 8 (
    echo       [x] Copy that bai. Dong Photoshop het roi thu lai.
    echo.
    pause
    exit /b 1
)
if not exist "%DR7_TARGET%\CSXS\manifest.xml" (
    echo       [x] Thieu CSXS\manifest.xml trong ban copy. Kiem tra lai thu muc nguon.
    echo.
    pause
    exit /b 1
)
rem Ban ghi cua trinh cap nhat GitHub khong con khop file vua copy -> xoa de lan sau tai lai du.
if exist "%DR7_TARGET%\.dr7-version.json" del /q "%DR7_TARGET%\.dr7-version.json" >nul 2>&1
rem Cap nhat do dang (journal + thu muc tam) khong duoc ghi de len file vua copy.
if exist "%DR7_TARGET%\.dr7-update.json" del /q "%DR7_TARGET%\.dr7-update.json" >nul 2>&1
if exist "%DR7_TARGET%\.dr7-update" rmdir /s /q "%DR7_TARGET%\.dr7-update" >nul 2>&1
echo       [ok] Da copy vao %DR7_TARGET%
rem Cai tu git checkout (may dev): nut Nap lai tren panel tu chep code moi tu thu muc nguon.
if exist "%SRC%\.git" ((echo %SRC%)>"%DR7_TARGET%\.dr7-dev-source") else del /q "%DR7_TARGET%\.dr7-dev-source" >nul 2>&1

rem ---------- 3. Ban cu con cai se xung dot ----------
echo [3/3] Kiem tra ban cu ...
set "OLD="
for /d %%D in ("%EXTDIR%\*") do (
    if /i not "%%~fD"=="%DR7_TARGET%" if exist "%%D\ext.js" set "OLD=%%~fD" & set "OLDNAME=%%~nxD"
)
if defined OLD (
    echo       [!] Phat hien ban cu: %OLD%
    echo           Ban cu va DR7 cung dang ky bien $._ext_* trong Photoshop,
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
if /i not "%LEGACY%"=="%DR7_TARGET%" if exist "%LEGACY%\CSXS\manifest.xml" (
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
