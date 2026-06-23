# deploy-web.ps1 — build and deploy Brigzy web to brigzy.vercel.app
# Usage: .\scripts\deploy-web.ps1

Set-Location $PSScriptRoot\..

Write-Host "Building web export..." -ForegroundColor Cyan
npx expo export --platform web
if ($LASTEXITCODE -ne 0) { Write-Error "expo export failed"; exit 1 }

Write-Host "Copying Vercel config..." -ForegroundColor Cyan
[System.IO.File]::WriteAllText(
    "$PSScriptRoot\..\dist\vercel.json",
    '{"trailingSlash":false,"rewrites":[{"source":"/(.*)","destination":"/index.html"}]}'
)
New-Item -ItemType Directory -Force "dist\.vercel" | Out-Null
Copy-Item ".vercel\project.json" "dist\.vercel\project.json" -Force

Write-Host "Deploying to Vercel..." -ForegroundColor Cyan
npx vercel dist/ --prod --yes

Write-Host "Done! https://brigzy.vercel.app" -ForegroundColor Green
