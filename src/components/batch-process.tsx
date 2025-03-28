"use client"

import { useState } from "react"
import { ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react"
import type { DustBalance } from "./dust-aggregator"
import type { DustAggregatorClient } from "@/src/lib/soroban-client"

interface BatchProcessProps {
  dustBalances: DustBalance[]
  onProcess: () => void
  client: DustAggregatorClient
  networkConfig: {
    contractAddress: string
    networkPassphrase: string
    rpcUrl: string
    userSecret: string
    userAddress: string
  }
}

export default function BatchProcess({ dustBalances, onProcess, client, networkConfig }: BatchProcessProps) {
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const FIXED_GAS_FEE = 22 // From smart contract
  const MIN_BATCH_AMOUNT = 50 // From smart contract

  const getTotalValue = () => {
    return dustBalances.reduce((sum, item) => sum + Number(item.value), 0).toFixed(2)
  }

  const calculateGasSavings = () => {
    // Fixed gas fee divided by number of participants
    const participatingUsers = dustBalances.length
    const sharedFee = participatingUsers > 1 ? FIXED_GAS_FEE / participatingUsers : FIXED_GAS_FEE / 2

    return sharedFee.toFixed(3)
  }

  const startProcessing = async () => {
    setProcessing(true)
    setProgress(0)
    setErrorMessage(null)

    try {
      // First deposit all dust balances
      for (let i = 0; i < dustBalances.length; i++) {
        const balance = dustBalances[i]
        try {
          // Make sure we're passing all required parameters to autoDeposit
          await client.autoDeposit({
            userAddress: balance.userAddress,
            contractAddress: networkConfig.contractAddress,
            networkPassphrase: networkConfig.networkPassphrase,
            rpcUrl: networkConfig.rpcUrl,
            userSecret: networkConfig.userSecret,
            chain: balance.chain,
            asset: balance.asset,
            amount: BigInt(balance.value),
          })

          // Update progress to 50% after deposits (half the process)
          setProgress(Math.min(Math.floor(((i + 1) / dustBalances.length) * 50), 50))
        } catch (error) {
          console.error(`Failed to process balance for ${balance.userAddress}`, error)
          // Continue with other balances even if one fails
        }
      }

      // Then execute the batch process
      await client.batchProcess({
        userAddress: networkConfig.userAddress,
        contractAddress: networkConfig.contractAddress,
        networkPassphrase: networkConfig.networkPassphrase,
        rpcUrl: networkConfig.rpcUrl,
        userSecret: networkConfig.userSecret,
      })

      // Set progress to 100% after batch processing
      setProgress(100)
      setProcessing(false)
      setCompleted(true)
    } catch (error) {
      console.error("Batch processing error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Unknown processing error")
      setProcessing(false)
    }
  }

  const handleComplete = () => {
    onProcess()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Batch Processing</h3>
        <div className="bg-slate-800 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded text-sm">
          {dustBalances.length} dust balances
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-slate-900 p-3 rounded-md">
            <p className="text-xs text-slate-400 mb-1">Total Value</p>
            <p className="text-xl font-bold text-white">${getTotalValue()} USD</p>
          </div>
          <div className="bg-slate-900 p-3 rounded-md">
            <p className="text-xs text-slate-400 mb-1">Gas Fee Share</p>
            <p className="text-xl font-bold text-emerald-400">{calculateGasSavings()} ETH</p>
          </div>
        </div>

        {processing && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Processing batch</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        {errorMessage && <div className="bg-red-500/10 text-red-400 p-3 rounded-md mb-4">{errorMessage}</div>}

        <div className="text-sm text-slate-300 mb-4">
          <p>
            Batch processing combines all your dust transactions into a single operation, significantly reducing gas
            fees.
          </p>
        </div>

        {completed ? (
          <div className="flex items-center justify-center p-3 bg-emerald-500/10 rounded-md text-emerald-400 mb-4">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span>Batch processing completed successfully!</span>
          </div>
        ) : null}

        {!processing && !completed ? (
          <button
            onClick={startProcessing}
            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            Process Batch <RefreshCw className="h-4 w-4" />
          </button>
        ) : completed ? (
          <button
            onClick={handleComplete}
            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            Continue to Transfer <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            disabled
            className="w-full py-2 rounded bg-slate-700 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Processing... <RefreshCw className="h-4 w-4 animate-spin" />
          </button>
        )}
      </div>
    </div>
  )
}

