@echo off
REM fix-port.bat - Windows uchun Port 3000 xatosini tuzatish

setlocal EnableDelayedExpansion

echo.
echo ========================================
echo  Balance API Port Fix Script (Windows)
echo ========================================
echo.

set PORT=3000

echo Tekshiryapman port %PORT% band qilgan processni...
echo.

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    set PID=%%a
    goto found
)

echo ❌ Port %PORT% band qilgan process topilmadi.
echo Ehtimol port ozod yoki server o'chiq.
echo.
pause
exit /b 0

:found
echo ✅ Port %PORT% band: PID = !PID!
echo.
echo Process o'chirilmoqda...

taskkill /PID !PID! /F

if %errorlevel% == 0 (
    echo ✅ Process muvaffaqiyatli o'chirildi!
    echo.
    echo Server qayta ishga tushishi uchun:
    echo   npm run start:dev
    echo.
) else (
    echo ❌ Process o'chirilmadi. Qo'llangan o'chirish:
    echo   taskkill /IM node.exe /F
    echo.
)

pause
