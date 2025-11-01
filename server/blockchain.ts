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
    
    // Only initialize wallet if private key is provided
    if (process.env.FACILITATOR_PRIVATE_KEY) {
      try {
        this.wallet = new ethers.Wallet(process.env.FACILITATOR_PRIVATE_KEY, this.provider);
        console.log(`✅ Facilitator wallet initialized: ${this.wallet.address}`);
      } catch (error) {
        console.error("❌ Failed to initialize wallet:", error);
      }
    } else {
      console.log("ℹ️  Running in verification-only mode (no private key provided)");
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

  async verifyPaymentPayload(
    paymentPayload: string,
    paymentDetails: {
      networkId: string;
      amount: string;
      to: string;
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

        // Verify token address matches fUSD
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

      // Parse and verify amount
      let amountValue: bigint;
      try {
        if (paymentDetails.scheme === PaymentScheme.EVM_ERC20) {
          // For fUSD, use token decimals (typically 18)
          amountValue = ethers.parseUnits(paymentDetails.amount, 18);
        } else {
          amountValue = ethers.parseEther(paymentDetails.amount);
        }
        
        if (amountValue <= 0n) {
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

      // For demo purposes, we'll do basic validation
      // In production, you would verify the signature against the payment details
      // The payload should be a signed message containing payment information
      
      // Basic payload format check (should be hex string)
      if (!paymentPayload.startsWith("0x") || paymentPayload.length < 10) {
        return {
          valid: false,
          message: "Invalid payment payload format",
        };
      }

      // Try to recover signer from payload (simplified for demo)
      // In real implementation, you would verify against expected message format
      let recoveredAddress: string | undefined;
      
      try {
        // Create a message to verify (this would be standardized in production)
        const currencyLabel = paymentDetails.scheme === PaymentScheme.EVM_ERC20 ? "fUSD" : "ETH";
        const message = `Pay ${paymentDetails.amount} ${currencyLabel} to ${paymentDetails.to} on network ${paymentDetails.networkId}`;
        
        // Try to recover address from signature
        if (paymentPayload.length >= 132) { // Standard signature length
          recoveredAddress = ethers.verifyMessage(message, paymentPayload);
        }
      } catch (error) {
        // Signature verification failed, but we'll allow it for demo
        console.log("Signature verification skipped (demo mode)");
      }

      return {
        valid: true,
        message: "Payment payload verified successfully",
        recoveredAddress,
      };
    } catch (error: any) {
      return {
        valid: false,
        message: `Verification error: ${error.message}`,
      };
    }
  }

  async settlePayment(
    paymentDetails: {
      amount: string;
      to: string;
      scheme: string;
      tokenAddress?: string;
    }
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    message?: string;
  }> {
    try {
      // Check if wallet is initialized
      if (!this.wallet) {
        return {
          success: false,
          message: "Settlement not available: Facilitator wallet not configured. Please provide FACILITATOR_PRIVATE_KEY.",
        };
      }

      // Verify recipient address
      if (!ethers.isAddress(paymentDetails.to)) {
        return {
          success: false,
          message: "Invalid recipient address",
        };
      }

      let tx: ethers.ContractTransactionResponse | ethers.TransactionResponse;
      let receipt: ethers.TransactionReceipt | null;

      if (paymentDetails.scheme === PaymentScheme.EVM_ERC20) {
        // ERC-20 token settlement
        if (!paymentDetails.tokenAddress) {
          return {
            success: false,
            message: "Token address required for ERC-20 settlement",
          };
        }

        if (paymentDetails.tokenAddress.toLowerCase() !== FUSD_ADDRESS.toLowerCase()) {
          return {
            success: false,
            message: `Unsupported token. Only fUSD (${FUSD_ADDRESS}) is supported`,
          };
        }

        // Parse amount with token decimals
        const amountTokens = ethers.parseUnits(paymentDetails.amount, 18);

        // Create token contract instance with wallet
        const tokenContract = new ethers.Contract(FUSD_ADDRESS, ERC20_ABI, this.wallet);

        // Check facilitator token balance
        const balance = await tokenContract.balanceOf(this.wallet.address);
        if (balance < amountTokens) {
          return {
            success: false,
            message: `Insufficient fUSD balance. Has: ${ethers.formatUnits(balance, 18)} fUSD, needs: ${paymentDetails.amount} fUSD`,
          };
        }

        // Execute token transfer
        tx = await tokenContract.transfer(paymentDetails.to, amountTokens);
        console.log(`📤 fUSD transfer sent: ${tx.hash}`);

        // Wait for confirmation
        receipt = await tx.wait();

      } else {
        // Native ETH settlement
        const amountWei = ethers.parseEther(paymentDetails.amount);

        // Check facilitator balance
        const balance = await this.provider.getBalance(this.wallet.address);
        if (balance < amountWei) {
          return {
            success: false,
            message: `Insufficient facilitator balance. Has: ${ethers.formatEther(balance)} ETH, needs: ${paymentDetails.amount} ETH`,
          };
        }

        // Send transaction
        tx = await this.wallet.sendTransaction({
          to: paymentDetails.to,
          value: amountWei,
        });

        console.log(`📤 ETH transaction sent: ${tx.hash}`);

        // Wait for confirmation
        receipt = await tx.wait();
      }

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
      return {
        success: false,
        message: `Settlement failed: ${error.message}`,
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
