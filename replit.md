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
1. `/api/verify` - Payment verification endpoint (supports ETH and fUSD)
2. `/api/settle` - Payment settlement endpoint (supports ETH and fUSD)
3. `/api/stats` - Statistics and recent transactions
4. Dashboard with real-time transaction monitoring
5. Comprehensive API documentation with ERC-20 examples
6. Professional landing page
7. **Payment Schemes**:
   - `evm-native` - Native ETH payments
   - `evm-erc20` - fUSD token payments (0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9)

## Network Configuration

- **Network**: Fluent Testnet
- **Chain ID**: 20994
- **RPC URL**: https://rpc.testnet.fluent.xyz/
- **Explorer**: https://testnet.fluentscan.xyz/
- **Native Token**: ETH
- **fUSD Token**: 0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9
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
- Payment verification logic (ETH and fUSD)
- Transaction settlement and monitoring (ETH and fUSD)
- ERC-20 token support with fUSD integration

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
- 2025-11-01: **fUSD ERC-20 token support added**
  - Added `evm-erc20` payment scheme
  - Integrated fUSD contract (0x7A9ab9D0E2ca7472d1339F082F79F2F712F8Ebc9)
  - Updated verification and settlement logic for token transfers
  - Enhanced frontend to display fUSD vs ETH transactions
  - Updated API documentation with ERC-20 examples

## User Preferences

- Focus on professional, developer-focused design
- Material Design + Linear-inspired minimalism
- Technical precision and clarity
- Inter font for UI, JetBrains Mono for code
- Blue primary color (#3B82F6 / hsl(221, 83%, 53%))
