@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install-sideload-windows.ps1" %*
exit /b %ERRORLEVEL%
