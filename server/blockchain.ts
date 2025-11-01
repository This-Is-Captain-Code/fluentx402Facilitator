import { ethers } from "ethers";
import { PaymentScheme, FUSD_ADDRESS } from "@shared/schema";

const FLUENT_TESTNET_CONFIG = {
  chainId: 20994,
  name: "Fluent Testnet",
  rpcUrl: process.env.FLUENT_RPC_URL || "https://rpc.testnet.fluent.xyz/",
  symbol: "ETH",
  explorer: "https://testnet.fluentscan.xyz/",
};

// Standard ERC-20 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private fusdContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(FLUENT_TESTNET_CONFIG.rpcUrl);
    
    // Initialize fUSD contract (read-only)
    this.fusdContract = new ethers.Contract(FUSD_ADDRESS, ERC20_ABI, this.provider);
    
    // Wallet is optional - only needed for facilitator admin tasks, not for broadcasting user txs
    if (process.env.FACILITATOR_PRIVATE_KEY) {
      try {
        this.wallet = new ethers.Wallet(process.env.FACILITATOR_PRIVATE_KEY, this.provider);
        console.log(`✅ Facilitator wallet initialized: ${this.wallet.address}`);
      } catch (error) {
        console.error("❌ Failed to initialize wallet:", error);
      }
    } else {
      console.log("ℹ️  Running in verification-only mode (no private key needed for broadcasting)");
    }
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error: any) {
      throw new Error(`Failed to get token balance: ${error.message}`);
    }
  }

  /**
   * Verifies a pre-signed transaction (x402-compliant non-custodial verification)
   * @param paymentPayload - RLP-encoded signed transaction
   * @param paymentDetails - Expected payment parameters
   * @returns Verification result with recovered sender address
   */
  async verifyPaymentPayload(
    paymentPayload: string,
    paymentDetails: {
      networkId: string;
      amount: string;
      to: string;
      from?: string;
      scheme: string;
      tokenAddress?: string;
    }
  ): Promise<{ valid: boolean; message?: string; recoveredAddress?: string }> {
    try {
      // Verify network ID matches
      if (paymentDetails.networkId !== String(FLUENT_TESTNET_CONFIG.chainId)) {
        return {
          valid: false,
          message: `Invalid network ID. Expected ${FLUENT_TESTNET_CONFIG.chainId}, got ${paymentDetails.networkId}`,
        };
      }

      // Verify scheme
      if (paymentDetails.scheme !== PaymentScheme.EVM_NATIVE && paymentDetails.scheme !== PaymentScheme.EVM_ERC20) {
        return {
          valid: false,
          message: `Unsupported payment scheme: ${paymentDetails.scheme}`,
        };
      }

      // For ERC-20 payments, verify token address
      if (paymentDetails.scheme === PaymentScheme.EVM_ERC20) {
        if (!paymentDetails.tokenAddress) {
          return {
            valid: false,
            message: "Token address required for evm-erc20 scheme",
          };
        }

        if (paymentDetails.tokenAddress.toLowerCase() !== FUSD_ADDRESS.toLowerCase()) {
          return {
            valid: false,
            message: `Unsupported token. Only fUSD (${FUSD_ADDRESS}) is supported`,
          };
        }

        if (!ethers.isAddress(paymentDetails.tokenAddress)) {
          return {
            valid: false,
            message: "Invalid token address",
          };
        }
      }

      // Parse expected amount
      let expectedAmountValue: bigint;
      try {
        if (paymentDetails.scheme === PaymentScheme.EVM_ERC20) {
          expectedAmountValue = ethers.parseUnits(paymentDetails.amount, 18);
        } else {
          expectedAmountValue = ethers.parseEther(paymentDetails.amount);
        }
        
        if (expectedAmountValue <= BigInt(0)) {
          return {
            valid: false,
            message: "Payment amount must be greater than 0",
          };
        }
      } catch (error) {
        return {
          valid: false,
          message: "Invalid payment amount format",
        };
      }

      // Verify recipient address
      if (!ethers.isAddress(paymentDetails.to)) {
        return {
          valid: false,
          message: "Invalid recipient address",
        };
      }

      // Parse the signed transaction
      let parsedTx: ethers.Transaction;
      try {
        parsedTx = ethers.Transaction.from(paymentPayload);
      } catch (error: any) {
        return {
          valid: false,
          message: `Invalid signed transaction: ${error.message}`,
        };
      }

      // Verify transaction chain ID
      if (parsedTx.chainId !== BigInt(FLUENT_TESTNET_CONFIG.chainId)) {
        return {
          valid: false,
          message: `Transaction chain ID mismatch. Expected ${FLUENT_TESTNET_CONFIG.chainId}, got ${parsedTx.chainId?.toString()}`,
        };
      }

      // Recover sender address from signature
      const senderAddress = parsedTx.from;
      if (!senderAddress) {
        return {
          valid: false,
          message: "Unable to recover sender address from transaction",
        };
      }

      // If from address provided in paymentDetails, verify it matches
      if (paymentDetails.from && paymentDetails.from.toLowerCase() !== senderAddress.toLowerCase()) {
        return {
          valid: false,
          message: "Sender address mismatch",
        };
      }

      // Verify transaction parameters based on scheme
      if (paymentDetails.scheme === PaymentScheme.EVM_NATIVE) {
        // For native ETH transfers
        if (!parsedTx.to || parsedTx.to.toLowerCase() !== paymentDetails.to.toLowerCase()) {
          return {
            valid: false,
            message: "Recipient address mismatch",
          };
        }

        if (parsedTx.value !== expectedAmountValue) {
          return {
            valid: false,
            message: `Amount mismatch. Expected ${paymentDetails.amount} ETH, got ${ethers.formatEther(parsedTx.value)} ETH`,
          };
        }

        // Check sender has sufficient balance (including gas)
        const balance = await this.provider.getBalance(senderAddress);
        const estimatedGas = parsedTx.gasLimit * (parsedTx.maxFeePerGas || parsedTx.gasPrice || BigInt(0));
        const totalNeeded = parsedTx.value + estimatedGas;
        
        if (balance < totalNeeded) {
          return {
            valid: false,
            message: `Insufficient sender balance. Has: ${ethers.formatEther(balance)} ETH, needs: ${ethers.formatEther(totalNeeded)} ETH (including gas)`,
          };
        }

      } else if (paymentDetails.scheme === PaymentScheme.EVM_ERC20) {
        // For ERC-20 token transfers
        if (!parsedTx.to || parsedTx.to.toLowerCase() !== paymentDetails.tokenAddress!.toLowerCase()) {
          return {
            valid: false,
            message: "Transaction must be sent to token contract",
          };
        }

        // Decode the transaction data to verify it's a transfer call
        try {
          const tokenInterface = new ethers.Interface(ERC20_ABI);
          const decodedData = tokenInterface.parseTransaction({ data: parsedTx.data });

          if (!decodedData || decodedData.name !== "transfer") {
            return {
              valid: false,
              message: "Transaction must call transfer() function",
            };
          }

          const [recipient, amount] = decodedData.args;

          if (recipient.toLowerCase() !== paymentDetails.to.toLowerCase()) {
            return {
              valid: false,
              message: "Token recipient mismatch",
            };
          }

          if (amount !== expectedAmountValue) {
            return {
              valid: false,
              message: `Token amount mismatch. Expected ${paymentDetails.amount}, got ${ethers.formatUnits(amount, 18)}`,
            };
          }

          // Check sender has sufficient token balance
          const tokenContract = new ethers.Contract(paymentDetails.tokenAddress!, ERC20_ABI, this.provider);
          const tokenBalance = await tokenContract.balanceOf(senderAddress);
          
          if (tokenBalance < amount) {
            return {
              valid: false,
              message: `Insufficient token balance. Has: ${ethers.formatUnits(tokenBalance, 18)} fUSD, needs: ${paymentDetails.amount} fUSD`,
            };
          }

          // Check sender has sufficient ETH for gas
          const balance = await this.provider.getBalance(senderAddress);
          const estimatedGas = parsedTx.gasLimit * (parsedTx.maxFeePerGas || parsedTx.gasPrice || BigInt(0));
          
          if (balance < estimatedGas) {
            return {
              valid: false,
              message: `Insufficient ETH for gas. Has: ${ethers.formatEther(balance)} ETH, needs: ${ethers.formatEther(estimatedGas)} ETH`,
            };
          }
        } catch (error: any) {
          return {
            valid: false,
            message: `Failed to decode token transfer: ${error.message}`,
          };
        }
      }

      return {
        valid: true,
        message: "Payment transaction verified successfully",
        recoveredAddress: senderAddress,
      };
    } catch (error: any) {
      return {
        valid: false,
        message: `Verification error: ${error.message}`,
      };
    }
  }

  /**
   * Settles a payment by broadcasting a pre-signed transaction (x402-compliant non-custodial settlement)
   * @param paymentPayload - RLP-encoded signed transaction from user
   * @returns Settlement result with transaction hash
   */
  async settlePayment(
    paymentPayload: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    message?: string;
  }> {
    try {
      // Broadcast the user's pre-signed transaction
      // Facilitator only pays network fees to propagate, user's wallet sends the actual funds
      const txResponse = await this.provider.broadcastTransaction(paymentPayload);
      
      console.log(`📤 Transaction broadcasted: ${txResponse.hash}`);

      // Wait for confirmation
      const receipt = await txResponse.wait();

      if (!receipt) {
        return {
          success: false,
          message: "Transaction receipt not available",
        };
      }

      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        message: "Payment settled successfully",
      };
    } catch (error: any) {
      console.error("❌ Settlement error:", error);
      
      // Provide more specific error messages
      let message = `Settlement failed: ${error.message}`;
      
      if (error.code === "INSUFFICIENT_FUNDS") {
        message = "Insufficient funds in sender wallet";
      } else if (error.code === "NONCE_EXPIRED" || error.code === "REPLACEMENT_UNDERPRICED") {
        message = "Transaction nonce already used or gas price too low";
      } else if (error.code === "NETWORK_ERROR") {
        message = "Network error - transaction may have been broadcasted";
      }

      return {
        success: false,
        message,
      };
    }
  }

  getNetworkConfig() {
    return FLUENT_TESTNET_CONFIG;
  }

  isWalletConfigured(): boolean {
    return this.wallet !== null;
  }

  getFacilitatorAddress(): string | null {
    return this.wallet?.address || null;
  }
}

export const blockchainService = new BlockchainService();
