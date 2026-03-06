# Deploy Logic App infrastructure to Azure
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroup,

    [Parameter(Mandatory = $true)]
    [string]$CosmosDbAccountName,

    [string]$CosmosDbDatabaseName,
    [string]$CosmosDbContainerName,
    [string]$LogicAppName,
    [string]$Location
)

$ErrorActionPreference = "Stop"

$templateFile = Join-Path $PSScriptRoot "logicapp.bicep"
if (-not (Test-Path $templateFile)) {
    Write-Error "logicapp.bicep not found in azure/"
    exit 1
}

# Build parameters
$params = @("cosmosDbAccountName=$CosmosDbAccountName")
if ($CosmosDbDatabaseName) { $params += "cosmosDbDatabaseName=$CosmosDbDatabaseName" }
if ($CosmosDbContainerName) { $params += "cosmosDbContainerName=$CosmosDbContainerName" }
if ($LogicAppName) { $params += "workflows_shadow_me_interns_logic_app_name=$LogicAppName" }
if ($Location) { $params += "location=$Location" }

Write-Host "Deploying Logic App to resource group '$ResourceGroup'..." -ForegroundColor Cyan
az deployment group create `
    --resource-group $ResourceGroup `
    --template-file $templateFile `
    --parameters $params

if ($LASTEXITCODE -ne 0) { Write-Error "Deployment failed"; exit 1 }

Write-Host "Deployed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Authorize API connections (Outlook, Content Conversion, Cosmos DB)" -ForegroundColor Yellow
Write-Host "  Go to Azure Portal > Resource Group > each connection > Edit API connection > Authorize > Save"
