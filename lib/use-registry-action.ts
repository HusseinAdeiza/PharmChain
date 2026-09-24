"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  DRUG_REGISTRY_ABI,
  registryAddress,
} from "@/lib/contracts";
import { errorMessage } from "@/lib/errors";
import { MONAD_MAINNET_ID, monadMainnet } from "@/lib/monad";

export type RegistryWriteRequest =
  | {
      functionName: "attestBatch";
      args: [
        manufacturerId: bigint,
        nafdacNumber: string,
        batchNumber: string,
        drugName: string,
        expiryDate: bigint,
        evidenceHash: `0x${string}`,
      ];
    }
  | {
      functionName: "flagRecall";
      args: [batchId: bigint, reason: string];
    }
  | {
      functionName: "flagCounterfeit";
      args: [nafdacNumber: string, details: string];
    }
  | {
      functionName: "validateCounterfeit";
      args: [reportId: bigint, isCounterfeit: boolean];
    };

export function useRegistryAction() {
  const { address: accountAddress, chainId, isConnected } = useAccount();
  const { connectors, connect, error: connectHookError, isPending: isConnecting } =
    useConnect();
  const { switchChain, error: switchHookError, isPending: isSwitching } =
    useSwitchChain();
  const {
    writeContractAsync,
    error: writeHookError,
    isPending: isWriting,
  } = useWriteContract();
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const [requestError, setRequestError] = useState<string>();
  const receipt = useWaitForTransactionReceipt({
    chainId: MONAD_MAINNET_ID,
    hash: transactionHash,
    query: {
      enabled: Boolean(transactionHash),
    },
  });
  const error = requestError ?? writeHookError?.message ?? receipt.error?.message ??
    (connectHookError ? errorMessage(connectHookError) : undefined) ??
    (switchHookError ? errorMessage(switchHookError) : undefined);

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

  const submit = async (request: RegistryWriteRequest) => {
    if (!registryAddress) {
      setRequestError(
        "The DrugRegistry address is not configured. Set NEXT_PUBLIC_DRUG_REGISTRY_ADDRESS and restart the app.",
      );
      return;
    }
    if (!isConnected || !accountAddress) {
      setRequestError("Connect an injected wallet before submitting a transaction.");
      return;
    }
    if (chainId !== MONAD_MAINNET_ID) {
      setRequestError("Switch the connected wallet to Monad Mainnet before submitting.");
      return;
    }

    setRequestError(undefined);
    setTransactionHash(undefined);

    try {
      let hash: `0x${string}`;
      if (request.functionName === "attestBatch") {
        hash = await writeContractAsync({
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          chain: monadMainnet,
          functionName: request.functionName,
          args: request.args,
        });
      } else if (request.functionName === "flagRecall") {
        hash = await writeContractAsync({
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          chain: monadMainnet,
          functionName: request.functionName,
          args: request.args,
        });
      } else if (request.functionName === "flagCounterfeit") {
        hash = await writeContractAsync({
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          chain: monadMainnet,
          functionName: request.functionName,
          args: request.args,
        });
      } else {
        hash = await writeContractAsync({
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          chain: monadMainnet,
          functionName: request.functionName,
          args: request.args,
        });
      }
      setTransactionHash(hash);
    } catch (writeError) {
      setRequestError(errorMessage(writeError));
    }
  };

  return {
    accountAddress,
    chainId,
    clear,
    connectWallet,
    error: error ? errorMessage(error) : undefined,
    hasInjectedConnector: connectors.length > 0,
    isConfirmed: receipt.isSuccess && receipt.data?.status === "success",
    isConfirming: Boolean(transactionHash) && receipt.isLoading,
    isConnected,
    isConnecting,
    isSwitching,
    isWriting,
    needsMonad: isConnected && chainId !== MONAD_MAINNET_ID,
    receipt: receipt.data,
    submit,
    switchToMonad,
    transactionHash,
  };
}
