import { useAccount, useDisconnect, useEnsName, useBalance, useChainId } from 'wagmi';

export function useWalletAccount() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const { data: ensName } = useEnsName({
    address,
    chainId: 1, // mainnet ENS
    query: {
      enabled: Boolean(address),
    },
  });

  const { data: balance } = useBalance({
    address,
    chainId,
    query: {
      enabled: Boolean(address && chainId),
    },
  });

  return {
    address,
    ensName,
    isConnected,
    connector,
    chainId,
    balance,
    disconnect,
  };
}
