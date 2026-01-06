/**
 * Mixer API Routes
 * Endpoints for private deposits and withdrawals
 *
 * IMPORTANT: Deposits and withdrawals are signed by the FRONTEND wallet (user).
 * The backend only prepares TX data; the user's wallet executes on-chain.
 */

import { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { getMixerService, DepositNote } from '../../services/mixer-service';

// Contract ABI for ZKMixer
const MIXER_ABI = [
  'function deposit(bytes32 commitment) external payable',
  'function withdraw(bytes calldata proof, bytes32 root, bytes32 nullifierHash, address recipient, address relayer, uint256 fee) external',
  'function getLastRoot() external view returns (bytes32)',
  'function getDepositCount() external view returns (uint32)',
  'function isKnownRoot(bytes32 root) external view returns (bool)',
  'function nullifierHashes(bytes32) external view returns (bool)',
  'function DENOMINATION() external view returns (uint256)',
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'event Withdrawal(address indexed recipient, bytes32 nullifierHash, address indexed relayer, uint256 fee)',
];

const mixerInterface = new ethers.Interface(MIXER_ABI);

interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  code: string;
  message: string;
  data?: T;
  details?: Record<string, unknown>;
}

interface DepositRequest {
  Body: {
    commitment?: string; // Optional - if not provided, generates new note
  };
}

interface WithdrawRequest {
  Body: {
    note: DepositNote;     // The saved deposit note
    leafIndex: number;     // Position in Merkle tree
    recipient: string;     // Withdrawal destination
    relayer?: string;      // Optional relayer address
    fee?: string;          // Optional relayer fee
  };
}

