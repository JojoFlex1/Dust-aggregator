"use client"

import { useState } from "react"
import { ArrowRight, ChevronDown, Wallet, RefreshCw, Check } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/seperator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data for demonstration
const mockWallets = [
  { id: 1, name: "Ethereum Wallet", address: "0x1a2...3b4c", connected: true },
  { id: 2, name: "Polygon Wallet", address: "0x5d6...7e8f", connected: false },
  { id: 3, name: "Avalanche Wallet", address: "0x9g0...1h2i", connected: false },
  { id: 4, name: "Binance Smart Chain", address: "0x3j4...5k6l", connected: false },
  { id: 5, name: "Solana Wallet", address: "ABCD...EFGH", connected: false },
]

const mockDustBalances = [
  { chain: "Ethereum", token: "ETH", amount: "0.00021", value: "$0.42", selected: true },
  { chain: "Ethereum", token: "USDT", amount: "0.54", value: "$0.54", selected: true },
  { chain: "Polygon", token: "MATIC", amount: "0.32", value: "$0.13", selected: true },
  { chain: "Avalanche", token: "AVAX", amount: "0.011", value: "$0.22", selected: true },
  { chain: "BSC", token: "BNB", amount: "0.0008", value: "$0.19", selected: true },
  { chain: "Solana", token: "SOL", amount: "0.0015", value: "$0.09", selected: true },
]

