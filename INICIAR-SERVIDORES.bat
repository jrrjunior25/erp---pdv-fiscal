@echo off
cls

echo ========================================
echo   ERP + PDV FISCAL - INICIAR SERVIDORES
echo ========================================
echo.

echo [1/2] Iniciando Backend (Porta 3001)...
start "Backend" cmd /k "cd /d "%~dp0backend" && npm run start:dev"
timeout /t 5 /nobreak >nul

echo [2/2] Iniciando Frontend (Porta 5173)...
start "Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   SERVIDORES INICIADOS COM SUCESSO!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.

echo ========================================
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
