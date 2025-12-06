import axios, { AxiosInstance } from 'axios';
import { Buffer } from 'buffer';
import {
  RPCTickInfoResponse,
  RPCTransactionResponse,
  RPCQuerySmartContractRequest,
  RPCQuerySmartContractResponse,
  QubicTick,
  RawTransaction,
} from '../types';
import { getRpcUrl } from '../config';

/**
 * QubicRPCService - Handles all RPC interactions with Qubic network
 * 
 * This service provides methods to:
 * - Get current tick information
 * - Fetch transactions by tick
 * - Query smart contracts (read-only)
 * - Broadcast transactions (write operations)
 */
export class QubicRPCService {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(customRpcUrl?: string) {
    this.baseUrl = customRpcUrl || getRpcUrl();
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[RPC Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[RPC Request Error]', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`[RPC Response] ${response.config.url} - Status: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('[RPC Response Error]', error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get current tick information
   * Essential for scheduling transactions and tracking blockchain state
   */
  async getCurrentTick(): Promise<QubicTick> {
    try {
      const response = await this.client.get<RPCTickInfoResponse>('/v1/tick-info');
      
      return {
        tick: response.data.tickInfo.tick,
        epoch: response.data.tickInfo.epoch,
        duration: response.data.tickInfo.duration,
      };
    } catch (error) {
      console.error('Failed to get current tick:', error);
      throw new Error('Failed to fetch current tick from Qubic RPC');
    }
  }

  /**
   * Get transactions for a specific tick
   * Returns all approved transactions that were executed in that tick
   */
  async getTransactionsByTick(tick: number): Promise<RawTransaction[]> {
    try {
      const response = await this.client.get(`/v1/tick-transactions/${tick}`);
      
      if (!response.data || !response.data.transactions) {
        return [];
      }

      return response.data.transactions.map((tx: any) => ({
        sourceId: tx.sourceId,
        destId: tx.destId,
        amount: BigInt(tx.amount || 0),
        tick: tx.tickNumber,
        inputType: tx.inputType,
        inputSize: tx.inputSize,
        signatureHex: tx.signatureHex,
        txId: tx.txId,
      }));
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Tick not found or no transactions
        return [];
      }
      console.error(`Failed to get transactions for tick ${tick}:`, error.message);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific tick
   */
  async getTickInfo(tick: number): Promise<any> {
    try {
      const response = await this.client.get(`/v1/tick-info/${tick}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get tick info for ${tick}:`, error);
      throw error;
    }
  }

  /**
   * Query a smart contract function (read-only operation)
   * 
   * @param contractIndex - The index of the smart contract (QX = 1)
   * @param inputType - The function type to call
   * @param inputSize - Size of the input data in bytes
   * @param requestData - Base64 encoded request payload
   */
  async querySmartContract(
    contractIndex: number,
    inputType: number,
    inputSize: number,
    requestData: string
  ): Promise<string> {
    try {
      const request: RPCQuerySmartContractRequest = {
        contractIndex,
        inputType,
        inputSize,
        requestData,
      };

      const response = await this.client.post<RPCQuerySmartContractResponse>(
        '/v1/querySmartContract',
        request
      );

      return response.data.responseData;
    } catch (error) {
      console.error('Failed to query smart contract:', error);
      throw error;
    }
  }

  /**
   * Get balance for a specific identity
   */
  async getBalance(identity: string): Promise<bigint> {
    try {
      const response = await this.client.get(`/v1/balances/${identity}`);
      
      if (response.data && response.data.balance) {
        return BigInt(response.data.balance.balance || 0);
      }
      
      return BigInt(0);
    } catch (error) {
      console.error(`Failed to get balance for ${identity}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction status by transaction ID
   */
  async getTransactionStatus(txId: string): Promise<any> {
    try {
      const response = await this.client.get(`/v1/transaction-status/${txId}`);
      return response.data;
    } catch (error) {
      console.error(`Failed to get transaction status for ${txId}:`, error);
      throw error;
    }
  }

  /**
   * Get network status
   */
  async getNetworkStatus(): Promise<any> {
    try {
      const response = await this.client.get('/v1/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get network status:', error);
      throw error;
    }
  }

  /**
   * Get transfers for an identity within a tick range
   */
  async getTransfers(identity: string, fromTick: number, toTick: number): Promise<any[]> {
    try {
      const response = await this.client.get(
        `/v1/transfers/${identity}/${fromTick}/${toTick}`
      );
      return response.data.transfers || [];
    } catch (error) {
      console.error(`Failed to get transfers for ${identity}:`, error);
      throw error;
    }
  }

  /**
   * Live Tree: Get all asset issuances (tokens created on QX)
   */
  async getAssetIssuances(): Promise<any[]> {
    try {
      const response = await this.client.get('/assets/issuances');
      return response.data.issuances || [];
    } catch (error) {
      console.error('Failed to get asset issuances:', error);
      throw error;
    }
  }

  /**
   * Live Tree: Get assets issued by a specific identity
   */
  async getIssuedAssets(identity: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/assets/${identity}/issued`);
      return response.data.issuedAssets || [];
    } catch (error) {
      console.error(`Failed to get issued assets for ${identity}:`, error);
      throw error;
    }
  }

  /**
   * Live Tree: Get assets owned by a specific identity
   */
  async getOwnedAssets(identity: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/assets/${identity}/owned`);
      return response.data.ownedAssets || [];
    } catch (error) {
      console.error(`Failed to get owned assets for ${identity}:`, error);
      throw error;
    }
  }

  /**
   * Live Tree: Get assets possessed (held) by a specific identity
   */
  async getPossessedAssets(identity: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/assets/${identity}/possessed`);
      return response.data.possessedAssets || [];
    } catch (error) {
      console.error(`Failed to get possessed assets for ${identity}:`, error);
      throw error;
    }
  }

  /**
   * Live Tree: Get all ownerships (who owns which assets)
   */
  async getAssetOwnerships(): Promise<any[]> {
    try {
      const response = await this.client.get('/assets/ownerships');
      return response.data.ownerships || [];
    } catch (error) {
      console.error('Failed to get asset ownerships:', error);
      throw error;
    }
  }

  /**
   * Live Tree: Get all possessions (who holds which assets)
   */
  async getAssetPossessions(): Promise<any[]> {
    try {
      const response = await this.client.get('/assets/possessions');
      return response.data.possessions || [];
    } catch (error) {
      console.error('Failed to get asset possessions:', error);
      throw error;
    }
  }

  /**
   * Utility: Decode base64 response data to Buffer
   */
  decodeBase64Response(base64Data: string): Buffer {
    return Buffer.from(base64Data, 'base64');
  }

  /**
   * Utility: Encode Buffer to base64 for request
   */
  encodeToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
  }
}

// Singleton instance
let rpcServiceInstance: QubicRPCService | null = null;

export function getRPCService(customRpcUrl?: string): QubicRPCService {
  if (!rpcServiceInstance || customRpcUrl) {
    rpcServiceInstance = new QubicRPCService(customRpcUrl);
  }
  return rpcServiceInstance;
}
