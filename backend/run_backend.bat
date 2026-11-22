@echo off
title SmartCare FastAPI Backend
cd /d "%~dp0"
echo Starting SmartCare FastAPI Backend on 0.0.0.0:8001...
".\venv\Scripts\uvicorn.exe" app.main:app --host 0.0.0.0 --port 8001 --reload
pause
