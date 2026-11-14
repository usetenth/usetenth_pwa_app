export const shortAddress = (a: string) => (a.length > 16 ? `${a.slice(0, 6)}…${a.slice(-6)}` : a);

export function shareMessage(asset: string, network: string, address: string) {
  return `Send ${asset} on ${network} to my usetenth wallet:\n${address}\n\nOnly send stablecoins on ${network}. Any other asset or network can be lost for good.`;
}
