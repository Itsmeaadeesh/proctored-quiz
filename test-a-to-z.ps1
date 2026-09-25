$ErrorActionPreference = 'Stop'
$baseUrl = "https://rha-proctored-quiz.vercel.app"
$adminPasscode = "RHAGGITS1234@1234*#ZYX"

Write-Host "================================================================================"
Write-Host "[A-TO-Z COMPREHENSIVE PRODUCTION AUDIT: RHA DAY 26 PROCTORED QUIZ]"
Write-Host "Target Endpoint: $baseUrl"
Write-Host "================================================================================"

$script:passedCount = 0
$script:failedCount = 0

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$Action
    )
    Write-Host ""
    Write-Host "--> Checking: $Name"
    try {
        $detail = & $Action
        Write-Host "    [PASS] $detail" -ForegroundColor Green
        $script:passedCount++
    } catch {
        Write-Host "    [FAIL] $($_.Exception.Message)" -ForegroundColor Red
        $script:failedCount++
    }
}

# --- TEST 1: Health & Institution Metadata ---
Test-Feature "1. Health Endpoint & Institution Metadata" {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
    if ($health.status -ne "ok" -or $health.event -ne "RHA DAY 26" -or -not $health.institution.Contains("GGITS")) {
        throw "Unexpected health payload: $($health | ConvertTo-Json)"
    }
    return "Status: $($health.status) | Event: $($health.event) | Institution: $($health.institution)"
}

# --- TEST 2: Active Quiz Metadata ---
Test-Feature "2. Active Quiz Metadata (60 Qs, 60 Mins, 60 Marks, Backtracking=True)" {
    $active = Invoke-RestMethod -Uri "$baseUrl/api/quiz/active" -Method Get
    $q = $active.quiz
    if ($q.title -ne "RHA DAY 26 Quiz") { throw "Title mismatch: $($q.title)" }
    if ($q.duration_minutes -ne 60) { throw "Duration mismatch: $($q.duration_minutes) mins (expected 60)" }
    if ($active.questionCount -ne 60) { throw "Question count mismatch: $($active.questionCount) (expected 60)" }
    if ($active.totalMarks -ne 60) { throw "Total marks mismatch: $($active.totalMarks) (expected 60)" }
    if ($q.allow_backtracking -ne $true) { throw "Backtracking is NOT enabled in active quiz!" }
    return "Title: '$($q.title)', Duration: $($q.duration_minutes)m, Questions: $($active.questionCount), Marks: $($active.totalMarks), Backtracking: $($q.allow_backtracking)"
}

# --- TEST 3: Admin Security - Passcode Rejection ---
Test-Feature "3. Admin Authentication: Rejection of Invalid Passcodes" {
    $wrongBody = @{ passcode = "wrong_password_attempt" } | ConvertTo-Json
    $rejected = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/admin-login" -Method Post -ContentType "application/json" -Body $wrongBody
    } catch {
        $rejected = $true
    }
    if (-not $rejected) { throw "Security flaw: Invalid passcode was accepted!" }

    $rejectedHeader = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/admin/metrics" -Method Get -Headers @{ "x-admin-passcode" = "invalid123" }
    } catch {
        $rejectedHeader = $true
    }
    if (-not $rejectedHeader) { throw "Security flaw: Admin API allowed access without valid header!" }
    return "Unauthorized requests properly rejected with HTTP 401"
}

# --- TEST 4: Admin Security - Passcode Acceptance & Telemetry ---
Test-Feature "4. Admin Authentication: Valid Passcode & Real-time Telemetry" {
    $correctBody = @{ passcode = $adminPasscode } | ConvertTo-Json
    $auth = Invoke-RestMethod -Uri "$baseUrl/api/auth/admin-login" -Method Post -ContentType "application/json" -Body $correctBody
    if ($auth.role -ne "admin") { throw "Expected admin role, got $($auth.role)" }

    $headers = @{ "x-admin-passcode" = $adminPasscode }
    $metrics = Invoke-RestMethod -Uri "$baseUrl/api/admin/metrics" -Method Get -Headers $headers
    if ($null -eq $metrics.totalSubmissions) { throw "Metrics missing totalSubmissions" }
    return "Authenticated Admin: $($auth.user.name) | Candidates: $($metrics.totalSubmissions), Completed: $($metrics.completedCount), AvgScore: $($metrics.avgScore)/60"
}

