# Payment API Implementation Guide

## Overview

This guide explains how to integrate the x402 Protocol Payment Verification and Settlement APIs into your website. These APIs allow you to verify and settle blockchain payments on the Fluent Testnet.

## Base URL

The API is deployed and accessible at:

```
https://fluentx402.replit.app
```

---

## API Endpoints

### 1. Health Check

**GET** `/api/health`

Check if the API server is running properly.

#### Response Example
```json
{
  "status": "healthy",
  "timestamp": "2025-11-04T12:00:00.000Z",
  "network": "Fluent Testnet",
  "chainId": 20994
}
```

---

### 2. Network Configuration

**GET** `/api/network`

Get the blockchain network configuration and facilitator details.

#### Response Example
```json
{
  "chainId": 20994,
  "name": "Fluent Testnet",
  "rpcUrl": "https://rpc.dev.thefluent.xyz/",
  "symbol": "ETH",
  "explorer": "https://blockscout.dev.thefluent.xyz",
  "facilitatorAddress": "0x...",
  "walletConfigured": true,
  "settlementAvailable": true
}
```

---

### 3. Verify Payment

**POST** `/api/verify`

Verify a signed payment transaction before broadcasting it to the blockchain.

#### Request Body
```json
{
  "paymentPayload": "0x...",  // RLP-encoded signed transaction
  "paymentDetails": {
    "networkId": "20994",
    "amount": "1000000000000000000",  // Amount in wei
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "from": "0x...",  // Optional - recovered from signature if not provided
    "scheme": "evm-native",  // or "evm-erc20"
    "tokenAddress": "0x..."  // Required only for evm-erc20 scheme
  }
}
```

#### Response (Success)
```json
{
  "valid": true,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Payment payload verified successfully"
}
```

#### Response (Failure)
```json
{
  "valid": false,
  "message": "Insufficient balance"
}
```

#### Payment Schemes
- `evm-native`: Native ETH payments (user pays gas)
- `evm-erc20`: ERC20 token payments (user pays gas, requires `tokenAddress`)
- `evm-erc20-gasless`: FLUID token payments with EIP-3009 (facilitator pays gas)

#### FLUID Token Address (Fluent Testnet)
```
0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0
```

**Note**: The `evm-erc20-gasless` scheme uses EIP-3009 meta-transactions and only works with the FLUID token. The facilitator pays gas fees, making transfers gasless for the user.

---

### 4. Settle Payment

**POST** `/api/settle`

Broadcast a verified signed transaction to the blockchain and settle the payment.

#### Request Body
```json
{
  "paymentPayload": "0x...",  // RLP-encoded signed transaction
  "paymentDetails": {
    "networkId": "20994",
    "amount": "1000000000000000000",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "from": "0x...",
    "scheme": "evm-native",
    "tokenAddress": "0x..."  // Optional
  },
  "transactionId": "550e8400-e29b-41d4-a716-446655440000"  // Optional, from verify response
}
```

#### Response (Success)
```json
{
  "success": true,
  "txHash": "0x123abc...",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "blockNumber": 12345,
  "message": "Payment settled successfully"
}
```

#### Response (Failure)
```json
{
  "success": false,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Transaction reverted"
}
```

---

### 5. Get Statistics

**GET** `/api/stats`

Retrieve payment processing statistics and recent transactions.

#### Response Example
```json
{
  "totalVerified": 150,
  "totalSettled": 142,
  "totalVolume": "15000000000000000000",
  "successRate": 94.67,
  "recentTransactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "txHash": "0x123abc...",
      "amount": "1000000000000000000",
      "status": "settled",
      "networkId": "20994",
      "scheme": "evm-native",
      "verifiedAt": "2025-11-04T12:00:00.000Z",
      "settledAt": "2025-11-04T12:01:00.000Z",
      "createdAt": "2025-11-04T12:00:00.000Z"
    }
  ]
}
```

---

## EIP-3009 Gasless Transfers

### Overview

The `evm-erc20-gasless` payment scheme uses **EIP-3009** to enable gasless FLUID token transfers. With EIP-3009:

