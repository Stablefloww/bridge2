// Mock implementation of ethers
export const utils = {
  formatEther: (value: any) => `${value / 1e18}`,
  parseEther: (value: any) => value * 1e18,
  formatUnits: (value: any, unit: any) => `${value / Math.pow(10, unit)}`,
  parseUnits: (value: any, unit: any) => value * Math.pow(10, unit),
};

export const providers = {
  JsonRpcProvider: function() {
    return {
      getGasPrice: async () => 2000000000,
      estimateGas: async () => 250000,
    };
  },
};

export const Contract = function() {
  return {
    connect: function() { return this; },
    quoteLayerZeroFee: async () => [100000, 0],
    swap: async () => ({
      hash: '0xmocktransactionhash',
      wait: async () => ({ status: 1 }),
    }),
    sendTransaction: async () => ({
      hash: '0xmocktransactionhash',
      wait: async () => ({ status: 1 }),
    }),
  };
};

export const Wallet = function() {
  return {
    connect: function() { return this; },
    getAddress: async () => '0xmockaddress',
  };
}; 