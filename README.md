# Base Tools MCP - Natural Language Bridge

A Model Context Protocol server for Base Network interactions with natural language bridge capabilities. This project enables users to bridge assets between Base and other EVM-compatible chains using natural language commands, with seamless gas handling and multi-provider support.

## Project Overview

The Base Tools MCP provides a conversational interface for blockchain bridging operations. Users can type commands like "Send 50 USDC to Arbitrum" and the system handles the complex cross-chain operations behind the scenes, including:

- Natural language command parsing
- Multi-chain routing optimization
- Gas fee abstraction (pay fees in the token being bridged)
- Transaction monitoring and status updates
- Error recovery and handling

## Project Structure

The project is organized as follows:

```
base-tools-mcp/
├── src/                      # Application source code
│   ├── app/                  # Next.js application
│   │   ├── api/              # API route handlers
│   │   ├── bridge/           # Bridge page components
│   │   ├── history/          # Transaction history page
│   │   ├── layout.tsx        # Root layout component
│   │   └── page.tsx          # Home page component
│   ├── components/           # React components
│   │   ├── BridgeUI.jsx      # Main bridge UI component (1200+ lines)
│   │   ├── BridgeError.jsx   # Error handling component
│   │   ├── BridgeInterface.tsx # Bridge interface component
│   │   ├── common/           # Shared UI components
│   │   ├── chat/             # Chat interface components
│   │   └── wallet/           # Wallet connection components
│   ├── hooks/                # React hooks
│   │   ├── useBridge.js      # Bridge functionality hook
│   │   ├── useNLP.js         # Natural language processing hook
│   │   └── useWallet.js      # Wallet connection hook
│   ├── lib/                  # Utility libraries
│   │   ├── bridge/           # Bridge functionality
│   │   │   ├── monitor.js    # Transaction monitoring
│   │   │   ├── providers.js  # Bridge provider integrations
│   │   │   └── socket.js     # Socket protocol integration
│   │   ├── gasless/          # Gas abstraction
│   │   │   └── biconomy.js   # Biconomy integration
│   │   ├── nlp/              # Natural language processing
│   │   │   ├── bridgeNLP.js  # NLP command parser
│   │   │   └── nlpProcessor.js # NLP engine
│   │   ├── tokens/           # Token utilities
│   │   │   └── tokenUtils.js # Token-related functions
│   │   └── utils/            # General utilities
│   ├── services/             # API services
│   ├── store/                # State management
│   └── types/                # TypeScript types
├── test/                     # Test files
│   ├── unit/                 # Unit tests
│   │   ├── bridge/           # Bridge-related tests
│   │   └── nlp/              # NLP-related tests
│   └── bridge-test.js        # Integration tests
├── server.js                 # Express server (400+ lines)
├── base-tools-mcp.js         # MCP server implementation
└── cursor-mcp-config.json    # MCP configuration
```

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or later)
- npm (v7 or later)
- A modern web browser
- Access to Base Network RPC endpoints

## Getting Started

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/base-tools-mcp.git
   cd base-tools-mcp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Then edit `.env.local` to add your specific configuration values.

### Configuration

The following environment variables are required:

```
PORT=3002                # The port the server will run on
SEED_PHRASE=your_phrase  # Wallet seed phrase for testing
COINBASE_API_KEY_NAME=builder
COINBASE_API_PRIVATE_KEY=your_private_key
COINBASE_KEY_ID=your_key_id
COINBASE_PROJECT_ID=your_project_id
BASE_RPC_URL=https://mainnet.base.org  # Base network RPC URL
ETH_RPC_URL=https://ethereum.publicnode.com  # Ethereum RPC URL
ARB_RPC_URL=https://arb1.arbitrum.io/rpc  # Arbitrum RPC URL
OP_RPC_URL=https://mainnet.optimism.io  # Optimism RPC URL
POLYGON_RPC_URL=https://polygon-rpc.com  # Polygon RPC URL
```

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
   This starts the server on the port specified in your `.env.local` file (default: 3000).
   You can access the web interface at `http://localhost:PORT`.

2. Run tests:
   ```bash
   npm test
   ```
   For specific test files:
   ```bash
   npm test -- --testMatch="**/src/lib/nlp/**/*.test.js"
   ```

3. Start the MCP server:
   ```bash
   npm start
   ```
   This runs the Model Context Protocol server for AI interactions.

4. All-in-one build and run:
   ```bash
   npm run build
   ```
   This runs tests and then starts the server.

## Architecture

### Core Components

#### 1. Natural Language Processing (NLP) Engine
The NLP engine is responsible for parsing user commands and extracting relevant parameters:

- **bridgeNLP.js**: Processes natural language commands and extracts parameters like source chain, destination chain, token symbol, and amount.
- **nlpProcessor.js**: Higher-level NLP processing with intent detection and parameter validation.