- **User signs an authorization** (not a transaction) using EIP-712 typed data
- **No ETH required** for gas - the facilitator pays all gas fees
- **Direct transfer** from user to recipient
- **Replay protection** via nonces stored on-chain

This is particularly useful for onboarding new users who don't have ETH for gas fees.

### EIP-3009 Request Format

For gasless transfers, the `paymentPayload` must be a **JSON string** (not RLP-encoded transaction) containing:

```json
{
  "from": "0x...",
  "to": "0x...",
  "value": "1000000000000000000",
  "validAfter": 0,
  "validBefore": 1735689600,
  "nonce": "0x1234...",
  "v": 28,
  "r": "0x...",
  "s": "0x..."
}
```

### Creating EIP-3009 Authorizations

Here's how to create and sign an EIP-3009 authorization using ethers.js v6:

```typescript
import { ethers } from 'ethers';

// FLUID token contract address on Fluent testnet
const FLUID_ADDRESS = '0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0';
const FLUENT_CHAIN_ID = 20994;

// EIP-712 domain for FLUID token
const domain = {
  name: 'Fluent USD',
  version: '1',
  chainId: FLUENT_CHAIN_ID,
  verifyingContract: FLUID_ADDRESS,
};

// EIP-712 types for transferWithAuthorization
const types = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
};

async function createGaslessAuthorization(
  signer: ethers.Signer,
  to: string,
  amount: string  // in wei
) {
  const from = await signer.getAddress();
  
  // Generate a unique nonce (32 bytes)
  const nonce = ethers.hexlify(ethers.randomBytes(32));
  
  // Set validity window (optional - use 0 and max for no restrictions)
  const validAfter = 0;
  const validBefore = Math.floor(Date.now() / 1000) + 3600; // Valid for 1 hour
  
  // Authorization message
  const message = {
    from,
    to,
    value: amount,  // Already in wei
    validAfter,
    validBefore,
    nonce,
  };
  
  // Sign with EIP-712
  const signature = await signer.signTypedData(domain, types, message);
  
  // Split signature into v, r, s
  const sig = ethers.Signature.from(signature);
  
  // Create authorization object
  const authorization = {
    from,
    to,
    value: amount,
    validAfter,
    validBefore,
    nonce,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  };
  
  return JSON.stringify(authorization);
}
```

### Using Gasless Transfers with the API

```typescript
async function verifyAndSettleGaslessPayment(
  signer: ethers.Signer,
  to: string,
  amount: string  // in wei, e.g., "1000000000000000000" for 1 FLUID
) {
  // Step 1: Create EIP-3009 authorization
  const authorizationJson = await createGaslessAuthorization(signer, to, amount);
  
  // Step 2: Verify the authorization
  const verifyResponse = await fetch('https://fluentx402.replit.app/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: authorizationJson,  // JSON, not hex!
      paymentDetails: {
        networkId: "20994",
        amount: amount,  // Same amount in wei
        to: to,
        from: await signer.getAddress(),
        scheme: "evm-erc20-gasless",
        tokenAddress: FLUID_ADDRESS,
      }
    })
  });
  
  const verifyResult = await verifyResponse.json();
  
  if (!verifyResult.valid) {
    throw new Error(`Verification failed: ${verifyResult.message}`);
  }
  
  console.log('✓ Authorization verified');
  
  // Step 3: Settle (facilitator pays gas)
  const settleResponse = await fetch('https://fluentx402.replit.app/api/settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: authorizationJson,
      paymentDetails: {
        networkId: "20994",
        amount: amount,
        to: to,
        from: await signer.getAddress(),
        scheme: "evm-erc20-gasless",
        tokenAddress: FLUID_ADDRESS,
      },
      transactionId: verifyResult.transactionId,
    })
  });
  
  const settleResult = await settleResponse.json();
  
  if (!settleResult.success) {
    throw new Error(`Settlement failed: ${settleResult.message}`);
  }
  
  console.log('✓ Gasless transfer settled!');
  console.log('  Transaction hash:', settleResult.txHash);
  console.log('  Block number:', settleResult.blockNumber);
  
  return settleResult;
}
```

