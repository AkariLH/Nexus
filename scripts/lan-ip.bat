@echo off
rem Deja en LAN_IP la IPv4 de la red con la que sale la laptop (el adaptador activo con puerta
rem de enlace). La usan start-web.bat y build-apk.bat para no escribir la IP a mano cada vez
rem que el router la cambia.
rem
rem Uso (desde otro .bat):  call "%~dp0lan-ip.bat" || exit /b 1

set "LAN_IP="
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1).IPv4Address.IPAddress"`) do set "LAN_IP=%%A"
if not defined LAN_IP (
  echo [error] No se encontro la IP de la red. Revisa que estes conectada al Wi-Fi.
  exit /b 1
)
exit /b 0
