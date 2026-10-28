# Cài các font trong thư mục fonts cho người dùng hiện tại (không cần quyền admin), rồi khởi động lại Photoshop để nhận font.
$source = Join-Path $PSScriptRoot '..\fonts'
$target = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'
$registry = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts'
New-Item -ItemType Directory -Force $target | Out-Null

foreach ($file in Get-ChildItem $source -Include *.ttf, *.otf -Recurse) {
    $kind = if ($file.Extension -eq '.otf') { 'OpenType' } else { 'TrueType' }
    $destination = Join-Path $target $file.Name
    Copy-Item $file.FullName $destination -Force
    New-ItemProperty -Path $registry -Name "$($file.BaseName) ($kind)" -Value $destination -PropertyType String -Force | Out-Null
    Write-Host "Đã cài $($file.Name)"
}
