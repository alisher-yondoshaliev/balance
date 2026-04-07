# fix-port.ps1 - Windows PowerShell uchun Port 3000 xatosini tuzatish
# Ishlatish: powershell -ExecutionPolicy Bypass -File .\fix-port.ps1

param(
    [int]$Port = 3000,
    [switch]$KillAll = $false
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host " Balance API Port Fix (PowerShell)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

function Find-PortProcess {
    param([int]$port)
    
    $netstatOutput = netstat -ano | Select-String ":$port"
    $processes = @()
    
    foreach ($line in $netstatOutput) {
        $tokens = $line.ToString() -split '\s+' | Where-Object { $_ }
        if ($tokens.Count -ge 5) {
            $pid = $tokens[-1]
            $processes += $pid
        }
    }
    
    return $processes | Get-Unique
}

function Kill-ProcessByPid {
    param([int]$pid)
    
    try {
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  Stopping PID $pid..." -ForegroundColor Yellow
            Stop-Process -Id $pid -Force -ErrorAction Stop
            return $true
        }
    } catch {
        Write-Host "  ❌ Error killing PID $pid : $_" -ForegroundColor Red
        return $false
    }
    
    return $false
}

# Main Logic
if ($KillAll) {
    Write-Host "Barcha Node.js processlari o'chirilmoqda..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Host "✅ Barcha Node.js processlari o'chirildi!" -ForegroundColor Green
} else {
    $pids = Find-PortProcess -port $Port
    
    if ($pids.Count -eq 0) {
        Write-Host "❌ Port $Port band qilgan process topilmadi." -ForegroundColor Yellow
        Write-Host "Port ozod yoki server o'chiq." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Port $Port band: PID(s) = $($pids -join ', ')" -ForegroundColor Cyan
        Write-Host "`nProcesslari o'chirilmoqda..." -ForegroundColor Yellow
        
        foreach ($pid in $pids) {
            Kill-ProcessByPid -pid $pid
        }
        
        Write-Host "`n✅ Barcha processlari o'chirildi!" -ForegroundColor Green
    }
}

Write-Host "`nKeying qadam:" -ForegroundColor Cyan
Write-Host "  npm run start:dev`n" -ForegroundColor Green

# Prompt for restart
$response = Read-Host "Serverni qayta ishga tushirasizmi? (y/n)"
if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host "`nServer ishga tushmoqda..." -ForegroundColor Green
    npm run start:dev
} else {
    Write-Host "Script tugadi." -ForegroundColor Yellow
}
