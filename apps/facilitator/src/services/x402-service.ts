import { ethers } from 'ethers';
import type {
  VerifyRequest,
  VerifyResponse,
  PaymentToken,
  EIP3009Payload,
  PaymentSignature
} from '../types';

export class X402Service {
  /**
   * Decode and parse the x-payment header (Base64 encoded JSON)
   */
  parsePaymentHeader(paymentHeader: string): PaymentToken | null {
    try {
      const decoded = Buffer.from(paymentHeader, 'base64').toString('utf-8');
      return JSON.parse(decoded) as PaymentToken;
    } catch {
      return null;
    }
  }

  /**
   * Verify an x402 payment signature and requirements
   */
  async verify(request: VerifyRequest): Promise<VerifyResponse> {
    const { paymentHeader, paymentRequirements } = request;

    // Parse the payment header
    const paymentToken = this.parsePaymentHeader(paymentHeader);
    if (!paymentToken) {
      return {
        isValid: false,
        invalidReason: 'Invalid payment header format - unable to decode',
      };
    }

    // Verify scheme matches
    if (paymentToken.scheme !== paymentRequirements.scheme) {
      return {
        isValid: false,
        invalidReason: `Scheme mismatch: expected ${paymentRequirements.scheme}, got ${paymentToken.scheme}`,
      };
    }

    // Verify network matches
    if (paymentToken.network !== paymentRequirements.network) {
      return {
        isValid: false,
        invalidReason: `Network mismatch: expected ${paymentRequirements.network}, got ${paymentToken.network}`,
      };
    }

    // For EIP-3009 scheme, verify the authorization signature
    if (paymentToken.scheme === 'eip-3009') {
      const signatureValid = await this.verifyEIP3009Signature(
        paymentToken.payload,
        paymentToken.signature,
        paymentRequirements.payTo
      );

      if (!signatureValid.valid) {
        return {
          isValid: false,
          invalidReason: signatureValid.reason,
        };
      }
    }

    // Verify amount meets requirements
    const paymentAmount = BigInt(paymentToken.payload.value);
    const requiredAmount = BigInt(paymentRequirements.maxAmountRequired);

    if (paymentAmount < requiredAmount) {
      return {
        isValid: false,
        invalidReason: `Insufficient payment: required ${requiredAmount}, got ${paymentAmount}`,
      };
    }

    // Verify recipient matches
    if (paymentToken.payload.to.toLowerCase() !== paymentRequirements.payTo.toLowerCase()) {
      return {
        isValid: false,
        invalidReason: `Recipient mismatch: expected ${paymentRequirements.payTo}, got ${paymentToken.payload.to}`,
      };
    }

    // Verify timing constraints
    const now = Math.floor(Date.now() / 1000);
    const validAfter = parseInt(paymentToken.payload.validAfter, 10);
    const validBefore = parseInt(paymentToken.payload.validBefore, 10);

    if (now < validAfter) {
      return {
        isValid: false,
        invalidReason: `Payment not yet valid: validAfter ${validAfter}, current time ${now}`,
      };
    }

    if (now >= validBefore) {
      return {
        isValid: false,
        invalidReason: `Payment expired: validBefore ${validBefore}, current time ${now}`,
      };
    }

    // All checks passed
    return {
      isValid: true,
      payer: paymentToken.payload.from,
      paymentToken,
    };
  }

  /**
   * Verify EIP-3009 transferWithAuthorization signature
   */
  private async verifyEIP3009Signature(
    payload: EIP3009Payload,
    signature: PaymentSignature,
    expectedRecipient: string
  ): Promise<{ valid: boolean; reason?: string }> {
    try {
      // EIP-712 typed data for transferWithAuthorization
      const domain: ethers.TypedDataDomain = {
        name: 'USD Coin', // Token name
        version: '2',
        chainId: parseInt(process.env.CHAIN_ID || '338', 10),
        verifyingContract: process.env.USDC_CONTRACT_ADDRESS || ethers.ZeroAddress,
      };

      const types = {
        TransferWithAuthorization: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      };

      const value = {
        from: payload.from,
        to: payload.to,
        value: payload.value,
        validAfter: payload.validAfter,
        validBefore: payload.validBefore,
        nonce: payload.nonce,
      };

      // Recover the signer address
      const sig = ethers.Signature.from({
        v: signature.v,
        r: signature.r,
        s: signature.s,
      });

      const recoveredAddress = ethers.verifyTypedData(domain, types, value, sig);

      if (recoveredAddress.toLowerCase() !== payload.from.toLowerCase()) {
        return {
          valid: false,
          reason: `Signature verification failed: recovered ${recoveredAddress}, expected ${payload.from}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        reason: `Signature verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Create a payment header for testing/debugging
   */
  encodePaymentHeader(paymentToken: PaymentToken): string {
    return Buffer.from(JSON.stringify(paymentToken)).toString('base64');
  }
}

// Singleton instance
let x402ServiceInstance: X402Service | null = null;

export function getX402Service(): X402Service {
  if (!x402ServiceInstance) {
    x402ServiceInstance = new X402Service();
  }
  return x402ServiceInstance;
}