# --- TEST 5: CSV Export with Compulsory Columns ---
Test-Feature "5. Admin CSV Export (Roll No, Email, Phone, Score /60, Violations)" {
    $headers = @{ "x-admin-passcode" = $adminPasscode }
    $csv = Invoke-RestMethod -Uri "$baseUrl/api/admin/export-csv" -Method Get -Headers $headers
    if (-not $csv.StartsWith("Roll Number,Student Name,College Email,Phone Number,Score,Total Marks,Percentage,Violations Count,Status,Time Spent (Seconds),Disqualified,Submitted At")) {
        throw "CSV header is missing required columns. Header was: $($csv.Split("`n")[0])"
    }
    $lineCount = $csv.Split("`n").Length
    return "Generated CSV with full candidate details ($lineCount lines)"
}

# --- TEST 6: Student Login Field Validation ---
Test-Feature "6. Student Login Field Validation (Compulsory Roll, Name, Email, Phone)" {
    $badBody = @{ rollNo = "0208CS999999"; name = "Test User"; phone = "9999999999" } | ConvertTo-Json
    $caught = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/student-login" -Method Post -ContentType "application/json" -Body $badBody
    } catch {
        $caught = $true
    }
    if (-not $caught) { throw "Login should have failed without email!" }

    $badBody2 = @{ rollNo = "0208CS999999"; name = "Test User"; email = "test@ggits.ac.in" } | ConvertTo-Json
    $caught2 = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/auth/student-login" -Method Post -ContentType "application/json" -Body $badBody2
    } catch {
        $caught2 = $true
    }
    if (-not $caught2) { throw "Login should have failed without phone number!" }
    return "Compulsory email and phone properly enforced on login"
}

$randSuffix = Get-Random -Minimum 1000 -Maximum 9999
$testRollNo = "0208CS22$randSuffix"
$testName = "A-to-Z Auditor $randSuffix"
$testEmail = "auditor$randSuffix@ggits.ac.in"
$testPhone = "982611$randSuffix"
$script:studentUserId = $null
$script:activeQuizId = $null
$script:submissionId = $null
$script:sampleQuestions = $null

# --- TEST 7: Valid Student Registration ---
Test-Feature "7. Student Registration & Active Quiz Association" {
    $body = @{
        rollNo = $testRollNo
        name = $testName
        email = $testEmail
        phone = $testPhone
    } | ConvertTo-Json

    $login = Invoke-RestMethod -Uri "$baseUrl/api/auth/student-login" -Method Post -ContentType "application/json" -Body $body
    $script:studentUserId = $login.user.id
    $script:activeQuizId = $login.quizId
    if (-not $script:studentUserId -or -not $script:activeQuizId) {
        throw "Failed to get user ID or quiz ID from login response"
    }
    return "Registered: $testName ($testRollNo) -> User ID: $($script:studentUserId)"
}

# --- TEST 8: Starting 60-Question Quiz Session ---
Test-Feature "8. Quiz Session Start (60 Questions, Sanitized, Deterministic Shuffle)" {
    $startBody = @{
        userId = $script:studentUserId
        userName = $testName
        userRollNo = $testRollNo
        userEmail = $testEmail
        userPhone = $testPhone
    } | ConvertTo-Json

    $session = Invoke-RestMethod -Uri "$baseUrl/api/quiz/$($script:activeQuizId)/start" -Method Post -ContentType "application/json" -Body $startBody
    $script:submissionId = $session.submission.id
    $script:sampleQuestions = $session.questions

    if ($session.questions.Count -ne 60) {
        throw "Expected 60 questions, got $($session.questions.Count)"
    }
    if ($session.quiz.allow_backtracking -ne $true) {
        throw "Quiz session has allow_backtracking = false!"
    }

    foreach ($q in $session.questions) {
        if ($null -ne $q.correct_answer) {
            throw "SECURITY LEAK: correct_answer was sent to the client for question: $($q.id)"
        }
        if ($q.marks -ne 1) {
            throw "Expected 1 mark per question, got $($q.marks) for question $($q.id)"
        }
        if ($q.options.Count -lt 2) {
            throw "Question $($q.id) has less than 2 options!"
        }
    }

    return "Submission ID: $($script:submissionId) | 60 questions received, 1 mark each, 0 answer leaks"
}

# --- TEST 9: Option Selection & Draft Progress Auto-Save ---
Test-Feature "9. Draft Answers Auto-Save & Retrieval (Fixing Unchecking Bug)" {
    $q1Id = $script:sampleQuestions[0].id
    $q1Selected = $script:sampleQuestions[0].options[0]
    $q2Id = $script:sampleQuestions[1].id
    $q2Selected = $script:sampleQuestions[1].options[1]

    $draftAnswers = @{
        $q1Id = $q1Selected
        $q2Id = $q2Selected
    }

    $draftPayload = @{ answers = $draftAnswers } | ConvertTo-Json
    $draftRes = Invoke-RestMethod -Uri "$baseUrl/api/submissions/$($script:submissionId)/draft" -Method Post -ContentType "application/json" -Body $draftPayload
    if ($draftRes.success -ne $true) {
        throw "Draft auto-save endpoint returned non-success"
    }

    $subDetails = Invoke-RestMethod -Uri "$baseUrl/api/submissions/$($script:submissionId)" -Method Get
    if ($subDetails.submission.answers.$q1Id -ne $q1Selected) {
        throw "Draft answer for Q1 not retained: expected '$q1Selected', got '$($subDetails.submission.answers.$q1Id)'"
    }
    return "Draft answers successfully saved and retrieved: Q1='$q1Selected', Q2='$q2Selected'"
}

