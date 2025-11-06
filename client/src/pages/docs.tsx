import { Header } from "@/components/header";
import { CodeBlock } from "@/components/code-block";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2, AlertCircle } from "lucide-react";

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4" data-testid="text-docs-title">
            API Documentation
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete reference for integrating x402 payment verification and settlement on Fluent testnet
          </p>
        </div>

        {/* Getting Started */}
        <section className="mb-12" id="getting-started">
          <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
          <p className="text-muted-foreground mb-6">
            The x402 facilitator provides two main endpoints for payment processing: verification and settlement. 
            Both endpoints accept JSON payloads and return structured responses.
          </p>

          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Base URL: <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">https://fluentx402.replit.app/api</code>
            </AlertDescription>
          </Alert>
        </section>

        {/* Non-Custodial Model */}
        <section className="mb-12" id="non-custodial">
          <h2 className="text-2xl font-semibold mb-4">Non-Custodial Payment Model</h2>
          <p className="text-muted-foreground mb-6">
            This facilitator follows the true x402 protocol specification - it is completely <strong>non-custodial</strong>. 
            Funds flow directly from the user's wallet to the recipient. The facilitator only broadcasts pre-signed transactions 
            to the network and never holds or controls user funds.
          </p>

          <Alert className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <div className="font-semibold mb-2">Payment Flow</div>
              <div className="text-sm">
                User signs transaction off-chain → Sends signed transaction to facilitator → Facilitator broadcasts to blockchain → 
                Funds transfer directly from user to recipient
              </div>
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Creating Signed Transactions</CardTitle>
              <CardDescription>
                The <code className="font-mono text-sm">paymentPayload</code> must be a complete, RLP-encoded signed transaction created by the user's wallet.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">For Native ETH Payments (ethers.js v6)</h4>
                <CodeBlock
                  language="javascript"
                  code={`import { ethers } from 'ethers';

// User's wallet (e.g., from Privy, MetaMask, etc.)
const wallet = new ethers.Wallet(userPrivateKey, provider);

// Create transaction
const tx = await wallet.signTransaction({
  to: recipientAddress,           // Where funds go
  value: ethers.parseEther("0.01"), // Amount in ETH
  chainId: 20994,                  // Fluent testnet
  gasLimit: 21000,
  maxFeePerGas: ethers.parseUnits("2", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
  nonce: await provider.getTransactionCount(wallet.address)
});

// tx is now a serialized signed transaction ready to send as paymentPayload`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">For FLUID Token Payments (ERC-20)</h4>
                <CodeBlock
                  language="javascript"
                  code={`import { ethers } from 'ethers';

const FLUID_ADDRESS = "0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0";
const fluidContract = new ethers.Contract(FLUID_ADDRESS, [
  "function transfer(address to, uint256 amount) returns (bool)"
], wallet);

// Encode transfer call
const transferData = fluidContract.interface.encodeFunctionData(
  "transfer",
  [recipientAddress, ethers.parseUnits("10.0", 18)] // 10 FLUID
);

// Sign transaction calling FLUID.transfer()
const tx = await wallet.signTransaction({
  to: FLUID_ADDRESS,               // Token contract
  data: transferData,              // Encoded transfer() call
  value: 0,                        // No ETH value for token transfers
  chainId: 20994,
  gasLimit: 65000,
  maxFeePerGas: ethers.parseUnits("2", "gwei"),
  maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
  nonce: await provider.getTransactionCount(wallet.address)
});

// tx is the signed transaction to send as paymentPayload`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Key Requirements</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>User must have sufficient balance in <strong>their own wallet</strong> (not the facilitator)</li>
                  <li>User must have enough ETH for gas fees</li>
                  <li>Transaction must be signed with user's private key</li>
                  <li>Chain ID must be 20994 (Fluent testnet)</li>
                  <li>Nonce must be correct for the sender's address</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Verify Endpoint */}
        <section className="mb-12" id="verify">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default">POST</Badge>
                <code className="font-mono text-lg">/api/verify</code>
              </div>
              <CardTitle>Verify Payment</CardTitle>
              <CardDescription>
                Validates a payment payload without submitting to the blockchain. Use this endpoint to confirm 
                that a payment meets your requirements before providing service.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "paymentPayload": "0x...",
  "paymentDetails": {
    "networkId": "20994",
    "amount": "0.01",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "scheme": "evm-native"
  }
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response (Success)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "valid": true,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Payment payload verified successfully"
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response (Failure)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "valid": false,
  "message": "Invalid signature or insufficient amount"
}`}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Example Usage</h4>
                <CodeBlock
                  language="javascript"
                  code={`const verifyPayment = async (payload, details) => {
  const response = await fetch('https://fluentx402.replit.app/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: payload,
      paymentDetails: details
    })
  });
  
  const result = await response.json();
  return result.valid;
};`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Settle Endpoint */}
        <section className="mb-12" id="settle">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="default">POST</Badge>
                <code className="font-mono text-lg">/api/settle</code>
              </div>
              <CardTitle>Settle Payment</CardTitle>
              <CardDescription>
                Submits a verified payment to the Fluent blockchain and monitors for confirmation. 
                This endpoint performs both verification and settlement in one call.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request Body</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "paymentPayload": "0x...",
  "paymentDetails": {
    "networkId": "20994",
    "amount": "0.01",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "scheme": "evm-native"
  },
  "transactionId": "550e8400-e29b-41d4-a716-446655440000"
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response (Success)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "success": true,
  "txHash": "0x1234567890abcdef...",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "blockNumber": 12345,
  "message": "Payment settled successfully"
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Response (Failure)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "success": false,
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Settlement failed: insufficient gas"
}`}
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Example Usage</h4>
                <CodeBlock
                  language="javascript"
                  code={`const settlePayment = async (payload, details) => {
  const response = await fetch('https://fluentx402.replit.app/api/settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: payload,
      paymentDetails: details
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Transaction hash:', result.txHash);
    console.log('Block number:', result.blockNumber);
  }
  
  return result;
};`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ERC-20 / FLUID Payments */}
        <section className="mb-12" id="erc20">
          <h2 className="text-2xl font-semibold mb-4">ERC-20 Token Payments (FLUID)</h2>
          <p className="text-muted-foreground mb-6">
            The facilitator supports FLUID (Fluent USD) token payments on Fluent testnet. Use the <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">evm-erc20</code> scheme 
            and include the token address in your payment details.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>FLUID Payment Example</CardTitle>
              <CardDescription>
                Verify or settle a payment using FLUID tokens instead of native ETH
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Request Body (Verify or Settle)</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "paymentPayload": "0x...",
  "paymentDetails": {
    "networkId": "20994",
    "amount": "10.0",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "scheme": "evm-erc20",
    "tokenAddress": "0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0"
  }
}`}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">FLUID Contract Address (Fluent USD - EIP 3009 compliant)</div>
                  <code className="text-xs break-all">0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0</code>
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Key Differences</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Set <code className="font-mono bg-muted px-1 py-0.5 rounded">scheme</code> to "evm-erc20"</li>
                  <li>Include <code className="font-mono bg-muted px-1 py-0.5 rounded">tokenAddress</code> field with FLUID contract address</li>
                  <li>Amount is denominated in FLUID (not ETH)</li>
                  <li>User must have sufficient FLUID balance in their wallet</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* EIP-3009 Gasless Transfers */}
        <section className="mb-12" id="eip-3009">
          <h2 className="text-2xl font-semibold mb-4">EIP-3009 Gasless Transfers</h2>
          <p className="text-muted-foreground mb-6">
            The facilitator supports gasless FLUID token transfers using EIP-3009, where users sign an authorization and the facilitator pays gas fees.
            This enables onboarding users who have FLUID tokens but no ETH for gas.
          </p>

          <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-900 dark:text-green-100">
              <div className="font-semibold mb-2">Key Benefits</div>
              <ul className="text-sm space-y-1">
                <li>• Users don't need ETH for gas fees</li>
                <li>• Facilitator pays gas costs</li>
                <li>• Direct transfer from user to recipient (non-custodial)</li>
                <li>• EIP-712 typed signatures for security</li>
                <li>• Replay protection via on-chain nonces</li>
              </ul>
            </AlertDescription>
          </Alert>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Creating EIP-3009 Authorizations</CardTitle>
              <CardDescription>
                Sign an EIP-712 authorization instead of a transaction. Use <code className="font-mono text-sm">evm-erc20-gasless</code> scheme.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Signing Authorization (ethers.js v6)</h4>
                <CodeBlock
                  language="javascript"
                  code={`import { ethers } from 'ethers';

