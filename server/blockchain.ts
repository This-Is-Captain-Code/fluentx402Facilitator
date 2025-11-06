import { ethers } from "ethers";
import { PaymentScheme, FLUID_ADDRESS } from "@shared/schema";

const FLUENT_TESTNET_CONFIG = {
  chainId: 20994,
  name: "Fluent Testnet",
  rpcUrl: process.env.FLUENT_RPC_URL || "https://rpc.testnet.fluent.xyz/",
  symbol: "ETH",
  explorer: "https://testnet.fluentscan.xyz/",
};

// ERC-20 + EIP 3009 ABI for token transfers
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  // EIP 3009 functions
  "function transferWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
  "function receiveWithAuthorization(address from, address to, uint256 value, uint256 validAfter, uint256 validBefore, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
  "function cancelAuthorization(address authorizer, bytes32 nonce, uint8 v, bytes32 r, bytes32 s)",
  "function authorizationState(address authorizer, bytes32 nonce) view returns (bool)",
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private fluidContract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(FLUENT_TESTNET_CONFIG.rpcUrl);
    
    // Initialize FLUID contract (Fluent USD - EIP 3009 compliant)
    this.fluidContract = new ethers.Contract(FLUID_ADDRESS, ERC20_ABI, this.provider);
    
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
   * Verifies an EIP-3009 transfer authorization for gasless transfers
   * @param authorizationJson - JSON string containing authorization parameters and signature
   * @param paymentDetails - Expected payment parameters
   * @param expectedAmount - Expected transfer amount in wei
   * @returns Verification result
   */
  private async verifyEIP3009Authorization(
    authorizationJson: string,
    paymentDetails: {
      networkId: string;
      amount: string;
      to: string;
      from?: string;
      tokenAddress?: string;
    },
    expectedAmount: bigint
  ): Promise<{ valid: boolean; message?: string; recoveredAddress?: string }> {
    try {
      // Parse authorization from JSON
      const auth = JSON.parse(authorizationJson);
      
      // Validate required fields
      if (!auth.from || !auth.to || !auth.value || !auth.validAfter || !auth.validBefore || !auth.nonce || !auth.v || !auth.r || !auth.s) {
        return {
          valid: false,
          message: "Missing required authorization fields: from, to, value, validAfter, validBefore, nonce, v, r, s",
        };
      }

      // Verify addresses
      if (!ethers.isAddress(auth.from) || !ethers.isAddress(auth.to)) {
        return {
          valid: false,
          message: "Invalid from or to address in authorization",
        };
      }

      if (auth.to.toLowerCase() !== paymentDetails.to.toLowerCase()) {
        return {
          valid: false,
          message: "Authorization recipient does not match paymentDetails.to",
        };
      }

      if (paymentDetails.from && auth.from.toLowerCase() !== paymentDetails.from.toLowerCase()) {
        return {
          valid: false,
          message: "Authorization sender does not match paymentDetails.from",
        };
      }

      // Verify amount
      const authValue = BigInt(auth.value);
      if (authValue !== expectedAmount) {
        return {
          valid: false,
          message: `Authorization amount mismatch. Expected ${expectedAmount.toString()} wei, got ${authValue.toString()} wei`,
        };
      }

      // Verify nonce hasn't been used
      const fluidContract = new ethers.Contract(FLUID_ADDRESS, ERC20_ABI, this.provider);
      const nonceUsed = await fluidContract.authorizationState(auth.from, auth.nonce);
      
      if (nonceUsed) {
        return {
          valid: false,
          message: "Authorization nonce has already been used",
        };
      }

      // Verify time window
      const now = Math.floor(Date.now() / 1000);
      const validAfter = parseInt(auth.validAfter);
      const validBefore = parseInt(auth.validBefore);

      if (now < validAfter) {
        return {
          valid: false,
          message: `Authorization not yet valid. Valid after ${new Date(validAfter * 1000).toISOString()}`,
        };
      }

      if (now > validBefore) {
        return {
          valid: false,
          message: `Authorization expired. Valid before ${new Date(validBefore * 1000).toISOString()}`,
        };
      }

      // Verify signature using EIP-712 typed data
      const domain = {
        name: await fluidContract.name(),
        version: "1",
        chainId: FLUENT_TESTNET_CONFIG.chainId,
        verifyingContract: FLUID_ADDRESS,
      };

      const types = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ],
      };

      const value = {
        from: auth.from,
        to: auth.to,
        value: auth.value,
        validAfter: auth.validAfter,
        validBefore: auth.validBefore,
        nonce: auth.nonce,
      };

      const digest = ethers.TypedDataEncoder.hash(domain, types, value);
      const signature = ethers.Signature.from({
        v: parseInt(auth.v),
        r: auth.r,
        s: auth.s,
      });

      const recoveredAddress = ethers.recoverAddress(digest, signature);

      if (recoveredAddress.toLowerCase() !== auth.from.toLowerCase()) {
        return {
          valid: false,
          message: `Invalid signature. Recovered ${recoveredAddress}, expected ${auth.from}`,
        };
      }

      // Check sender has sufficient token balance
      const tokenBalance = await fluidContract.balanceOf(auth.from);
      
      if (tokenBalance < authValue) {
        return {
          valid: false,
          message: `Insufficient token balance. Has: ${tokenBalance.toString()} wei, needs: ${authValue.toString()} wei`,
        };
      }

      // Facilitator will pay gas, so no need to check user's ETH balance

      return {
        valid: true,
        message: "EIP-3009 authorization verified successfully (gasless transfer)",
        recoveredAddress: auth.from,
      };
    } catch (error: any) {
      return {
        valid: false,
        message: `Failed to verify EIP-3009 authorization: ${error.message}`,
      };
    }
  }

  /**
   * Verifies a pre-signed transaction (x402-compliant non-custodial verification)
   * @param paymentPayload - RLP-encoded signed transaction or EIP-3009 authorization JSON
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
      if (
        paymentDetails.scheme !== PaymentScheme.EVM_NATIVE && 
        paymentDetails.scheme !== PaymentScheme.EVM_ERC20 &&
        paymentDetails.scheme !== PaymentScheme.EVM_ERC20_GASLESS
      ) {
        return {
          valid: false,
          message: `Unsupported payment scheme: ${paymentDetails.scheme}`,
        };
      }

      // For ERC-20 payments, verify token address
      if (paymentDetails.scheme === PaymentScheme.EVM_ERC20 || paymentDetails.scheme === PaymentScheme.EVM_ERC20_GASLESS) {
        if (!paymentDetails.tokenAddress) {
          return {
            valid: false,
            message: "Token address required for evm-erc20 scheme",
          };
        }

        if (paymentDetails.tokenAddress.toLowerCase() !== FLUID_ADDRESS.toLowerCase()) {
          return {
            valid: false,
            message: `Unsupported token. Only FLUID (${FLUID_ADDRESS}) is supported`,
          };
        }

        if (!ethers.isAddress(paymentDetails.tokenAddress)) {
          return {
            valid: false,
            message: "Invalid token address",
          };
        }
      }

      // Parse expected amount (already in wei - smallest unit)
      let expectedAmountValue: bigint;
      try {
        expectedAmountValue = BigInt(paymentDetails.amount);
        
        if (expectedAmountValue <= BigInt(0)) {
          return {
            valid: false,
            message: "Payment amount must be greater than 0",
          };
        }
      } catch (error) {
        return {
          valid: false,
          message: "Invalid payment amount format - must be a valid wei amount string",
        };
      }

      // Verify recipient address
      if (!ethers.isAddress(paymentDetails.to)) {
        return {
          valid: false,
          message: "Invalid recipient address",
        };
      }

      // Handle EIP-3009 gasless transfers differently
      if (paymentDetails.scheme === PaymentScheme.EVM_ERC20_GASLESS) {
        return await this.verifyEIP3009Authorization(paymentPayload, paymentDetails, expectedAmountValue);
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
            message: `Amount mismatch. Expected ${paymentDetails.amount} wei, got ${parsedTx.value.toString()} wei`,
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
              message: `Token amount mismatch. Expected ${paymentDetails.amount} wei, got ${amount.toString()} wei`,
            };
          }

          // Check sender has sufficient token balance
          const tokenContract = new ethers.Contract(paymentDetails.tokenAddress!, ERC20_ABI, this.provider);
          const tokenBalance = await tokenContract.balanceOf(senderAddress);
          
          if (tokenBalance < amount) {
            return {
              valid: false,
              message: `Insufficient token balance. Has: ${tokenBalance.toString()} wei, needs: ${paymentDetails.amount} wei`,
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
   * Settles a payment by broadcasting a pre-signed transaction or executing EIP-3009 gasless transfer
   * @param paymentPayload - RLP-encoded signed transaction or EIP-3009 authorization JSON
   * @param scheme - Payment scheme (evm-native, evm-erc20, or evm-erc20-gasless)
   * @returns Settlement result with transaction hash
   */
  async settlePayment(
    paymentPayload: string,
    scheme: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    message?: string;
  }> {
    try {
      // Handle EIP-3009 gasless transfers
      if (scheme === PaymentScheme.EVM_ERC20_GASLESS) {
        return await this.settleEIP3009Authorization(paymentPayload);
      }

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

  /**
   * Settles an EIP-3009 gasless transfer by calling transferWithAuthorization
   * @param authorizationJson - JSON string containing authorization parameters and signature
   * @returns Settlement result
   */
  private async settleEIP3009Authorization(
    authorizationJson: string
  ): Promise<{
    success: boolean;
    txHash?: string;
    blockNumber?: number;
    message?: string;
  }> {
    try {
      if (!this.wallet) {
        return {
          success: false,
          message: "Facilitator wallet not configured - cannot execute gasless transfers",
        };
      }

      // Parse authorization
      const auth = JSON.parse(authorizationJson);

      // Connect wallet to FLUID contract
      const fluidWithSigner = new ethers.Contract(FLUID_ADDRESS, ERC20_ABI, this.wallet);

      console.log(`📤 Executing EIP-3009 transferWithAuthorization (gasless)...`);
      console.log(`   From: ${auth.from}`);
      console.log(`   To: ${auth.to}`);
      console.log(`   Value: ${auth.value} wei`);

      // Call transferWithAuthorization - facilitator pays gas
      const tx = await fluidWithSigner.transferWithAuthorization(
        auth.from,
        auth.to,
        auth.value,
        auth.validAfter,
        auth.validBefore,
        auth.nonce,
        auth.v,
        auth.r,
        auth.s
      );

      console.log(`📤 Transaction submitted: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await tx.wait();

      if (!receipt) {
        return {
          success: false,
          message: "Transaction receipt not available",
        };
      }

      console.log(`✅ Gasless transfer confirmed in block ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        message: "Gasless transfer settled successfully (facilitator paid gas)",
      };
    } catch (error: any) {
      console.error("❌ EIP-3009 settlement error:", error);

      let message = `Gasless settlement failed: ${error.message}`;

      if (error.code === "INVALID_ARGUMENT") {
        message = "Invalid authorization parameters";
      } else if (error.message.includes("authorization is used")) {
        message = "Authorization nonce has already been used";
      } else if (error.message.includes("authorization is expired")) {
        message = "Authorization has expired";
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