### Privy Integration Example

Here's a complete example using Privy embedded wallets for gasless FLUID transfers:

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

function GaslessPaymentComponent() {
  const { wallets } = useWallets();
  
  async function sendGaslessFluid(recipient: string, amountInFluid: string) {
    // Get Privy embedded wallet
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    if (!embeddedWallet) throw new Error('No embedded wallet found');
    
    // Get ethers provider and signer
    const provider = await embeddedWallet.getEthersProvider();
    const signer = provider.getSigner();
    
    // Convert amount to wei (FLUID has 18 decimals like ETH)
    const amountWei = ethers.parseEther(amountInFluid).toString();
    
    // Create gasless authorization
    const authJson = await createGaslessAuthorization(
      signer,
      recipient,
      amountWei
    );
    
    // Verify and settle
    const result = await verifyAndSettleGaslessPayment(
      signer,
      recipient,
      amountWei
    );
    
    return result;
  }
  
  return (
    <button onClick={() => sendGaslessFluid('0x...', '10.0')}>
      Send 10 FLUID (Gasless)
    </button>
  );
}
```

### Key Differences: Regular vs Gasless

| Feature | Regular (`evm-erc20`) | Gasless (`evm-erc20-gasless`) |
|---------|----------------------|------------------------------|
| **Payload Format** | RLP-encoded transaction (hex) | JSON authorization |
| **Gas Payment** | User pays in ETH | Facilitator pays in ETH |
| **Signature Type** | Transaction signature | EIP-712 typed signature |
| **Requirements** | User needs ETH + tokens | User only needs tokens |
| **Supported Tokens** | Any ERC-20 | FLUID only |
| **Nonce Management** | Account nonce | Authorization nonce |

### Validation Rules

The API validates gasless authorizations by:

1. **Chain ID Check**: Must be Fluent testnet (20994)
2. **Token Check**: Must be FLUID token address
3. **Signature Recovery**: Verifies EIP-712 signature matches `from` address
4. **Nonce Check**: Ensures nonce hasn't been used via `authorizationState()`
5. **Time Window**: Checks `validAfter` and `validBefore` timestamps
6. **Balance Check**: Verifies sender has sufficient FLUID tokens

### Error Handling

Common errors for gasless transfers:

```json
{
  "valid": false,
  "message": "Authorization nonce has already been used"
}
```

```json
{
  "success": false,
  "message": "Authorization has expired"
}
```

```json
{
  "valid": false,
  "message": "Insufficient token balance"
}
```

---

## Implementation Examples

### JavaScript/TypeScript (Frontend)

```typescript
// Configuration
const API_BASE_URL = 'https://fluentx402.replit.app';

// Type definitions
interface PaymentDetails {
  networkId: string;
  amount: string;
  to: string;
  from?: string;
  scheme: 'evm-native' | 'evm-erc20' | 'evm-erc20-gasless';
  tokenAddress?: string;
}

interface VerifyResponse {
  valid: boolean;
  transactionId?: string;
  message?: string;
}

interface SettleResponse {
  success: boolean;
  txHash?: string;
  transactionId: string;
  blockNumber?: number;
  message?: string;
}

// 1. Check API Health
async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  const data = await response.json();
  console.log('API Status:', data.status);
  return data;
}

// 2. Get Network Configuration
async function getNetworkConfig() {
  const response = await fetch(`${API_BASE_URL}/api/network`);
  const config = await response.json();
  return config;
}

