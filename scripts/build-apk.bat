@echo off
rem Compila el APK release de Nexus en Windows (mismo metodo que projects/finanzas).
rem
rem La ruta del usuario (C:\Users\HP Elitebook) tiene un espacio y es larga, lo que rompe la
rem compilacion nativa. Por eso el script:
rem   1. Genera la carpeta android con expo prebuild si todavia no existe.
rem   2. Monta el SDK de Android en la unidad S: (sin espacios).
rem   3. Copia el proyecto a C:\nx y compila ahi (ruta corta).
rem   4. Genera los objetos C++ en C:\bn para no pasar de 260 caracteres.
rem   5. Copia el APK a dist\ del proyecto.
rem
rem La direccion del backend queda dentro del APK: si cambia la IP de la laptop, se recompila.
rem
rem Uso:  scripts\build-apk.bat 192.168.0.197            compila contra http://192.168.0.197:8080/api
rem       scripts\build-apk.bat 192.168.0.197 install    compila e instala en el telefono por USB

setlocal
if "%~1"=="" (
  echo Uso: scripts\build-apk.bat ^<IP de la laptop^> [install]
  echo La IP sale en ipconfig, linea "Direccion IPv4" del Wi-Fi.
  exit /b 1
)
for %%I in ("%~dp0..") do set "PROJECT=%%~fI"
set "API_URL=http://%~1:8080/api"
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
if not exist "%PROJECT%\android" (
  pushd "%PROJECT%"
  call npx expo prebuild --platform android --no-install || (popd & exit /b 1)
  popd
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

if /I "%~2"=="install" (
  echo Instalando en el telefono ...
  adb install -r "%APK%" || exit /b 1
)

endlocal
