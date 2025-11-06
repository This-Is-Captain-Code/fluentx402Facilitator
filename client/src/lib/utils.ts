import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWeiToEth(weiAmount: string, maxDecimals: number = 8): string {
  try {
    const wei = BigInt(weiAmount);
    
    if (wei === BigInt(0)) {
      return "0";
    }
    
    const ethDivisor = BigInt("1000000000000000000");
    const ethWhole = wei / ethDivisor;
    const ethRemainder = wei % ethDivisor;
    
    if (ethRemainder === BigInt(0)) {
      return ethWhole.toString();
    }
    
    const remainderStr = ethRemainder.toString().padStart(18, '0');
    const trimmedDecimal = remainderStr.replace(/0+$/, '');
    
    if (trimmedDecimal === '') {
      return ethWhole.toString();
    }
    
    const finalDecimal = trimmedDecimal.length > maxDecimals 
      ? trimmedDecimal.slice(0, maxDecimals)
      : trimmedDecimal;
    
    return `${ethWhole}.${finalDecimal}`;
  } catch (error) {
    return "0";
  }
}
