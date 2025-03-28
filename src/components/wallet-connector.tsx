"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WalletIcon } from 'lucide-react'
import TokenBalances from "./token-balances"
import { ethers } from "ethers"
import type { Server } from "stellar-sdk"
import type { Provider } from "starknet"
import type { Connection } from "@solana/web3.js"

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
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => void;
    };
    solflare?: {
      isSolflare?: boolean;
    };
    starknet?: {
      enable: () => Promise<string[]>;
      isPreauthorized?: () => Promise<boolean>;
    };
    freighter?: {
      getPublicKey: () => Promise<string>;
      isConnected: () => Promise<boolean>;
    };
  }
}

// Wallet types
type WalletType = "stellar" | "solana" | "ethereum" | "polygon" | "starknet" | "none"

export default function WalletConnector() {
  const [activeTab, setActiveTab] = useState<WalletType>("stellar")
  const [connected, setConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")
  const [selectedToken, setSelectedToken] = useState("")
  const [tokens, setTokens] = useState<Record<WalletType, string[]>>({
    stellar: [],
    solana: [],
    ethereum: [],
    polygon: [],
    starknet: [],
    none: []
  })

  // RPC URLs from environment variables
  const RPC_URLS = {
    stellar: process.env.NEXT_PUBLIC_STELLAR_RPC_URL || '',
    solana: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || '',
    ethereum: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || '',
    polygon: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || '',
    starknet: process.env.NEXT_PUBLIC_STARKNET_RPC_URL || '',
  }

  // Check if wallets are available in the browser
  const [walletsAvailable, setWalletsAvailable] = useState<Record<string, boolean>>({
    stellar: false,
    solana: false,
    ethereum: false,
    polygon: false,
    starknet: false,
  })

  // Fetch tokens for each blockchain
  const fetchTokens = async () => {
    try {
      if (typeof window === "undefined") return;
      
      // Initialize token arrays
      const tokenData: Record<WalletType, string[]> = {
        stellar: [],
        solana: [],
        ethereum: [],
        polygon: [],
        starknet: [],
        none: []
      };

      // Stellar tokens
      try {
        const { Server } = await import("stellar-sdk");
        const stellarServer = new Server(RPC_URLS.stellar);
        tokenData.stellar = await fetchStellarTokens(stellarServer);
      } catch (error) {
        console.error("Error fetching Stellar tokens:", error);
        tokenData.stellar = ["XLM", "USDC", "BTC"]; // Fallback
      }

      // Ethereum tokens
      try {
        const ethProvider = new ethers.providers.JsonRpcProvider(RPC_URLS.ethereum);
        tokenData.ethereum = await fetchEthereumTokens(ethProvider);
      } catch (error) {
        console.error("Error fetching Ethereum tokens:", error);
        tokenData.ethereum = ["ETH", "USDT", "USDC"]; // Fallback
      }

      // Polygon tokens
      try {
        const polygonProvider = new ethers.providers.JsonRpcProvider(RPC_URLS.polygon);
        tokenData.polygon = await fetchPolygonTokens(polygonProvider);
      } catch (error) {
        console.error("Error fetching Polygon tokens:", error);
        tokenData.polygon = ["MATIC", "USDC", "WETH"]; // Fallback
      }

      // Solana tokens
      try {
        const { Connection } = await import("@solana/web3.js");
        const solanaConnection = new Connection(RPC_URLS.solana);
        tokenData.solana = await fetchSolanaTokens(solanaConnection);
      } catch (error) {
        console.error("Error fetching Solana tokens:", error);
        tokenData.solana = ["SOL", "USDC", "RAY"]; // Fallback
      }

      // Starknet tokens
      try {
        const { Provider } = await import("starknet");
        const starknetProvider = new Provider({ rpc: { nodeUrl: RPC_URLS.starknet } });
        tokenData.starknet = await fetchStarknetTokens(starknetProvider);
      } catch (error) {
        console.error("Error fetching Starknet tokens:", error);
        tokenData.starknet = ["ETH", "STRK", "USDC"]; // Fallback
      }

      setTokens(tokenData);
    } catch (error) {
      console.error("Error fetching tokens:", error);
    }
  }

  // Placeholder functions for token fetching (you'll need to implement these)
  const fetchStellarTokens = async (server: Server): Promise<string[]> => {
    // Implement Stellar token fetching logic
    return ["XLM", "USDC", "BTC"];
  }

  const fetchEthereumTokens = async (provider: ethers.providers.JsonRpcProvider): Promise<string[]> => {
    // Implement Ethereum token fetching logic
    return ["ETH", "USDT", "USDC"];
  }

  const fetchPolygonTokens = async (provider: ethers.providers.JsonRpcProvider): Promise<string[]> => {
    // Implement Polygon token fetching logic
    return ["MATIC", "USDC", "WETH"];
  }

  const fetchSolanaTokens = async (connection: Connection): Promise<string[]> => {
    // Implement Solana token fetching logic
    return ["SOL", "USDC", "RAY"];
  }

  const fetchStarknetTokens = async (provider: Provider): Promise<string[]> => {
    // Implement Starknet token fetching logic
    return ["ETH", "STRK", "USDC"];
  }

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined") return;
    
    // Fetch tokens when component mounts
    fetchTokens();

    // Check for wallet availability
    const checkWalletAvailability = () => {
      const available = {
        stellar: false,
        solana: false,
        ethereum: false,
        polygon: false,
        starknet: false,
      };

      if (typeof window !== "undefined") {
        // Check Stellar wallet (Freighter)
        available.stellar = !!window.freighter;
        
        // Check Solana wallet (Phantom)
        available.solana = !!window.solana && !!window.solana.isPhantom;
        
        // Check Ethereum wallet (MetaMask, etc.)
        available.ethereum = !!window.ethereum;
        
        // Polygon uses Ethereum wallets
        available.polygon = !!window.ethereum;
        
        // Check Starknet wallet
        available.starknet = !!window.starknet;
      }

      setWalletsAvailable(available);
    };

    checkWalletAvailability();
  }, []);

  // Connect to selected wallet (simplified example)
  const connectWallet = async () => {
    try {
      if (typeof window === "undefined") return;
      
      switch(activeTab) {
        case "stellar":
          await connectStellarWallet();
          break;
        case "solana":
          await connectSolanaWallet();
          break;
        case "ethereum":
          await connectEthereumWallet();
          break;
        case "polygon":
          await connectPolygonWallet();
          break;
        case "starknet":
          await connectStarknetWallet();
          break;
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  }

  // Individual wallet connection methods (placeholder implementations)
  const connectStellarWallet = async () => {
    // Implement Stellar wallet connection
    if (typeof window !== "undefined" && window.freighter) {
      try {
        const publicKey = await window.freighter.getPublicKey();
        setWalletAddress(publicKey);
        setConnected(true);
      } catch (error) {
        console.error("Error connecting to Freighter:", error);
      }
    }
  }

  const connectSolanaWallet = async () => {
    if (typeof window !== "undefined" && window.solana && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setConnected(true);
      } catch (error) {
        console.error("Error connecting to Phantom:", error);
      }
    }
  }

  const connectEthereumWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setConnected(true);
      } catch (error) {
        console.error("Error connecting to Ethereum wallet:", error);
      }
    }
  }

  const connectPolygonWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setWalletAddress(accounts[0]);
        setConnected(true);
      } catch (error) {
        console.error("Error connecting to Polygon wallet:", error);
      }
    }
  }

  const connectStarknetWallet = async () => {
    if (typeof window !== "undefined" && window.starknet) {
      try {
        const result = await window.starknet.enable();
        setWalletAddress(result[0]);
        setConnected(true);
      } catch (error) {
        console.error("Error connecting to Starknet wallet:", error);
      }
    }
  }

  // Disconnect wallet
  const disconnectWallet = () => {
    if (typeof window === "undefined") return;
    
    // Add specific disconnect logic for each wallet type
    try {
      switch(activeTab) {
        case "solana":
          if (window.solana?.disconnect) {
            window.solana.disconnect();
          }
          break;
        case "ethereum":
        case "polygon":
          // Ethereum/Polygon wallets typically don't have a disconnect method
          break;
        case "starknet":
          // Starknet might not have a standard disconnect method
          break;
      }
      
      setConnected(false);
      setWalletAddress("");
      setSelectedToken("");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <WalletIcon className="h-6 w-6" />
          Wallet Connection
        </CardTitle>
        <CardDescription>Connect your wallet to view and manage your tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="stellar" 
          className="w-full" 
          onValueChange={(value) => setActiveTab(value as WalletType)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stellar">Stellar</TabsTrigger>
            <TabsTrigger value="solana">Solana</TabsTrigger>
            <TabsTrigger value="starknet">Starknet</TabsTrigger>
          </TabsList>
          
          {(["stellar", "solana", "starknet"] as WalletType[]).map((blockchain) => (
            <TabsContent key={blockchain} value={blockchain}>
              {!walletsAvailable[blockchain] ? (
                <div className="p-4 text-center">
                  <p className="mb-4">{`${blockchain} wallet not detected`}</p>
                  <a
                    href={`https://${blockchain}.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {`Install ${blockchain} Wallet`}
                  </a>
                </div>
              ) : connected && activeTab === blockchain ? (
                <div className="space-y-4 mt-4">
                  <div className="p-4 border rounded-md">
                    <p className="text-sm font-medium mb-1">Connected Address:</p>
                    <p className="text-xs break-all">{walletAddress}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Token</label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens[blockchain].map((token) => (
                          <SelectItem key={token} value={token}>
                            {token}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedToken && (
                    <TokenBalances 
                      blockchain={blockchain} 
                      token={selectedToken} 
                      address={walletAddress} 
                    />
                  )}
                </div>
              ) : null}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter>
        {!connected ? (
          <Button
            className="w-full"
            onClick={connectWallet}
            disabled={!walletsAvailable[activeTab]}
          >
            Connect {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Wallet
          </Button>
        ) : (
          <Button variant="destructive" className="w-full" onClick={disconnectWallet}>
            Disconnect Wallet
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}