# Natural Language Cross-Chain Bridge for Base

A zero-friction bridge interface that enables users to bridge assets between Base and other EVM-compatible chains using natural language commands. The system handles complex bridging operations behind a simple conversational interface, with gas fees automatically paid in the bridged currency via Biconomy gas abstraction.

## Features

- **Natural Language Processing**: Bridge tokens by simply typing commands like "Send 100 USDC to Arbitrum"
- **Native Asset Bridging**: Preserves native token functionality without wrapped tokens
- **Gas Abstraction**: Pay transaction fees in the bridged token itself (no ETH needed)
- **Instant Guaranteed Finality**: Secure and reliable bridging with Stargate
- **Multiple Chain Support**: Bridge between Base and popular EVM chains (Ethereum, Arbitrum, Optimism, etc.)

## Architecture

The project follows these key components:

1. **NLP Processor**: Parses natural language commands to extract bridge parameters
2. **Stargate Integration**: Utilizes Stargate Protocol for secure cross-chain bridging
3. **Biconomy Gas Abstraction**: Enables users to pay transaction fees in the bridged token
4. **React/Next.js Frontend**: Provides a simple chat interface for entering bridge commands

## Technical Implementation

### NLP Processing

The natural language processing pipeline:
- Parses user input to extract parameters (source chain, destination chain, token, amount)
- Normalizes chain names and token symbols
- Handles incomplete commands by requesting clarification
- Provides feedback on command interpretation

### Stargate Integration

Stargate Protocol is used as the primary bridge provider:
- Direct integration with Stargate Router contracts
- Support for multiple tokens (ETH, USDC, USDT, etc.)
- Optimized for security and transaction finality
- Support for pool-to-pool native asset bridging

### Biconomy Gas Abstraction

Biconomy enables gas-free transactions:
- EIP-2771 meta-transactions for gasless transactions
- Users pay fees in the bridged token rather than ETH
- Signature-based transaction authorization
- Gas estimations and fee calculations handled automatically

## Setup Instructions

### Prerequisites

- Node.js 18+
- Wallet with funds on Base
- Biconomy API key (for gas abstraction)

### Environment Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in required values:
   - RPC URLs for supported chains
   - Biconomy API key
   - Wallet configuration (for testing)

3. Install dependencies:
```bash
npm install
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Connect your wallet using the "Connect Wallet" button
2. Type a bridge command in the chat interface, such as:
   - "Bridge 50 USDC to Arbitrum"
   - "Send 0.1 ETH to Optimism"
   - "Transfer 100 USDT from Base to Polygon"
3. Review the interpretation of your command
4. Confirm the transaction when prompted
5. Monitor progress on the bridge status page

## Supported Chains

- Base (default source chain)
- Ethereum
- Arbitrum
- Optimism
- Polygon
- Avalanche
- BSC
- Linea
- zkSync
- Scroll

## Supported Tokens

- ETH
- USDC
- USDT
- DAI (coming soon)

## Testing

Run the test suite to verify functionality:

```bash
npm test
```

This includes tests for:
- NLP command parsing
- Bridge provider integration
- Gas abstraction mechanism
- Contract interactions

## Security Considerations

- All bridge operations use Stargate's security model
- User signatures are required for all transactions
- Gas abstraction follows EIP-2771 standard
- Rate limiting is implemented to prevent abuse

## License

MIT 