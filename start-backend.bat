@echo off
cd /d "C:\Projects\Rivalis\backend"
echo Navegando para o diretório backend...
echo Diretório atual:
cd
echo.
echo Verificando se server.js existe:
dir server.js
echo.
echo Iniciando servidor...
node server.js
pause