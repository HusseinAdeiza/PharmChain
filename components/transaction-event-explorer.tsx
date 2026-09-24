"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  FileCheck2,
  History,
  LoaderCircle,
  RefreshCw,
  SearchX,
  ShieldAlert,
} from "lucide-react";
import { decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { Button, cn } from "@/components/ui/button";
import {
  DRUG_REGISTRY_ABI,
  isRegistryConfigured,
  registryAddress,
  type Batch,
  type CounterfeitReport,
} from "@/lib/contracts";
import { errorMessage } from "@/lib/errors";
import { shortAddress } from "@/lib/format";
import { MONAD_MAINNET_ID, monadTransactionUrl } from "@/lib/monad";

const defaultLookbackBlocks = 50_000n;
const deploymentBlockValue = process.env.NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK?.trim();

type ExplorerEventName =
  | "BatchAttested"
  | "BatchRecalled"
  | "CounterfeitFlagged"
  | "CounterfeitValidated";

type ExplorerEvent = {
  name: ExplorerEventName;
  transactionHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
  batchId?: bigint;
  reportId?: bigint;
  nafdacNumber?: string;
  batchNumber?: string;
  drugName?: string;
  reason?: string;
  details?: string;
  isCounterfeit?: boolean;
  actor?: `0x${string}`;
};

type EventScanRange = {
  fromBlock: bigint;
  toBlock: bigint;
  source: "deployment" | "lookback";
};

function eventScanRange(latestBlock: bigint): EventScanRange {
  if (latestBlock < 1n) {
    throw new Error("Monad returned an invalid latest block number.");
  }
  const earliestLookbackBlock =
    latestBlock >= defaultLookbackBlocks
      ? latestBlock - defaultLookbackBlocks + 1n
      : 1n;
  if (deploymentBlockValue) {
    if (!/^\d+$/.test(deploymentBlockValue)) {
      throw new Error(
        "NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK must be a positive whole number.",
      );
    }
    const deploymentBlock = BigInt(deploymentBlockValue);
    if (deploymentBlock < 1n || deploymentBlock > latestBlock) {
      throw new Error(
        "NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK must be between block 1 and the current Monad block.",
      );
    }
    const fromBlock = deploymentBlock > earliestLookbackBlock ? deploymentBlock : earliestLookbackBlock;
    return {
      fromBlock,
      toBlock: latestBlock,
      source: fromBlock === deploymentBlock ? "deployment" : "lookback",
    };
  }
  return {
    fromBlock: earliestLookbackBlock,
    toBlock: latestBlock,
    source: "lookback",
  };
}

function ExplorerEventIcon({ name }: { name: ExplorerEventName }) {
  if (name === "BatchAttested") {
    return <FileCheck2 className="h-4 w-4" />;
  }
  if (name === "BatchRecalled") {
    return <ShieldAlert className="h-4 w-4" />;
  }
  return <BadgeCheck className="h-4 w-4" />;
}

function ExplorerEventCard({ event }: { event: ExplorerEvent }) {
  const eventLabel =
    event.name === "BatchAttested"
      ? "Batch attested"
      : event.name === "BatchRecalled"
        ? "Batch recalled"
        : event.name === "CounterfeitFlagged"
          ? "Counterfeit report filed"
          : "Counterfeit report validated";
  const id =
    event.batchId !== undefined
      ? `Batch #${event.batchId.toString()}`
      : event.reportId !== undefined
        ? `Report #${event.reportId.toString()}`
        : "Registry event";
  const detail =
    event.name === "BatchAttested"
      ? [event.nafdacNumber, event.batchNumber, event.drugName].filter(Boolean).join(" · ")
      : event.name === "BatchRecalled"
        ? event.reason || "No reason returned"
        : event.name === "CounterfeitFlagged"
          ? [event.nafdacNumber, event.details].filter(Boolean).join(" · ")
          : event.isCounterfeit
            ? "Validated as counterfeit"
            : "Validated as not counterfeit";
  const transactionUrl = monadTransactionUrl(event.transactionHash);

  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mint text-ink">
            <ExplorerEventIcon name={event.name} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-teal">
              {eventLabel}
            </p>
            <h4 className="mt-1 font-display text-base font-extrabold tracking-[-0.02em]">
              {id}
            </h4>
          </div>
        </div>
        <div className="shrink-0 text-left text-xs text-ink/45 sm:text-right">
          <p>Block {event.blockNumber.toString()}</p>
          {event.actor ? <p className="mt-1">By {shortAddress(event.actor)}</p> : null}
        </div>
      </div>
      <p className="mt-4 break-words text-sm leading-6 text-ink/60">{detail}</p>
      {transactionUrl ? (
        <a
          href={transactionUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex items-start gap-2 rounded-xl bg-ink/[0.035] p-3 text-xs text-teal transition hover:bg-teal/5"
        >
          <span className="min-w-0 break-all font-mono leading-5">{event.transactionHash}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        </a>
      ) : null}
    </article>
  );
}

export function TransactionEventExplorer({
  nafdacNumber,
  batches,
  reports,
  refreshVersion,
}: {
  nafdacNumber: string;
  batches: Batch[];
  reports: CounterfeitReport[];
  refreshVersion: number;
}) {
  const publicClient = usePublicClient({ chainId: MONAD_MAINNET_ID });
  const eventQuery = useQuery({
    queryKey: [
      "drug-registry-transaction-events",
      registryAddress,
      nafdacNumber,
      refreshVersion,
    ],
    enabled: isRegistryConfigured && Boolean(publicClient) && Boolean(registryAddress),
    queryFn: async () => {
      const client = publicClient;
      const address = registryAddress;
      if (!client || !address) {
        throw new Error("Monad public client or registry address is unavailable.");
      }
      const latestBlock = await client.getBlockNumber();
      const range = eventScanRange(latestBlock);
      const logs = await client.getLogs({
        address,
        fromBlock: range.fromBlock,
        toBlock: range.toBlock,
      });
      const batchIds = new Set(batches.map((batch) => batch.batchId.toString()));
      const reportIds = new Set(reports.map((report) => report.reportId.toString()));
      const events: ExplorerEvent[] = [];

      for (const log of logs) {
        let decoded;
        try {
          decoded = decodeEventLog({
            abi: DRUG_REGISTRY_ABI,
            data: log.data,
            topics: log.topics,
            strict: true,
          });
        } catch {
          continue;
        }
        if (decoded.eventName === "BatchAttested") {
          if (
            decoded.args.nafdacNumber === nafdacNumber &&
            batchIds.has(decoded.args.batchId.toString())
          ) {
            events.push({
              name: decoded.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              batchId: decoded.args.batchId,
              nafdacNumber: decoded.args.nafdacNumber,
              batchNumber: decoded.args.batchNumber,
              drugName: decoded.args.drugName,
              actor: decoded.args.attestor,
            });
          }
          continue;
        }
        if (decoded.eventName === "BatchRecalled") {
          if (batchIds.has(decoded.args.batchId.toString())) {
            events.push({
              name: decoded.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              batchId: decoded.args.batchId,
              reason: decoded.args.reason,
              actor: decoded.args.caller,
            });
          }
          continue;
        }
        if (decoded.eventName === "CounterfeitFlagged") {
          if (
            decoded.args.nafdacNumber === nafdacNumber &&
            reportIds.has(decoded.args.reportId.toString())
          ) {
            events.push({
              name: decoded.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              reportId: decoded.args.reportId,
              nafdacNumber: decoded.args.nafdacNumber,
              details: decoded.args.details,
              actor: decoded.args.reporter,
            });
          }
          continue;
        }
        if (decoded.eventName === "CounterfeitValidated") {
          if (reportIds.has(decoded.args.reportId.toString())) {
            events.push({
              name: decoded.eventName,
              transactionHash: log.transactionHash,
              blockNumber: log.blockNumber,
              logIndex: log.logIndex,
              reportId: decoded.args.reportId,
              isCounterfeit: decoded.args.isCounterfeit,
              actor: decoded.args.validator,
            });
          }
        }
      }

      events.sort((left, right) => {
        if (left.blockNumber === right.blockNumber) {
          return right.logIndex - left.logIndex;
        }
        return left.blockNumber > right.blockNumber ? -1 : 1;
      });
      return { events, range };
    },
    staleTime: 30_000,
  });

  return (
    <section className="rounded-3xl border border-ink/8 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-teal">
            <History className="h-4 w-4" />
            Transaction event explorer
          </p>
          <h2 className="mt-2 font-display text-2xl font-black tracking-[-0.04em]">
            Matching registry events
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/55">
            Event logs are independent public-RPC index data. A failure here does not
            invalidate the passport records already returned by the contract.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void eventQuery.refetch()}
          disabled={eventQuery.isFetching}
        >
          <RefreshCw className={cn("h-4 w-4", eventQuery.isFetching && "animate-spin")} />
          Refresh events
        </Button>
      </div>

      {eventQuery.isPending ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-ink/8 bg-paper p-4 text-sm text-ink/55">
          <LoaderCircle className="h-4 w-4 animate-spin text-teal" />
          Querying the bounded Monad event window…
        </div>
      ) : null}

      {eventQuery.isError ? (
        <div className="mt-5 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 text-amber-950" role="status">
          <div className="flex gap-3">
            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-bold">Explorer index data is unavailable</p>
              <p className="mt-1 text-sm leading-6 text-amber-900/70">
                The public RPC could not return the bounded event logs. The passport,
                batch, and report records remain available; no transaction hash is shown
                unless it was returned by Monad.
              </p>
              <p className="mt-2 break-words text-xs text-amber-900/55">
                {errorMessage(eventQuery.error)}
              </p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3 border-amber-300 bg-white"
                onClick={() => void eventQuery.refetch()}
              >
                <RefreshCw className="h-4 w-4" />
                Retry event query
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {eventQuery.isSuccess ? (
        <>
          <div className="mt-5 rounded-2xl bg-ink/[0.035] px-4 py-3 text-xs leading-5 text-ink/50">
            Queried blocks {eventQuery.data.range.fromBlock.toString()} through{" "}
            {eventQuery.data.range.toBlock.toString()} on Monad Mainnet.{" "}
            {eventQuery.data.range.source === "deployment"
              ? "The lower bound uses NEXT_PUBLIC_DRUG_REGISTRY_DEPLOYMENT_BLOCK."
              : "The lower bound uses the latest 50,000-block lookback; older events are outside this query."}
          </div>
          {eventQuery.data.events.length ? (
            <div className="mt-4 space-y-3">
              {eventQuery.data.events.map((event) => (
                <ExplorerEventCard
                  key={`${event.transactionHash}-${event.logIndex}`}
                  event={event}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-ink/15 bg-paper/60 p-6 text-center">
              <SearchX className="mx-auto h-6 w-6 text-ink/30" />
              <p className="mt-3 text-sm font-bold text-ink">No matching events in this window</p>
              <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-ink/45">
                This does not prove that no older event exists. A verified deployment block
                can be supplied to extend the bounded query.
              </p>
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