// 3. Verify Payment
async function verifyPayment(
  paymentPayload: string,
  paymentDetails: PaymentDetails
): Promise<VerifyResponse> {
  const response = await fetch(`${API_BASE_URL}/api/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentPayload,
      paymentDetails,
    }),
  });

  const result: VerifyResponse = await response.json();
  
  if (!result.valid) {
    throw new Error(`Verification failed: ${result.message}`);
  }
  
  return result;
}

// 4. Settle Payment
async function settlePayment(
  paymentPayload: string,
  paymentDetails: PaymentDetails,
  transactionId?: string
): Promise<SettleResponse> {
  const response = await fetch(`${API_BASE_URL}/api/settle`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      paymentPayload,
      paymentDetails,
      transactionId,
    }),
  });

  const result: SettleResponse = await response.json();
  
  if (!result.success) {
    throw new Error(`Settlement failed: ${result.message}`);
  }
  
  return result;
}

// 5. Get Statistics
async function getStats() {
  const response = await fetch(`${API_BASE_URL}/api/stats`);
  const stats = await response.json();
  return stats;
}

// Example: Complete Payment Flow
async function completePaymentFlow(signedTx: string, details: PaymentDetails) {
  try {
    // Step 1: Verify the payment
    console.log('Verifying payment...');
    const verifyResult = await verifyPayment(signedTx, details);
    console.log('Payment verified:', verifyResult);

    // Step 2: Settle the payment
    console.log('Settling payment...');
    const settleResult = await settlePayment(
      signedTx,
      details,
      verifyResult.transactionId
    );
    console.log('Payment settled:', settleResult);

    return {
      success: true,
      txHash: settleResult.txHash,
      blockNumber: settleResult.blockNumber,
    };
  } catch (error) {
    console.error('Payment flow error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
```

### React Hook Example

```typescript
import { useState } from 'react';

interface UsePaymentResult {
  verifyPayment: (payload: string, details: PaymentDetails) => Promise<void>;
  settlePayment: (payload: string, details: PaymentDetails, txId?: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  verifyResult: VerifyResponse | null;
  settleResult: SettleResponse | null;
}

export function usePayment(apiBaseUrl: string): UsePaymentResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [settleResult, setSettleResult] = useState<SettleResponse | null>(null);

  const verifyPayment = async (payload: string, details: PaymentDetails) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentPayload: payload, paymentDetails: details }),
      });

      const result = await response.json();
      
      if (!result.valid) {
        throw new Error(result.message || 'Verification failed');
      }
      
      setVerifyResult(result);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const settlePayment = async (
    payload: string,
    details: PaymentDetails,
    txId?: string
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentPayload: payload,
          paymentDetails: details,
          transactionId: txId,
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Settlement failed');
      }
      
      setSettleResult(result);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    verifyPayment,
    settlePayment,
    loading,
    error,
    verifyResult,
    settleResult,
  };
}
```

### Python Example

```python
import requests
from typing import Dict, Optional

API_BASE_URL = "https://fluentx402.replit.app"

class PaymentAPI:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
    
    def check_health(self) -> Dict:
        """Check API health status"""
        response = requests.get(f"{self.base_url}/api/health")
        response.raise_for_status()
        return response.json()
    
    def get_network_config(self) -> Dict:
        """Get network configuration"""
        response = requests.get(f"{self.base_url}/api/network")
        response.raise_for_status()
        return response.json()
    
    def verify_payment(
        self,
        payment_payload: str,
        payment_details: Dict
    ) -> Dict:
        """Verify a payment transaction"""
        response = requests.post(
            f"{self.base_url}/api/verify",
            json={
                "paymentPayload": payment_payload,
                "paymentDetails": payment_details
            }
        )
        response.raise_for_status()
        result = response.json()
        
        if not result.get('valid'):
            raise ValueError(f"Verification failed: {result.get('message')}")
        
        return result
    
    def settle_payment(
        self,
        payment_payload: str,
        payment_details: Dict,
        transaction_id: Optional[str] = None
    ) -> Dict:
        """Settle a payment on blockchain"""
        payload = {
            "paymentPayload": payment_payload,
            "paymentDetails": payment_details
        }
        
        if transaction_id:
            payload["transactionId"] = transaction_id
        
        response = requests.post(
            f"{self.base_url}/api/settle",
            json=payload
        )
        response.raise_for_status()
        result = response.json()
        
        if not result.get('success'):
            raise ValueError(f"Settlement failed: {result.get('message')}")
        
        return result
    
    def get_stats(self) -> Dict:
        """Get payment statistics"""
        response = requests.get(f"{self.base_url}/api/stats")
        response.raise_for_status()
        return response.json()

# Usage example
if __name__ == "__main__":
    api = PaymentAPI(API_BASE_URL)
    
    # Check health
    health = api.check_health()
    print(f"API Status: {health['status']}")
    
    # Verify payment
    payment_details = {
        "networkId": "20994",
        "amount": "1000000000000000000",
        "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "scheme": "evm-native"
    }
    
    signed_tx = "0x..."  # Your RLP-encoded signed transaction
    
    try:
        verify_result = api.verify_payment(signed_tx, payment_details)
        print(f"Transaction verified: {verify_result['transactionId']}")
        
        settle_result = api.settle_payment(
            signed_tx,
            payment_details,
            verify_result['transactionId']
        )
        print(f"Transaction settled: {settle_result['txHash']}")
    except ValueError as e:
        print(f"Error: {e}")
```

### cURL Examples

```bash
# Health Check
curl -X GET https://fluentx402.replit.app/api/health

# Get Network Config
curl -X GET https://fluentx402.replit.app/api/network

# Verify Payment
curl -X POST https://fluentx402.replit.app/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": "0x...",
    "paymentDetails": {
      "networkId": "20994",
      "amount": "1000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "scheme": "evm-native"
    }
  }'

# Settle Payment
curl -X POST https://fluentx402.replit.app/api/settle \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": "0x...",
    "paymentDetails": {
      "networkId": "20994",
      "amount": "1000000000000000000",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "scheme": "evm-native"
    },
    "transactionId": "550e8400-e29b-41d4-a716-446655440000"
  }'

# Get Statistics
curl -X GET https://fluentx402.replit.app/api/stats
```

---

## Integration Steps

### 1. Setup
The API is already deployed at `https://fluentx402.replit.app` - no additional setup required!

### 2. Client-Side Integration
1. Install required dependencies (ethers.js for signing transactions)
2. Copy the appropriate code examples above
3. The examples are already configured with the correct API URL

### 3. Create Signed Transactions
You'll need to create RLP-encoded signed transactions using a library like ethers.js:

```typescript
import { ethers } from 'ethers';

async function createSignedTransaction(
  wallet: ethers.Wallet,
  to: string,
  amount: string
) {
  const tx = {
    to,
    value: ethers.parseEther(amount),
    // Add other transaction parameters (gas, nonce, etc.)
  };
  
  const signedTx = await wallet.signTransaction(tx);
  return signedTx; // This is your paymentPayload
}
```

### 4. Payment Flow
1. User initiates payment on your website
2. Create and sign the transaction on client-side
3. Call `/api/verify` to verify the signed transaction
4. If valid, call `/api/settle` to broadcast to blockchain
5. Show confirmation to user with transaction hash

---

## Error Handling

### Common Errors

| Status Code | Error | Description |
|-------------|-------|-------------|
| 400 | Invalid request body | Request body doesn't match schema |
| 404 | Transaction not found | TransactionId doesn't exist |
| 500 | Internal server error | Server-side error occurred |

### Validation Errors
The API will return detailed validation errors:

```json
{
  "valid": false,
  "message": "Insufficient balance for transaction"
}
```

### Best Practices
1. Always call `/api/verify` before `/api/settle`
2. Store the `transactionId` from verify response
3. Handle errors gracefully with user-friendly messages
4. Implement retry logic for network failures
5. Monitor transaction status using the `txHash`

---

## Security Considerations

1. **HTTPS Only**: Always use HTTPS in production
2. **Rate Limiting**: Implement rate limiting on your reverse proxy
3. **Input Validation**: The API validates all inputs, but add client-side validation too
4. **Private Keys**: Never send private keys to the API (only send signed transactions)
5. **CORS**: The API has CORS enabled to allow direct calls from web applications (see CORS Configuration below)

---

## CORS Configuration

This API has **Cross-Origin Resource Sharing (CORS)** enabled, which means you can call it directly from your web application without needing a backend proxy.

### Current Configuration

The API accepts requests from **any origin** with the following settings:

- **Allowed Origins**: `*` (all domains)
- **Allowed Methods**: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`
- **Allowed Headers**: `Content-Type`, `Authorization`
- **Credentials**: Disabled (not needed - API is stateless and doesn't use cookies)

### Direct Frontend Integration

This means you can call the API directly from your frontend JavaScript code, including:

- **React/Next.js** applications
- **Vue/Nuxt** applications
- **Vanilla JavaScript** web apps
- **Mobile apps** (React Native, etc.)

### Example: Direct API Call from Browser

```typescript
// This works directly from your frontend - no proxy needed!
const response = await fetch('https://fluentx402.replit.app/api/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    paymentPayload: signedTransaction,
    paymentDetails: {
      networkId: "20994",
      amount: ethers.parseEther("1.0").toString(),
      to: recipientAddress,
      scheme: "evm-native"
    }
  })
});

