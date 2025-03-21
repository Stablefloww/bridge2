# Base Tools MCP - Natural Language Bridge

A Model Context Protocol server for Base Network interactions with natural language bridge capabilities.

## Project Structure

The project is organized as follows:

```
base-tools-mcp/
├── src/                      # Application source code
│   ├── app/                  # Next.js application
│   ├── components/           # React components
│   │   ├── BridgeUI.jsx      # Main bridge UI component
│   │   ├── BridgeError.jsx   # Error handling component
│   │   └── BridgeInterface.tsx # Bridge interface component
│   ├── hooks/                # React hooks
│   ├── lib/                  # Utility libraries
│   │   ├── bridge/           # Bridge functionality
│   │   ├── gasless/          # Gas abstraction
│   │   ├── nlp/              # Natural language processing
│   │   ├── tokens/           # Token utilities
│   │   └── utils/            # General utilities
│   ├── services/             # API services
│   ├── store/                # State management
│   └── types/                # TypeScript types
├── test/                     # Test files
├── server.js                 # Express server
├── base-tools-mcp.js         # MCP server implementation
└── cursor-mcp-config.json    # MCP configuration
```

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```
   This will start the server on the port specified in your `.env.local` file (default: 3000).
   You can access the application at `http://localhost:PORT` where PORT is the value from your `.env.local`.

3. Run tests:
   ```
   npm test
   ```

4. Start the MCP server:
   ```
   npm start
   ```

5. All-in-one build and run:
   ```
   npm run build
   ```
   This will run tests and then start the server.

## Main Components

- **BridgeUI.jsx**: The main UI component for the bridge functionality
- **server.js**: Express server for API endpoints
- **base-tools-mcp.js**: MCP server implementation for Base Network interactions

## Features

- Natural language bridge commands
- Multiple bridge provider support
- Gas abstraction for improved UX
- Token fee payment (no ETH required)
- Real-time transaction monitoring

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```
PORT=3002  # The port the server will run on
SEED_PHRASE=your_seed_phrase
COINBASE_API_KEY_NAME=builder
COINBASE_API_PRIVATE_KEY=your_private_key
COINBASE_KEY_ID=your_key_id
COINBASE_PROJECT_ID=your_project_id
```

## Server API Endpoints

- `GET /`: Home page with Bridge UI
- `POST /api/nlp`: Process natural language commands
- `GET /api/balance`: Get wallet balance
- `POST /api/execute-bridge`: Execute a bridge transaction

## License

MIT 