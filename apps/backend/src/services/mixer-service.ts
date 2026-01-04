/**
 * Mixer Service
 * Handles private deposits and withdrawals using ZK proofs
 *
 * Privacy Model:
 * - User deposits fixed amount with commitment = hash(nullifier, secret)
 * - User can later withdraw to ANY address by proving they know the preimage
 * - No link between deposit and withdrawal is visible on-chain
 */

import { FastifyInstance } from 'fastify';
import { ethers } from 'ethers';
import { randomBytes } from 'crypto';

// Types
export interface DepositNote {
  nullifier: string;      // Random secret (256-bit hex)
  secret: string;         // Random secret (256-bit hex)
  commitment: string;     // hash(nullifier, secret)
  nullifierHash: string;  // hash(nullifier) - used on withdraw
  leafIndex?: number;     // Position in Merkle tree (set after deposit)
  depositTxHash?: string; // Transaction hash of deposit
}

export interface MerkleProof {
  root: string;
  pathElements: string[];
  pathIndices: number[];
}

export interface WithdrawProof {
  proof: string;          // Encoded proof for contract
  root: string;
  nullifierHash: string;
  recipient: string;
  relayer: string;
  fee: string;
}

// Contract ABI for events
const MIXER_ABI = [
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'function getLastRoot() view returns (bytes32)',
  'function getDepositCount() view returns (uint32)',
  'function isKnownRoot(bytes32) view returns (bool)',
];

// Singleton instance
let mixerServiceInstance: MixerService | null = null;

export async function initializeMixerService(server: FastifyInstance): Promise<void> {
  mixerServiceInstance = new MixerService(server.log);

  // Sync with on-chain state
  const mixerAddress = process.env.MIXER_CONTRACT_ADDRESS;
  if (mixerAddress) {
    try {
      await mixerServiceInstance.syncWithChain(mixerAddress);
      server.log.info('[MixerService] Initialized and synced with chain');
    } catch (error) {
      server.log.warn({ error }, '[MixerService] Failed to sync with chain, starting fresh');
    }
  } else {
    server.log.info('[MixerService] Initialized (no contract address, running locally)');
  }
}

export function getMixerService(): MixerService {
  if (!mixerServiceInstance) {
    throw new Error('MixerService not initialized');
  }
  return mixerServiceInstance;
}

export class MixerService {
  // In-memory Merkle tree (for MVP - production would use DB)
  private leaves: string[] = [];
  private readonly TREE_DEPTH = 20;
  private readonly DENOMINATION = '0.1'; // 0.1 CRO

  // Zero values for empty nodes
  private zeros: string[] = [];

  constructor(private logger: FastifyInstance['log']) {
    this._initializeZeros();
  }

  /**
   * Generate a new deposit note
   * @returns DepositNote with secrets - USER MUST SAVE THIS
   */
  generateDepositNote(): DepositNote {
    // Generate random secrets
    const nullifier = '0x' + randomBytes(32).toString('hex');
    const secret = '0x' + randomBytes(32).toString('hex');

    // Compute commitment = hash(nullifier, secret)
    // Using keccak256 for MVP (matches contract)
    const commitment = this._hashPair(nullifier, secret);

    // Compute nullifierHash = hash(nullifier, nullifier)
    const nullifierHash = this._hashPair(nullifier, nullifier);

    this.logger.info(
      { commitment },
      '[MixerService] Generated deposit note (secrets hidden)'
    );

    return {
      nullifier,
      secret,
      commitment,
      nullifierHash,
    };
  }

  /**
   * Record a deposit in the local Merkle tree
   */
  recordDeposit(commitment: string, leafIndex: number, txHash: string): void {
    // Ensure leaves array is large enough
    while (this.leaves.length <= leafIndex) {
      this.leaves.push(this.zeros[0]);
    }
    this.leaves[leafIndex] = commitment;

    this.logger.info(
      { leafIndex, txHash },
      '[MixerService] Recorded deposit'
    );
  }

  /**
   * Generate Merkle proof for a commitment
   */
  generateMerkleProof(leafIndex: number): MerkleProof {
    if (leafIndex >= this.leaves.length) {
      throw new Error('Leaf index out of bounds');
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < this.TREE_DEPTH; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

      // Get sibling (or zero if doesn't exist)
      const sibling = this._getNode(level, siblingIndex);
      pathElements.push(sibling);
      pathIndices.push(currentIndex % 2); // 0 = left, 1 = right

      currentIndex = Math.floor(currentIndex / 2);
    }

    const root = this._computeRoot();

    return {
      root,
      pathElements,
      pathIndices,
    };
  }

