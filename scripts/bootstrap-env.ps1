param(
    [switch]$Force
)

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

function Copy-EnvFile {
    param(
        [string]$Source,
        [string]$Target,
        [string]$Description
    )

    if (-not (Test-Path $Source)) {
        Write-Warning "Arquivo de exemplo não encontrado: $Source"
        return
    }

    if ((Test-Path $Target) -and -not $Force) {
        Write-Host "✔ $Description já existe. Use -Force para sobrescrever." -ForegroundColor Yellow
        return
    }

    Copy-Item $Source $Target -Force
    Write-Host "✅ $Description criado a partir do exemplo." -ForegroundColor Green
}

Write-Host "==> Configurando arquivos .env" -ForegroundColor Cyan

Copy-EnvFile -Source (Join-Path $repoRoot 'backend/.env.example') `
             -Target (Join-Path $repoRoot 'backend/.env') `
             -Description 'backend/.env'

Copy-EnvFile -Source (Join-Path $repoRoot 'frontend/.env.example') `
             -Target (Join-Path $repoRoot 'frontend/.env.local') `
             -Description 'frontend/.env.local'

Write-Host "\nPróximos passos:" -ForegroundColor Cyan
Write-Host "  1. Edite backend/.env com as credenciais reais (MYSQL_URL, JWT_SECRET, etc.)"
Write-Host "  2. Edite frontend/.env.local com a URL da API (VITE_API_URL)"
Write-Host "  3. Execute 'npm install' + 'npm run dev' dentro de frontend/"
Write-Host "  4. Execute 'npm install' + 'npm start' dentro de backend/"