const FLUID_ADDRESS = "0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0";

// EIP-712 domain for FLUID token
const domain = {
  name: 'Fluent USD',
  version: '1',
  chainId: 20994,
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

// Create authorization message
const message = {
  from: userAddress,
  to: recipientAddress,
  value: ethers.parseEther("10.0").toString(), // 10 FLUID in wei
  validAfter: 0,
  validBefore: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
  nonce: ethers.hexlify(ethers.randomBytes(32)), // Unique nonce
};

// Sign with EIP-712
const signature = await signer.signTypedData(domain, types, message);
const sig = ethers.Signature.from(signature);

// Create authorization JSON payload
const authorization = JSON.stringify({
  from: message.from,
  to: message.to,
  value: message.value,
  validAfter: message.validAfter,
  validBefore: message.validBefore,
  nonce: message.nonce,
  v: sig.v,
  r: sig.r,
  s: sig.s,
});

// authorization is now the paymentPayload for gasless transfers`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Verify Gasless Payment</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "paymentPayload": "{\\"from\\":\\"0x...\\",\\"to\\":\\"0x...\\",\\"value\\":\\"10000000000000000000\\",\\"validAfter\\":0,\\"validBefore\\":1735689600,\\"nonce\\":\\"0x1234...\\",\\"v\\":28,\\"r\\":\\"0x...\\",\\"s\\":\\"0x...\\"}",
  "paymentDetails": {
    "networkId": "20994",
    "amount": "10000000000000000000",
    "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "from": "0x...",
    "scheme": "evm-erc20-gasless",
    "tokenAddress": "0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0"
  }
}`}
                />
              </div>

              <div>
                <h4 className="font-semibold mb-3">Key Differences vs Regular Transfers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold mb-2">Regular (evm-erc20)</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Payload: RLP-encoded transaction</li>
                      <li>• User pays gas in ETH</li>
                      <li>• Any ERC-20 token</li>
                      <li>• User needs ETH + tokens</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <div className="font-semibold mb-2">Gasless (evm-erc20-gasless)</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Payload: JSON authorization</li>
                      <li>• Facilitator pays gas</li>
                      <li>• FLUID token only</li>
                      <li>• User only needs FLUID</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Complete Gasless Transfer Example</h4>
                <CodeBlock
                  language="javascript"
                  code={`async function sendGaslessFluid(signer, recipient, amount) {
  // Step 1: Create authorization
  const message = {
    from: await signer.getAddress(),
    to: recipient,
    value: ethers.parseEther(amount).toString(),
    validAfter: 0,
    validBefore: Math.floor(Date.now() / 1000) + 3600,
    nonce: ethers.hexlify(ethers.randomBytes(32)),
  };
  
  // Step 2: Sign authorization
  const signature = await signer.signTypedData(domain, types, message);
  const sig = ethers.Signature.from(signature);
  
  const authPayload = JSON.stringify({
    ...message,
    v: sig.v,
    r: sig.r,
    s: sig.s,
  });
  
  // Step 3: Verify with API
  const verifyResponse = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: authPayload,
      paymentDetails: {
        networkId: "20994",
        amount: message.value,
        to: recipient,
        from: message.from,
        scheme: "evm-erc20-gasless",
        tokenAddress: FLUID_ADDRESS,
      }
    })
  });
  
  const { valid, transactionId } = await verifyResponse.json();
  if (!valid) throw new Error('Verification failed');
  
  // Step 4: Settle (facilitator pays gas)
  const settleResponse = await fetch('/api/settle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentPayload: authPayload,
      paymentDetails: {
        networkId: "20994",
        amount: message.value,
        to: recipient,
        from: message.from,
        scheme: "evm-erc20-gasless",
        tokenAddress: FLUID_ADDRESS,
      },
      transactionId,
    })
  });
  
  const result = await settleResponse.json();
  console.log('Gasless transfer settled:', result.txHash);
  return result;
}`}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">Important Notes</div>
                  <ul className="text-sm space-y-1">
                    <li>• Amounts must be in wei (smallest unit): <code className="font-mono">ethers.parseEther("10.0").toString()</code></li>
                    <li>• Each authorization requires a unique nonce (32 bytes)</li>
                    <li>• Nonces are checked on-chain to prevent replay attacks</li>
                    <li>• Authorization expires after <code className="font-mono">validBefore</code> timestamp</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        {/* Stats Endpoint */}
        <section className="mb-12" id="stats">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="secondary">GET</Badge>
                <code className="font-mono text-lg">/api/stats</code>
              </div>
              <CardTitle>Get Statistics</CardTitle>
              <CardDescription>
                Retrieve aggregated statistics about payment processing activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Response</h4>
                <CodeBlock
                  language="json"
                  code={`{
  "totalVerified": 150,
  "totalSettled": 142,
  "totalVolume": "2.45",
  "successRate": 94.67,
  "recentTransactions": [...]
}`}
                />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Error Codes */}
        <section className="mb-12" id="errors">
          <h2 className="text-2xl font-semibold mb-4">Error Handling</h2>
          <p className="text-muted-foreground mb-6">
            All endpoints return appropriate HTTP status codes and structured error messages.
          </p>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">200 OK</div>
                    <div className="text-sm text-muted-foreground">Request succeeded</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">400 Bad Request</div>
                    <div className="text-sm text-muted-foreground">Invalid request body or missing required fields</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <div className="font-semibold">500 Internal Server Error</div>
                    <div className="text-sm text-muted-foreground">Server error or blockchain communication failure</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Network Information */}
        <section className="mb-12" id="network">
          <h2 className="text-2xl font-semibold mb-4">Network Configuration</h2>
          <Card>
            <CardContent className="pt-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Chain ID</dt>
                  <dd className="font-mono">20994</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Network</dt>
                  <dd className="font-mono">Fluent Testnet</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">RPC URL</dt>
                  <dd className="font-mono text-sm break-all">https://rpc.testnet.fluent.xyz/</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Explorer</dt>
                  <dd className="font-mono text-sm break-all">https://testnet.fluentscan.xyz/</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Native Token</dt>
                  <dd className="font-mono">ETH</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">FLUID Contract</dt>
                  <dd className="font-mono text-xs break-all">0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground mb-1">Faucet</dt>
                  <dd className="font-mono text-sm break-all">https://testnet.fluent.xyz/dev-portal</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