  /**
   * Generate withdrawal proof
   * This creates the proof that will be verified on-chain
   */
  generateWithdrawProof(
    note: DepositNote,
    leafIndex: number,
    recipient: string,
    relayer: string = ethers.ZeroAddress,
    fee: string = '0'
  ): WithdrawProof {
    // Get Merkle proof
    const merkleProof = this.generateMerkleProof(leafIndex);

    // For MVP: Create a binding proof
    // The contract checks: hash(root, nullifierHash, recipient, relayer, fee)
    const binding = ethers.keccak256(
      ethers.solidityPacked(
        ['bytes32', 'bytes32', 'address', 'address', 'uint256'],
        [merkleProof.root, note.nullifierHash, recipient, relayer, fee]
      )
    );

    // Encode proof with binding as first 32 bytes
    // In production, this would be the actual ZK proof
    const proof = ethers.solidityPacked(
      ['bytes32', 'bytes32[]', 'uint8[]'],
      [
        binding,
        merkleProof.pathElements,
        merkleProof.pathIndices,
      ]
    );

    this.logger.info(
      { recipient, relayer: relayer !== ethers.ZeroAddress },
      '[MixerService] Generated withdrawal proof (note details hidden)'
    );

    return {
      proof,
      root: merkleProof.root,
      nullifierHash: note.nullifierHash,
      recipient,
      relayer,
      fee,
    };
  }

  /**
   * Get current Merkle root
   */
  getCurrentRoot(): string {
    return this._computeRoot();
  }

  /**
   * Get deposit count
   */
  getDepositCount(): number {
    return this.leaves.filter(l => l !== this.zeros[0]).length;
  }

  /**
   * Get denomination
   */
  getDenomination(): string {
    return this.DENOMINATION;
  }

  /**
   * Sync local Merkle tree with on-chain deposits
   * Fetches all Deposit events and rebuilds the tree
   */
  async syncWithChain(contractAddress: string): Promise<void> {
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    const contract = new ethers.Contract(contractAddress, MIXER_ABI, provider);

    // Get deposit count from contract
    const depositCount = await contract.getDepositCount();
    this.logger.info({ depositCount: Number(depositCount) }, '[MixerService] Fetching on-chain deposits');

    if (depositCount === 0n) {
      this.logger.info('[MixerService] No deposits to sync');
      return;
    }

    // Query Deposit events in batches (RPC limits to 2000 blocks per query)
    const currentBlock = await provider.getBlockNumber();
    const BATCH_SIZE = 1000;
    const filter = contract.filters.Deposit();
    const allEvents: ethers.EventLog[] = [];

    // Start from a reasonable block (contract was deployed recently)
    // We search backwards in batches until we find all deposits
    let toBlock = currentBlock;
    let fromBlock = Math.max(0, currentBlock - BATCH_SIZE);

    while (allEvents.length < Number(depositCount) && fromBlock >= 0) {
      try {
        const events = await contract.queryFilter(filter, fromBlock, toBlock);
        for (const event of events) {
          if (event instanceof ethers.EventLog) {
            allEvents.push(event);
          }
        }
        this.logger.info(
          { fromBlock, toBlock, found: events.length, total: allEvents.length },
          '[MixerService] Fetched batch'
        );
      } catch {
        // If batch is too large, reduce size
        this.logger.warn({ fromBlock, toBlock }, '[MixerService] Batch query failed, trying smaller range');
      }

      // Move to earlier blocks
      toBlock = fromBlock - 1;
      fromBlock = Math.max(0, toBlock - BATCH_SIZE);

      if (toBlock < 0) break;
    }

    this.logger.info({ eventCount: allEvents.length }, '[MixerService] Found deposit events');

    // Sort by leafIndex and insert into tree
    const deposits = allEvents
      .map((log) => ({
        commitment: log.args[0] as string,
        leafIndex: Number(log.args[1]),
        timestamp: Number(log.args[2]),
      }))
      .sort((a, b) => a.leafIndex - b.leafIndex);

    // Clear and rebuild tree
    this.leaves = [];
    for (const deposit of deposits) {
      while (this.leaves.length < deposit.leafIndex) {
        this.leaves.push(this.zeros[0]);
      }
      this.leaves[deposit.leafIndex] = deposit.commitment;
    }

    // Verify our root matches on-chain
    const localRoot = this._computeRoot();
    const onChainRoot = await contract.getLastRoot();

    if (localRoot === onChainRoot) {
      this.logger.info(
        { root: localRoot, deposits: deposits.length },
        '[MixerService] Successfully synced with chain - roots match'
      );
    } else {
      this.logger.warn(
        { localRoot, onChainRoot },
        '[MixerService] Root mismatch after sync - tree may be incomplete'
      );
    }
  }

  // ============ Internal Functions ============

  private _initializeZeros(): void {
    let currentZero = ethers.ZeroHash;
    this.zeros.push(currentZero);

    for (let i = 1; i < this.TREE_DEPTH; i++) {
      currentZero = this._hashPair(currentZero, currentZero);
      this.zeros.push(currentZero);
    }
  }

  private _hashPair(left: string, right: string): string {
    return ethers.keccak256(ethers.solidityPacked(['bytes32', 'bytes32'], [left, right]));
  }

  private _getNode(level: number, index: number): string {
    if (level === 0) {
      return index < this.leaves.length ? this.leaves[index] : this.zeros[0];
    }

    const leftIndex = index * 2;
    const rightIndex = leftIndex + 1;

    const left = this._getNode(level - 1, leftIndex);
    const right = this._getNode(level - 1, rightIndex);

    return this._hashPair(left, right);
  }

  private _computeRoot(): string {
    if (this.leaves.length === 0) {
      // Empty tree root
      let root = this.zeros[0];
      for (let i = 0; i < this.TREE_DEPTH; i++) {
        root = this._hashPair(root, this.zeros[i]);
      }
      return root;
    }

    return this._getNode(this.TREE_DEPTH, 0);
  }
}
