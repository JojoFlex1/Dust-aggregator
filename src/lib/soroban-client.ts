import { 
  Address, 
  Contract,
  Keypair, 
  Networks, 
  Operation,
  Server, 
  TransactionBuilder, 
  xdr 
} from 'stellar-sdk';

// Interface for contract interaction parameters
export interface SorobanContractParams {
  userAddress: string;
  contractAddress: string;
  networkPassphrase: string;
  rpcUrl: string;
  userSecret: string; // Added secret key for signing
}

// Interface for auto deposit parameters
export interface AutoDepositParams extends SorobanContractParams {
  chain: string;
  asset: string;
  amount: bigint;
}

// Interface for withdraw parameters
export interface WithdrawParams extends SorobanContractParams {
  chain: string;
  asset: string;
}

// Interface for swap parameters
export interface SwapParams extends SorobanContractParams {
  fromChain: string;
  fromAsset: string;
  toAsset: string;
  amount?: bigint;
}

// Interface for batch process parameters
export interface BatchProcessParams extends SorobanContractParams {
  // No additional parameters needed for batch processing
}

export class DustAggregatorClient {
  private server: Server;
  private contractId: string;
  private params: SorobanContractParams;

  constructor(params: SorobanContractParams) {
    this.params = params;
    this.server = new Server(params.rpcUrl);
    this.contractId = params.contractAddress;
  }

  // Helper to convert string to Address and then to ScVal
  private addressToScVal(addressStr: string): xdr.ScVal {
    try {
      return new Address(addressStr).toScVal();
    } catch (error) {
      throw new Error(`Invalid address format: ${addressStr}`);
    }
  }

  // Auto deposit method
  async autoDeposit(params: AutoDepositParams): Promise<string> {
    try {
      const sourceScVal = this.addressToScVal(params.userAddress);
      const chainSymbol = xdr.ScVal.scvSymbol(params.chain);
      const assetScVal = this.addressToScVal(params.asset);
      
      const account = await this.server.loadAccount(params.userAddress);
      
      // Create contract instance
      const contract = new Contract(this.contractId);
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: params.networkPassphrase
      })
      .addOperation(
        Operation.invokeHostFunction({
          function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
          parameters: [
            contract.address().toScVal(),
            xdr.ScVal.scvSymbol('auto_deposit'),
            sourceScVal,
            chainSymbol,
            assetScVal,
            xdr.ScVal.scvU64(params.amount)
          ]
        })
      )
      .setTimeout(30)
      .build();

