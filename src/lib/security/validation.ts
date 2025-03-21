import { isAddress } from "ethers"

export const isValidAddress = (address: string): boolean => {
  return isAddress(address)
}

export const isContractAddress = async (provider: any, address: string): Promise<boolean> => {
  const code = await provider.getCode(address)
  return code !== '0x'
}

export const validateDestination = async (
  provider: any,
  address: string
): Promise<{ valid: boolean; isContract: boolean }> => {
  if (!isValidAddress(address)) return { valid: false, isContract: false }
  
  const isContract = await isContractAddress(provider, address)
  return { valid: true, isContract }
} 