export async function mixerRoutes(fastify: FastifyInstance): Promise<void> {
  const mixerAddress = process.env.MIXER_CONTRACT_ADDRESS;

  /**
   * GET /mixer/info
   * Get mixer information
   */
  fastify.get('/mixer/info', async (request, reply): Promise<ApiResponse> => {
    try {
      const mixerService = getMixerService();

      // Get on-chain info if contract is deployed
      let onChainInfo = null;
      if (mixerAddress) {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const mixer = new ethers.Contract(mixerAddress, MIXER_ABI, provider);

        const [root, depositCount, denomination] = await Promise.all([
          mixer.getLastRoot(),
          mixer.getDepositCount(),
          mixer.DENOMINATION(),
        ]);

        onChainInfo = {
          contractAddress: mixerAddress,
          currentRoot: root,
          depositCount: Number(depositCount),
          denomination: ethers.formatEther(denomination) + ' CRO',
        };
      }

      return {
        status: 'success',
        code: 'MIXER_INFO',
        message: 'Mixer information retrieved',
        data: {
          denomination: mixerService.getDenomination() + ' CRO',
          localDepositCount: mixerService.getDepositCount(),
          localRoot: mixerService.getCurrentRoot(),
          onChain: onChainInfo,
          privacyModel: {
            description: 'Deposit funds, withdraw to any address without link',
            anonymitySet: mixerService.getDepositCount(),
          },
        },
      };
    } catch (error) {
      request.log.error(error, '[Mixer] Failed to get info');
      return {
        status: 'error',
        code: 'MIXER_INFO_FAILED',
        message: 'Failed to get mixer information',
      };
    }
  });

  /**
   * POST /mixer/generate-note
   * Generate a new deposit note (user must save this!)
   */
  fastify.post('/mixer/generate-note', async (request, reply): Promise<ApiResponse> => {
    try {
      const mixerService = getMixerService();
      const note = mixerService.generateDepositNote();

      return {
        status: 'success',
        code: 'NOTE_GENERATED',
        message: 'Deposit note generated - SAVE THIS SECURELY!',
        data: {
          note,
          warning: 'This note is required for withdrawal. If lost, funds cannot be recovered!',
          instructions: [
            '1. Save this note in a secure location',
            '2. Use the commitment to deposit funds',
            '3. After deposit, use the note to withdraw to any address',
          ],
        },
      };
    } catch (error) {
      request.log.error(error, '[Mixer] Failed to generate note');
      return {
        status: 'error',
        code: 'NOTE_GENERATION_FAILED',
        message: 'Failed to generate deposit note',
      };
    }
  });

  /**
   * POST /mixer/deposit
   * Prepare deposit TX data for frontend wallet to execute
   * Frontend signs and broadcasts the transaction
   */
  fastify.post<DepositRequest>('/mixer/deposit', async (request): Promise<ApiResponse> => {
    try {
      const { commitment } = request.body;

      if (!mixerAddress) {
        return {
          status: 'error',
          code: 'MIXER_NOT_DEPLOYED',
          message: 'Mixer contract not deployed. Set MIXER_CONTRACT_ADDRESS.',
        };
      }

      if (!commitment) {
        return {
          status: 'error',
          code: 'COMMITMENT_REQUIRED',
          message: 'Commitment is required. Generate a note first with /mixer/generate-note',
        };
      }

      // Get denomination from contract
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const mixer = new ethers.Contract(mixerAddress, MIXER_ABI, provider);
      const denomination = await mixer.DENOMINATION();

      // Encode the deposit call data
      const callData = mixerInterface.encodeFunctionData('deposit', [commitment]);

      request.log.info({ commitment }, '[Mixer] Prepared deposit TX for frontend');

      return {
        status: 'success',
        code: 'DEPOSIT_TX_PREPARED',
        message: 'Deposit transaction prepared. Sign and send from your wallet.',
        data: {
          tx: {
            to: mixerAddress,
            data: callData,
            value: denomination.toString(),
          },
          commitment,
          amount: ethers.formatEther(denomination) + ' CRO',
          instructions: [
            '1. Sign this transaction with your connected wallet',
            '2. After confirmation, call /mixer/confirm-deposit with txHash',
            '3. Save your note securely for withdrawal',
          ],
        },
      };
    } catch (error) {
      request.log.error(error, '[Mixer] Deposit preparation failed');
      return {
        status: 'error',
        code: 'DEPOSIT_FAILED',
        message: (error as Error).message || 'Deposit preparation failed',
      };
    }
  });

  /**
   * POST /mixer/withdraw
   * Prepare withdraw TX data for frontend wallet to execute
   * Frontend signs and broadcasts the transaction
   */
  fastify.post<WithdrawRequest>('/mixer/withdraw', async (request): Promise<ApiResponse> => {
    try {
      const { note, leafIndex, recipient, relayer, fee } = request.body;

      if (!mixerAddress) {
        return {
          status: 'error',
          code: 'MIXER_NOT_DEPLOYED',
          message: 'Mixer contract not deployed',
        };
      }

      if (!note || !note.nullifier || !note.secret) {
        return {
          status: 'error',
          code: 'INVALID_NOTE',
          message: 'Valid deposit note is required',
        };
      }

      if (!ethers.isAddress(recipient)) {
        return {
          status: 'error',
          code: 'INVALID_RECIPIENT',
          message: 'Valid recipient address required',
        };
      }

      const mixerService = getMixerService();

      // Check if already withdrawn
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      const mixerRead = new ethers.Contract(mixerAddress, MIXER_ABI, provider);

      const isSpent = await mixerRead.nullifierHashes(note.nullifierHash);
      if (isSpent) {
        return {
          status: 'error',
          code: 'ALREADY_WITHDRAWN',
          message: 'This note has already been used for withdrawal',
        };
      }

      // Generate withdrawal proof
      const withdrawProof = mixerService.generateWithdrawProof(
        note,
        leafIndex,
        recipient,
        relayer || ethers.ZeroAddress,
        fee || '0'
      );

      // Check if root is valid
      const isValidRoot = await mixerRead.isKnownRoot(withdrawProof.root);
      if (!isValidRoot) {
        return {
          status: 'error',
          code: 'INVALID_ROOT',
          message: 'Merkle root not found on-chain. Sync deposits first.',
        };
      }

      // Encode the withdraw call data for frontend to execute
      const callData = mixerInterface.encodeFunctionData('withdraw', [
        withdrawProof.proof,
        withdrawProof.root,
        withdrawProof.nullifierHash,
        recipient,
        withdrawProof.relayer,
        withdrawProof.fee,
      ]);

      request.log.info(
        { recipient, hasRelayer: !!relayer },
        '[Mixer] Prepared withdrawal TX for frontend (details hidden)'
      );

      return {
        status: 'success',
        code: 'WITHDRAW_TX_PREPARED',
        message: 'Withdrawal transaction prepared. Sign and send from your wallet.',
        data: {
          tx: {
            to: mixerAddress,
            data: callData,
            value: '0',
          },
          recipient,
          amount: mixerService.getDenomination() + ' CRO',
          privacy: 'Withdrawal will be unlinkable to your deposit',
          instructions: [
            '1. Sign this transaction with your connected wallet',
            '2. Funds will be sent to the recipient address',
            '3. No on-chain link between deposit and withdrawal',
          ],
        },
      };
    } catch (error) {
      request.log.error(error, '[Mixer] Withdrawal preparation failed');
      return {
        status: 'error',
        code: 'WITHDRAWAL_FAILED',
        message: (error as Error).message || 'Withdrawal preparation failed',
      };
    }
  });

  /**
   * POST /mixer/confirm-deposit
   * Confirm a deposit after frontend executes the TX
   * Updates local Merkle tree with on-chain deposit
   */
  fastify.post<{ Body: { txHash: string; commitment: string } }>(
    '/mixer/confirm-deposit',
    async (request): Promise<ApiResponse> => {
      try {
        const { txHash, commitment } = request.body;

        if (!txHash || !commitment) {
          return {
            status: 'error',
            code: 'MISSING_PARAMS',
            message: 'txHash and commitment are required',
          };
        }

        if (!mixerAddress) {
          return {
            status: 'error',
            code: 'MIXER_NOT_DEPLOYED',
            message: 'Mixer contract not deployed',
          };
        }

        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          return {
            status: 'error',
            code: 'TX_NOT_FOUND',
            message: 'Transaction not found. Wait for confirmation.',
          };
        }

        if (receipt.status === 0) {
          return {
            status: 'error',
            code: 'TX_FAILED',
            message: 'Transaction failed on-chain',
          };
        }

        // Find Deposit event
        const depositEvent = receipt.logs.find(
          (log) => log.topics[0] === ethers.id('Deposit(bytes32,uint32,uint256)')
        );

        if (!depositEvent) {
          return {
            status: 'error',
            code: 'DEPOSIT_EVENT_NOT_FOUND',
            message: 'Deposit event not found in transaction',
          };
        }

        const parsed = mixerInterface.parseLog({
          topics: depositEvent.topics as string[],
          data: depositEvent.data,
        });
        const leafIndex = Number(parsed?.args?.leafIndex || 0);

        // Record in local tree
        const mixerService = getMixerService();
        mixerService.recordDeposit(commitment, leafIndex, txHash);

        request.log.info({ txHash, leafIndex }, '[Mixer] Deposit confirmed');

        return {
          status: 'success',
          code: 'DEPOSIT_CONFIRMED',
          message: 'Deposit confirmed and recorded',
          data: {
            txHash,
            leafIndex,
            commitment,
            instructions: [
              `Save leafIndex: ${leafIndex} with your note`,
              'You can now withdraw to any address',
            ],
          },
        };
      } catch (error) {
        request.log.error(error, '[Mixer] Confirm deposit failed');
        return {
          status: 'error',
          code: 'CONFIRM_FAILED',
          message: (error as Error).message || 'Failed to confirm deposit',
        };
      }
    }
  );

  /**
   * POST /mixer/simulate-withdraw
   * Simulate withdrawal (generate proof without executing)
   */
  fastify.post<WithdrawRequest>('/mixer/simulate-withdraw', async (request): Promise<ApiResponse> => {
    try {
      const { note, leafIndex, recipient, relayer, fee } = request.body;

      if (!note || !note.nullifier || !note.secret) {
        return {
          status: 'error',
          code: 'INVALID_NOTE',
          message: 'Valid deposit note is required',
        };
      }

      const mixerService = getMixerService();

      // Generate withdrawal proof without executing
      const withdrawProof = mixerService.generateWithdrawProof(
        note,
        leafIndex,
        recipient,
        relayer || ethers.ZeroAddress,
        fee || '0'
      );

      return {
        status: 'success',
        code: 'SIMULATION_SUCCESS',
        message: 'Withdrawal simulation successful',
        data: {
          proof: withdrawProof.proof,
          root: withdrawProof.root,
          nullifierHash: withdrawProof.nullifierHash,
          recipient,
          relayer: withdrawProof.relayer,
          fee: withdrawProof.fee,
          canExecute: true,
        },
      };
    } catch (error) {
      request.log.error(error, '[Mixer] Simulation failed');
      return {
        status: 'error',
        code: 'SIMULATION_FAILED',
        message: (error as Error).message || 'Simulation failed',
      };
    }
  });
}
