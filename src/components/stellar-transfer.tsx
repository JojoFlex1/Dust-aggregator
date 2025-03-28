"use client"

import { useState } from "react"
import { ArrowUpRight, RefreshCw, CheckCircle2 } from "lucide-react"

interface StellarTransferProps {
  batchedAmount: number
  status: string
  onTransfer: (targetAsset: string) => void
}

export default function StellarTransfer({ batchedAmount, status, onTransfer }: StellarTransferProps) {
  const [targetAsset, setTargetAsset] = useState("USDC")

  const getProgress = () => {
    switch (status) {
      case "pending":
        return 0
      case "processing":
        return 60
      case "completed":
        return 100
      default:
        return 0
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Transfer to Stellar</h3>
      </div>

      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <p className="text-sm text-slate-400">Amount to transfer</p>
            <p className="text-sm font-medium text-white">${batchedAmount} USD</p>
          </div>

          <div className="flex justify-between mb-4">
            <p className="text-sm text-slate-400">Target network</p>
            <p className="text-sm font-medium text-white">Stellar (via Soroban)</p>
          </div>

          <div className="mb-4">
            <label className="text-sm text-slate-400 block mb-2">Target asset</label>
            <select
              value={targetAsset}
              onChange={(e) => setTargetAsset(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            >
              <option value="USDC">USDC</option>
              <option value="XLM">XLM</option>
              <option value="yUSDC">yUSDC (Yield-bearing)</option>
            </select>
          </div>
        </div>

        {status === "processing" && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Transferring to Stellar</span>
              <span>{getProgress()}%</span>
            </div>
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all" style={{ width: `${getProgress()}%` }}></div>
            </div>
          </div>
        )}

        {status === "completed" && (
          <div className="flex items-center justify-center p-3 bg-emerald-500/10 rounded-md text-emerald-400 mb-4">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            <span>Transfer completed! Assets available on Stellar.</span>
          </div>
        )}

        {status === "pending" ? (
          <button
            onClick={() => onTransfer(targetAsset)}
            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
          >
            Transfer to Stellar <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        ) : status === "processing" ? (
          <button
            disabled
            className="w-full py-2 rounded bg-slate-700 text-slate-400 flex items-center justify-center gap-2 cursor-not-allowed"
          >
            Processing Transfer <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
          </button>
        ) : (
          <button
            className="w-full py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
            onClick={() => window.open("https://stellar.expert", "_blank")}
          >
            View on Stellar Explorer <ArrowUpRight className="ml-2 h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

