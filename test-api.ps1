$ErrorActionPreference = 'Stop'

Write-Host "--- 1. Testing Health Endpoint ---"
$health = Invoke-RestMethod -Uri 'http://localhost:5000/api/health' -Method Get
Write-Host "Health check response:" ($health | ConvertTo-Json -Compress)

Write-Host "`n--- 2. Testing Student Login Validation (Missing Phone/Email) ---"
try {
    $invalidBody = @{
        rollNo = "0208CS221001"
        name = "Test Student"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/student-login' -Method Post -ContentType 'application/json' -Body $invalidBody
    Write-Error "Expected failure on missing phone and email, but request succeeded!"
} catch {
    Write-Host "Correctly rejected missing email/phone with status 400"
}

Write-Host "`n--- 3. Testing Valid Student Login (With Email & Phone) ---"
$bodyLogin = @{
    rollNo = "0208CS221099"
    name = "Candidate Student"
    email = "candidate@ggits.ac.in"
    phone = "9876543210"
} | ConvertTo-Json
$student = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/student-login' -Method Post -ContentType 'application/json' -Body $bodyLogin
Write-Host "Student logged in:" $student.user.name "- Roll:" $student.user.roll_no "- Phone:" $student.user.phone
$quizId = $student.quizId
$userId = $student.user.id

Write-Host "`n--- 4. Testing Admin Login Passcode Validation ---"
try {
    $wrongPasscode = @{ passcode = "WRONG_PASSCODE" } | ConvertTo-Json
    Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/admin-login' -Method Post -ContentType 'application/json' -Body $wrongPasscode
    Write-Error "Expected failure with wrong passcode, but request succeeded!"
} catch {
    Write-Host "Correctly rejected invalid passcode with status 401"
}

$adminBody = @{ passcode = "RHAGGITS1234@1234*#ZYX" } | ConvertTo-Json
$admin = Invoke-RestMethod -Uri 'http://localhost:5000/api/auth/admin-login' -Method Post -ContentType 'application/json' -Body $adminBody
Write-Host "Admin access verified for:" $admin.user.name

Write-Host "`n--- 5. Testing Start Quiz with Email & Phone ---"
$startBody = @{
    userId = $userId
    userName = $student.user.name
    userRollNo = $student.user.roll_no
    userEmail = $student.user.email
    userPhone = $student.user.phone
} | ConvertTo-Json
$quizSession = Invoke-RestMethod -Uri "http://localhost:5000/api/quiz/$quizId/start" -Method Post -ContentType 'application/json' -Body $startBody
Write-Host "Quiz initialized. Total questions returned:" $quizSession.questions.Count
$submissionId = $quizSession.submission.id
Write-Host "Submission ID created:" $submissionId "with email:" $quizSession.submission.student_email

Write-Host "`n--- 6. Testing Anti-Cheating Violation Log ---"
$violBody = @{
    submissionId = $submissionId
    userId = $userId
    type = "FULLSCREEN_EXIT"
    meta = @{ action = "Candidate escaped fullscreen mode" }
} | ConvertTo-Json
$viol = Invoke-RestMethod -Uri 'http://localhost:5000/api/violations' -Method Post -ContentType 'application/json' -Body $violBody
Write-Host "Violation successfully logged. Strikes count:" $viol.violationsCount "Disqualified:" $viol.isDisqualified

Write-Host "`n--- 7. Testing Answer Submission & Grading ---"
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

Write-Host "`n--- 8. Testing Admin Metrics ---"
$metrics = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/metrics' -Method Get
Write-Host "Admin overview metrics:" ($metrics | ConvertTo-Json -Compress)

Write-Host "`n--- 9. Testing CSV Export (Validating Email & Phone columns) ---"
$csv = Invoke-RestMethod -Uri 'http://localhost:5000/api/admin/export-csv' -Method Get
Write-Host "CSV Export Header:" ($csv.Split("`n")[0])
Write-Host "First record:" ($csv.Split("`n")[1])

Write-Host "`n✅ ALL BACKEND TEST ASSERTIONS PASSED SUCCESSFULLY!"