Example processing flow:
```
"Send 100 USDC to Arbitrum" → {
  intent: "bridge",
  sourceChain: "base", // Default if not specified
  destinationChain: "arbitrum",
  tokenSymbol: "USDC",
  amount: "100"
}
```

#### 2. Bridge Provider Integration
Multiple bridge protocols are supported through a provider abstraction layer:

- **providers.js**: Generic interface for all bridge providers
- **socket.js**: Integration with Socket protocol
- **Stargate Router**: Direct integration with Stargate Protocol contracts

#### 3. Gas Abstraction
Pay for transactions using the bridged token instead of requiring ETH:

- **biconomy.js**: Biconomy SDK integration for meta-transactions
- **Gas estimation**: Accurate fee calculation across chains

#### 4. Transaction Monitoring
Real-time tracking of bridge transactions:

- **monitor.js**: Monitors transaction status across chains
- Status polling with automatic retries and error handling

### Data Flow

1. User inputs natural language command
2. NLP engine parses command and extracts parameters
3. System verifies parameters and requests clarification if needed
4. Bridge providers are queried for available routes
5. Best route is selected based on fees, speed, and reliability
6. Transaction is prepared and sent to the blockchain
7. System monitors transaction until completion
8. Result is displayed to the user

## API Reference

### Server API Endpoints

#### 1. Process Natural Language Commands
```
POST /api/nlp
```

**Request Body:**
```json
{
  "command": "bridge 100 USDC from Base to Ethereum"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "sourceChain": "base",
    "destinationChain": "ethereum",
    "tokenSymbol": "USDC",
    "amount": "100",
    "gasPreference": "normal"
  }
}
```

#### 2. Get Wallet Balance
```
GET /api/balance?chain=base&token=USDC
```

**Response:**
```json
{
  "success": true,
  "balance": "1250.50",
  "address": "0xabc...",
  "chain": "base",
  "tokenSymbol": "USDC"
}
```

#### 3. Execute Bridge Transaction
```
POST /api/execute-bridge
```

**Request Body:**
```json
{
  "sourceChain": "base",
  "destinationChain": "arbitrum",
  "token": "USDC",
  "amount": "10",
  "gasPreference": "normal",
  "walletAddress": "0xabc..."
}
```

**Response:**
```json
{
  "success": true,
  "transactionHash": "0x123...",
  "estimatedTimeMinutes": 15,
  "fee": "1.25",
  "feeToken": "USDC"
}
```

### MCP Function Reference

The Base Tools MCP server implements these functions:

- `get-address`: Retrieve the wallet address
- `list-balances`: Display balances for connected wallet
- `transfer-funds`: Send funds to another address
- `erc20-balance`: Get token balance for a specific contract
- `erc20-transfer`: Transfer ERC20 tokens

## Usage Examples

### Example 1: Basic Bridge Command
```
bridge 100 USDC to Arbitrum
```
This will bridge 100 USDC from the default chain (Base) to Arbitrum.

### Example 2: Specifying Source Chain
```
send 0.5 ETH from Ethereum to Optimism
```
This specifies Ethereum as the source chain, with 0.5 ETH being sent to Optimism.

### Example 3: Checking Balance
```
check my USDC balance on Base
```
This queries the USDC balance on Base for the connected wallet.

### Example 4: Gas Preferences
```
bridge 50 USDC to Polygon with fast gas
```
This bridges 50 USDC to Polygon with priority gas settings.

## Supported Chains

- Base (default source chain)
- Ethereum
- Arbitrum
- Optimism
- Polygon

## Supported Tokens

- ETH (Native)
- USDC
- USDT
- DAI

## Troubleshooting

### Common Issues

#### Server Won't Start
- Check if the specified port is already in use
- Verify that all environment variables are set correctly
- Ensure you have the correct Node.js version (v18+)

```bash
# Check if port is in use
lsof -i :3002
# Kill process using port if needed
kill -9 <PID>
```

#### Bridge Transaction Fails
- Verify you have sufficient token balance
- Check if the destination chain is supported
- Ensure the token is supported on both chains
- Verify gas settings are appropriate

#### NLP Command Not Recognized
- Try rephrasing the command
- Use the format: "bridge [amount] [token] to [destination]"
- Make sure to use supported chain and token names

### Logs and Debugging

To enable verbose logging:
```
DEBUG=true npm run dev
```

For transaction-specific logs:
```
DEBUG=bridge:* npm run dev
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Style Guidelines
- Use ES modules (`import`/`export`) instead of CommonJS (`require`)
- Follow the existing code style and formatting
- Write tests for new features
- Keep components modular and focused

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Base Network](https://base.org/) for the underlying blockchain infrastructure
- [Stargate Protocol](https://stargate.finance/) for cross-chain bridging capabilities
- [Biconomy](https://biconomy.io/) for gas abstraction functionality
- [Socket](https://socket.tech/) for bridge aggregation services 