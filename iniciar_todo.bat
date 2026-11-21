@echo off
chcp 65001 > nul
title Sistema Web3 UPEC - Lanzador
rem Siempre trabaja en la carpeta donde esta este archivo (evita el error de C:\WINDOWS\system32)
cd /d "%~dp0"

echo ============================================================
echo   LANZADOR DEL PROTOTIPO WEB3 - TESIS UPEC
echo   Carpeta: %CD%
echo ============================================================
echo.

where node > nul 2>&1
if errorlevel 1 (
  echo [ERROR] No se encontro Node.js. Instalalo desde https://nodejs.org y vuelve a abrir este archivo.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo 0. Instalando dependencias del proyecto, solo la primera vez...
  call npm install
)
if not exist "client\node_modules" (
  echo 0b. Instalando dependencias de la interfaz, solo la primera vez...
  call npm --prefix client install
)

echo 1. Iniciando el nodo Hardhat en http://127.0.0.1:8545 ...
start "1. Nodo Hardhat UPEC - NO CERRAR" /D "%~dp0." cmd /k npx hardhat node --hostname 127.0.0.1

echo    Esperando a que el nodo responda...
set INTENTOS=0
:esperar
timeout /t 2 /nobreak > nul
set /a INTENTOS+=1
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri http://127.0.0.1:8545 -Method Post -ContentType 'application/json' -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' -TimeoutSec 2; if ($r.result -eq '0x539') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  if %INTENTOS% GEQ 60 (
    echo [ERROR] El nodo no respondio en 2 minutos. Revisa la ventana "1. Nodo Hardhat UPEC".
    pause
    exit /b 1
  )
  goto esperar
)
echo    Nodo listo, ID de cadena 1337.
echo.

echo 2. Desplegando los contratos y cargando los proyectos de demostracion...
call npx hardhat run scripts/deploy.js --network localhost
call npx hardhat run scripts/preparar-todo.js --network localhost

echo.
echo 3. Iniciando el proxy IPFS en el puerto 8787. Sin PINATA_JWT funciona en modo demostracion...
start "2. Proxy IPFS UPEC" /D "%~dp0." cmd /k node server/ipfs-proxy.js

echo 4. Iniciando la interfaz en http://localhost:3000 ...
start "3. Interfaz UPEC - NO CERRAR" /D "%~dp0client" cmd /k npm run dev

echo.
echo ============================================================
echo   LISTO
echo   - Abre http://localhost:3000
echo   - En MetaMask: red Hardhat, RPC http://127.0.0.1:8545, ID 1337
echo   - Despues de cada reinicio: MetaMask ^> Configuracion ^> Avanzado
echo     ^> Borrar datos de actividad
echo ============================================================
timeout /t 6 > nul
start http://localhost:3000
