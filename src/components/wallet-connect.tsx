"use client"

import { useState, useEffect } from "react"
import { Wallet, AlertCircle } from 'lucide-react'

// Define window extensions for wallet providers
declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      isCoinbaseWallet?: boolean;
      request: (args: any) => Promise<any>;
      providers?: any[];
    };
    solana?: {
      isPhantom?: boolean;
      isSolflare?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
    };
    starknet?: {
      enable: () => Promise<string[]>;
    };
    freighter?: {
      getPublicKey: () => Promise<string>;
    };
  }
}

// Wallet Provider Type
export interface WalletProvider {
  name: string;
  provider: any;
}

// Wallet Info Type
export interface WalletInfo {
  id: string;
  chain: string;
  address: string;
  provider: WalletProvider;
}

// Chain Type
type ChainType = "ethereum" | "solana" | "polygon" | "stellar";

// Available Wallets Type
interface AvailableWallets {
  ethereum: WalletProvider[];
  solana: WalletProvider[];
  polygon: WalletProvider[];
  stellar: WalletProvider[];
  [key: string]: WalletProvider[]; // Index signature for dynamic access
}

export default function WalletConnect() {
  const [availableWallets, setAvailableWallets] = useState<AvailableWallets>({
    ethereum: [],
    solana: [],
    polygon: [],
    stellar: [],
  })

  const [connectedWallets, setConnectedWallets] = useState<WalletInfo[]>([])

  // Detect available wallets on component mount
  useEffect(() => {
    detectWallets()
  }, [])

  // Detect available wallets
  const detectWallets = () => {
    const detected: AvailableWallets = {
      ethereum: [],
      solana: [],
      polygon: [],
      stellar: [],
    }

    if (typeof window !== "undefined") {
      // Ethereum wallets (MetaMask, Coinbase, etc.)
      if (window.ethereum) {
        // MetaMask
        if (window.ethereum.isMetaMask) {
          detected.ethereum.push({
            name: "MetaMask",
            provider: window.ethereum,
          })
        }

        // Coinbase
        if (window.ethereum.isCoinbaseWallet) {
          detected.ethereum.push({
            name: "Coinbase",
            provider: window.ethereum,
          })
        }
      }

      // Starknet
      if (window.starknet) {
        detected.ethereum.push({
          name: "Starknet",
          provider: window.starknet,
        })
      }

      // Solana wallets
      if (window.solana) {
        if (window.solana.isPhantom) {
          detected.solana.push({
            name: "Phantom",
            provider: window.solana,
          })
        }
        if (window.solana.isSolflare) {
          detected.solana.push({
            name: "Solflare",
            provider: window.solana,
          })
        }
      }

      // Polygon (uses Ethereum providers)
      detected.polygon = [...detected.ethereum]

      // Stellar wallets
      if (window.freighter) {
        detected.stellar.push({
          name: "Freighter",
          provider: window.freighter,
        })
      }
    }

    // Ensure at least one wallet per chain for demo
    Object.keys(detected).forEach((chain) => {
      if (detected[chain].length === 0) {
        detected[chain].push({ 
          name: chain === 'stellar' ? 'Freighter' : 
                 chain === 'solana' ? 'Phantom' : 
                 'MetaMask', 
          provider: null 
        })
      }
    })

    setAvailableWallets(detected)
  }

  // Connect to a wallet
  const connectWallet = async (chain: string, walletInfo: WalletProvider) => {
    try {
      console.log(`Connecting to ${walletInfo.name} on ${chain}`)

      let address = ""
      const provider = walletInfo.provider

      // Connection logic for different chains
      switch(chain) {
        case "ethereum":
          if (walletInfo.name === "MetaMask" && window.ethereum) {
            const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
            address = accounts[0]
          } else if (walletInfo.name === "Starknet" && window.starknet) {
            const accounts = await window.starknet.enable()
            address = accounts[0]
          }
          break

        case "solana":
          if (walletInfo.name === "Phantom" && window.solana) {
            const resp = await window.solana.connect()
            address = resp.publicKey.toString()
          }
          break

        case "stellar":
          if (walletInfo.name === "Freighter" && window.freighter) {
            const publicKey = await window.freighter.getPublicKey()
            address = publicKey
          }
          break
      }

      // Fallback for demo or if connection fails
      if (!address) {
        address = `${chain}-${Math.random().toString(36).substring(2, 10)}...`
      }

      // Generate unique ID for this wallet connection
      const id = `${chain}-${walletInfo.name}-${Date.now()}`

      // Add wallet to connected wallets
      const newWalletInfo: WalletInfo = {
        id,
        chain,
        address,
        provider: {
          name: walletInfo.name,
          provider: walletInfo.provider
        }
      }

      setConnectedWallets(prev => [...prev, newWalletInfo])
    } catch (error) {
      console.error(`Error connecting to ${walletInfo.name}:`, error)
    }
  }

  // Disconnect wallet
  const disconnectWallet = (walletId: string) => {
    setConnectedWallets(prev => prev.filter(wallet => wallet.id !== walletId))
  }

  // Get chain color
  const getChainColor = (chain: string) => {
    const colors: Record<string, string> = {
      ethereum: "bg-blue-500",
      solana: "bg-purple-500",
      polygon: "bg-indigo-500",
      stellar: "bg-emerald-500"
    }
    return colors[chain] || "bg-slate-500"
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-slate-400 mb-4">
          <AlertCircle className="h-4 w-4" />
          <p>Connect wallets from different chains to collect dust balances</p>
        </div>

        <div className="space-y-6">
          {Object.entries(availableWallets).map(([chain, wallets]) => (
            <div key={chain} className="space-y-2">
              <h3 className="text-lg font-medium text-white capitalize">{chain}</h3>

              <div className="space-y-2">
                {wallets.map((wallet, idx) => {
                  const connectedWallet = connectedWallets.find(
                    (w) => w.chain === chain && w.provider.name === wallet.name
                  )

                  return (
                    <div
                      key={`${chain}-${wallet.name}-${idx}`}
                      className="bg-slate-800 border border-slate-700 p-3 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full ${getChainColor(chain)} flex items-center justify-center text-white font-bold text-xs`}
                        >
                          {wallet.name.substring(0, 1)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{wallet.name}</h4>
                          {connectedWallet && (
                            <p className="text-xs text-slate-400 truncate max-w-[150px]">
                              {connectedWallet.address}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {connectedWallet ? (
                          <button
                            className="px-3 py-1 rounded text-sm border border-red-500/50 text-red-400 hover:bg-red-500/10"
                            onClick={() => disconnectWallet(connectedWallet.id)}
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            className="px-3 py-1 rounded text-sm bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            onClick={() => connectWallet(chain, wallet)}
                          >
                            <Wallet className="h-3 w-3" />
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}