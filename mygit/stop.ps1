# 카쉐어링 데일리 태스크 - 서버 종료 스크립트 (PowerShell)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  [카쉐어링 데일리 태스크] 서버를 종료합니다..." -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$PORT = 3000
$conn = Get-NetTCPConnection -LocalPort $PORT -ErrorAction SilentlyContinue

if ($conn) {
    $pids = $conn.OwningProcess | Select-Object -Unique
    foreach ($p in $pids) {
        Write-Host "포트 $PORT 에서 실행 중인 프로세스 (PID: $p) 종료 중..." -ForegroundColor White
        Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    }
    Write-Host "`n[성공] 서버가 정상적으로 종료되었습니다." -ForegroundColor Green
} else {
    Write-Host "`n[안내] 포트 $PORT 에서 실행 중인 서버 프로세스를 찾을 수 없습니다." -ForegroundColor Gray
}

Write-Host "========================================================" -ForegroundColor Cyan

