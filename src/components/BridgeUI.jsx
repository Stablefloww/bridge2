import React, { useState, useEffect } from 'react';
import { useBridge } from '../hooks/useBridge';
import { useNLP } from '../hooks/useNLP';
import { ethers } from 'ethers';
import { BRIDGE_STATUS } from '../lib/bridge/monitor';
import BridgeError from './BridgeError';
import { Web3Provider } from '@ethersproject/providers';

const BridgeUI = ({ signer }) => {
  // State for form inputs
  const [sourceChain, setSourceChain] = useState('Base');
  const [destChain, setDestChain] = useState('Ethereum');
  const [tokenSymbol, setTokenSymbol] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [slippageTolerance, setSlippageTolerance] = useState(0.5);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'natural'
  const [darkMode, setDarkMode] = useState(false);
  const [bridgeError, setBridgeError] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [ethBalance, setEthBalance] = useState(null);
  const [isLoadingEthBalance, setIsLoadingEthBalance] = useState(false);
  
  // Get bridge hook functions
  const {
    fetchRoutes,
    bridge,
    routes,
    selectedRoute,
    selectRoute,
    isLoadingRoutes,
    isBridging,
    bridgeError: bridgeErrorFromHook,
    bridgeResult,
    transactionStatus,
    useTokenFees,
    toggleTokenFees,
    useGasAbstraction,
    toggleGasAbstraction
  } = useBridge(signer);
  
  // Get NLP hook functions
  const {
    processCommand,
    handleClarification,
    isProcessing: isProcessingNLP,
    result: nlpResult,
    error: nlpError,
    needsClarification,
    clarificationQuestions
  } = useNLP();
  
  // Supported chains for dropdowns
  const supportedChains = ['Ethereum', 'Base', 'Arbitrum', 'Optimism', 'Polygon'];
  
  // Supported tokens for dropdowns
  const supportedTokens = ['ETH', 'USDC', 'USDT', 'DAI'];
  
  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await fetchRoutes({
        sourceChain,
        destChain,
        tokenSymbol,
        amount
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };
  
  // Handle executing the bridge transaction
  const handleBridge = async () => {
    // Clear any previous errors
    setBridgeError(null);
    
    // Validate balance first
    if (tokenBalance && parseFloat(amount) > parseFloat(tokenBalance)) {
      setBridgeError(`Insufficient ${tokenSymbol} balance. You have ${tokenBalance} but need ${amount}`);
      return;
    }
    
    try {
      // Log the start of bridge transaction with ethers
      console.log('Initiating bridge transaction with ethers...');
      
      await bridge({
        sourceChain,
        destChain,
        tokenSymbol,
        amount,
        slippageTolerance,
        useTokenFeesParam: useTokenFees,
        selectedRoute
      });
    } catch (error) {
      console.error('Error bridging tokens:', error);
    }
  };
  
  // Handle natural language input
  const handleNLPSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await processCommand(naturalLanguageInput);
    } catch (error) {
      console.error('Error processing command:', error);
    }
  };
  
  // Handle clarification response
  const handleClarificationSubmit = async (e) => {
    e.preventDefault();
    const clarificationInput = document.getElementById('clarification-input').value;
    
    try {
      await handleClarification(clarificationInput, naturalLanguageInput);
    } catch (error) {
      console.error('Error handling clarification:', error);
    }
  };
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  // Select a specific route
  const handleRouteSelect = (index) => {
    selectRoute(index);
  };
  
  // Update form when NLP result is received
  useEffect(() => {
    if (nlpResult && nlpResult.intent === 'BRIDGE' && !needsClarification) {
      const { sourceChain: src, destChain: dst, tokenSymbol: token, amount: amt } = nlpResult.params;
      
      if (src) setSourceChain(src);
      if (dst) setDestChain(dst);
      if (token) setTokenSymbol(token);
      if (amt) setAmount(amt);
      
      // Fetch routes with the extracted parameters
      fetchRoutes({
        sourceChain: src || sourceChain,
        destChain: dst || destChain,
        tokenSymbol: token || tokenSymbol,
        amount: amt || amount
      });
    }
  }, [nlpResult, needsClarification]);
  
  // Sync bridge hook error with local state
  useEffect(() => {
    if (bridgeErrorFromHook) {
      setBridgeError(bridgeErrorFromHook);
    }
  }, [bridgeErrorFromHook]);
  
  // Render transaction status
  const renderTransactionStatus = () => {
    if (!transactionStatus) return null;
    
    const statusColors = {
      [BRIDGE_STATUS.PENDING]: { bg: '#F3F4F6', text: '#6B7280', icon: '⏳' },
      [BRIDGE_STATUS.SOURCE_CONFIRMED]: { bg: '#EFF6FF', text: '#1E40AF', icon: '✓' },
      [BRIDGE_STATUS.DESTINATION_PENDING]: { bg: '#FEF3C7', text: '#B45309', icon: '⏳' },
      [BRIDGE_STATUS.COMPLETED]: { bg: '#D1FAE5', text: '#047857', icon: '✓' },
      [BRIDGE_STATUS.FAILED]: { bg: '#FEE2E2', text: '#B91C1C', icon: '✗' },
      [BRIDGE_STATUS.UNKNOWN]: { bg: '#F3F4F6', text: '#6B7280', icon: '?' }
    };
    
    const statusStyle = statusColors[transactionStatus.status] || statusColors[BRIDGE_STATUS.UNKNOWN];
    
    return (
      <div className="transaction-status" style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}>
        <div className="status-icon">{statusStyle.icon}</div>
        <div className="status-details">
          <h3>{transactionStatus.status.replace(/_/g, ' ')}</h3>
          <p>{transactionStatus.message}</p>
          {transactionStatus.status === BRIDGE_STATUS.COMPLETED && transactionStatus.destinationTxHash && (
            <a 
              href={`https://${destChain.toLowerCase() === 'ethereum' ? 'etherscan.io' : `${destChain.toLowerCase()}scan.io`}/tx/${transactionStatus.destinationTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="explorer-link"
            >
              View on Block Explorer
            </a>
          )}
        </div>
      </div>
    );
  };
  
  // Add a function to fetch token balance
  const fetchTokenBalance = async () => {
    if (!signer || !tokenSymbol || !sourceChain) return;
    
    setIsLoadingBalance(true);
    try {
      const { getTokenContract } = await import('../lib/tokens/tokenUtils');
      const tokenContract = await getTokenContract(tokenSymbol, sourceChain, signer);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      
      // Format the balance with ethers
      const formattedBalance = ethers.formatUnits(balance, decimals);
      setTokenBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching token balance:", error);
      setTokenBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };
  
  // Add function to fetch ETH balance
  const fetchEthBalance = async () => {
    if (!signer) return;
    
    setIsLoadingEthBalance(true);
    try {
      const address = await signer.getAddress();
      const balance = await signer.provider.getBalance(address);
      
      // Format the balance with ethers
      const formattedBalance = ethers.formatEther(balance);
      setEthBalance(formattedBalance);
    } catch (error) {
      console.error("Error fetching ETH balance:", error);
      setEthBalance(null);
    } finally {
      setIsLoadingEthBalance(false);
    }
  };
  
  // Refetch both balances
  const refreshBalances = () => {
    fetchTokenBalance();
    fetchEthBalance();
  };
  
  // Update useEffect to fetch ETH balance
  useEffect(() => {
    fetchTokenBalance();
    fetchEthBalance();
    
    // Initialize any wallet-related state after connecting
    if (signer) {
      try {
        // Log that we have a connected signer
        console.log('Signer connected:', signer);
      } catch (error) {
        console.error('Error initializing wallet:', error);
      }
    }
  }, [tokenSymbol, sourceChain, signer]);
  
  return (
    <div className={`bridge-ui ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      <div className="header">
        <h1>Cross-Chain Bridge</h1>
        <button 
          onClick={toggleDarkMode} 
          className="theme-toggle"
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
      
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'natural' ? 'active' : ''}`}
          onClick={() => setActiveTab('natural')}
        >
          Natural Language
        </button>
        <button 
          className={`tab ${activeTab === 'form' ? 'active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          Form
        </button>
      </div>
      
      {/* Natural Language Input */}
      {activeTab === 'natural' && (
        <div className="nlp-section">
          <form onSubmit={handleNLPSubmit}>
            <div className="input-group">
              <input
                type="text"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                placeholder="E.g. Bridge 100 USDC from Base to Ethereum"
                className="nlp-input"
                aria-label="Natural language command"
              />
              <button 
                type="submit" 
                disabled={isProcessingNLP || !naturalLanguageInput}
                aria-label="Process command"
              >
                {isProcessingNLP ? 'Processing...' : 'Process'}
              </button>
            </div>
          </form>
          
          {/* NLP Errors */}
          {nlpError && (
            <div className="error-message">
              <p>{nlpError}</p>
            </div>
          )}
          
          {/* Clarification Requests */}
          {needsClarification && (
            <div className="clarification-section">
              <h3>I need some clarification:</h3>
              <ul>
                {clarificationQuestions.map((question, index) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
              <form onSubmit={handleClarificationSubmit}>
                <div className="input-group">
                  <input
                    id="clarification-input"
                    type="text"
                    placeholder="Your response..."
                    className="clarification-input"
                    aria-label="Clarification response"
                  />
                  <button type="submit" aria-label="Submit clarification">Submit</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
      
      {/* Manual Form */}
      {activeTab === 'form' && (
        <div className="form-section">
          <form onSubmit={handleFormSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="sourceChain">Source Chain:</label>
                <select
                  id="sourceChain"
                  value={sourceChain}
                  onChange={(e) => setSourceChain(e.target.value)}
                  aria-label="Source Chain"
                >
                  {supportedChains.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="destChain">Destination Chain:</label>
                <select
                  id="destChain"
                  value={destChain}
                  onChange={(e) => setDestChain(e.target.value)}
                  aria-label="Destination Chain"
                >
                  {supportedChains.map((chain) => (
                    <option key={chain} value={chain}>
                      {chain}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="tokenSymbol">Token:</label>
                <select
                  id="tokenSymbol"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value)}
                  aria-label="Token"
                >
                  {supportedTokens.map((token) => (
                    <option key={token} value={token}>
                      {token}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="amount">Amount:</label>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  aria-label="Amount"
                />
              </div>
              
              <div className="form-group balance-display">
                <label>Your Balance:</label>
                <div className="balance-value">
                  {isLoadingBalance ? (
                    <span className="loading">Loading...</span>
                  ) : tokenBalance ? (
                    <span>
                      {parseFloat(tokenBalance).toFixed(6)} {tokenSymbol}
                      <button 
                        onClick={() => setAmount(tokenBalance)} 
                        className="max-button"
                        type="button"
                      >
                        MAX
                      </button>
                    </span>
                  ) : (
                    <span className="no-balance">No balance found</span>
                  )}
                </div>
              </div>
              
              <div className="form-group balance-display">
                <label>Your ETH Balance:</label>
                <div className="balance-value">
                  {isLoadingEthBalance ? (
                    <span className="loading">Loading...</span>
                  ) : ethBalance ? (
                    <span>{parseFloat(ethBalance).toFixed(6)} ETH</span>
                  ) : (
                    <span className="no-balance">No balance found</span>
                  )}
                  <button 
                    onClick={refreshBalances} 
                    className="refresh-button"
                    type="button"
                    aria-label="Refresh balances"
                  >
                    ↻
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="slippage">Slippage Tolerance (%):</label>
                <input
                  id="slippage"
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={slippageTolerance}
                  onChange={(e) => setSlippageTolerance(parseFloat(e.target.value))}
                  aria-label="Slippage Tolerance"
                />
                <div className="slippage-value">{slippageTolerance}%</div>
              </div>
            </div>
            
            <div className="toggle-options">
              <div className="toggle-option">
                <label htmlFor="useGasAbstraction">Use Gas Abstraction:</label>
                <div className="toggle-switch">
                  <input
                    id="useGasAbstraction"
                    type="checkbox"
                    checked={useGasAbstraction}
                    onChange={toggleGasAbstraction}
                    aria-label="Use Gas Abstraction"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
              
              <div className="toggle-option">
                <label htmlFor="useTokenFees">Pay Bridge Fees with Token:</label>
                <div className="toggle-switch">
                  <input
                    id="useTokenFees"
                    type="checkbox"
                    checked={useTokenFees}
                    onChange={toggleTokenFees}
                    aria-label="Pay Bridge Fees with Token"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="get-routes-button"
              disabled={isLoadingRoutes || !amount}
              aria-label="Get Routes"
            >
              {isLoadingRoutes ? 'Loading Routes...' : 'Get Routes'}
            </button>
          </form>
        </div>
      )}
      
      {/* Transaction Status */}
      {renderTransactionStatus()}
      
      {/* Routes Display */}
      {routes.length > 0 && (
        <div className="routes-section">
          <h2>Available Routes</h2>
          <div className="routes-list">
            {routes.map((route, index) => (
              <div 
                key={index} 
                className={`route-card ${selectedRoute === route ? 'selected' : ''}`}
                onClick={() => handleRouteSelect(index)}
              >
                <div className="route-header">
                  <h3>{route.provider}</h3>
                  {route.bridge && <span className="route-bridge">{route.bridge}</span>}
                </div>
                <div className="route-details">
                  <div className="route-detail">
                    <span className="detail-label">From:</span>
                    <span className="detail-value">{route.sourceChain}</span>
                  </div>
                  <div className="route-detail">
                    <span className="detail-label">To:</span>
                    <span className="detail-value">{route.destChain}</span>
                  </div>
                  <div className="route-detail">
                    <span className="detail-label">Token:</span>
                    <span className="detail-value">{route.tokenSymbol}</span>
                  </div>
                  <div className="route-detail">
                    <span className="detail-label">Amount:</span>
                    <span className="detail-value">{route.amount} {route.tokenSymbol}</span>
                  </div>
                  <div className="route-detail">
                    <span className="detail-label">Fee:</span>
                    <span className="detail-value">{route.fee || route.bridgeFee}</span>
                  </div>
                  <div className="route-detail">
                    <span className="detail-label">Est. Time:</span>
                    <span className="detail-value">{typeof route.estimatedTime === 'number' ? `${Math.round(route.estimatedTime / 60)} mins` : route.estimatedTime}</span>
                  </div>
                  {route.score && (
                    <div className="route-detail score">
                      <span className="detail-label">Score:</span>
                      <span className="detail-value">{(route.score * 100).toFixed(0)}/100</span>
                    </div>
                  )}
                </div>
                {selectedRoute === route && (
                  <div className="selected-indicator">Selected</div>
                )}
              </div>
            ))}
          </div>
          
          <button 
            className="bridge-button"
            onClick={handleBridge}
            disabled={
              isBridging || 
              routes.length === 0 || 
              !selectedRoute || 
              (tokenBalance && parseFloat(amount) > parseFloat(tokenBalance))
            }
            aria-label="Execute Bridge"
          >
            {isBridging ? 'Bridging...' : 'Execute Bridge'}
            {tokenBalance && parseFloat(amount) > parseFloat(tokenBalance) && 
              <span className="insufficient-note"> (Insufficient balance)</span>
            }
          </button>
        </div>
      )}
      
      {/* Bridge Errors */}
      {bridgeError && (
        <BridgeError 
          error={bridgeError} 
          onClose={() => setBridgeError(null)} 
        />
      )}
      
      {/* Bridge Result */}
      {bridgeResult && !transactionStatus && (
        <div className="result-section">
          <h2>Bridge Transaction Initiated</h2>
          <p><strong>Transaction Hash:</strong> {bridgeResult.transactionHash}</p>
          <a 
            href={`https://${sourceChain.toLowerCase() === 'ethereum' ? 'etherscan.io' : `${sourceChain.toLowerCase()}scan.io`}/tx/${bridgeResult.transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            View on Block Explorer
          </a>
        </div>
      )}
      
      <style jsx>{`
        .bridge-ui {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .light-mode {
          background-color: #FFFFFF;
          color: #171717;
        }
        
        .dark-mode {
          background-color: #121212;
          color: #F3F4F6;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        h1, h2, h3 {
          margin: 0;
        }
        
        h1 {
          font-size: 32px;
          font-weight: 700;
          line-height: 40px;
        }
        
        h2 {
          font-size: 24px;
          font-weight: 600;
          line-height: 32px;
          margin-bottom: 16px;
        }
        
        h3 {
          font-size: 20px;
          font-weight: 600;
          line-height: 28px;
        }
        
        .theme-toggle {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 4px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .light-mode .theme-toggle:hover {
          background-color: #F8F9FA;
        }
        
        .dark-mode .theme-toggle:hover {
          background-color: #1E1E1E;
        }
        
        .tabs {
          display: flex;
          margin-bottom: 24px;
          border-bottom: 1px solid;
        }
        
        .light-mode .tabs {
          border-color: #E5E7EB;
        }
        
        .dark-mode .tabs {
          border-color: #374151;
        }
        
        .tab {
          padding: 12px 24px;
          background: none;
          border: none;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
          margin-right: 8px;
        }
        
        .light-mode .tab {
          color: #6B7280;
        }
        
        .dark-mode .tab {
          color: #9CA3AF;
        }
        
        .tab.active {
          border-bottom: 2px solid;
        }
        
        .light-mode .tab.active {
          color: #3B48DF;
          border-color: #3B48DF;
        }
        
        .dark-mode .tab.active {
          color: #5865F2;
          border-color: #5865F2;
        }
        
        .nlp-section, .form-section, .routes-section, .result-section {
          margin-bottom: 32px;
          padding: 24px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }
        
        .light-mode .nlp-section, .light-mode .form-section, .light-mode .routes-section, .light-mode .result-section {
          background-color: #F8F9FA;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
        
        .dark-mode .nlp-section, .dark-mode .form-section, .dark-mode .routes-section, .dark-mode .result-section {
          background-color: #1E1E1E;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .input-group {
          display: flex;
          gap: 8px;
        }
        
        .nlp-input, .clarification-input {
          flex: 1;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .light-mode .nlp-input, .light-mode .clarification-input {
          border-color: #E5E7EB;
          background: #FFFFFF;
          color: #171717;
        }
        
        .dark-mode .nlp-input, .dark-mode .clarification-input {
          border-color: #374151;
          background: #121212;
          color: #F3F4F6;
        }
        
        .light-mode .nlp-input:focus, .light-mode .clarification-input:focus {
          border-color: #3B48DF;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 72, 223, 0.2);
        }
        
        .dark-mode .nlp-input:focus, .dark-mode .clarification-input:focus {
          border-color: #5865F2;
          outline: none;
          box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
        }
        
        button {
          padding: 12px 16px;
          border-radius: 6px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 16px;
        }
        
        .light-mode button {
          background-color: #3B48DF;
          color: white;
        }
        
        .dark-mode button {
          background-color: #5865F2;
          color: white;
        }
        
        .light-mode button:hover:not(:disabled) {
          background-color: #2A37D0;
        }
        
        .dark-mode button:hover:not(:disabled) {
          background-color: #4754E3;
        }
        
        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          font-size: 14px;
        }
        
        select, input[type="text"] {
          width: 100%;
          padding: 12px;
          border-radius: 6px;
          border: 1px solid;
          font-size: 16px;
          transition: all 0.2s;
        }
        
        .light-mode select, .light-mode input[type="text"] {
          border-color: #E5E7EB;
          background: #FFFFFF;
          color: #171717;
        }
        
        .dark-mode select, .dark-mode input[type="text"] {
          border-color: #374151;
          background: #121212;
          color: #F3F4F6;
        }
        
        .light-mode select:focus, .light-mode input[type="text"]:focus {
          border-color: #3B48DF;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 72, 223, 0.2);
        }
        
        .dark-mode select:focus, .dark-mode input[type="text"]:focus {
          border-color: #5865F2;
          outline: none;
          box-shadow: 0 0 0 2px rgba(88, 101, 242, 0.2);
        }
        
        .get-routes-button, .bridge-button {
          width: 100%;
          margin-top: 16px;
          padding: 14px;
        }
        
        .bridge-button {
          background-color: #10B981;
          color: white;
        }
        
        .bridge-button:hover:not(:disabled) {
          background-color: #059669;
        }
        
        .routes-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .route-card {
          padding: 16px;
          border-radius: 8px;
          border: 2px solid;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }
        
        .light-mode .route-card {
          border-color: #E5E7EB;
          background-color: #FFFFFF;
        }
        
        .dark-mode .route-card {
          border-color: #374151;
          background-color: #1E1E1E;
        }
        
        .light-mode .route-card:hover {
          border-color: #D1D5DB;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        
        .dark-mode .route-card:hover {
          border-color: #4B5563;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
        }
        
        .light-mode .route-card.selected {
          border-color: #3B48DF;
          box-shadow: 0 0 0 1px #3B48DF;
        }
        
        .dark-mode .route-card.selected {
          border-color: #5865F2;
          box-shadow: 0 0 0 1px #5865F2;
        }
        
        .route-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid;
        }
        
        .light-mode .route-header {
          border-color: #E5E7EB;
        }
        
        .dark-mode .route-header {
          border-color: #374151;
        }
        
        .route-bridge {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: #f3f4f6;
          color: #6b7280;
        }
        
        .route-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .route-detail {
          display: flex;
          flex-direction: column;
        }
        
        .detail-label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .detail-value {
          font-weight: 500;
        }
        
        .route-detail.score {
          grid-column: span 2;
          margin-top: 8px;
        }
        
        .score .detail-value {
          color: #10B981;
        }
        
        .selected-indicator {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #3B48DF;
          color: white;
          padding: 4px 8px;
          font-size: 12px;
          border-bottom-left-radius: 8px;
        }
        
        .dark-mode .selected-indicator {
          background-color: #5865F2;
        }
        
        .error-message {
          margin: 16px 0;
          padding: 12px;
          border-radius: 6px;
          background-color: #FEE2E2;
          color: #B91C1C;
        }
        
        .dark-mode .error-message {
          background-color: rgba(185, 28, 28, 0.2);
        }
        
        .clarification-section {
          margin-top: 16px;
          padding: 16px;
          border-radius: 6px;
          background-color: #EFF6FF;
          color: #1E40AF;
        }
        
        .dark-mode .clarification-section {
          background-color: rgba(30, 64, 175, 0.2);
        }
        
        .clarification-section h3 {
          margin-bottom: 8px;
          color: #1E40AF;
        }
        
        .dark-mode .clarification-section h3 {
          color: #93C5FD;
        }
        
        .clarification-section ul {
          margin-bottom: 16px;
          padding-left: 20px;
        }
        
        .transaction-status {
          display: flex;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          align-items: center;
        }
        
        .status-icon {
          font-size: 24px;
          margin-right: 16px;
        }
        
        .status-details h3 {
          margin-bottom: 4px;
        }
        
        .explorer-link {
          display: inline-block;
          margin-top: 8px;
          text-decoration: none;
          color: #3B48DF;
          font-weight: 500;
        }
        
        .dark-mode .explorer-link {
          color: #5865F2;
        }
        
        .explorer-link:hover {
          text-decoration: underline;
        }
        
        .slippage-value {
          margin-top: 4px;
          font-size: 14px;
          text-align: right;
        }
        
        .toggle-options {
          margin: 20px 0;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .toggle-option {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        
        input:checked + .toggle-slider {
          background-color: #10B981;
        }
        
        input:focus + .toggle-slider {
          box-shadow: 0 0 1px #10B981;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        
        .dark-mode .toggle-slider {
          background-color: #4B5563;
        }
        
        .dark-mode input:checked + .toggle-slider {
          background-color: #10B981;
        }
        
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          
          .routes-list {
            grid-template-columns: 1fr;
          }
        }
        
        .balance-display {
          grid-column: span 2;
          margin-top: -8px;
        }
        
        .balance-value {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 14px;
          background-color: #F3F4F6;
        }
        
        .dark-mode .balance-value {
          background-color: #1F2937;
        }
        
        .loading {
          color: #6B7280;
        }
        
        .no-balance {
          color: #6B7280;
          font-style: italic;
        }
        
        .max-button {
          padding: 2px 6px;
          font-size: 12px;
          background-color: #10B981;
          color: white;
          border-radius: 4px;
          margin-left: 8px;
        }
        
        .refresh-button {
          padding: 2px 6px;
          font-size: 14px;
          background-color: transparent;
          color: #6B7280;
          border-radius: 4px;
          margin-left: 8px;
          transition: all 0.2s;
        }
        
        .refresh-button:hover {
          background-color: #E5E7EB;
          color: #374151;
          transform: rotate(180deg);
        }
        
        .dark-mode .refresh-button {
          color: #9CA3AF;
        }
        
        .dark-mode .refresh-button:hover {
          background-color: #374151;
          color: #F3F4F6;
        }
        
        .insufficient-note {
          font-size: 12px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
};

export default BridgeUI; 