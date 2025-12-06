import { Buffer } from 'buffer';
import {
  RawTransaction,
  DecodedQXTransaction,
  QXInputType,
  QXOrder,
} from '../types';
import { config } from '../config';

/**
 * QXTransactionDecoder - Decodes QX smart contract transactions
 * 
 * This decoder analyzes transactions sent to the QX contract (DEX) and extracts:
 * - Operation type (BUY, SELL, TRANSFER, etc.)
 * - Asset information (issuer, name)
 * - Order details (price, shares, total value)
 * 
 * Key insight: inputType determines the operation:
 * - inputType 6 = AddToBidOrder = BUY
 * - inputType 5 = AddToAskOrder = SELL
 * - inputType 2 = TransferShares = TRANSFER
 * - inputType 1 = IssueAsset = ISSUE
 */
export class QXTransactionDecoder {
  private readonly QX_CONTRACT_ADDRESS = config.qubic.qx.contractAddress;

  /**
   * Check if a transaction is targeting the QX contract
   */
  isQXTransaction(tx: RawTransaction): boolean {
    return tx.destId === this.QX_CONTRACT_ADDRESS;
  }

  /**
   * Decode a QX transaction and extract all relevant information
   */
  decode(tx: RawTransaction): DecodedQXTransaction | null {
    if (!this.isQXTransaction(tx)) {
      return null;
    }

    const operation = this.getOperationType(tx.inputType);
    if (!operation) {
      return null;
    }

    const decoded: DecodedQXTransaction = {
      ...tx,
      contractIndex: config.qubic.qx.contractIndex,
      operation,
      asset: {
        issuer: '',
        name: '',
      },
    };

    // Decode based on operation type
    switch (operation) {
      case 'BUY':
        return this.decodeBidOrder(decoded, tx);
      case 'SELL':
        return this.decodeAskOrder(decoded, tx);
      case 'TRANSFER':
        return this.decodeTransfer(decoded, tx);
      case 'ISSUE':
        return this.decodeIssue(decoded, tx);
      default:
        return decoded;
    }
  }

  /**
   * Map inputType to operation name
   */
  private getOperationType(inputType: number): DecodedQXTransaction['operation'] | null {
    switch (inputType) {
      case QXInputType.ADD_TO_BID_ORDER:
        return 'BUY';
      case QXInputType.ADD_TO_ASK_ORDER:
        return 'SELL';
      case QXInputType.TRANSFER_SHARES:
        return 'TRANSFER';
      case QXInputType.ISSUE_ASSET:
        return 'ISSUE';
      case QXInputType.REMOVE_FROM_BID_ORDER:
      case QXInputType.REMOVE_FROM_ASK_ORDER:
        return 'REMOVE_ORDER';
      default:
        return null;
    }
  }

  /**
   * Decode AddToBidOrder (BUY operation)
   * 
   * C++ struct:
   * struct AddToBidOrder_input {
   *   id issuer;              // 32 bytes
   *   uint64 assetName;       // 8 bytes
   *   sint64 price;           // 8 bytes
   *   sint64 numberOfShares;  // 8 bytes
   * }
   * Total: 56 bytes
   */
  private decodeBidOrder(
    decoded: DecodedQXTransaction,
    tx: RawTransaction
  ): DecodedQXTransaction {
    // Note: In a real implementation, you would need to:
    // 1. Get the transaction payload from the RPC
    // 2. Parse the 56-byte structure
    // 
    // For now, we extract what we can from the transaction metadata
    // The amount field contains the total QU locked (price * numberOfShares)

    decoded.orderDetails = {
      price: BigInt(0), // Would be extracted from payload
      shares: BigInt(0), // Would be extracted from payload
      totalValue: tx.amount, // This is the locked QU amount
    };

    return decoded;
  }

  /**
   * Decode AddToAskOrder (SELL operation)
   * 
   * C++ struct:
   * struct AddToAskOrder_input {
   *   id issuer;              // 32 bytes
   *   uint64 assetName;       // 8 bytes
   *   sint64 price;           // 8 bytes
   *   sint64 numberOfShares;  // 8 bytes
   * }
   * Total: 56 bytes
   */
  private decodeAskOrder(
    decoded: DecodedQXTransaction,
    tx: RawTransaction
  ): DecodedQXTransaction {
    // Similar to BidOrder, but this is a sell operation
    decoded.orderDetails = {
      price: BigInt(0),
      shares: BigInt(0),
      totalValue: tx.amount,
    };

    return decoded;
  }

  /**
   * Decode TransferShares operation
   */
  private decodeTransfer(
    decoded: DecodedQXTransaction,
    tx: RawTransaction
  ): DecodedQXTransaction {
    // Transfer operations don't have price, just amount
    return decoded;
  }

  /**
   * Decode IssueAsset operation
   */
  private decodeIssue(
    decoded: DecodedQXTransaction,
    tx: RawTransaction
  ): DecodedQXTransaction {
    // Asset issuance - initial creation
    return decoded;
  }

  /**
   * Parse QX order payload from base64 encoded data
   * This is the core method that would extract full order details
   */
  parseOrderPayload(base64Payload: string): QXOrder | null {
    try {
      const buffer = Buffer.from(base64Payload, 'base64');
      
      if (buffer.length < 56) {
        console.error('Invalid order payload size');
        return null;
      }

      // Extract fields according to C++ struct layout
      let offset = 0;

      // 1. Issuer (32 bytes)
      const issuerBytes = buffer.slice(offset, offset + 32);
      const issuer = this.publicKeyToString(issuerBytes);
      offset += 32;

      // 2. Asset name (8 bytes, uint64)
      const assetNameNumber = buffer.readBigUInt64LE(offset);
      const assetName = this.uint64ToString(assetNameNumber);
      offset += 8;

      // 3. Price (8 bytes, sint64)
      const price = buffer.readBigInt64LE(offset);
      offset += 8;

      // 4. Number of shares (8 bytes, sint64)
      const numberOfShares = buffer.readBigInt64LE(offset);

      return {
        issuer,
        assetName,
        price,
        numberOfShares,
      };
    } catch (error) {
      console.error('Failed to parse order payload:', error);
      return null;
    }
  }

  /**
   * Convert public key bytes to Qubic address string
   * Qubic uses a specific encoding for addresses
   */
  private publicKeyToString(bytes: Buffer): string {
    // This would use the Qubic-specific public key to address conversion
    // For now, return hex representation
    return bytes.toString('hex').toUpperCase();
  }

  /**
   * Convert uint64 to string representation of asset name
   * Asset names are stored as 8-byte numbers but represent strings
   */
  private uint64ToString(num: bigint): string {
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64LE(num);
    
    // Read as ASCII string, removing null bytes
    return buffer.toString('ascii').replace(/\0/g, '');
  }

  /**
   * Helper to determine if a transaction resulted in an executed trade
   * or just an order placement
   */
  isExecutedTrade(tx: DecodedQXTransaction): boolean {
    // In QX, if an order is immediately matched, it executes
    // This would need to check events or order book state
    // For now, we assume all orders are attempts
    return true;
  }

  /**
   * Calculate effective price per unit from order details
   */
  calculatePricePerUnit(order: QXOrder): number {
    if (order.numberOfShares === BigInt(0)) {
      return 0;
    }
    return Number(order.price) / Number(order.numberOfShares);
  }
}

// Singleton instance
let decoderInstance: QXTransactionDecoder | null = null;

export function getQXDecoder(): QXTransactionDecoder {
  if (!decoderInstance) {
    decoderInstance = new QXTransactionDecoder();
  }
  return decoderInstance;
}
