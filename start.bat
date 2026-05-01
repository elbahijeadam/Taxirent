@echo off
setlocal

:: Always run from the directory that contains this file
cd /d "%~dp0"

:: Verify Node.js is reachable before doing anything
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Node.js was not found in PATH.
    echo  Install it from https://nodejs.org ^(LTS recommended^)
    echo.
    pause
    exit /b 1
)

:: Run start.js with Node.js explicitly.
:: This line must say  node start.js  -- never wscript / cscript.
node "%~dp0start.js"

:: Keep the window open only when something went wrong
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] start.js exited with code %errorlevel%.
    echo  Check the output above for details.
    echo.
    pause
)
