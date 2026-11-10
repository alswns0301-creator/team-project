# 카쉐어링 데일리 태스크 - 서버 실행 스크립트 (PowerShell)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [카쉐어링 데일리 태스크] 풀스택 서버를 실행합니다" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

# 1. Node.js 확인
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "[오류] Node.js가 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "https://nodejs.org 에서 Node.js를 설치해주세요."
    exit 1
}

# 2. 포트 3000 사용 중인 프로세스 정리
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    $pids = $conn.OwningProcess | Select-Object -Unique
    foreach ($p in $pids) {
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
}

# 3. 서버 백그라운드 구동
Write-Host "[1/2] 백엔드 및 웹 서버 시작 중 (포트: 3000)..." -ForegroundColor Yellow
Start-Process node -ArgumentList "server.js" -WindowStyle Hidden

Start-Sleep -Seconds 2

# 4. 브라우저 실행
Write-Host "[2/2] 브라우저를 엽니다: http://localhost:3000" -ForegroundColor Yellow
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  * 서버 주소: http://localhost:3000" -ForegroundColor Green
Write-Host "  * 프론트엔드와 백엔드가 정상 구동 중입니다."
Write-Host "  * 서버를 종료하려면 .\stop.ps1 또는 stop.bat 을 실행하세요." -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Cyan

