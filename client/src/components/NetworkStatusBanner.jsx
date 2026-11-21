import React, { useCallback, useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { TARGET_NETWORK, targetChain, targetRpcUrl, localRpcUrl, saveRpcUrl } from '../config/wagmi.js';
import { CONTRACT_ADDRESSES } from '../contracts/config.js';

/**
 * Revisa cada pocos segundos que la red responda, que los contratos estén desplegados
 * y que MetaMask esté en la red correcta. Si algo falla, explica qué hacer.
 * Funciona con la red Hardhat (local o por túnel) y con Sepolia.
 */
async function rpc(method, params = []) {
  const res = await fetch(targetRpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

const isSepolia = TARGET_NETWORK === 'sepolia';

export default function NetworkStatusBanner() {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [status, setStatus] = useState('checking'); // checking | ok | down | wrongnode | nocontracts
  const [rpcInput, setRpcInput] = useState(localRpcUrl);

  const check = useCallback(async () => {
    try {
      const id = parseInt(await rpc('eth_chainId'), 16);
      if (id !== targetChain.id) return setStatus('wrongnode');
      const addr = CONTRACT_ADDRESSES[targetChain.id];
      const code = addr ? await rpc('eth_getCode', [addr, 'latest']) : '0x';
      setStatus(!code || code === '0x' ? 'nocontracts' : 'ok');
    } catch {
      setStatus('down');
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [check]);

  const box = (title, lines, action) => (
    <div className="mb-4 p-4 rounded-2xl border-2 border-rose-300 bg-rose-50 text-rose-950 text-xs sm:text-sm shadow-sm">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="font-black">{title}</p>
          {lines.map((l, i) => (
            <p key={i} className="leading-relaxed">{l}</p>
          ))}
          <div className="flex flex-wrap gap-2 pt-1">
            {action}
            <button type="button" onClick={check} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-rose-300 font-bold text-rose-800 hover:bg-rose-100">
              <RefreshCw className="w-3.5 h-3.5" /> Volver a comprobar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  const code = (t) => <code className="px-1.5 py-0.5 rounded bg-white border border-rose-200 font-mono text-[11px] break-all">{t}</code>;

  const rpcEditor = !isSepolia && (
    <div className="w-full flex flex-col sm:flex-row gap-2 pt-1">
      <input
        value={rpcInput}
        onChange={(e) => setRpcInput(e.target.value)}
        placeholder="https://xxxx.trycloudflare.com"
        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-rose-300 bg-white font-mono text-[11px] focus:outline-none focus:border-rose-500"
      />
      <button
        type="button"
        onClick={() => { saveRpcUrl(rpcInput); window.location.href = window.location.pathname; }}
        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
      >
        Usar este RPC
      </button>
      <button
        type="button"
        onClick={() => { saveRpcUrl(''); window.location.href = window.location.pathname; }}
        className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 font-bold text-rose-800"
      >
        Volver a 127.0.0.1
      </button>
    </div>
  );

  if (status === 'down')
    return isSepolia
      ? box('No responde el nodo RPC de Sepolia', [
          <>La aplicación consulta {code(targetRpcUrl)} y no obtuvo respuesta. Revisa tu conexión a internet o define otro RPC en la variable {code('VITE_SEPOLIA_RPC_URL')} de Vercel.</>,
        ])
      : box('No se encuentra el nodo Hardhat', [
          <>La aplicación busca la red en {code(localRpcUrl)} y no responde. MetaMask mostrará "No se puede conectar a Hardhat Localhost" hasta que el nodo esté encendido.</>,
          <>En la PC del nodo: haz doble clic en {code('iniciar_todo.bat')} o ejecuta {code('npx hardhat node --hostname 127.0.0.1')} en la carpeta del proyecto y deja esa ventana abierta.</>,
          <>Si entras desde otra computadora, pega abajo la dirección del túnel que muestra {code('npm run tunel')} en la PC del nodo.</>,
        ], rpcEditor);
  if (status === 'wrongnode')
    return box('La red responde con otro identificador', [
      <>Se esperaba el ID de cadena {code(String(targetChain.id))}. Revisa el RPC configurado.</>,
    ], rpcEditor);
  if (status === 'nocontracts')
    return isSepolia
      ? box('Los contratos todavía no están desplegados en Sepolia', [
          <>En la carpeta del proyecto ejecuta {code('npm run deploy:sepolia')} (necesita {code('PRIVATE_KEY')} y {code('DOCENTE_WALLETS')} en el archivo .env), sube el cambio a GitHub y espera a que Vercel publique.</>,
        ])
      : box('El nodo está encendido, pero los contratos no están desplegados', [
          <>Pasa cada vez que se reinicia el nodo. En la carpeta del proyecto ejecuta {code('npm run deploy:local')} y luego {code('npm run preparar')}.</>,
          <>Después, en MetaMask: Configuración &gt; Avanzado &gt; Borrar datos de actividad.</>,
        ]);
  if (status === 'ok' && isConnected && chainId !== targetChain.id)
    return box('MetaMask está en otra red', [
      isSepolia
        ? <>Para firmar en el prototipo, MetaMask debe estar en la red de prueba {code('Sepolia')}.</>
        : <>MetaMask debe usar la red con ID {code('1337')} y RPC {code(localRpcUrl)}.</>,
    ],
      <button type="button" disabled={isPending} onClick={() => switchChain({ chainId: targetChain.id })} className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold disabled:opacity-60">
        {isPending ? 'Confirma en MetaMask…' : `Cambiar a ${isSepolia ? 'Sepolia' : 'la red Hardhat (1337)'}`}
      </button>
    );
  return null;
}
