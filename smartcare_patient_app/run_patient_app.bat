@echo off
title SmartCare Patient Flutter App
cd /d "%~dp0"
echo ==============================================
echo SmartCare - Patient Mobile Application
echo ==============================================
echo.
echo Choose launch target:
echo [1] Run in Google Chrome (Web Preview)
echo [2] Run on Connected Android Device / Emulator
echo.
set /p choice="Enter choice (1 or 2, default is 1): "

if "%choice%"=="2" (
    echo Starting on Android...
    "C:\Users\Tanmay Kulkarni\flutter\bin\flutter.bat" run
) else (
    echo Starting in Google Chrome...
    "C:\Users\Tanmay Kulkarni\flutter\bin\flutter.bat" run -d chrome
)
pause
