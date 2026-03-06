# Deploy all Intern Support infrastructure and code to Azure
param(
    [string]$ResourceGroup = 'intern-support',
    [string]$Location = 'swedencentral',
    [string]$CosmosAccountName = 'shadow-me-interns-db-msft',
    [string]$AppServiceName = 'intern-support-server',
    [string]$StaticWebAppName = 'intern-support-client'
)

$ErrorActionPreference = "Stop"
$scriptsDir = $PSScriptRoot

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Intern Support - Full Deployment" -ForegroundColor Cyan
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor Cyan
Write-Host "  Location: $Location" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Create resource group if it doesn't exist
Write-Host "[1/6] Ensuring resource group exists..." -ForegroundColor Yellow
az group create --name $ResourceGroup --location $Location --output none 2>$null
Write-Host "  Resource group '$ResourceGroup' ready." -ForegroundColor Green
Write-Host ""

# 2. Deploy Cosmos DB
Write-Host "[2/6] Deploying Cosmos DB..." -ForegroundColor Yellow
& "$scriptsDir\deploy-database.ps1" -ResourceGroup $ResourceGroup -AccountName $CosmosAccountName -Location $Location
Write-Host ""

# 3. Deploy App Service
Write-Host "[3/6] Deploying App Service infrastructure..." -ForegroundColor Yellow
& "$scriptsDir\deploy-appservice.ps1" -ResourceGroup $ResourceGroup -AppName $AppServiceName -Location $Location
Write-Host ""

# 4. Deploy server code to App Service
Write-Host "[4/6] Deploying server code..." -ForegroundColor Yellow
& "$scriptsDir\deploy-server.ps1" -ResourceGroup $ResourceGroup -AppName $AppServiceName
Write-Host ""

# 5. Deploy Static Web App infrastructure
Write-Host "[5/6] Deploying Static Web App infrastructure..." -ForegroundColor Yellow
& "$scriptsDir\deploy-staticwebapp.ps1" -ResourceGroup $ResourceGroup -AppName $StaticWebAppName
Write-Host ""

# 6. Deploy client code to Static Web App
Write-Host "[6/6] Deploying client code..." -ForegroundColor Yellow
& "$scriptsDir\deploy-client.ps1"
Write-Host ""

# 7. Deploy Logic App
Write-Host "[Bonus] Deploying Logic App..." -ForegroundColor Yellow
& "$scriptsDir\deploy-logicapp.ps1" -ResourceGroup $ResourceGroup -CosmosDbAccountName $CosmosAccountName -Location $Location
Write-Host ""

Write-Host "================================================" -ForegroundColor Green
Write-Host "  All deployments complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Post-deployment steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [!] The App Service backend code is NOT deployed by this script." -ForegroundColor Red
Write-Host "      Deploy it manually via VS Code: right-click server/ > Deploy to Web App." -ForegroundColor Red
Write-Host "      See README for full instructions." -ForegroundColor Red
Write-Host ""
Write-Host "  1. Configure App Service env vars (ENTRA_TENANT_ID, ENTRA_CLIENT_ID, COSMOS_KEY, etc.)"
Write-Host "  2. Authorize Logic App API connections (Outlook, Content Conversion, Cosmos DB)"
Write-Host "  3. Set ALLOWED_ORIGINS on App Service to include Static Web App URLs"