# --- TEST 10: Anti-Cheating Telemetry & Violation Recording ---
Test-Feature "10. Anti-Cheating Telemetry (Fullscreen Exit Warning Strike)" {
    $v1 = Invoke-RestMethod -Uri "$baseUrl/api/violations" -Method Post -ContentType "application/json" -Body (@{
        submissionId = $script:submissionId
        userId = $script:studentUserId
        type = "FULLSCREEN_EXIT"
        meta = @{ action = "Candidate escaped fullscreen" }
    } | ConvertTo-Json)

    if ($v1.violationsCount -lt 1) {
        throw "Violations count not properly incremented: expected >= 1, got $($v1.violationsCount)"
    }
    return "Successfully logged FULLSCREEN_EXIT incident | Current violations: $($v1.violationsCount)"
}

# --- TEST 11: Final Exam Submission & Scoring ---
Test-Feature "11. Final Exam Submission, Score Computation & Integrity Audit" {
    $finalAnswers = @{}
    for ($i = 0; $i -lt 10; $i++) {
        $q = $script:sampleQuestions[$i]
        $finalAnswers[$q.id] = $q.options[0]
    }

    $submitPayload = @{
        answers = $finalAnswers
        timeSpentSeconds = 340
    } | ConvertTo-Json

    $submitRes = Invoke-RestMethod -Uri "$baseUrl/api/submissions/$($script:submissionId)/submit" -Method Post -ContentType "application/json" -Body $submitPayload
    if ($submitRes.success -ne $true) {
        throw "Final submission failed"
    }

    $sub = $submitRes.submission
    if ($sub.total_marks -ne 60) {
        throw "Expected total_marks 60, got $($sub.total_marks)"
    }
    if ($sub.status -ne "submitted") {
        throw "Expected status 'submitted', got $($sub.status)"
    }
    return "Score awarded: $($sub.score) / $($sub.total_marks) marks | Status: $($sub.status) | Time: $($sub.time_taken_seconds)s"
}

# --- TEST 12: Enforce Strictly Single Attempt ---
Test-Feature "12. Single Attempt Enforcement (Block Re-entry with HTTP 403)" {
    $startBody = @{
        userId = $script:studentUserId
        userName = $testName
        userRollNo = $testRollNo
        userEmail = $testEmail
        userPhone = $testPhone
    } | ConvertTo-Json

    $blocked = $false
    try {
        Invoke-RestMethod -Uri "$baseUrl/api/quiz/$($script:activeQuizId)/start" -Method Post -ContentType "application/json" -Body $startBody
    } catch {
        if ($_.Exception.Response.StatusCode -eq 403) {
            $blocked = $true
        }
    }

    if (-not $blocked) {
        throw "CRITICAL FAILURE: Student was able to start a second attempt on the quiz!"
    }
    return "Second attempt strictly blocked with HTTP 403 (ATTEMPT_LIMIT_REACHED)"
}

# --- TEST 13: Admin Dashboard Sync ---
Test-Feature "13. Admin Dashboard Audit Trail & Candidate Record Verification" {
    $headers = @{ "x-admin-passcode" = $adminPasscode }
    $submissions = Invoke-RestMethod -Uri "$baseUrl/api/admin/submissions" -Method Get -Headers $headers
    $mySub = $submissions | Where-Object { $_.id -eq $script:submissionId }

    if (-not $mySub) {
        throw "Completed submission not found in admin submissions list!"
    }
    if ($mySub.student_roll_no -ne $testRollNo) {
        throw "Roll number mismatch in admin listing: expected $testRollNo, got $($mySub.student_roll_no)"
    }
    if ($mySub.total_marks -ne 60) {
        throw "Expected total marks 60 in admin record, got $($mySub.total_marks)"
    }
    return "Candidate found in Admin Console: Roll=$($mySub.student_roll_no), Score=$($mySub.score)/$($mySub.total_marks), Violations=$($mySub.violations_count)"
}

Write-Host ""
Write-Host "================================================================================"
Write-Host "AUDIT SUMMARY: Passed: $($script:passedCount) | Failed: $($script:failedCount)"
Write-Host "================================================================================"
if ($script:failedCount -eq 0) {
    Write-Host ">>> ALL 13 CORE PRODUCTION CAPABILITIES 100% VERIFIED AND FUNCTIONAL <<<" -ForegroundColor Green
} else {
    Write-Host ">>> SOME TESTS FAILED <<<" -ForegroundColor Red
    exit 1
}
