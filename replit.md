# x402 Facilitator - Fluent Testnet

## Project Overview

An x402 payment facilitator service built for Fluent testnet (Chain ID: 20994). This application implements the x402 protocol for HTTP-based micropayments, providing verification and settlement services for developers building on Fluent.

## Purpose

- **Verify Payments**: Validate payment payloads against server requirements without blockchain interaction
- **Settle Payments**: Submit verified payments to Fluent blockchain and monitor for confirmation
- **Track Activity**: Monitor all payment processing with comprehensive dashboard and statistics

## Architecture

### Frontend
- React SPA with TypeScript
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI components with Tailwind CSS
- Dark/light mode support
- Pages: Landing, API Documentation, Dashboard

### Backend
- Express.js REST API
- ethers.js v6 for blockchain interactions
- In-memory storage for transaction tracking
- x402 protocol implementation

### Key Features
1. `/api/verify` - Payment verification endpoint (supports ETH and FLUID)
2. `/api/settle` - Payment settlement endpoint (supports ETH and FLUID)
3. `/api/stats` - Statistics and recent transactions
4. Dashboard with real-time transaction monitoring
5. Comprehensive API documentation with ERC-20 examples
6. Professional landing page
7. **Payment Schemes**:
   - `evm-native` - Native ETH payments
   - `evm-erc20` - FLUID token payments (0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0)

## Network Configuration

- **Network**: Fluent Testnet
- **Chain ID**: 20994
- **RPC URL**: https://rpc.testnet.fluent.xyz/
- **Explorer**: https://testnet.fluentscan.xyz/
- **Native Token**: ETH
- **FLUID Token**: 0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0 (Fluent USD - EIP 3009 compliant)
- **Faucet**: https://testnet.fluent.xyz/dev-portal

## Environment Variables

- `FLUENT_RPC_URL`: RPC endpoint for Fluent testnet (provided by user)
- `FACILITATOR_PRIVATE_KEY`: Private key for settlement transactions (optional, for future implementation)
- `SESSION_SECRET`: Session secret for Express (auto-generated)

## Development Status

### Phase 1: Schema & Frontend ✅ 
- Defined complete data models for x402 protocol
- Created theme provider and dark mode support
- Built all UI components:
  - Header with navigation
  - Stats cards for dashboard metrics
  - Transaction table with sorting and filtering
  - Transaction details modal
  - Code blocks for API documentation
- Implemented all pages:
  - Landing page with hero, features, integration preview
  - API documentation with complete endpoint reference (including ERC-20)
  - Dashboard with statistics and transaction monitoring
  
### Phase 2: Backend ✅
- Implemented API endpoints for verify, settle, stats
- Blockchain integration with ethers.js
- Payment verification logic (ETH and FLUID)
- Transaction settlement and monitoring (ETH and FLUID)
- ERC-20 token support with FLUID integration

### Phase 3: Integration & Testing ✅
- Connected frontend to backend
- Error handling and loading states
- Testing completed
- Full MVP ready

## Recent Changes

- 2025-11-01: Initial project setup with schema-first approach
- 2025-11-01: Complete frontend implementation with professional design
- 2025-11-01: All React components and pages built
- 2025-11-01: Dark mode theming configured
- 2025-11-01: Storage interface defined for transaction management
- 2025-11-01: Backend implementation with full blockchain integration
- 2025-11-01: **FLUID ERC-20 token support added**
  - Added `evm-erc20` payment scheme
  - Integrated FLUID contract (0xd8acBC0d60acCCeeF70D9b84ac47153b3895D3d0) - Fluent USD stablecoin with EIP 3009 compliance
  - Updated verification and settlement logic for token transfers
  - Enhanced frontend to display FLUID vs ETH transactions
  - Updated API documentation with ERC-20 examples
- 2025-11-01: **Refactored to true x402-compliant non-custodial model**
  - Changed from facilitator sending own funds to broadcasting user-signed transactions
  - Payment flow now: User signs tx → Facilitator broadcasts → Direct user→recipient transfer
  - Verification parses RLP-encoded signed transactions and validates all parameters
  - Settlement uses `provider.broadcastTransaction()` instead of `wallet.sendTransaction()`
  - Facilitator never holds or controls user funds (trust-minimizing architecture)
  - Updated API documentation with signed transaction creation examples
  - Works with any ERC-20 token (not limited to EIP-3009 support)
- 2025-11-04: **Updated front page with FLUID token showcase**
  - Added FLUID Token Highlight section prominently featuring dual payment support
  - Updated hero badges to show "Supports: ETH + FLUID" and "EIP-3009 Gasless"
  - Added dedicated code examples for both FLUID (evm-erc20) and ETH (evm-native) payment verification
  - Enhanced footer to include FLUID stablecoin information
  - Showcased EIP-3009 gasless transfer capabilities and meta-transaction support
- 2025-11-06: **Added CORS support for direct frontend API calls**
  - Installed and configured `cors` middleware in Express server
  - Enabled cross-origin requests from any origin with `credentials: false`
  - Updated API documentation with comprehensive CORS configuration section
  - Added Privy wallet integration example showing direct API calls from frontend
  - API now supports direct calls from web applications without requiring a backend proxy
  - Enables seamless integration with wallet providers (Privy, MetaMask, WalletConnect, etc.)
- 2025-11-06: **Fixed ERC20 amount parsing bug**
  - Fixed bug where API incorrectly parsed `paymentDetails.amount` using `parseUnits`
  - Changed to use `BigInt()` directly since amounts should already be in wei
  - Updated error messages to show raw wei values for clarity
  - Resolves "Token amount mismatch" errors when integrating with Privy wallets
  - API now correctly accepts amounts in wei (smallest unit) for both ETH and ERC20 tokens

## User Preferences

- Focus on professional, developer-focused design
- Material Design + Linear-inspired minimalism
- Technical precision and clarity
- Inter font for UI, JetBrains Mono for code
- Blue primary color (#3B82F6 / hsl(221, 83%, 53%))
