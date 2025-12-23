# Auto RSS Ingestion Script for Local Development
# This script runs in the background and triggers RSS ingestion every 5 minutes

Write-Host "Starting Auto RSS Ingestion Service..." -ForegroundColor Green
Write-Host "Triggering ingestion every 5 minutes" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Load environment variables from .env file
$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
} else {
    Write-Host "❌ Warning: .env file not found at $envFile" -ForegroundColor Yellow
}

$projectUrl = $env:NEXT_PUBLIC_SUPABASE_URL
$anonKey = $env:NEXT_PUBLIC_SUPABASE_ANON_KEY

if (-not $projectUrl -or -not $anonKey) {
    Write-Host "❌ Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $anonKey"
    "Content-Type" = "application/json"
}

$url = "$projectUrl/functions/v1/ingest-rss"

function Invoke-RSSIngestion {
    try {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Triggering RSS ingestion..." -ForegroundColor Cyan
        
        $response = Invoke-WebRequest -Uri $url -Method POST -Headers $headers -Body '{}' -UseBasicParsing
        
        if ($response.StatusCode -eq 200) {
            Write-Host "[$timestamp] Ingestion completed successfully" -ForegroundColor Green
        }
        else {
            Write-Host "[$timestamp] Unexpected status code: $($response.StatusCode)" -ForegroundColor Yellow
        }
    }
    catch {
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Write-Host "[$timestamp] Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Initial trigger
Invoke-RSSIngestion

# Loop every 5 minutes
while ($true) {
    Start-Sleep -Seconds 300 # 5 minutes
    Invoke-RSSIngestion
}
