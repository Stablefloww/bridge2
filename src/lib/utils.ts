import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Batches multiple similar requests into a single API call
 * Improves performance by reducing the number of network requests
 */
export class BatchRequest {
  private queue: Map<string, {
    promise: Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private batchWindow: number;

  constructor(batchWindow: number = 300) {
    this.batchWindow = batchWindow;
  }

  add<T, R>(params: T, batchFn: (batchedParams: T[]) => Promise<R[]>): Promise<R> {
    const key = JSON.stringify(params);
    
    if (this.queue.has(key)) {
      return this.queue.get(key)!.promise;
    }
    
    // Create promise with externally accessible resolve/reject functions
    let resolver: (value: R) => void;
    let rejecter: (reason: any) => void;
    
    const promise = new Promise<R>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });
    
    // TypeScript requires these assertions because the variables are
    // set within the Promise constructor
    this.queue.set(key, { 
      promise, 
      resolve: resolver!, 
      reject: rejecter! 
    });
    
    if (!this.timer) {
      this.timer = setTimeout(async () => {
        const currentQueue = new Map(this.queue);
        this.queue.clear();
        this.timer = null;
        
        const keys = Array.from(currentQueue.keys());
        const paramsList = keys.map(k => JSON.parse(k));
        
        try {
          const results = await batchFn(paramsList);
          keys.forEach((k, i) => {
            const resolver = currentQueue.get(k);
            if (resolver) {
              resolver.resolve(results[i]);
            }
          });
        } catch (error) {
          keys.forEach((k) => {
            const resolver = currentQueue.get(k);
            if (resolver) {
              resolver.reject(error);
            }
          });
        }
      }, this.batchWindow);
    }
    
    return promise;
  }
} 