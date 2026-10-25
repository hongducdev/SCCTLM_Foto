# Records a behaviour baseline (tests/photoshop-baseline-record.jsx) for commands that open a modal ScriptUI dialog.
# Photoshop must be open with the panel's extension files in place. A helper loop presses a key whenever a window whose
# title starts with -Title appears in the Photoshop process, so the blocking command can finish (Enter = default button).
# Example:  pwsh tests/record-baseline-with-dialogs.ps1 -Commands LS -Name ls.after -Samples
# Takes keyboard focus while it runs; do not type in other windows.
param(
    # Both end up inside JavaScript string literals, so only plain identifiers / file names are accepted
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9_]+$')][string[]]$Commands,
    [Parameter(Mandatory)][ValidatePattern('^[A-Za-z0-9_.-]+$')][string]$Name,
    [switch]$Samples,
    [ValidateSet('Enter', 'Esc')][string]$Key = 'Enter',
    [string]$Title = 'SCCTLM_Foto',
    [int]$TimeoutSec = 900
)
Add-Type -AssemblyName System.Windows.Forms
Add-Type @'
using System; using System.Runtime.InteropServices;
public class DialogFinder {
    delegate bool EnumCallback(IntPtr handle, IntPtr state);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumCallback callback, IntPtr state);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr handle, System.Text.StringBuilder text, int max);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr handle, out uint processId);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
    public static IntPtr Find(int processId, string prefix) {
        IntPtr found = IntPtr.Zero;
        EnumWindows((handle, state) => {
            uint owner; GetWindowThreadProcessId(handle, out owner);
            if (owner == processId && IsWindowVisible(handle)) {
                var text = new System.Text.StringBuilder(256); GetWindowText(handle, text, 256);
                if (text.ToString().StartsWith(prefix)) found = handle;
            }
            return true;
        }, IntPtr.Zero);
        return found;
    }
}
'@

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path.Replace('\', '/')
$commandList = ($Commands | ForEach-Object { '"' + $_ + '"' }) -join ','
$js = '$.dr7BaselineCommands=[' + $commandList + ']; $.dr7BaselineName="' + $Name + '"; $.dr7BaselineSamples=' + ([string]$Samples.IsPresent).ToLower() +
    '; $.evalFile(new File("' + $root + '/tests/photoshop-baseline-record.jsx"))'
$send = if ($Key -eq 'Esc') { '{ESC}' } else { '{ENTER}' }
$processId = (Get-Process Photoshop | Select-Object -First 1).Id

$job = Start-Job -ScriptBlock { param($script) (New-Object -ComObject Photoshop.Application).DoJavaScript($script, $null) } -ArgumentList $js
$start = Get-Date
while ($job.State -eq 'Running' -and ((Get-Date) - $start).TotalSeconds -lt $TimeoutSec) {
    $window = [DialogFinder]::Find($processId, $Title)
    if ($window -ne [IntPtr]::Zero) {
        Start-Sleep -Milliseconds 500
        [void][DialogFinder]::SetForegroundWindow($window)
        Start-Sleep -Milliseconds 300
        [System.Windows.Forms.SendKeys]::SendWait($send)
        Start-Sleep -Milliseconds 900
    } else { Start-Sleep -Milliseconds 150 }
}
if ($job.State -eq 'Running') { Stop-Job $job; Remove-Job $job -Force; Write-Error "Timed out after $TimeoutSec s; a dialog may still be open in Photoshop"; exit 1 }
Receive-Job $job
Remove-Job $job -Force
