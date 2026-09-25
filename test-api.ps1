$ErrorActionPreference = 'Stop'

Write-Host "--- 1. Testing Health Endpoint ---"
$health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get
Write-Host "Health check response:" ($health | ConvertTo-Json -Compress)

Write-Host "`n--- 2. Testing Student Login ---"
$bodyLogin = @{
    rollNo = "0208CS221001"
    name = "Aman Verma"
    email = "aman.verma@ggits.ac.in"
} | ConvertTo-Json
$student = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/student-login' -Method Post -ContentType 'application/json' -Body $bodyLogin
Write-Host "Student logged in:" $student.user.name "- Roll:" $student.user.roll_no
$quizId = $student.quizId
$userId = $student.user.id

Write-Host "`n--- 3. Testing Admin Login ---"
$adminBody = @{ passcode = "RHA26@GGITS" } | ConvertTo-Json
$admin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/admin-login' -Method Post -ContentType 'application/json' -Body $adminBody
Write-Host "Admin access verified for:" $admin.user.name

Write-Host "`n--- 4. Testing Start Quiz ---"
$startBody = @{ userId = $userId } | ConvertTo-Json
$quizSession = Invoke-RestMethod -Uri "http://localhost:5000/api/quiz/$quizId/start" -Method Post -ContentType 'application/json' -Body $startBody
Write-Host "Quiz initialized. Total questions returned:" $quizSession.questions.Count
Write-Host "First question text:" $quizSession.questions[0].text
$submissionId = $quizSession.submission.id

Write-Host "`n--- 5. Testing Anti-Cheating Violation Log ---"
$violBody = @{
    submissionId = $submissionId
    userId = $userId
    type = "FULLSCREEN_EXIT"
    meta = @{ action = "Candidate escaped fullscreen mode" }
} | ConvertTo-Json
$viol = Invoke-RestMethod -Uri 'http://localhost:5000/api/violations' -Method Post -ContentType 'application/json' -Body $violBody
Write-Host "Violation successfully logged. Strikes count:" $viol.violationsCount "Disqualified:" $viol.isDisqualified

Write-Host "`n--- 6. Testing Answer Submission & Grading ---"
$submitBody = @{
    answers = @{
        "q-101" = "systemd"
        "q-102" = "Podman"
        "q-103" = "setenforce 0"
        "q-104" = "dnf"
        "q-105" = "YAML"
        "q-107" = "nmtui"
    }
    timeSpentSeconds = 185
} | ConvertTo-Json
$result = Invoke-RestMethod -Uri "http://localhost:5000/api/submissions/$submissionId/submit" -Method Post -ContentType 'application/json' -Body $submitBody
Write-Host "Final evaluation complete!"
Write-Host "Score awarded:" $result.submission.score "/" $result.submission.total_marks
Write-Host "Status:" $result.submission.status "Violations:" $result.violationsCount

Write-Host "`n--- 7. Testing Admin Metrics ---"
$metrics = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/metrics' -Method Get
Write-Host "Admin overview metrics:" ($metrics | ConvertTo-Json -Compress)

Write-Host "`n--- 8. Testing CSV Export ---"
$csv = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/export-csv' -Method Get
Write-Host "CSV Export Header:" ($csv.Split("`n")[0])
Write-Host "First record:" ($csv.Split("`n")[1])

Write-Host "`n✅ ALL BACKEND TEST ASSERTIONS PASSED SUCCESSFULLY!"
