@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ============================================
echo Publicando Leaf ^& Light Studio...
echo ============================================
echo.

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-site.ps1" -Message "Publish website updates"

set "RESULTADO=%ERRORLEVEL%"

echo.

if not "%RESULTADO%"=="0" (
echo ============================================
echo ERRO: a publicacao nao foi concluida.
echo Verifique as mensagens acima.
echo ============================================
) else (
echo ============================================
echo Publicacao finalizada.
echo ============================================
)

echo.
pause
exit /b %RESULTADO%
