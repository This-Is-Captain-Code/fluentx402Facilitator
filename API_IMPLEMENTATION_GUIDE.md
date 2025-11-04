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
- `evm-native`: Native ETH payments
- `evm-erc20`: ERC20 token payments (requires `tokenAddress`)

#### FLUID Token Address (Fluent Testnet)
```
0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0
```

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
  scheme: 'evm-native' | 'evm-erc20';
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
5. **CORS**: Configure CORS properly for your domain

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
