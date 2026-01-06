/**
 * Test Real E2E Flow for x402 Facilitator
 *
 * This script tests the complete facilitator flow:
 * 1. Generate a valid EIP-3009 payment signature
 * 2. Verify the payment via POST /verify
 * 3. Attempt settlement via POST /settle
 */

import { ethers } from 'ethers';

const FACILITATOR_URL = 'http://localhost:3002';
const CHAIN_ID = 338;
const USDC_ADDRESS = '0x5425890298aed601595a70AB815c96711a31Bc65';

// Test wallet (same as in .env for this test)
const TEST_PRIVATE_KEY = '0x164c0ae52ae57c5c35424b7a83ecb211623835e347ff3d45027d4078cee51167';

interface PaymentToken {
  scheme: string;
  network: string;
  payload: {
    from: string;
    to: string;
    value: string;
    validAfter: string;
    validBefore: string;
    nonce: string;
  };
  signature: {
    v: number;
    r: string;
    s: string;
  };
}

async function generateEIP3009Signature(wallet: ethers.Wallet): Promise<PaymentToken> {
  const now = Math.floor(Date.now() / 1000);
  const nonce = ethers.hexlify(ethers.randomBytes(32));

  const payload = {
    from: wallet.address,
    to: wallet.address, // Self-transfer for testing
    value: '1000000', // 1 USDC (6 decimals)
    validAfter: (now - 3600).toString(),
    validBefore: (now + 3600).toString(),
    nonce,
  };

  // EIP-712 domain for USDC
  const domain: ethers.TypedDataDomain = {
    name: 'USD Coin',
    version: '2',
    chainId: CHAIN_ID,
    verifyingContract: USDC_ADDRESS,
  };

  // EIP-3009 TransferWithAuthorization types
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

  // Sign the typed data
  const signature = await wallet.signTypedData(domain, types, value);
  const sig = ethers.Signature.from(signature);

  return {
    scheme: 'eip-3009',
    network: 'cronos-testnet',
    payload,
    signature: {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    },
  };
}

async function testVerify(paymentHeader: string, payTo: string): Promise<void> {
  console.log('\n📝 Testing POST /verify...');

  const response = await fetch(`${FACILITATOR_URL}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentHeader,
      paymentRequirements: {
        scheme: 'eip-3009',
        network: 'cronos-testnet',
        maxAmountRequired: '1000000',
        resource: 'https://api.example.com/premium',
        payTo,
      },
    }),
  });

  const result = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));

  if (result.status === 'success' && result.data?.isValid) {
    console.log('✅ Verification PASSED!');
  } else {
    console.log('❌ Verification FAILED:', result.message || result.data?.invalidReason);
  }
}

async function testSettle(paymentHeader: string, payTo: string): Promise<void> {
  console.log('\n💰 Testing POST /settle...');

  const response = await fetch(`${FACILITATOR_URL}/settle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentHeader,
      paymentRequirements: {
        scheme: 'eip-3009',
        network: 'cronos-testnet',
        maxAmountRequired: '1000000',
        resource: 'https://api.example.com/premium',
        payTo,
      },
    }),
  });

  const result = await response.json();
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(result, null, 2));

  if (result.status === 'success' && result.data?.success) {
    console.log('✅ Settlement EXECUTED! TxHash:', result.data.transactionHash);
  } else {
    console.log('⚠️ Settlement failed (expected if no USDC balance):', result.message);
  }
}

async function main() {
  console.log('🚀 Starting x402 Facilitator Real E2E Test');
  console.log('==========================================\n');

  // Create wallet
  const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);
  console.log('🔑 Test Wallet:', wallet.address);

  // Test 1: Health check
  console.log('\n❤️ Testing GET /health...');
  const healthRes = await fetch(`${FACILITATOR_URL}/health`);
  const health = await healthRes.json();
  console.log('Health:', health.status === 'success' ? '✅ OK' : '❌ FAIL');

  // Test 2: Generate valid EIP-3009 signature
  console.log('\n✍️ Generating EIP-3009 signature...');
  const paymentToken = await generateEIP3009Signature(wallet);
  console.log('Payment Token generated for:', paymentToken.payload.from);
  console.log('Amount:', paymentToken.payload.value, 'wei (1 USDC)');

  // Encode to base64
  const paymentHeader = Buffer.from(JSON.stringify(paymentToken)).toString('base64');
  console.log('Payment Header (first 50 chars):', paymentHeader.substring(0, 50) + '...');

  // Test 3: Verify the payment
  await testVerify(paymentHeader, wallet.address);

  // Test 4: Attempt settlement (will fail if no USDC balance, but tests the flow)
  await testSettle(paymentHeader, wallet.address);

  console.log('\n==========================================');
  console.log('🏁 E2E Test Complete!');
}

main().catch(console.error);
