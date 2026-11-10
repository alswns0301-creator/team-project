@echo off
chcp 65001 > nul
title 카쉐어링 데일리 태스크 - 서버 종료

echo ========================================================
echo   [카쉐어링 데일리 태스크] 서버를 종료합니다...
echo ========================================================
echo.

set PORT=3000
set FOUND=0

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%PORT% ^| findstr LISTENING 2^>nul') do (
    echo [포트 %PORT%] 실행 중인 프로세스(PID: %%a) 종료 중...
    taskkill /F /PID %%a >nul 2>nul
    set FOUND=1
)

if %FOUND% equ 1 (
    echo.
    echo [성공] 서버가 정상적으로 종료되었습니다.
) else (
    echo.
    echo [안내] 현재 포트 %PORT% 에서 실행 중인 서버 프로세스가 없습니다.
)

echo.
echo ========================================================
timeout /t 3 > nul

