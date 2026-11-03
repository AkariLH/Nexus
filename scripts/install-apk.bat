@echo off
rem Instala el APK ya compilado (dist\nexus-<version>.apk) en todos los telefonos conectados por
rem USB, sin volver a compilar. Para compilar e instalar: scripts\build-apk.bat install
rem
rem Uso:  scripts\install-apk.bat                    instala dist\nexus-<version de app.json>.apk
rem       scripts\install-apk.bat ruta\otro.apk      instala ese APK

setlocal
for %%I in ("%~dp0..") do set "PROJECT=%%~fI"
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"

if not exist "%ADB%" (
  echo [error] No se encontro adb en "%ADB%".
  exit /b 1
)

set "APK=%~1"
if not defined APK (
  for /f "usebackq delims=" %%V in (`node -p "require('%PROJECT:\=/%/app.json').expo.version"`) do set "APK=%PROJECT%\dist\nexus-%%V.apk"
)
if not exist "%APK%" (
  echo [error] No existe "%APK%". Compilalo primero con scripts\build-apk.bat
  exit /b 1
)
for %%F in ("%APK%") do echo APK: %%~fF  ^(%%~tF^)

set "INSTALLED=0"
set "FOUND=0"
for /f "skip=1 tokens=1,2" %%A in ('call "%ADB%" devices') do (
  if "%%B"=="device" (
    set /a FOUND+=1
    echo Instalando en %%A ...
    call "%ADB%" -s %%A install -r "%APK%" && set /a INSTALLED+=1
  )
  if "%%B"=="unauthorized" echo [aviso] %%A no esta autorizado: acepta la depuracion USB en su pantalla.
)
call echo Instalado en %%INSTALLED%% de %%FOUND%% telefono^(s^).
if "%FOUND%"=="0" echo [aviso] No hay telefonos conectados: revisa el cable y la depuracion USB.

endlocal
