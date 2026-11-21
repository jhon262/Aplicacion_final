import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, injectedWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets';
import { http } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// ---------------------------------------------------------------------------
// Red de trabajo
//   VITE_CHAIN=hardhat  (por defecto) → nodo Hardhat local, o expuesto con un túnel
//   VITE_CHAIN=sepolia               → red de prueba pública Sepolia (funciona sin tu PC)
// ---------------------------------------------------------------------------
export const TARGET_NETWORK = (import.meta.env.VITE_CHAIN || 'hardhat').toLowerCase() === 'sepolia' ? 'sepolia' : 'hardhat';

// RPC del nodo Hardhat. Orden de prioridad:
//   1. ?rpc=https://... en la dirección (se guarda en el navegador), útil para el túnel
//   2. el RPC guardado antes en este navegador
//   3. VITE_RPC_URL
//   4. la IP de la red local si la app se abre desde el celular en la misma Wi-Fi
//   5. http://127.0.0.1:8545 (la propia computadora)
function readStoredRpc() {
  if (typeof window === 'undefined') return '';
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('rpc');
    if (fromUrl && /^https?:\/\//.test(fromUrl)) {
      localStorage.setItem('upec_rpc_url', fromUrl);
      return fromUrl;
    }
    return localStorage.getItem('upec_rpc_url') || '';
  } catch {
    return '';
  }
}
const host = typeof window !== 'undefined' ? window.location.hostname : '';
const isLanIp = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host);
export const localRpcUrl =
  readStoredRpc() || import.meta.env.VITE_RPC_URL || (isLanIp ? `http://${host}:8545` : 'http://127.0.0.1:8545');

export function saveRpcUrl(url) {
  try {
    if (url) localStorage.setItem('upec_rpc_url', url.trim());
    else localStorage.removeItem('upec_rpc_url');
  } catch {
    // ignore
  }
}

export const sepoliaRpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

// Red local Hardhat con chainId 1337
export const hardhat1337 = defineChain({
  id: 1337,
  name: 'Hardhat UPEC (1337)',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [localRpcUrl] },
  },
  testnet: true,
});

export const targetChain = TARGET_NETWORK === 'sepolia' ? sepolia : hardhat1337;
export const targetRpcUrl = TARGET_NETWORK === 'sepolia' ? sepoliaRpcUrl : localRpcUrl;

// "MetaMask" conectado directamente a la extensión instalada (window.ethereum).
// El conector de MetaMask que trae RainbowKit usa el SDK de MetaMask y a veces se queda en
// "Opening MetaMask..." con redes locales; este va directo a la extensión.
const metaMaskExtension = (params) => {
  const base = injectedWallet(params);
  const mm = metaMaskWallet(params);
  return {
    ...base,
    id: 'metamask-extension',
    rdns: 'io.metamask',
    name: 'MetaMask',
    iconUrl: mm.iconUrl,
    iconBackground: mm.iconBackground || '#fff',
    downloadUrls: mm.downloadUrls,
    installed: typeof window !== 'undefined' && Boolean(window.ethereum?.isMetaMask),
  };
};

const browserWallet = (params) => ({ ...injectedWallet(params), name: 'Billetera del navegador' });

// Configuración única compartida para toda la aplicación
export const config = getDefaultConfig({
  appName: 'UPEC Web3 System',
  projectId: 'c4f79cc821944d9680842e34466bfbd',
  wallets: [
    { groupName: 'Recomendado', wallets: [metaMaskExtension, browserWallet] },
    { groupName: 'Otras', wallets: [walletConnectWallet] },
  ],
  // La red elegida va primero: es la que se usa cuando no hay billetera conectada
  chains: TARGET_NETWORK === 'sepolia' ? [sepolia, hardhat1337] : [hardhat1337, sepolia],
  transports: {
    [hardhat1337.id]: http(localRpcUrl),
    [sepolia.id]: http(sepoliaRpcUrl),
  },
  ssr: false,
});
