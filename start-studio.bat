@echo off
setlocal
where node >nul 2>&1
if %errorlevel%==0 (
  start "" /b node "%~dp0tools\studio-server.mjs"
  exit /b 0
)

set "AGY_EXE=%LOCALAPPDATA%\Programs\Antigravity\Antigravity.exe"
if not exist "%AGY_EXE%" set "AGY_EXE=%ProgramFiles%\Antigravity\Antigravity.exe"
if exist "%AGY_EXE%" (
  set ELECTRON_RUN_AS_NODE=1
  start "" "%AGY_EXE%" "%~dp0tools\studio-server.mjs"
  exit /b 0
)

echo [Error] Neither Node.js nor Antigravity.exe was found.
pause
exit /b 1
