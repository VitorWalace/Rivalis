@echo off
setlocal
REM Ir para a pasta backend relativa a este arquivo
cd /d "%~dp0backend"

echo Navegando para o diretório backend...
cd
echo.

REM Garante .env (copia do .env.example se ainda não existir)
if not exist ".env" (
	echo [info] Arquivo backend\.env nao encontrado. Criando uma copia de .env.example...
	if exist ".env.example" (
		copy ".env.example" ".env" >nul
		echo [ok] backend\.env criado. Abra e configure MYSQL_URL ou DATABASE_URL e JWT_SECRET.
	) else (
		echo [aviso] .env.example nao encontrado. Crie backend\.env manualmente.
	)
)

echo Verificando se server.js existe:
dir server.js
echo.
echo Iniciando servidor...
node server.js
pause