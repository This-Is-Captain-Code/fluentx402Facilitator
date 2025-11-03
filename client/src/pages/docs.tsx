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
                <h4 className="font-semibold mb-3">For fUSD Token Payments (ERC-20)</h4>
                <CodeBlock
                  language="javascript"
                  code={`import { ethers } from 'ethers';

const FUSD_ADDRESS = "0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9";
const fUSDContract = new ethers.Contract(FUSD_ADDRESS, [
  "function transfer(address to, uint256 amount) returns (bool)"
], wallet);

// Encode transfer call
const transferData = fUSDContract.interface.encodeFunctionData(
  "transfer",
  [recipientAddress, ethers.parseUnits("10.0", 18)] // 10 fUSD
);

// Sign transaction calling fUSD.transfer()
const tx = await wallet.signTransaction({
  to: FUSD_ADDRESS,                // Token contract
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

        {/* ERC-20 / fUSD Payments */}
        <section className="mb-12" id="erc20">
          <h2 className="text-2xl font-semibold mb-4">ERC-20 Token Payments (fUSD)</h2>
          <p className="text-muted-foreground mb-6">
            The facilitator supports fUSD token payments on Fluent testnet. Use the <code className="font-mono text-sm bg-muted px-1 py-0.5 rounded">evm-erc20</code> scheme 
            and include the token address in your payment details.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>fUSD Payment Example</CardTitle>
              <CardDescription>
                Verify or settle a payment using fUSD tokens instead of native ETH
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
    "tokenAddress": "0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9"
  }
}`}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-1">fUSD Contract Address</div>
                  <code className="text-xs break-all">0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9</code>
                </AlertDescription>
              </Alert>

              <div>
                <h4 className="font-semibold mb-3">Key Differences</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Set <code className="font-mono bg-muted px-1 py-0.5 rounded">scheme</code> to "evm-erc20"</li>
                  <li>Include <code className="font-mono bg-muted px-1 py-0.5 rounded">tokenAddress</code> field with fUSD contract address</li>
                  <li>Amount is denominated in fUSD (not ETH)</li>
                  <li>Token transfers require the facilitator wallet to have sufficient fUSD balance</li>
                </ul>
              </div>
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
                  <dt className="text-sm font-medium text-muted-foreground mb-1">fUSD Contract</dt>
                  <dd className="font-mono text-xs break-all">0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9</dd>
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
