"use client"

import { Coins, ArrowRight } from "lucide-react"
import type { DustBalance } from "./dust-aggregator"

interface DustBalancesProps {
  balances: DustBalance[]
  onContinue: () => void
}

export default function DustBalances({ balances, onContinue }: DustBalancesProps) {
  const getTotalValue = () => {
    return balances.reduce((sum, item) => sum + item.value, 0).toFixed(2)
  }

  const getChainColor = (chain: string) => {
    switch (chain) {
      case "ethereum":
        return "bg-blue-500"
      case "solana":
        return "bg-purple-500"
      case "polygon":
        return "bg-indigo-500"
      case "stellar":
        return "bg-emerald-500"
      default:
        return "bg-slate-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">Dust Balances</h3>
        <div className="bg-slate-800 text-emerald-400 border border-emerald-500/50 px-2 py-1 rounded text-sm">
          Total: ${getTotalValue()} USD
        </div>
      </div>

      {balances.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-lg text-center text-slate-400">
          <Coins className="h-8 w-8 mx-auto mb-2 text-slate-500" />
          <p>No dust balances found. Connect more wallets to find dust.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {balances.map((balance, index) => (
            <div key={index} className="bg-slate-800 border border-slate-700 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full ${getChainColor(balance.chain)} flex items-center justify-center text-white font-bold text-xs`}
                  >
                    {balance.token.substring(0, 3)}
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{balance.token}</h4>
                    <p className="text-xs text-slate-400">{balance.chain}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">{balance.amount}</p>
                  <p className="text-xs text-slate-400">${balance.value.toFixed(2)} USD</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={onContinue}
          disabled={balances.length === 0}
          className={`px-4 py-2 rounded flex items-center gap-2 ${
            balances.length === 0
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          Collect Dust <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