const result = await response.json();
```

### Integration with Wallet Providers

The CORS configuration enables seamless integration with wallet providers like:

- **Privy Embedded Wallets**
- **MetaMask**
- **WalletConnect**
- **Coinbase Wallet**
- **Rainbow Wallet**

### Privy Wallet Example

If you're using Privy embedded wallets, you can sign transactions and call this API directly:

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';

function PaymentComponent() {
  const { wallets } = useWallets();
  
  async function makePayment(amount: string, recipient: string) {
    // Get Privy embedded wallet
    const embeddedWallet = wallets.find(w => w.walletClientType === 'privy');
    const provider = await embeddedWallet.getEthersProvider();
    const signer = provider.getSigner();
    
    // Sign transaction
    const signedTx = await signer.signTransaction({
      to: recipient,
      value: ethers.parseEther(amount),
      chainId: 20994, // Fluent testnet
    });
    
    // Call x402 API directly - CORS is enabled!
    const response = await fetch('https://fluentx402.replit.app/api/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentPayload: signedTx,
        paymentDetails: {
          networkId: "20994",
          amount: ethers.parseEther(amount).toString(),
          to: recipient,
          scheme: "evm-native"
        }
      })
    });
    
    const result = await response.json();
    console.log('Payment settled:', result.txHash);
  }
}
```

