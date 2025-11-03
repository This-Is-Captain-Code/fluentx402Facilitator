import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/header";
import { CheckCircle, Code, Network, Zap, ArrowRight, BookOpen, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
              <Network className="h-4 w-4" />
              <span>x402 Protocol Facilitator</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight" data-testid="text-hero-title">
              Payment Verification for{" "}
              <span className="text-primary">Fluent Testnet</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Professional x402 facilitator service for verifying and settling micropayments on the Fluent blockchain. 
              Integrate seamless, stateless payments into your applications with minimal configuration.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/docs">
                <Button size="lg" className="gap-2" data-testid="button-cta-docs">
                  <BookOpen className="h-5 w-5" />
                  View Documentation
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="gap-2" data-testid="button-cta-dashboard">
                  <LayoutDashboard className="h-5 w-5" />
                  Go to Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>Chain ID: 20994</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <span>Native Token: ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <span>Protocol: x402</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Built for Developers
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Everything you need to integrate x402 payments into your Fluent testnet applications
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Payment Verification</CardTitle>
                <CardDescription>
                  Instantly verify payment payloads against your requirements without blockchain interaction
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Real-time signature validation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Amount and recipient verification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Protocol compliance checking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <Network className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Blockchain Settlement</CardTitle>
                <CardDescription>
                  Submit verified payments to Fluent testnet and track confirmation status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Automated transaction submission</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Confirmation monitoring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Transaction hash tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-all">
              <CardHeader>
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Simple Integration</CardTitle>
                <CardDescription>
                  RESTful API with comprehensive documentation and code examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Standard HTTP endpoints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>JSON request/response format</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>Complete integration examples</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Integration Preview */}
      <section className="py-20 px-6">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Quick Integration
            </h2>
            <p className="text-muted-foreground text-lg">
              Get started with just a few lines of code
            </p>
          </div>

          <Card className="bg-muted/50 border-2">
            <CardHeader>
              <CardTitle className="text-sm font-mono text-muted-foreground">
                Example: Verify Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-background rounded-md p-4 overflow-x-auto border text-sm font-mono">
{`const response = await fetch('https://fluentx402.replit.app/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    paymentPayload: signedPayload,
    paymentDetails: {
      networkId: '20994',
      amount: '0.01',
      to: recipientAddress,
      scheme: 'evm-native'
    }
  })
});

const result = await response.json();
if (result.valid) {
  // Payment verified - proceed with request
}`}
              </pre>
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Link href="/docs">
              <Button variant="outline" size="lg" className="gap-2" data-testid="button-view-full-docs">
                View Full Documentation
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Network className="h-5 w-5 text-primary" />
                <span className="font-bold">x402 Facilitator</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professional payment verification and settlement for Fluent testnet
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://x402.gitbook.io/x402" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    x402 Protocol Docs
                  </a>
                </li>
                <li>
                  <a href="https://testnet.fluent.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Fluent Testnet
                  </a>
                </li>
                <li>
                  <a href="https://testnet.fluentscan.xyz/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    Block Explorer
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Network Info</h3>
              <ul className="space-y-2 text-sm font-mono text-muted-foreground">
                <li>Chain ID: 20994</li>
                <li>Symbol: ETH</li>
                <li>RPC: rpc.testnet.fluent.xyz</li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>Built for the Fluent ecosystem • x402 Protocol Compatible</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
