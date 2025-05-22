@echo off
REM See latest version at:
REM https://github.com/elixir-lang/elixir-lang.github.com/blob/main/install.bat

setlocal EnableDelayedExpansion

set "otp_version="
set "elixir_version="
set "force=false"

goto :main

:usage
echo Usage: install.bat elixir@ELIXIR_VERSION otp@OTP_VERSION [options]
echo.
echo ELIXIR_VERSION can be X.Y.Z, latest, or main.
echo OTP_VERSION can be X.Y.Z or latest.
echo.
echo Options:
echo.
echo   -f, --force      Forces installation even if it was previously installed
echo   -h, --help       Prints this help
echo.
echo Examples:
echo.
echo   install.bat elixir@1.16.3 otp@26.2.5.4
echo   install.bat elixir@latest otp@latest
echo   install.bat elixir@main otp@latest
echo.
goto :eof

:main
for %%i in (%*) do (
  set arg=%%i

  if "!arg:~0,7!" == "elixir@" (
    set "elixir_version=!arg:~7!"
  ) else if "!arg:~0,4!" == "otp@" (
    set "otp_version=!arg:~4!"
  ) else if "!arg!" == "-f" (
    set "force=true"
  ) else if "!arg!" == "--force" (
    set "force=true"
  ) else if "!arg!" == "-h" (
    call :usage
    exit /b 0
  ) else if "!arg!" == "--help" (
    call :usage
    exit /b 0
  ) else (
    echo error: unknown argument !arg!
    exit /b 1
  )
)

if "%elixir_version%" == "" (
  call :usage
  echo error: missing elixir@VERSION argument
  exit /b 1
)

if "%otp_version%" == "" (
  call :usage
  echo error: missing otp@VERSION argument
  exit /b 1
)

if "!otp_version!" == "latest" (
  set "url=https://github.com/erlang/otp/releases/latest"
  for /f "tokens=2 delims= " %%a in ('curl -fsS --head "!url!" ^| findstr /I "^location:"') do set url=%%a
  set "otp_version=!url:*releases/tag/OTP-=!"
)

if "!elixir_version!" == "latest" (
  set "url=https://github.com/elixir-lang/elixir/releases/latest"
  for /f "tokens=2 delims= " %%a in ('curl -fsS --head "!url!" ^| findstr /I "^location:"') do set url=%%a
  set "elixir_version=!url:*releases/tag/v=!"
)

for /f "tokens=1 delims=." %%A in ("!otp_version!") do set "elixir_otp_release=%%A"
for /f "tokens=1,2 delims=." %%A in ("!elixir_version!") do set "elixir_major_minor=%%A.%%B"

if "%elixir_major_minor%" == "1.14" (
  if %elixir_otp_release% GEQ 25 set "elixir_otp_release=25"
) else if "%elixir_major_minor%" == "1.15" (
  if %elixir_otp_release% GEQ 26 set "elixir_otp_release=26"
) else if "%elixir_major_minor%" == "1.16" (
  if %elixir_otp_release% GEQ 26 set "elixir_otp_release=26"
) else if "%elixir_major_minor%" == "1.17" (
  if %elixir_otp_release% GEQ 27 set "elixir_otp_release=27"
) else if "%elixir_major_minor%" == "1.18" (
  if %elixir_otp_release% GEQ 27 set "elixir_otp_release=27"
) else if "%elixir_major_minor%" == "1.19" (
  if %elixir_otp_release% GEQ 28 set "elixir_otp_release=28"
) else (
  if %elixir_otp_release% GEQ 28 set "elixir_otp_release=28"
)

set "root_dir=%USERPROFILE%\.elixir-install"
set "tmp_dir=%root_dir%\tmp"
mkdir %tmp_dir% 2>nul
set "otp_dir=%root_dir%\installs\otp\%otp_version%"
set "elixir_dir=%root_dir%\installs\elixir\%elixir_version%-otp-%elixir_otp_release%"

call :install_otp
if %errorlevel% neq 0 exit /b 1

set /p="checking OTP... "<nul
set "PATH=%otp_dir%\bin;%PATH%"
"%otp_dir%\bin\erl.exe" -noshell -eval "io:put_chars(erlang:system_info(otp_release) ++ "" ok\n""), halt()."

