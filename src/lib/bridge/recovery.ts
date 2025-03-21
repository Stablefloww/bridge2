export const retryTransaction = async (tx: BridgeTransaction) => {
  try {
    useTransactionStore.getState().updateStatus(tx.hash, 'pending')
    
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    
    const res = await signer.sendTransaction({
      ...tx,
      gasPrice: tx.gasPrice ? tx.gasPrice * 1.2 : undefined
    })
    
    return res.hash
  } catch (error) {
    useTransactionStore.getState().updateStatus(tx.hash, 'failed')
    throw error
  }
}

export const cancelTransaction = async (tx: BridgeTransaction) => {
  try {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    
    const cancelTx = await signer.sendTransaction({
      to: tx.from,
      value: 0,
      gasPrice: tx.gasPrice,
      nonce: tx.nonce
    })
    
    return cancelTx.hash
  } catch (error) {
    throw error
  }
} 