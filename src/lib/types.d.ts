// Type definitions for browser wallet extensions

interface StarknetWindow extends Window {
    starknet?: {
      enable: () => Promise<string[]>
      account: {
        address: string
      }
    }
  }
  
  interface PhantomWindow extends Window {
    solana?: {
      isPhantom: boolean
      connect: () => Promise<{ publicKey: { toString: () => string } }>
      disconnect: () => Promise<void>
    }
  }
  
  interface SolflareWindow extends Window {
    solflare?: {
      connect: () => Promise<{ publicKey: string }>
    }
  }
  
  interface FreighterWindow extends Window {
    freighter?: {
      isConnected: () => Promise<boolean>
      getPublicKey: () => Promise<string>
    }
  }
  
  declare global {
    interface Window extends StarknetWindow, PhantomWindow, SolflareWindow, FreighterWindow {
      ethereum?: {
        isMetaMask?: boolean
        request: (request: { method: string; params?: any[] }) => Promise<any>
        providers?: any[]
      }
    }
  }
  
  export {}
  
  