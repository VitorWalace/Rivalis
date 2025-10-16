@echo off
echo Iniciando Backend...
start cmd /k "cd /d C:\Projects\Rivalis\backend && npm start"
timeout /t 3 /nobreak
echo Iniciando Frontend...
start cmd /k "cd /d C:\Projects\Rivalis\frontend && npm run dev"
echo.
echo Ambos os servidores foram iniciados!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:5173
pause
