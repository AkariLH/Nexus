@echo off
rem Compila el APK release de Nexus en Windows (mismo metodo que projects/finanzas).
rem
rem La ruta del usuario (C:\Users\HP Elitebook) tiene un espacio y es larga, lo que rompe la
rem compilacion nativa. Por eso el script:
rem   1. Genera o actualiza la carpeta android con expo prebuild (si no existe, o si cambio app.json
rem      o los iconos de Android desde la ultima vez).
rem   2. Monta el SDK de Android en la unidad S: (sin espacios).
rem   3. Copia el proyecto a C:\nx y compila ahi (ruta corta).
rem   4. Genera los objetos C++ en C:\bn para no pasar de 260 caracteres.
rem   5. Copia el APK a dist\ del proyecto.
rem
rem La direccion del backend queda dentro del APK: si cambia la IP de la laptop, se recompila.
rem Sin IP, el script usa la IP actual de la laptop (lan-ip.bat).
rem
rem Uso:  scripts\build-apk.bat                          compila contra la IP actual
rem       scripts\build-apk.bat install                  compila contra la IP actual e instala por USB
rem       scripts\build-apk.bat 192.168.0.197            compila contra http://192.168.0.197:8080/api
rem       scripts\build-apk.bat 192.168.0.197 install    compila e instala por USB
rem "install" instala en todos los telefonos conectados (los que adb devices muestra como device).

setlocal
set "TARGET_IP=%~1"
set "INSTALL=%~2"
if /I "%~1"=="install" (
  set "TARGET_IP="
  set "INSTALL=install"
)
if not defined TARGET_IP (
  call "%~dp0lan-ip.bat" || exit /b 1
  call set "TARGET_IP=%%LAN_IP%%"
)
for %%I in ("%~dp0..") do set "PROJECT=%%~fI"
set "API_URL=http://%TARGET_IP%:8080/api"
set "SDK=%LOCALAPPDATA%\Android\Sdk"
set "SDK_DRIVE=S:"
set "BUILD_DIR=C:\nx"
set "CXX_STAGING=C:/bn"
set "ARCHS=arm64-v8a,armeabi-v7a"

if not exist "%SDK%\platform-tools" (
  echo [error] No se encontro el SDK de Android en "%SDK%".
  exit /b 1
)

echo [1/5] Revisando la carpeta android ...
rem android\.prebuild-stamp marca el ultimo prebuild; si app.json o un icono de Android es mas
rem nuevo, se vuelve a correr (sin --clean, para conservar la cache).
set "STAMP=%PROJECT%\android\.prebuild-stamp"
set "NEEDS_PREBUILD="
if not exist "%PROJECT%\android" set "NEEDS_PREBUILD=1"
if not defined NEEDS_PREBUILD (
  pushd "%PROJECT%"
  node -e "const fs=require('fs');const t=f=>fs.existsSync(f)?fs.statSync(f).mtimeMs:0;const s=t('android/.prebuild-stamp');const n=Math.max(...['app.json','assets/images/icon.png','assets/images/android-icon-foreground.png','assets/images/android-icon-gradient.png'].map(t));process.exit(n>s?1:0)"
  if errorlevel 1 set "NEEDS_PREBUILD=1"
  popd
)
if defined NEEDS_PREBUILD (
  echo       Actualizando la carpeta android con expo prebuild ...
  pushd "%PROJECT%"
  set "EXPO_NO_GIT_STATUS=1"
  call npx expo prebuild --platform android --no-install || (popd & exit /b 1)
  popd
  type nul > "%STAMP%"
)

echo [2/5] Montando el SDK en %SDK_DRIVE% ...
if not exist "%SDK_DRIVE%\platform-tools" (
  if exist "%SDK_DRIVE%\" (
    echo [error] La unidad %SDK_DRIVE% ya esta en uso por otra cosa. Liberala con: subst %SDK_DRIVE% /D
    exit /b 1
  )
  subst %SDK_DRIVE% "%SDK%" || exit /b 1
)

echo [3/5] Copiando el proyecto a %BUILD_DIR% ...
rem Las carpetas excluidas no se borran del destino: asi se conserva la cache de compilacion.
robocopy "%PROJECT%" "%BUILD_DIR%" /MIR /XD "%PROJECT%\android\build" "%PROJECT%\android\app\build" "%PROJECT%\android\.gradle" "%PROJECT%\dist" .cxx .expo .impeccable /NFL /NDL /NJH /NJS /NP >nul
if errorlevel 8 (
  echo [error] Fallo la copia con robocopy.
  exit /b 1
)

echo [4/5] Compilando el APK release contra %API_URL% (la primera vez tarda mas) ...
set "JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/Windows/Temp"
set "ANDROID_HOME=%SDK_DRIVE%\"
set "ANDROID_SDK_ROOT=%SDK_DRIVE%\"
set "NODE_ENV=production"
set "EXPO_PUBLIC_API_URL=%API_URL%"
pushd "%BUILD_DIR%\android"
call "%BUILD_DIR%\android\gradlew.bat" assembleRelease "-PreactNativeArchitectures=%ARCHS%" "-PcxxStagingDir=%CXX_STAGING%"
set "GRADLE_EXIT=%ERRORLEVEL%"
popd
if not "%GRADLE_EXIT%"=="0" (
  echo [error] Gradle termino con codigo %GRADLE_EXIT%.
  exit /b %GRADLE_EXIT%
)

echo [5/5] Copiando el APK a dist\ ...
for /f "usebackq delims=" %%V in (`node -p "require('%PROJECT:\=/%/app.json').expo.version"`) do set "VERSION=%%V"
if not exist "%PROJECT%\dist" mkdir "%PROJECT%\dist"
set "APK=%PROJECT%\dist\nexus-%VERSION%.apk"
copy /Y "%BUILD_DIR%\android\app\build\outputs\apk\release\app-release.apk" "%APK%" >nul || exit /b 1
echo Listo: %APK%

if /I "%INSTALL%"=="install" (
  set "INSTALLED=0"
  for /f "skip=1 tokens=1,2" %%A in ('call "%SDK%\platform-tools\adb.exe" devices') do (
    if "%%B"=="device" (
      echo Instalando en %%A ...
      call "%SDK%\platform-tools\adb.exe" -s %%A install -r "%APK%" && set /a INSTALLED+=1
    )
    if "%%B"=="unauthorized" echo [aviso] %%A no esta autorizado: acepta la depuracion USB en su pantalla.
  )
  call echo Instalado en %%INSTALLED%% telefono^(s^).
)

endlocal
