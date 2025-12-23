# Quick script to check terminal page status
Write-Host "Checking terminal page..." -ForegroundColor Cyan

# Test the endpoint
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/terminal" -UseBasicParsing -TimeoutSec 5
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Content Length: $($response.Content.Length) bytes" -ForegroundColor Green
    
    # Check for key elements in HTML
    $hasPane = $response.Content -match 'class="[^"]*pane'
    $hasNews = $response.Content -match 'news'
    
    Write-Host "`nPage Elements:" -ForegroundColor Yellow
    Write-Host "  - Has pane elements: $hasPane" -ForegroundColor $(if($hasPane){"Green"}else{"Red"})
    Write-Host "  - Has news content: $hasNews" -ForegroundColor $(if($hasNews){"Green"}else{"Red"})
    
    Write-Host "`nPage is responding! Open in browser: http://localhost:3000/terminal" -ForegroundColor Green
} catch {
    Write-Host "Error accessing page: $($_.Exception.Message)" -ForegroundColor Red
}