### Production Considerations

For production deployments, you may want to:

1. **Restrict Origins**: Modify the CORS configuration to only allow specific domains
2. **Add API Keys**: Implement API key authentication for additional security
3. **Rate Limiting**: Add rate limiting to prevent abuse
4. **Monitoring**: Track API usage and set up alerts

The current permissive CORS configuration (`origin: '*'`) is suitable for development and testing but should be reviewed before production use.

---

## Testing

### Test Flow
1. Use Fluent Testnet for testing
2. Get test ETH from Fluent faucet
3. Test with small amounts first
4. Monitor `/api/stats` for transaction status

### Test Addresses
- Network: Fluent Testnet
- Chain ID: 20994
- RPC: https://rpc.dev.thefluent.xyz/
- FLUID Token: 0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0

---

## Support & Resources

- Fluent Testnet Explorer: https://blockscout.dev.thefluent.xyz
- Ethers.js Documentation: https://docs.ethers.org/
- x402 Protocol Specification: (if available)

---

## FAQ

**Q: Do I need to verify before settling?**  
A: No, `/api/settle` includes verification. However, calling `/api/verify` first is recommended to catch issues early.

**Q: What happens if settlement fails?**  
A: The transaction status will be marked as 'failed' and you'll receive an error message explaining why.

**Q: Can I settle the same transaction twice?**  
A: No, once a transaction is settled on the blockchain, it cannot be replayed.

**Q: What's the difference between evm-native and evm-erc20?**  
A: `evm-native` is for native ETH payments. `evm-erc20` is for token payments and requires a `tokenAddress`.

**Q: How do I track a transaction after settlement?**  
A: Use the returned `txHash` to track the transaction on the blockchain explorer.
