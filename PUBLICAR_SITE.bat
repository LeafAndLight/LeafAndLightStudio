@echo off
cd /d "%~dp0"
echo.
echo Publicando Leaf & Light Studio...
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-site.ps1" -Message "Publish website updates"
echo.
pause
