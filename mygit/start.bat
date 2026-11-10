@echo off
chcp 65001 > nul
title 카쉐어링 데일리 태스크 - 서버 실행

echo ========================================================
echo   [카쉐어링 데일리 태스크] 풀스택 서버를 실행합니다
echo ========================================================
echo.

:: 1. Node.js 설치 확인
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 Node.js를 설치한 후 다시 실행해주세요.
    echo.
    pause
    exit /b 1
)

:: 2. 기존 실행 중인 서버 포트(3000) 정리
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING 2^>nul') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: 3. 백엔드 서버 백그라운드 구동
echo [1/2] 백엔드 및 정적 파일 서버 구동 중 (포트: 3000)...
start "CarSharingServer" /B node server.js

:: 서버 시작 대기 (1.5초)
timeout /t 2 /nobreak > nul

:: 4. 브라우저 자동 오픈
echo [2/2] 기본 브라우저를 실행합니다 (http://localhost:3000)...
start http://localhost:3000

echo.
echo ========================================================
echo   * 서버 주소: http://localhost:3000
echo   * 프론트엔드와 백엔드가 정상적으로 가동 중입니다.
echo   * 서버를 종료하려면 stop.bat 을 더블 클릭하세요.
echo ========================================================
echo.
pause

