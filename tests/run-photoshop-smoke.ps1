# Runs tests/photoshop-script-audit.jsx in the open Photoshop through COM and fails on any FAIL line.
# The audit loads loader.jsx, calls every dialog-free retouch command on disposable 128x128 documents and checks the
# dialog-opening handlers exist. Only disposable documents are touched; the active document is restored afterwards.
# Photoshop must be running, with no modal dialog open (a modal blocks COM until it is dismissed).
# Example:  pwsh tests/run-photoshop-smoke.ps1
param([int]$TimeoutSec = 300)
$script = (Resolve-Path (Join-Path $PSScriptRoot 'photoshop-script-audit.jsx')).Path
if (-not (Get-Process -Name Photoshop -ErrorAction SilentlyContinue)) { Write-Error 'Photoshop is not running.'; exit 2 }
$job = Start-Job { param($file) (New-Object -ComObject Photoshop.Application).DoJavaScriptFile($file) } -ArgumentList $script
if (-not (Wait-Job $job -Timeout $TimeoutSec)) {
    Stop-Job $job; Remove-Job $job -Force
    Write-Error "Timed out after $TimeoutSec s: a Photoshop modal dialog is probably blocking the script."; exit 3
}
$report = Receive-Job $job; Remove-Job $job
$report -split "`n" | ForEach-Object { Write-Host $_ }
if (($report -split "`n") -match '^FAIL') { exit 1 }
if (-not ($report -match '^PASS')) { Write-Error 'No PASS line in the audit report.'; exit 1 }
