"use client";

import { useState } from "react";
import { decodeEventLog, type Address } from "viem";
import {
  useAccount,
  useConnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  MANUFACTURER_CREDENTIAL_ABI,
  credentialConfiguration,
  manufacturerCredentialAddress,
} from "@/lib/contracts";
import { errorMessage } from "@/lib/errors";
import { MONAD_MAINNET_ID, monadMainnet } from "@/lib/monad";

export type CredentialMintRequest = {
  manufacturer: Address;
  manufacturerName: string;
  nafdacRegistrationNumber: string;
  manufacturingAddress: string;
};

function sameAddress(left?: Address, right?: Address) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function credentialMintedTokenId(
  logs: readonly {
    address: Address;
    data: `0x${string}`;
    topics: readonly `0x${string}`[];
  }[],
  contractAddress: Address,
) {
  for (const log of logs) {
    if (log.address.toLowerCase() !== contractAddress.toLowerCase()) {
      continue;
    }
    try {
      const event = decodeEventLog({
        abi: MANUFACTURER_CREDENTIAL_ABI,
        data: log.data,
        topics: log.topics as [`0x${string}`, ...`0x${string}`[]],
      });
      if (event.eventName === "CredentialMinted") {
        return event.args.tokenId;
      }
    } catch {
      continue;
    }
  }
  return undefined;
}

export function useManufacturerCredentialMint() {
  const { address: accountAddress, chainId, isConnected } = useAccount();
  const { connectors, connect, error: connectError, isPending: isConnecting } =
    useConnect();
  const { switchChain, error: switchError, isPending: isSwitching } =
    useSwitchChain();
  const {
    writeContractAsync,
    error: writeError,
    isPending: isWriting,
  } = useWriteContract();
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const [requestError, setRequestError] = useState<string>();
  const ownerQuery = useReadContract({
    address: manufacturerCredentialAddress,
    abi: MANUFACTURER_CREDENTIAL_ABI,
    functionName: "owner",
    query: {
      enabled: credentialConfiguration === "ready",
    },
  });
  const pausedQuery = useReadContract({
    address: manufacturerCredentialAddress,
    abi: MANUFACTURER_CREDENTIAL_ABI,
    functionName: "paused",
    query: {
      enabled: credentialConfiguration === "ready",
    },
  });
  const receipt = useWaitForTransactionReceipt({
    chainId: MONAD_MAINNET_ID,
    hash: transactionHash,
    query: {
      enabled: Boolean(transactionHash),
    },
  });
  const ownerAddress = ownerQuery.data;
  const isOwner = sameAddress(accountAddress, ownerAddress);
  const isPaused = pausedQuery.data === true;
  const mintedTokenId =
    receipt.data && manufacturerCredentialAddress
      ? credentialMintedTokenId(receipt.data.logs, manufacturerCredentialAddress)
      : undefined;
  const error = requestError ??
    (writeError ? errorMessage(writeError) : undefined) ??
    (receipt.error ? errorMessage(receipt.error) : undefined) ??
    (connectError ? errorMessage(connectError) : undefined) ??
    (switchError ? errorMessage(switchError) : undefined);

  const connectWallet = () => {
    const connector = connectors[0];
    if (!connector) {
      setRequestError("No injected wallet was detected. Install a browser wallet and refresh the page.");
      return;
    }
    setRequestError(undefined);
    connect({ connector });
  };

  const switchToMonad = () => {
    setRequestError(undefined);
    switchChain({ chainId: MONAD_MAINNET_ID });
  };

  const clear = () => {
    setRequestError(undefined);
    setTransactionHash(undefined);
  };

  const submit = async (request: CredentialMintRequest) => {
    if (credentialConfiguration !== "ready" || !manufacturerCredentialAddress) {
      setRequestError(
        "Set NEXT_PUBLIC_MANUFACTURER_CREDENTIAL_ADDRESS to a verified ManufacturerCredential deployment and restart the app.",
      );
      return;
    }
    if (!isConnected || !accountAddress) {
      setRequestError("Connect the credential owner wallet before minting.");
      return;
    }
    if (chainId !== MONAD_MAINNET_ID) {
      setRequestError("Switch the connected wallet to Monad Mainnet before minting.");
      return;
    }
    if (!isOwner) {
      setRequestError("Only the credential contract owner can call mint.");
      return;
    }
    if (isPaused) {
      setRequestError("The credential contract is paused and cannot mint.");
      return;
    }

    setRequestError(undefined);
    setTransactionHash(undefined);

    try {
      const hash = await writeContractAsync({
        address: manufacturerCredentialAddress,
        abi: MANUFACTURER_CREDENTIAL_ABI,
        chain: monadMainnet,
        functionName: "mint",
        args: [
          request.manufacturer,
          request.manufacturerName,
          request.nafdacRegistrationNumber,
          request.manufacturingAddress,
        ],
      });
      setTransactionHash(hash);
    } catch (writeFailure) {
      setRequestError(errorMessage(writeFailure));
    }
  };

  return {
    accountAddress,
    canSubmit:
      credentialConfiguration === "ready" &&
      isConnected &&
      chainId === MONAD_MAINNET_ID &&
      isOwner &&
      !isPaused &&
      !isWriting &&
      !receipt.isLoading &&
      !ownerQuery.isLoading &&
      !ownerQuery.isError &&
      !pausedQuery.isLoading &&
      !pausedQuery.isError &&
      !receipt.isSuccess,
    clear,
    connectWallet,
    error,
    hasInjectedConnector: connectors.length > 0,
    isConfirmed: receipt.isSuccess && receipt.data?.status === "success",
    isConfirming: Boolean(transactionHash) && receipt.isLoading,
    isConnected,
    isConnecting,
    isOwner,
    isPaused,
    isSwitching,
    isWriting,
    mintedTokenId,
    needsMonad: isConnected && chainId !== MONAD_MAINNET_ID,
    ownerAddress,
    ownerReadFailed: ownerQuery.isError,
    ownerReadLoading: ownerQuery.isLoading,
    pausedReadFailed: pausedQuery.isError,
    pausedReadLoading: pausedQuery.isLoading,
    receipt: receipt.data,
    refetchContractState: () => {
      void ownerQuery.refetch();
      void pausedQuery.refetch();
    },
    submit,
    switchToMonad,
    transactionHash,
  };
}
