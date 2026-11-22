@echo off
echo ========================================================
echo   SmartCare - Launching Web Portal (Chrome)
echo   Connected to FastAPI backend at: http://127.0.0.1:8001
echo ========================================================
cd /d "%~dp0"
call "C:\Users\Tanmay Kulkarni\flutter\bin\flutter.bat" run -d chrome --web-port=8080
pause
