$ErrorActionPreference = 'Stop'

Write-Host "=========================================================="
Write-Host "🚀 Testing Live Deployment: https://rha-proctored-quiz.vercel.app"
Write-Host "=========================================================="

Write-Host "`n--- 1. Testing Active Quiz Metadata ---"
$active = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/quiz/active" -Method Get
Write-Host "Title: " $active.quiz.title
Write-Host "Duration: " $active.quiz.duration_minutes "minutes"
Write-Host "Total Questions: " $active.questionCount
Write-Host "Total Marks: " $active.totalMarks
Write-Host "Backtracking: " $active.quiz.allow_backtracking

if ($active.quiz.title -ne "RHA DAY 26 Quiz" -or $active.questionCount -ne 60 -or $active.totalMarks -ne 60 -or $active.quiz.duration_minutes -ne 60) {
    Write-Error "Active quiz metadata does not match requirements!"
}

Write-Host "`n--- 2. Testing Student Registration & Login ---"
$studBody = @{
    rollNo = "0208CS221990"
    name = "Devansh Verma"
    email = "devansh.verma@ggits.ac.in"
    phone = "9876543210"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/auth/student-login" -Method Post -ContentType "application/json" -Body $studBody
Write-Host "Authenticated student:" $login.user.name "(ID:" $login.user.id ")"

Write-Host "`n--- 3. Starting 60-Question Quiz Session ---"
$startBody = @{
    userId = $login.user.id
    userName = $login.user.name
    userRollNo = $login.user.roll_no
    userEmail = $login.user.email
    userPhone = $login.user.phone
} | ConvertTo-Json

$session = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/quiz/$($active.quiz.id)/start" -Method Post -ContentType "application/json" -Body $startBody
Write-Host "Submission ID:" $session.submission.id
Write-Host "Received Questions:" $session.questions.Count
Write-Host "Sample Question 1:" $session.questions[0].text
Write-Host "Sample Question 1 Options:" ($session.questions[0].options -join " | ")

if ($session.questions.Count -ne 60) {
    Write-Error "Expected 60 questions, got $($session.questions.Count)"
}

Write-Host "`n--- 4. Testing Admin Dashboard Telemetry ---"
$adminHeaders = @{
    "x-admin-passcode" = "RHAGGITS1234@1234*#ZYX"
}
$metrics = Invoke-RestMethod -Uri "https://rha-proctored-quiz.vercel.app/api/admin/metrics" -Method Get -Headers $adminHeaders
Write-Host "Admin Metrics: Total Candidates =" $metrics.totalSubmissions ", Completed =" $metrics.completedCount ", AvgScore =" $metrics.avgScore

Write-Host "`n=========================================================="
Write-Host "🎉 LIVE VERCEL VERIFICATION COMPLETED WITH 100% SUCCESS!"
Write-Host "=========================================================="
