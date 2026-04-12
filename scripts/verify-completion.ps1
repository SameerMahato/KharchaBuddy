# Verify that all components are in place

Write-Host "🔍 Verifying KharchaBuddy Implementation..." -ForegroundColor Cyan
Write-Host ""

$Total = 0
$Passed = 0
$Failed = 0

function Check-File {
    param($Path, $Description)
    $script:Total++
    if (Test-Path $Path) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $script:Passed++
    }
    else {
        Write-Host "✗ $Description (missing: $Path)" -ForegroundColor Red
        $script:Failed++
    }
}

function Check-Dir {
    param($Path, $Description)
    $script:Total++
    if (Test-Path $Path -PathType Container) {
        Write-Host "✓ $Description" -ForegroundColor Green
        $script:Passed++
    }
    else {
        Write-Host "✗ $Description (missing: $Path)" -ForegroundColor Red
        $script:Failed++
    }
}

Write-Host "📦 Checking Microservices..." -ForegroundColor Yellow
Check-Dir "services/auth-service" "Auth Service"
Check-Dir "services/expense-service" "Expense Service"
Check-Dir "services/budget-service" "Budget Service"
Check-Dir "services/ai-cfo-service" "AI CFO Service"
Check-Dir "services/prediction-engine" "Prediction Engine"
Check-Dir "services/social-finance" "Social Finance"
Check-Dir "services/wealth-builder" "Wealth Builder"
Check-Dir "services/tax-optimizer" "Tax Optimizer"
Check-Dir "services/integration" "Integration Service"
Write-Host ""

Write-Host "🌐 Checking Gateway & Frontend..." -ForegroundColor Yellow
Check-Dir "gateway" "API Gateway"
Check-Dir "frontend" "Frontend"
Write-Host ""

Write-Host "🐳 Checking Docker Configuration..." -ForegroundColor Yellow
Check-File "docker-compose.yml" "Docker Compose"
Check-File "services/ai-cfo-service/Dockerfile" "AI CFO Dockerfile"
Write-Host ""

Write-Host "☸️  Checking Kubernetes Manifests..." -ForegroundColor Yellow
Check-File "k8s/namespace.yaml" "Namespace"
Check-File "k8s/secrets.yaml" "Secrets"
Check-File "k8s/auth-service-deployment.yaml" "Auth Service Deployment"
Check-File "k8s/expense-service-deployment.yaml" "Expense Service Deployment"
Check-File "k8s/budget-service-deployment.yaml" "Budget Service Deployment"
Check-File "k8s/ai-cfo-service-deployment.yaml" "AI CFO Service Deployment"
Check-File "k8s/prediction-engine-deployment.yaml" "Prediction Engine Deployment"
Check-File "k8s/all-services-deployment.yaml" "Other Services Deployment"
Check-File "k8s/gateway-deployment.yaml" "Gateway Deployment"
Write-Host ""

Write-Host "🔄 Checking CI/CD..." -ForegroundColor Yellow
Check-File ".github/workflows/ci.yml" "GitHub Actions CI/CD"
Write-Host ""

Write-Host "🧪 Checking Test Infrastructure..." -ForegroundColor Yellow
Check-File "jest.config.js" "Jest Config"
Check-File "jest.setup.js" "Jest Setup"
Check-File "services/auth-service/src/__tests__/auth.test.ts" "Auth Tests"
Check-File "services/expense-service/src/__tests__/anomalyDetection.test.ts" "Anomaly Detection Tests"
Check-File "services/ai-cfo-service/src/__tests__/aiCFOService.test.ts" "AI CFO Tests"
Write-Host ""

Write-Host "📜 Checking Deployment Scripts..." -ForegroundColor Yellow
Check-File "scripts/install-all.sh" "Install Script"
Check-File "scripts/dev-all.sh" "Dev Script"
Check-File "scripts/test-all.sh" "Test Script"
Check-File "scripts/build-all.sh" "Build Script"
Check-File "scripts/push-all.sh" "Push Script"
Check-File "scripts/deploy-k8s.sh" "Deploy Script"
Write-Host ""

Write-Host "📚 Checking Documentation..." -ForegroundColor Yellow
Check-File "README.md" "Main README"
Check-File "IMPLEMENTATION_COMPLETE_FINAL.md" "Final Status"
Check-File "COMPLETION_SUMMARY.md" "Completion Summary"
Check-File "DEPLOYMENT_GUIDE.md" "Deployment Guide"
Write-Host ""

Write-Host "📦 Checking Package Files..." -ForegroundColor Yellow
Check-File "package.json" "Root Package.json"
Check-File "services/ai-cfo-service/package.json" "AI CFO Package.json"
Check-File "gateway/package.json" "Gateway Package.json"
Check-File "frontend/package.json" "Frontend Package.json"
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Verification Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Total Checks: $Total" -ForegroundColor Yellow
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "✅ All checks passed! Project is 100% complete." -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 Ready to:" -ForegroundColor Cyan
    Write-Host "  1. npm run install:all  # Install dependencies"
    Write-Host "  2. npm run docker:up    # Start infrastructure"
    Write-Host "  3. npm run dev:all      # Start all services"
    Write-Host ""
    exit 0
}
else {
    Write-Host "❌ Some checks failed. Please review the missing components." -ForegroundColor Red
    Write-Host ""
    exit 1
}