call :install_elixir
if %errorlevel% neq 0 exit /b 1

set /p="checking Elixir... "<nul
call "%elixir_dir%\bin\elixir.bat" -e "IO.write(System.version())"
echo. ok

echo.
echo If you are using powershell, run this (or add to your $PROFILE):
echo.
echo    $env:PATH = "$env:USERPROFILE\.elixir-install\installs\otp\!otp_version!\bin;$env:PATH"
echo    $env:PATH = "$env:USERPROFILE\.elixir-install\installs\elixir\!elixir_version!-otp-%elixir_otp_release%\bin;$env:PATH"
echo.
echo If you are using cmd, run this:
echo.
echo    set PATH=%%USERPROFILE%%\.elixir-install\installs\otp\!otp_version!\bin;%%PATH%%
echo    set PATH=%%USERPROFILE%%\.elixir-install\installs\elixir\!elixir_version!-otp-%elixir_otp_release%\bin;%%PATH%%
echo.
goto :eof

:install_otp
set "otp_zip=otp_win64_%otp_version%.zip"

if "%force%" == "true" (
  if exist "%otp_dir%" (
    rmdir /s /q "%otp_dir%"
  )
)

if not exist "%otp_dir%\bin" (
  if exist "%otp_dir%" (
    rmdir /s /q "%otp_dir%"
  )

  set otp_url=https://github.com/erlang/otp/releases/download/OTP-!otp_version!/%otp_zip%
  echo downloading !otp_url!...
  curl.exe -fsSLo %tmp_dir%\%otp_zip% "!otp_url!" || exit /b 1

  echo unpacking %tmp_dir%\%otp_zip%
  powershell -NoProfile -Command ^
    "$ErrorActionPreference='Stop';" ^
    "try {" ^
    "  if (-not (Get-Command Expand-Archive -ErrorAction SilentlyContinue)) {" ^
    "    Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
    "    [System.IO.Compression.ZipFile]::ExtractToDirectory('%tmp_dir%\%otp_zip%', '%otp_dir%')" ^
    "  } else {" ^
    "    Expand-Archive -LiteralPath '%tmp_dir%\%otp_zip%' -DestinationPath '%otp_dir%' -Force" ^
    "  }" ^
    "} catch { Write-Error $_; exit 1 }"
  del /f /q "%tmp_dir%\%otp_zip%"
  cd /d "%otp_dir%"

  if not exist "c:\windows\system32\vcruntime140.dll" (
    echo Installing VC++ Redistributable...
    .\vc_redist.exe /quiet /norestart
  )
)
exit /b 0
goto :eof

:install_elixir
set "elixir_zip=elixir-otp-!elixir_otp_release!.zip"

if "%elixir_version%" == "main" (
  rem Do not remove this comment
  set "ref=main-latest"
) else (
  rem Do not remove this comment
  set "ref=v%elixir_version%"
)

if "%force%" == "true" (
  if exist "%elixir_dir%" (
    rmdir /s /q "%elixir_dir%"
  )
)

if not exist "%elixir_dir%\bin" (
  set "elixir_url=https://github.com/elixir-lang/elixir/releases/download/%ref%/elixir-otp-%elixir_otp_release%.zip"
  echo downloading !elixir_url!...
  curl.exe -fsSLo "%tmp_dir%\%elixir_zip%" "!elixir_url!" || exit /b 1

  echo unpacking %tmp_dir%\%elixir_zip%
  powershell -NoProfile -Command ^
    "$ErrorActionPreference='Stop';" ^
    "try {" ^
    "  if (-not (Get-Command Expand-Archive -ErrorAction SilentlyContinue)) {" ^
    "    Add-Type -AssemblyName System.IO.Compression.FileSystem;" ^
    "    [System.IO.Compression.ZipFile]::ExtractToDirectory('%tmp_dir%\%elixir_zip%', '%elixir_dir%')" ^
    "  } else {" ^
    "    Expand-Archive -LiteralPath '%tmp_dir%\%elixir_zip%' -DestinationPath '%elixir_dir%' -Force" ^
    "  }" ^
    "} catch { Write-Error $_; exit 1 }"
  del /f /q %tmp_dir%\%elixir_zip%
)
goto :eof
