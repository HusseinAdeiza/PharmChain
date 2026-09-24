import { defineChain } from "viem";

export const MONAD_MAINNET_ID = 143 as const;

export const monadMainnet = defineChain({
  id: MONAD_MAINNET_ID,
  name: "Monad Mainnet",
  nativeCurrency: {
    name: "Monad",
    symbol: "MON",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.monad.xyz"],
    },
  },
  blockExplorers: {
    default: {
      name: "MonadScan",
      url: "https://monadscan.com",
    },
  },
  testnet: false,
});

export const MONAD_EXPLORER_URL = "https://monadscan.com";

export function monadAddressUrl(address?: string) {
  return address ? `${MONAD_EXPLORER_URL}/address/${address}` : undefined;
}

export function monadTransactionUrl(hash?: `0x${string}`) {
  return hash ? `${MONAD_EXPLORER_URL}/tx/${hash}` : undefined;
}
