@echo off
setlocal
REM Navega para a pasta onde este .bat está (backend/)
cd /d "%~dp0"

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

echo Iniciando servidor...
node server.js
pause