export default function DustAggregator() {
  const [connectedWallets, setConnectedWallets] = useState(1)
  const [dustBalances, setDustBalances] = useState(mockDustBalances)
  const [processingStep, setProcessingStep] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const totalValue = dustBalances
    .filter(balance => balance.selected)
    .reduce((sum, balance) => sum + parseFloat(balance.value.replace('$', '')), 0)
    .toFixed(2)

  const connectWallet = (id: number) => {
    const updatedWallets = [...mockWallets]
    const walletIndex = updatedWallets.findIndex(wallet => wallet.id === id)
    if (walletIndex !== -1) {
      updatedWallets[walletIndex].connected = true
      setConnectedWallets(prev => prev + 1)
    }
  }

  const toggleDustSelection = (index: number) => {
    const updatedBalances = [...dustBalances]
    updatedBalances[index].selected = !updatedBalances[index].selected
    setDustBalances(updatedBalances)
  }

  const startProcessing = () => {
    setIsProcessing(true)
    setProcessingStep(1)
    
    // Simulate processing steps
    const timer1 = setTimeout(() => setProcessingStep(2), 2000)
    const timer2 = setTimeout(() => setProcessingStep(3), 4000)
    const timer3 = setTimeout(() => setProcessingStep(4), 6000)
    const timer4 = setTimeout(() => {
      setProcessingStep(5)
      setIsProcessing(false)
    }, 8000)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-white">
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <h1 className="text-xl font-bold">Dust Aggregator</h1>
          <Button variant="outline" className="gap-2 border-gray-700 bg-transparent text-white hover:bg-gray-800">
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </header>
      
      <main className="flex-1 px-6 py-8">
        <div className="mx-auto max-w-5xl">
          <Card className="border-gray-800 bg-gray-900">
            <CardHeader>
              <CardTitle className="text-2xl">Cross-Chain Dust Aggregator</CardTitle>
              <CardDescription className="text-gray-400">
                Collect small, unusable balances from different wallets, batch process them to reduce gas fees, 
                and transfer to Stellar via Soroban.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="collect" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger value="collect">1. Collect Dust</TabsTrigger>
                  <TabsTrigger value="process">2. Process & Transfer</TabsTrigger>
                  <TabsTrigger value="swap">3. Swap on Stellar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="collect" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Connect Your Wallets</h3>
                    <div className="grid gap-3">
                      {mockWallets.map(wallet => (
                        <div key={wallet.id} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-950 p-3">
                          <div>
                            <p className="font-medium">{wallet.name}</p>
                            <p className="text-sm text-gray-400">{wallet.address}</p>
                          </div>
                          {wallet.connected ? (
                            <Badge variant="outline" className="gap-1 border-green-800 bg-green-950 text-green-400">
                              <Check className="h-3 w-3" /> Connected
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-700 bg-transparent hover:bg-gray-800"
                              onClick={() => connectWallet(wallet.id)}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Dust Balances</h3>
                      <Button variant="ghost" size="sm" className="gap-1 text-gray-400 hover:text-white">
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </Button>
                    </div>
                    
                    <ScrollArea className="h-[240px] rounded-md border border-gray-800">
                      <div className="space-y-1 p-1">
                        {dustBalances.map((balance, index) => (
                          <div 
                            key={index} 
                            className={`flex cursor-pointer items-center justify-between rounded-md p-2 ${
                              balance.selected ? 'bg-gray-800' : 'hover:bg-gray-850'
                            }`}
                            onClick={() => toggleDustSelection(index)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                                balance.chain === 'Ethereum' ? 'bg-blue-900' : 
                                balance.chain === 'Polygon' ? 'bg-purple-900' : 
                                balance.chain === 'Avalanche' ? 'bg-red-900' : 
                                balance.chain === 'BSC' ? 'bg-yellow-900' : 'bg-green-900'
                              }`}>
                                <span className="text-xs">{balance.chain.charAt(0)}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium">{balance.amount} {balance.token}</p>
                                <p className="text-xs text-gray-400">{balance.chain}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{balance.value}</span>
                              <div className={`h-4 w-4 rounded-sm border ${
                                balance.selected ? 'border-primary bg-primary' : 'border-gray-600'
                              }`}>
                                {balance.selected && <Check className="h-3 w-3 text-white" />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Total Selected Dust Value</p>
                          <p className="text-2xl font-bold">${totalValue}</p>
                        </div>
                        <Button className="gap-2" onClick={() => document.querySelector('[data-value="process"]')?.click()}>
                          Continue to Processing <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="process" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Batch Processing</h3>
                    <p className="text-gray-400">
                      We'll batch process your dust to minimize gas fees and transfer to Stellar via Soroban.
                    </p>
                    
                    <div className="space-y-6 rounded-lg border border-gray-800 bg-gray-950 p-6">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Processing Status</p>
                          <p className="text-sm text-gray-400">Step {processingStep} of 5</p>
                        </div>
                        <Progress value={processingStep * 20} className="h-2" />
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            processingStep >= 1 ? 'bg-green-900' : 'bg-gray-800'
                          }`}>
                            {processingStep >= 1 ? <Check className="h-4 w-4" /> : '1'}
                          </div>
                          <p className={processingStep >= 1 ? 'text-white' : 'text-gray-500'}>
                            Collecting dust from connected wallets
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            processingStep >= 2 ? 'bg-green-900' : 'bg-gray-800'
                          }`}>
                            {processingStep >= 2 ? <Check className="h-4 w-4" /> : '2'}
                          </div>
                          <p className={processingStep >= 2 ? 'text-white' : 'text-gray-500'}>
                            Optimizing batch transactions
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            processingStep >= 3 ? 'bg-green-900' : 'bg-gray-800'
                          }`}>
                            {processingStep >= 3 ? <Check className="h-4 w-4" /> : '3'}
                          </div>
                          <p className={processingStep >= 3 ? 'text-white' : 'text-gray-500'}>
                            Processing batch transactions
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            processingStep >= 4 ? 'bg-green-900' : 'bg-gray-800'
                          }`}>
                            {processingStep >= 4 ? <Check className="h-4 w-4" /> : '4'}
                          </div>
                          <p className={processingStep >= 4 ? 'text-white' : 'text-gray-500'}>
                            Transferring to Stellar via Soroban
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full ${
                            processingStep >= 5 ? 'bg-green-900' : 'bg-gray-800'
                          }`}>
                            {processingStep >= 5 ? <Check className="h-4 w-4" /> : '5'}
                          </div>
                          <p className={processingStep >= 5 ? 'text-white' : 'text-gray-500'}>
                            Complete
                          </p>
                        </div>
                      </div>
                      
                      {processingStep === 5 ? (
                        <Button className="w-full gap-2" onClick={() => document.querySelector('[data-value="swap"]')?.click()}>
                          Continue to Swap <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={startProcessing} 
                          disabled={isProcessing}
                        >
                          {isProcessing ? 'Processing...' : 'Start Processing'}
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="swap" className="mt-6 space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Swap on Stellar</h3>
                    <p className="text-gray-400">
                      Your aggregated dust is now on Stellar. Choose an asset to swap into.
                    </p>
                    
                    <div className="rounded-lg border border-gray-800 bg-gray-950 p-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <p className="text-sm text-gray-400">Available Balance</p>
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900">
                              <span>S</span>
                            </div>
                            <p className="text-2xl font-bold">${totalValue}</p>
                          </div>
                        </div>
                        
                        <Separator className="bg-gray-800" />
                        
                        <div className="space-y-4">
                          <p className="font-medium">Swap To</p>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" className="w-full justify-between border-gray-700 bg-gray-800">
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900">
                                    <span className="text-xs">X</span>
                                  </div>
                                  <span>XLM</span>
                                </div>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[200px]">
                              <DropdownMenuItem>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-900">
                                    <span className="text-xs">X</span>
                                  </div>
                                  <span>XLM</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <div className="flex items-center gap-2">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-900">
                                    <span className="text-xs">U</span>
                                  </div>
                                  <span>USDC</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <div className="rounded-md bg-gray-800 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-400">You'll receive approximately</p>
                              <p className="font-medium">~{(parseFloat(totalValue) * 7.5).toFixed(2)} XLM</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-400">Exchange rate</p>
                              <p className="text-sm">$1.00 = 7.5 XLM</p>
                            </div>
                          </div>
                          
                          <Button className="w-full">Swap Now</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex-col items-start gap-2 border-t border-gray-800 bg-gray-950 px-6 py-4">
              <p className="text-sm font-medium">About Dust Aggregation</p>
              <p className="text-sm text-gray-400">
                Dust refers to tiny amounts of cryptocurrency that are too small to be transacted due to 
                network fees exceeding their value. This tool helps you reclaim value from these otherwise 
                unusable assets by batching them together and moving them to Stellar's low-fee environment.
              </p>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}