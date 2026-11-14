const NAMES: Record<string, string> = {
  solana: "Solana",
  evm: "Base (EVM)",
  base: "Base",
  ethereum: "Ethereum",
};

export const networkName = (id: string) => NAMES[id] ?? id.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
export const chainName = (chain: string | null, family: string) => (chain ? networkName(chain) : networkName(family));