      const keypair = Keypair.fromSecret(params.userSecret);
      tx.sign(keypair);
      const response = await this.server.submitTransaction(tx);
      return response.hash;
    } catch (error) {
      console.error('Auto deposit error:', error);
      throw error;
    }
  }

  // Batch process method - ADDED THIS IMPORTANT FUNCTION
  async batchProcess(params: BatchProcessParams): Promise<string> {
    try {
      const account = await this.server.loadAccount(params.userAddress);
      
      // Create contract instance
      const contract = new Contract(this.contractId);
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: params.networkPassphrase
      })
      .addOperation(
        Operation.invokeHostFunction({
          function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
          parameters: [
            contract.address().toScVal(),
            xdr.ScVal.scvSymbol('batch_process')
            // No additional parameters needed for batch_process
          ]
        })
      )
      .setTimeout(30)
      .build();

      const keypair = Keypair.fromSecret(params.userSecret);
      tx.sign(keypair);
      const response = await this.server.submitTransaction(tx);
      return response.hash;
    } catch (error) {
      console.error('Batch process error:', error);
      throw error;
    }
  }

  // Withdraw method
  async withdraw(params: WithdrawParams): Promise<bigint> {
    try {
      const sourceScVal = this.addressToScVal(params.userAddress);
      const chainSymbol = xdr.ScVal.scvSymbol(params.chain);
      const assetScVal = this.addressToScVal(params.asset);
      
      const account = await this.server.loadAccount(params.userAddress);
      
      // Create contract instance
      const contract = new Contract(this.contractId);
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: params.networkPassphrase
      })
      .addOperation(
        Operation.invokeHostFunction({
          function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
          parameters: [
            contract.address().toScVal(),
            xdr.ScVal.scvSymbol('withdraw'),
            sourceScVal,
            chainSymbol,
            assetScVal
          ]
        })
      )
      .setTimeout(30)
      .build();

      const keypair = Keypair.fromSecret(params.userSecret);
      tx.sign(keypair);
      const response = await this.server.submitTransaction(tx);
      
      // Fetch the result of the withdraw operation
      const result = await this.server.getTransactionResult(response.hash);
      return this.parseReturnValue(result.returnValue);
    } catch (error) {
      console.error('Withdraw error:', error);
      throw error;
    }
  }

  // Swap method
  async swap(params: SwapParams): Promise<bigint> {
    try {
      const sourceScVal = this.addressToScVal(params.userAddress);
      const fromChainSymbol = xdr.ScVal.scvSymbol(params.fromChain);
      const fromAssetScVal = this.addressToScVal(params.fromAsset);
      const toAssetScVal = this.addressToScVal(params.toAsset);
      
      const account = await this.server.loadAccount(params.userAddress);
      
      // Create contract instance
      const contract = new Contract(this.contractId);
      
      // Prepare parameters
      const parameters = [
        contract.address().toScVal(),
        xdr.ScVal.scvSymbol('swap'),
        sourceScVal,
        fromChainSymbol,
        fromAssetScVal,
        toAssetScVal
      ];
      
      // Add amount parameter if provided
      if (params.amount) {
        parameters.push(xdr.ScVal.scvU64(params.amount));
      } else {
        parameters.push(xdr.ScVal.scvVoid());
      }
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: params.networkPassphrase
      })
      .addOperation(
        Operation.invokeHostFunction({
          function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
          parameters
        })
      )
      .setTimeout(30)
      .build();

      const keypair = Keypair.fromSecret(params.userSecret);
      tx.sign(keypair);
      const response = await this.server.submitTransaction(tx);
      
      // Fetch the result of the swap operation
      const result = await this.server.getTransactionResult(response.hash);
      return this.parseReturnValue(result.returnValue);
    } catch (error) {
      console.error('Swap error:', error);
      throw error;
    }
  }

  // Helper function to parse return value
  private parseReturnValue(returnValue: any): bigint {
    try {
      if (returnValue && returnValue.type === xdr.ScValType.scvU64) {
        return BigInt(returnValue.u64().toString());
      } else {
        throw new Error(`Unsupported return value type: ${returnValue?.type}`);
      }
    } catch (error) {
      console.error('Error parsing return value:', error);
      throw error;
    }
  }

  // Get balance method
  async getBalance(
    userAddress: string, 
    chain: string, 
    asset: string
  ): Promise<bigint> {
    try {
      const sourceScVal = this.addressToScVal(userAddress);
      const chainSymbol = xdr.ScVal.scvSymbol(chain);
      const assetScVal = this.addressToScVal(asset);
      
      // Create contract instance
      const contract = new Contract(this.contractId);
      
      const account = await this.server.loadAccount(userAddress);
      
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.params.networkPassphrase
      })
      .addOperation(
        Operation.invokeHostFunction({
          function: xdr.HostFunction.hostFunctionTypeInvokeContract(),
          parameters: [
            contract.address().toScVal(),
            xdr.ScVal.scvSymbol('get_balance'),
            sourceScVal,
            chainSymbol,
            assetScVal
          ]
        })
      )
      .setTimeout(30)
      .build();
      
      const result = await this.server.simulateTransaction(tx);
      return this.parseReturnValue(result.returnValue);
    } catch (error) {
      console.error('Get balance error:', error);
      throw error;
    }
  }
}