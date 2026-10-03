"use client";

import { useState } from "react";
import {
  useAccount,
  usePublicClient,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import {
  DRUG_REGISTRY_ABI,
  parseCounterfeitReport,
  registryAddress,
  type CounterfeitReport,
} from "@/lib/contracts";
import { errorMessage } from "@/lib/errors";
import { MONAD_MAINNET_ID, monadMainnet } from "@/lib/monad";
import { useWalletSelection } from "@/components/wallet-selection";

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
  const publicClient = usePublicClient({ chainId: MONAD_MAINNET_ID });
  const { openPicker, hasConnector, isConnecting } = useWalletSelection();
  const { switchChain, error: switchHookError, isPending: isSwitching } =
    useSwitchChain();
  const {
    writeContractAsync,
    error: writeHookError,
    isPending: isWriting,
  } = useWriteContract();
  const [transactionHash, setTransactionHash] = useState<`0x${string}`>();
  const [requestError, setRequestError] = useState<string>();
  const [predictedRecordId, setPredictedRecordId] = useState<string>();
  const [storedReport, setStoredReport] = useState<CounterfeitReport>();
  const receipt = useWaitForTransactionReceipt({
    chainId: MONAD_MAINNET_ID,
    hash: transactionHash,
    query: {
      enabled: Boolean(transactionHash),
    },
  });
  const error = requestError ?? writeHookError?.message ?? receipt.error?.message ??
    (switchHookError ? errorMessage(switchHookError) : undefined);
  const isConfirmed = receipt.isSuccess && receipt.data?.status === "success";

  const connectWallet = openPicker;

  const switchToMonad = () => {
    setRequestError(undefined);
    switchChain({ chainId: MONAD_MAINNET_ID });
  };

  const clear = () => {
    setRequestError(undefined);
    setTransactionHash(undefined);
    setPredictedRecordId(undefined);
    setStoredReport(undefined);
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
    setPredictedRecordId(undefined);
    setStoredReport(undefined);

    // Simulate before asking the user to sign. This surfaces a revert in the UI
    // instead of wasting a wallet confirmation, and for writes that return an
    // identifier it tells us which record the transaction will create.
    if (
      publicClient &&
      (request.functionName === "flagCounterfeit" || request.functionName === "attestBatch")
    ) {
      try {
        const simulation = await publicClient.simulateContract({
          address: registryAddress,
          abi: DRUG_REGISTRY_ABI,
          functionName: request.functionName,
          args: request.args,
        });
        const result: unknown = simulation.result;
        if (typeof result === "bigint" || typeof result === "string") {
          setPredictedRecordId(result.toString());
        }
      } catch (simulationError) {
        setRequestError(`This transaction would revert: ${errorMessage(simulationError)}`);
        return;
      }
    }

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

  // Read the newly written report back from the registry instead of trusting the
  // wallet confirmation. The confirmation screen only claims what the chain
  // actually returns.
  const confirmStoredReport = async (reportId: string) => {
    if (!publicClient || !registryAddress) return;
    try {
      const value = await publicClient.readContract({
        address: registryAddress,
        abi: DRUG_REGISTRY_ABI,
        functionName: "getCounterfeitReport",
        args: [BigInt(reportId)],
      });
      setStoredReport(parseCounterfeitReport(value));
    } catch {
      setStoredReport(undefined);
    }
  };

  return {
    accountAddress,
    chainId,
    clear,
    confirmStoredReport,
    connectWallet,
    error: error ? errorMessage(error) : undefined,
    hasInjectedConnector: hasConnector,
    isConfirmed,
    isConfirming: Boolean(transactionHash) && receipt.isLoading,
    isConnected,
    isConnecting,
    isSwitching,
    isWriting,
    needsMonad: isConnected && chainId !== MONAD_MAINNET_ID,
    predictedRecordId,
    receipt: receipt.data,
    storedReport,
    submit,
    switchToMonad,
    transactionHash,
  };
}
