$ErrorActionPreference = 'Stop'

Write-Host "--- 1. Testing Live Vercel with WRONG passcode ---"
$wrongBody = @{ passcode = "wrongpassword" } | ConvertTo-Json
try {
    $res = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/auth/admin-login" -Method Post -ContentType "application/json" -Body $wrongBody
    Write-Host "FAILED: Expected error but got success: " $res
} catch {
    Write-Host "SUCCESS: Rejected wrong passcode as expected! Status: " $_.Exception.Response.StatusCode
}

Write-Host "`n--- 2. Testing Live Vercel with SECRET passcode (RHAGGITS1234@1234*#ZYX) ---"
$correctBody = @{ passcode = "RHAGGITS1234@1234*#ZYX" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/auth/admin-login" -Method Post -ContentType "application/json" -Body $correctBody
Write-Host "SUCCESS: Authenticated coordinator:" $res.user.name "- Role:" $res.role
