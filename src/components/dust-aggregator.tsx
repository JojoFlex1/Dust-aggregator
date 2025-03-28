"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Wallet, Coins, ArrowUpRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { DustAggregatorClient } from "@/src/lib/soroban-client";
import { ethers } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";
import { Server } from "stellar-sdk";

// Types
export type WalletInfo = {
  id: string;
  chain: string;
  address: string;
  provider: any;
};

export type DustBalance = {
  walletId: string;
  chain: string;
  token: string;
  asset?: string;
  userAddress?: string;
  amount: string;
  value: number;
};

export default function DustAggregator() {
  const [activeStep, setActiveStep] = useState<string>("connect");
  const [connectedWallets, setConnectedWallets] = useState<WalletInfo[]>([]);
  const [dustBalances, setDustBalances] = useState<DustBalance[]>([]);
  const [batchedDust, setBatchedDust] = useState<{
    totalValue: number;
    status: string;
  }>({
    totalValue: 0,
    status: "pending",
  });
  const [transferStatus, setTransferStatus] = useState<string>("pending");
  const [targetAsset, setTargetAsset] = useState("USDC");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Detect available wallets
  const [availableWallets, setAvailableWallets] = useState<{
    ethereum: any[];
    solana: any[];
    polygon: any[];
    stellar: any[];
  }>({
    ethereum: [],
    solana: [],
    polygon: [],
    stellar: [],
  });

  // Environment Variables
  const stellarRpcUrl = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || "";
  const stellarNetworkPassphrase =
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE || "";
  const sorobanContractAddress =
    process.env.NEXT_PUBLIC_SOROBAN_CONTRACT_ADDRESS || "";
  const solanaRpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "";
  const ethereumRpcUrl = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || "";
  const polygonRpcUrl = process.env.NEXT_PUBLIC_POLYGON_RPC_URL || "";
  const starknetRpcUrl = process.env.NEXT_PUBLIC_STARKNET_RPC_URL || "";
  const userSecret = process.env.NEXT_PUBLIC_USER_SECRET || "";

  // Detect available wallets on component mount
  useEffect(() => {
    detectWallets();
  }, []);

  // Detect available wallets
  const detectWallets = () => {
    const detected = {
      ethereum: [],
      solana: [],
      polygon: [],
      stellar: [],
    };

    // Detect Ethereum wallets (MetaMask, Coinbase, etc.)
    if (typeof window !== "undefined") {
      // Check for MetaMask
      if (window.ethereum) {
        detected.ethereum.push({
          name: "MetaMask",
          provider: window.ethereum,
        });
      }

      // Check for multiple Ethereum providers
      if (window.ethereum?.providers) {
        window.ethereum.providers.forEach((provider: any) => {
          if (provider.isMetaMask) {
            detected.ethereum.push({
              name: "MetaMask",
              provider,
            });
          } else if (provider.isCoinbaseWallet) {
            detected.ethereum.push({
              name: "Coinbase",
              provider,
            });
          }
        });
      }

      // Check for Starknet
      if (typeof window !== "undefined" && "starknet" in window) {
        detected.ethereum.push({
          name: "Starknet",
          provider: (window as any).starknet,
        });
      }

      // Check for Solana wallets (Phantom, Solflare, etc.)
      if (typeof window !== "undefined" && (window as any).solana) {
        if ((window as any).solana.isPhantom) {
          detected.solana.push({
            name: "Phantom",
            provider: (window as any).solana,
          });
        }
      }

      // Check for Solflare
      if (typeof window !== "undefined" && (window as any).solflare) {
        detected.solana.push({
          name: "Solflare",
          provider: (window as any).solflare,
        });
      }

      // For Polygon, we can use the same Ethereum providers
      detected.polygon = [...detected.ethereum];

      // For Stellar, check for Freighter, Albedo, etc.
      if (typeof window !== "undefined" && (window as any).freighter) {
        detected.stellar.push({
          name: "Freighter",
          provider: (window as any).freighter,
        });
      }
    }

    setAvailableWallets(detected);
  };

  // Connect to a wallet
  const connectWallet = async (chain: string, walletInfo: any) => {
    try {
      let address = "";
      let provider = walletInfo.provider;

      // Connect based on chain and wallet type
      if (chain === "ethereum" && typeof window !== "undefined") {
        if (walletInfo.name === "MetaMask" && window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          address = accounts[0];
        } else if (walletInfo.name === "Starknet" && (window as any).starknet) {
          const starknet = (window as any).starknet;
          const accounts = await starknet.enable();
          address = accounts[0];
        }
      } else if (chain === "solana" && typeof window !== "undefined") {
        if (walletInfo.name === "Phantom" && (window as any).solana) {
          const resp = await (window as any).solana.connect();
          address = resp.publicKey.toString();
        }
      } else if (chain === "stellar" && typeof window !== "undefined" && (window as any).freighter) {
        address = await (window as any).freighter.getPublicKey();
        provider = (window as any).freighter;
      }

      // Generate unique ID for this wallet connection
      const id = `${chain}-${walletInfo.name}-${Date.now()}`;

      // Add wallet to connected wallets
      const newWallet = {
        id,
        chain,
        address,
        provider,
      };

      setConnectedWallets((prev) => [...prev, newWallet]);

      // Fetch balances for this wallet
      fetchWalletBalances(newWallet);
    } catch (error) {
      console.error(`Error connecting to ${walletInfo.name}:`, error);
    }
  };

  // Add a connected wallet
  const addWallet = (walletInfo: WalletInfo) => {
    if (connectedWallets.some((w) => w.id === walletInfo.id)) {
      return;
    }

    setConnectedWallets((prev) => [...prev, walletInfo]);
    fetchWalletBalances(walletInfo);
  };

  // Fetch wallet balances (in real app, this would call the blockchain)
  const fetchWalletBalances = async (wallet: WalletInfo) => {
    try {
      console.log(`Fetching balances for ${wallet.chain} wallet: ${wallet.address}`);

      let newBalances: DustBalance[] = [];

      if (wallet.chain === "ethereum") {
        const provider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl);
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance);

        newBalances.push({
          walletId: wallet.id,
          chain: "ethereum",
          token: "ETH",
          asset: "ETH",
          userAddress: wallet.address,
          amount: formattedBalance,
          value: parseFloat(formattedBalance) * 2000,
        });
      } else if (wallet.chain === "solana") {
        const connection = new Connection(solanaRpcUrl);
        const publicKey = new PublicKey(wallet.address);
        const balance = await connection.getBalance(publicKey);
        const formattedBalance = balance / Math.pow(10, 9);

        newBalances.push({
          walletId: wallet.id,
          chain: "solana",
          token: "SOL",
          asset: "SOL",
          userAddress: wallet.address,
          amount: formattedBalance.toString(),
          value: formattedBalance * 180,
        });
      } else if (wallet.chain === "polygon") {
        const provider = new ethers.providers.JsonRpcProvider(polygonRpcUrl);
        const balance = await provider.getBalance(wallet.address);
        const formattedBalance = ethers.utils.formatEther(balance);

        newBalances.push({
          walletId: wallet.id,
          chain: "polygon",
          token: "MATIC",
          asset: "MATIC",
          userAddress: wallet.address,
          amount: formattedBalance,
          value: parseFloat(formattedBalance) * 1,
        });
      } else if (wallet.chain === "stellar") {
        const server = new Server(stellarRpcUrl);
        try {
          const account = await server.loadAccount(wallet.address);

          account.balances.forEach((balance: any) => {
            newBalances.push({
              walletId: wallet.id,
              chain: "stellar",
              token: balance.asset_code || "XLM",
              asset: balance.asset_code || "XLM",
              userAddress: wallet.address,
              amount: balance.balance,
              value: parseFloat(balance.balance) * 0.1,
            });
          });
        } catch (error) {
          console.error("Error loading Stellar account:", error);
        }
      }

      setDustBalances((prev) => [...prev, ...newBalances]);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  // Process dust in batch
  const processBatch = async () => {
    try {
      setProcessing(true);
      setProgress(0);

      // Find a Stellar wallet for batch processing
      const stellarWallet = connectedWallets.find(
        (wallet) => wallet.chain === "stellar"
      );

      if (!stellarWallet) {
        console.error("No Stellar wallet connected for batch processing");
        setProcessing(false);
        return;
      }

      // Create Soroban client
      const sorobanClient = new DustAggregatorClient({
        userAddress: stellarWallet.address,
        contractAddress: sorobanContractAddress,
        networkPassphrase: stellarNetworkPassphrase,
        rpcUrl: stellarRpcUrl,
        userSecret: userSecret,
      });

      // First deposit all dust balances
      for (let i = 0; i < dustBalances.length; i++) {
        try {
          const balance = dustBalances[i];
          
          // Skip if balance doesn't have required fields
          if (!balance.asset || !balance.userAddress) continue;
          
          await sorobanClient.autoDeposit({
            userAddress: balance.userAddress,
            contractAddress: sorobanContractAddress,
            networkPassphrase: stellarNetworkPassphrase,
            rpcUrl: stellarRpcUrl,
            userSecret: userSecret,
            chain: balance.chain,
            asset: balance.asset,
            amount: BigInt(Math.round(balance.value * 100)),
          });
          
          // Update progress to 50% after deposits
          setProgress(Math.min(Math.floor(((i + 1) / dustBalances.length) * 50), 50));
        } catch (error) {
          console.error("Error depositing balance:", error);
          // Continue with other balances
        }
      }

      // Then execute batch process
      try {
        await sorobanClient.batchProcess({
          userAddress: stellarWallet.address,
          contractAddress: sorobanContractAddress,
          networkPassphrase: stellarNetworkPassphrase,
          rpcUrl: stellarRpcUrl,
          userSecret: userSecret,
        });
        
        // Set progress to 100% after batch processing
        setProgress(100);
      } catch (error) {
        console.error("Error in batch processing:", error);
      }

      // Calculate total value
      const totalValue = dustBalances.reduce(
        (sum, item) => sum + item.value,
        0
      );

      // Update state after successful processing
      setBatchedDust({
        totalValue: Number.parseFloat(totalValue.toFixed(2)),
        status: "completed",
      });
      
      setProcessing(false);
    } catch (error) {
      console.error("Error processing batch:", error);
      setProcessing(false);
    }
  };

  // Transfer to Stellar via Soroban
  const transferToStellar = async () => {
    try {
      setTransferStatus("processing");

      // Find a Stellar wallet
      const stellarWallet = connectedWallets.find(
        (wallet) => wallet.chain === "stellar"
      );

      if (!stellarWallet) {
        console.error("No Stellar wallet connected");
        setTransferStatus("error");
        return;
      }

      const sorobanClient = new DustAggregatorClient({
        userAddress: stellarWallet.address,
        contractAddress: sorobanContractAddress,
        networkPassphrase: stellarNetworkPassphrase,
        rpcUrl: stellarRpcUrl,
        userSecret: userSecret,
      });

      // Soroban transfer
      // In a real implementation, this would call your Soroban smart contract
      const result = await sorobanClient.autoDeposit({
        userAddress: stellarWallet.address,
        contractAddress: sorobanContractAddress,
        networkPassphrase: stellarNetworkPassphrase,
        rpcUrl: stellarRpcUrl,
        userSecret: userSecret,
        chain: "stellar",
        asset: targetAsset,
        amount: BigInt(Math.round(batchedDust.totalValue * 100)),
      });

      console.log("Soroban transfer result:", result);

      // Update state after successful transfer
      setTransferStatus("completed");
    } catch (error) {
      console.error("Error transferring to Stellar:", error);
      setTransferStatus("error");
    }
  };

  // Get chain color
  const getChainColor = (chain: string) => {
    switch (chain) {
      case "ethereum":
        return "bg-blue-600";
      case "solana":
        return "bg-purple-600";
      case "polygon":
        return "bg-indigo-600";
      case "stellar":
        return "bg-blue-500";
      default:
        return "bg-blue-600";
    }
  };

  // Calculate total dust value
  const getTotalDustValue = () => {
    return dustBalances.reduce((sum, item) => sum + item.value, 0).toFixed(2);
  };

  // Calculate gas savings
  const getGasSavings = () => {
    const individualGas = dustBalances.length * 0.005; // 0.005 ETH per tx
    const batchGas = 0.0075; // Fixed batch gas
    const savings = individualGas - batchGas;
    return savings.toFixed(3);
  };

  // Get progress for the step indicator
  const getProgress = () => {
    const steps = ["connect", "collect", "batch", "transfer"];
    return ((steps.indexOf(activeStep) + 1) / steps.length) * 100;
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="bg-[#051326] text-white p-6 rounded-t-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Coins className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold">
              Cross-Chain Dust Aggregator
            </h1>
          </div>
          <div className="bg-[#0a1f33] px-3 py-1 rounded-full text-blue-300 text-sm border border-[#1a3a5a]">
            Powered by Soroban
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div
            className={`p-3 rounded-lg flex flex-col items-center ${
              activeStep === "connect" ? "bg-[#0d2847]" : "bg-[#071b33]/50"
            } cursor-pointer`}
            onClick={() => setActiveStep("connect")}
          >
            <div className="w-8 h-8 rounded-full bg-[#0d2847] flex items-center justify-center mb-2">
              <span className="font-bold">1</span>
            </div>
            <span className="text-sm">Connect Wallets</span>
          </div>

          <div
            className={`p-3 rounded-lg flex flex-col items-center ${
              activeStep === "collect" ? "bg-[#0d2847]" : "bg-[#071b33]/50"
            } ${
              connectedWallets.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            onClick={() =>
              connectedWallets.length > 0 && setActiveStep("collect")
            }
          >
            <div className="w-8 h-8 rounded-full bg-[#0d2847] flex items-center justify-center mb-2">
              <span className="font-bold">2</span>
            </div>
            <span className="text-sm">Collect Dust</span>
          </div>

          <div
            className={`p-3 rounded-lg flex flex-col items-center ${
              activeStep === "batch" ? "bg-[#0d2847]" : "bg-[#071b33]/50"
            } ${
              dustBalances.length === 0
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            onClick={() => dustBalances.length > 0 && setActiveStep("batch")}
          >
            <div className="w-8 h-8 rounded-full bg-[#0d2847] flex items-center justify-center mb-2">
              <span className="font-bold">3</span>
            </div>
            <span className="text-sm">Batch Process</span>
          </div>

          <div
            className={`p-3 rounded-lg flex flex-col items-center ${
              activeStep === "transfer" ? "bg-[#0d2847]" : "bg-[#071b33]/50"
            } ${
              batchedDust.status !== "completed"
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer"
            }`}
            onClick={() =>
              batchedDust.status === "completed" && setActiveStep("transfer")
            }
          >
            <div className="w-8 h-8 rounded-full bg-[#0d2847] flex items-center justify-center mb-2">
              <span className="font-bold">4</span>
            </div>
            <span className="text-sm">Transfer to Stellar</span>
          </div>
        </div>
      </div>

      <div className="bg-[#030e1a] text-white rounded-b-lg p-6">
        {/* Connect Wallets Section */}
        {activeStep === "connect" && (
          <div>
            <h2 className="text-xl font-bold text-blue-300 mb-4">
              Connect Your Wallets
            </h2>
            <p className="text-gray-400 mb-6">
              Connect wallets from different chains to collect dust balances.
            </p>

            <div className="space-y-6">
              {Object.entries(availableWallets).map(([chain, wallets]) => (
                <div key={chain} className="space-y-2">
                  <h3 className="text-lg font-medium text-blue-300 capitalize">
                    {chain}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {wallets.map((wallet, idx) => {
                      const isConnected = connectedWallets.some(
                        (w) =>
                          w.chain === chain && w.provider?.name === wallet.name
                      );

                      const connectedWallet = connectedWallets.find(
                        (w) =>
                          w.chain === chain && w.provider?.name === wallet.name
                      );

                      return (
                        <div
                          key={`${chain}-${wallet.name}-${idx}`}
                          className="border border-[#1a3a5a] bg-[#051326] p-4 rounded-lg flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full ${getChainColor(
                                chain
                              )} flex items-center justify-center text-white font-bold`}
                            >
                              {chain.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-medium">{wallet.name}</h4>
                              <p className="text-xs text-gray-400">
                                {!isConnected
                                  ? "Not Connected"
                                  : `Connected: ${
                                      connectedWallet?.address.slice(0, 6) +
                                      "..." +
                                      connectedWallet?.address.slice(-4)
                                    }`}
                              </p>
                            </div>
                          </div>
                          {!isConnected ? (
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                              onClick={() => connectWallet(chain, wallet)}
                            >
                              Connect
                            </button>
                          ) : (
                            <CheckCircle2 className="text-green-500 h-6 w-6" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collect Dust Section */}
        {activeStep === "collect" && (
          <div>
            <h2 className="text-xl font-bold text-blue-300 mb-4">
              Collect Dust Balances
            </h2>
            <p className="text-gray-400 mb-6">
              View and collect dust balances from your connected wallets.
            </p>

            {connectedWallets.map((wallet) => (
              <div
                key={wallet.id}
                className="border border-[#1a3a5a] bg-[#051326] p-4 rounded-lg mb-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full ${getChainColor(
                        wallet.chain
                      )} flex items-center justify-center text-white font-bold`}
                    >
                      {wallet.chain.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium">{wallet.chain} Wallet</h4>
                      <p className="text-xs text-gray-400">
                        Address: {wallet.address.slice(0, 6) +
                          "..." +
                          wallet.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                    onClick={() => fetchWalletBalances(wallet)}
                  >
                    <RefreshCw className="h-4 w-4 mr-1 inline-block" />
                    Refresh Balances
                  </button>
                </div>

                <div>
                  {dustBalances.filter((b) => b.walletId === wallet.id).length >
                  0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="text-left text-gray-400">
                            <th className="p-2">Token</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Value (USD)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dustBalances
                            .filter((b) => b.walletId === wallet.id)
                            .map((balance, index) => (
                              <tr key={`${balance.token}-${index}`}>
                                <td className="p-2">{balance.token}</td>
                                <td className="p-2">{balance.amount}</td>
                                <td className="p-2">${balance.value.toFixed(2)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-400">No dust balances found.</p>
                  )}
                </div>
              </div>
            ))}

            <div className="flex justify-end mt-4">
              <div className="text-right">
                <h5 className="text-lg font-medium text-blue-300">
                  Total Dust Value: ${getTotalDustValue()}
                </h5>
                <p className="text-sm text-gray-400">
                  Potential Gas Savings: {getGasSavings()} ETH
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Batch Process Section */}
        {activeStep === "batch" && (
          <div>
            <h2 className="text-xl font-bold text-blue-300 mb-4">Batch Processing</h2>
            <p className="text-gray-400 mb-6">Process your collected dust balances.</p>

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-blue-300">
                Total Value: ${getTotalDustValue()}
              </h3>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                onClick={processBatch}
                disabled={processing}
              >
                {processing ? (
                  <>Processing... ({progress}%)</>
                ) : (
                  "Start Batch Processing"
                )}
              </button>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {batchedDust.status === "completed" && (
              <div className="mt-6 p-4 border border-green-500 bg-green-700/10 rounded-lg text-green-400 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <h4 className="font-medium">Batch Processing Completed!</h4>
                  <p>
                    Total value batched: ${batchedDust.totalValue}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transfer to Stellar Section */}
        {activeStep === "transfer" && (
          <div>
            <h2 className="text-xl font-bold text-blue-300 mb-4">
              Transfer to Stellar
            </h2>
            <p className="text-gray-400 mb-6">
              Transfer your batched dust to Stellar and swap to your preferred
              asset.
            </p>

            <div className="mb-6">
              <label
                htmlFor="targetAsset"
                className="block text-sm font-medium text-gray-400 mb-2"
              >
                Target Asset
              </label>
              <select
                id="targetAsset"
                className="shadow-sm bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={targetAsset}
                onChange={(e) => setTargetAsset(e.target.value)}
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
              </select>
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              onClick={transferToStellar}
              disabled={transferStatus === "processing"}
            >
              {transferStatus === "processing" ? (
                "Transferring..."
              ) : (
                "Transfer to Stellar"
              )}
            </button>

            {transferStatus === "completed" && (
              <div className="mt-6 p-4 border border-green-500 bg-green-700/10 rounded-lg text-green-400 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6" />
                <div>
                  <h4 className="font-medium">Transfer Completed!</h4>
                  <p>
                    Dust has been transferred and swapped to {targetAsset} on
                    Stellar.
                  </p>
                </div>
              </div>
            )}

            {transferStatus === "error" && (
              <div className="mt-6 p-4 border border-red-500 bg-red-700/10 rounded-lg text-red-400 flex items-center gap-3">
                <div>
                  <h4 className="font-medium">Transfer Failed!</h4>
                  <p>
                    There was an error transferring your dust. Please try again.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}