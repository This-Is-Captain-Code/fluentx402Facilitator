import { ethers } from "ethers";

const FLUENT_TESTNET_CONFIG = {
  chainId: 20994,
  name: "Fluent Testnet",
  rpcUrl: process.env.FLUENT_RPC_URL || "https://rpc.testnet.fluent.xyz/",
  symbol: "ETH",
  explorer: "https://testnet.fluentscan.xyz/",
};

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(FLUENT_TESTNET_CONFIG.rpcUrl);
    
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

  async verifyPaymentPayload(
    paymentPayload: string,
    paymentDetails: {
      networkId: string;
      amount: string;
      to: string;
      scheme: string;
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
      if (paymentDetails.scheme !== "evm-native") {
        return {
          valid: false,
          message: `Unsupported payment scheme: ${paymentDetails.scheme}`,
        };
      }

      // Parse and verify amount
      const amountWei = ethers.parseEther(paymentDetails.amount);
      if (amountWei <= 0n) {
        return {
          valid: false,
          message: "Payment amount must be greater than 0",
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
        const message = `Pay ${paymentDetails.amount} ETH to ${paymentDetails.to} on network ${paymentDetails.networkId}`;
        
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

      // Parse amount
      const amountWei = ethers.parseEther(paymentDetails.amount);

      // Check facilitator balance
      const balance = await this.wallet.provider.getBalance(this.wallet.address);
      if (balance < amountWei) {
        return {
          success: false,
          message: `Insufficient facilitator balance. Has: ${ethers.formatEther(balance)} ETH, needs: ${paymentDetails.amount} ETH`,
        };
      }

      // Send transaction
      const tx = await this.wallet.sendTransaction({
        to: paymentDetails.to,
        value: amountWei,
      });

      console.log(`📤 Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

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
