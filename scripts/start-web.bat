@echo off
rem Arranca la web de Nexus apuntando al backend en la IP actual de la laptop.
rem
rem La variable EXPO_PUBLIC_API_URL que se pone aqui gana sobre la del .env (Expo no pisa las
rem variables que ya existen), asi que el .env no hay que tocarlo cuando el router cambia la IP.
rem Se arranca con -c para que Expo no reuse la IP vieja de su cache.
rem
rem Uso:  scripts\start-web.bat          solo la web
rem       scripts\start-web.bat movil    Expo normal (web y telefono con Expo Go)

setlocal
for %%I in ("%~dp0..") do set "PROJECT=%%~fI"
call "%~dp0lan-ip.bat" || exit /b 1
set "EXPO_PUBLIC_API_URL=http://%LAN_IP%:8080/api"
echo Backend: %EXPO_PUBLIC_API_URL%

pushd "%PROJECT%"
if /I "%~1"=="movil" (
  call npx expo start -c
) else (
  call npx expo start --web -c
)
popd
endlocal
