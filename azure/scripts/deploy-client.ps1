# Deploy client to Azure Static Web Apps (production)
$ErrorActionPreference = "Stop"

# Load deployment token from azure/.env
$envFile = Join-Path (Join-Path $PSScriptRoot "..") ".env"
if (-not (Test-Path $envFile)) {
    Write-Error "azure/.env not found. Create it with DEPLOYMENT_TOKEN=<your-token>"
    exit 1
}

$token = (Get-Content $envFile | Where-Object { $_ -match "^DEPLOYMENT_TOKEN=" }) -replace "^DEPLOYMENT_TOKEN=", ""
if (-not $token) {
    Write-Error "DEPLOYMENT_TOKEN not found in azure/.env"
    exit 1
}

# Build
$clientDir = Join-Path (Join-Path $PSScriptRoot "..\.."  ) "client"
Push-Location $clientDir
Write-Host "Building client..." -ForegroundColor Cyan
bun run build
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed"; exit 1 }

# Copy static web app config to dist
Copy-Item -Path "staticwebapp.config.json" -Destination "dist\" -ErrorAction SilentlyContinue

# Deploy
Write-Host "Deploying to Azure Static Web Apps (production)..." -ForegroundColor Cyan
swa deploy ./dist --deployment-token $token --env production
if ($LASTEXITCODE -ne 0) { Write-Error "Deployment failed"; exit 1 }

Pop-Location
Write-Host "Deployed successfully." -ForegroundColor Green
