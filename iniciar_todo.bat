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

echo 1. Iniciando el nodo local persistente en http://127.0.0.1:8545 ...
echo    La cadena se guarda en cadena-local.json: no se pierde al cerrar.
start "1. Nodo local UPEC - NO CERRAR" /D "%~dp0." cmd /k npm run nodo

echo    Esperando a que el nodo responda...
set INTENTOS=0
:esperar
timeout /t 2 /nobreak > nul
set /a INTENTOS+=1
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri http://127.0.0.1:8545 -Method Post -ContentType 'application/json' -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' -TimeoutSec 2; if ($r.result -eq '0x539') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  if %INTENTOS% GEQ 60 (
    echo [ERROR] El nodo no respondio en 2 minutos. Revisa la ventana "1. Nodo local UPEC".
    pause
    exit /b 1
  )
  goto esperar
)
echo    Nodo listo, ID de cadena 1337.
echo.

rem Si la cadena guardada ya tiene los contratos, no se vuelven a desplegar
powershell -NoProfile -Command "try { $r = Invoke-RestMethod -Uri http://127.0.0.1:8545 -Method Post -ContentType 'application/json' -Body '{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"0x5FbDB2315678afecb367f032d93F642f64180aa3\",\"latest\"],\"id\":1}' -TimeoutSec 3; if ($r.result -and $r.result -ne '0x') { exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo 2. Cadena nueva: desplegando los contratos y cargando los proyectos de demostracion...
  call npx hardhat run scripts/deploy.js --network localhost
  call npx hardhat run scripts/preparar-todo.js --network localhost
) else (
  echo 2. La cadena guardada ya tiene los contratos y los proyectos. No hace falta desplegar.
)

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
echo   - La cadena se conserva entre reinicios: no hace falta borrar
echo     la actividad de MetaMask. Solo la primera vez, o despues de
echo     usar reiniciar_cadena.bat.
echo ============================================================
timeout /t 6 > nul
start http://localhost:3000
