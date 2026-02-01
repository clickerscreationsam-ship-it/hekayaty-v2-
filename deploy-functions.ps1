# Supabase Edge Functions Deployment Script
# Run this after you've logged in with: supabase login

Write-Host "🚀 Starting Supabase Edge Functions Deployment..." -ForegroundColor Cyan
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase CLI authentication..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in. Please run: supabase login" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Authenticated" -ForegroundColor Green
Write-Host ""

# Link project (if not already linked)
Write-Host "Linking to Supabase project..." -ForegroundColor Yellow
if (-not (Test-Path ".\.supabase")) {
    Write-Host "⚠️  Project not linked yet." -ForegroundColor Yellow
    Write-Host "Please enter your Project Reference ID (found in Supabase Dashboard > Settings > General):" -ForegroundColor Cyan
    $projectRef = Read-Host "Project Ref"
    
    if ($projectRef) {
        supabase link --project-ref $projectRef
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ Failed to link project" -ForegroundColor Red
            exit 1
        }
        Write-Host "✅ Project linked" -ForegroundColor Green
    } else {
        Write-Host "❌ Project reference is required" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Project already linked" -ForegroundColor Green
}
Write-Host ""

# Set secrets
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
Write-Host "Note: Get these from your Supabase Dashboard > Project Settings > API" -ForegroundColor Gray
Write-Host ""

$setSecrets = Read-Host "Do you want to set/update secrets now? (y/n)"
if ($setSecrets -eq "y") {
    Write-Host "Enter your Supabase URL (e.g., https://yourproject.supabase.co):" -ForegroundColor Cyan
    $supabaseUrl = Read-Host "SUPABASE_URL"
    
    Write-Host "Enter your Supabase Anon Key:" -ForegroundColor Cyan
    $anonKey = Read-Host "SUPABASE_ANON_KEY"
    
    Write-Host "Enter your Supabase Service Role Key:" -ForegroundColor Cyan
    $serviceKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY"
    
    if ($supabaseUrl -and $anonKey -and $serviceKey) {
        supabase secrets set SUPABASE_URL=$supabaseUrl
        supabase secrets set SUPABASE_ANON_KEY=$anonKey
        supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$serviceKey
        Write-Host "✅ Secrets configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Skipping secrets setup (some values missing)" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Skipping secrets setup" -ForegroundColor Yellow
}
Write-Host ""

# Deploy functions
Write-Host "Deploying Edge Functions..." -ForegroundColor Yellow
Write-Host ""

# Change to supabase directory to ensure correct path
Set-Location -Path "supabase"

$functions = @(
    "checkout",
    "verify-payment",
    "calculate-shipping",
    "request-payout",
    "earnings-overview",
    "seller-orders",
    "update-fulfillment"
)

$successCount = 0
$failCount = 0

foreach ($func in $functions) {
    Write-Host "Deploying $func..." -ForegroundColor Cyan
    supabase functions deploy $func --no-verify-jwt
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $func deployed successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "❌ $func deployment failed" -ForegroundColor Red
        $failCount++
    }
    Write-Host ""
}

# Return to root directory
Set-Location -Path ".."

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Successfully deployed: $successCount functions" -ForegroundColor Green
if ($failCount -gt 0) {
    Write-Host "❌ Failed: $failCount functions" -ForegroundColor Red
}
Write-Host ""

if ($successCount -eq $functions.Count) {
    Write-Host "🎉 All Edge Functions deployed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Apply RLS policies: Run 011_enable_rls_policies.sql in Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Update frontend to use Edge Functions hooks (use-edge-functions.ts)" -ForegroundColor White
    Write-Host "3. Test your functions!" -ForegroundColor White
} else {
    Write-Host "⚠️  Some functions failed to deploy. Please check the errors above." -ForegroundColor Yellow
}
