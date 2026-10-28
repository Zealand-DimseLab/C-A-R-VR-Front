@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js mangler. Installer Node.js 22 eller nyere. & pause & exit /b 1)
if not exist node_modules call npm install
if errorlevel 1 (echo Installation fejlede. & pause & exit /b 1)
start "" http://localhost:5173
npm run dev
pause
