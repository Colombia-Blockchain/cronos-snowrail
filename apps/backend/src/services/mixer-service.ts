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
   * Updates filledSubtrees to match contract behavior
   */
  recordDeposit(commitment: string, leafIndex: number, txHash: string): void {
    // Update filledSubtrees like the contract does
    let currentHash = commitment;
    let currentIndex = leafIndex;

    for (let i = 0; i < this.TREE_DEPTH; i++) {
      if (currentIndex % 2 === 0) {
        // Left child: store current hash for later
        this.filledSubtrees[i] = currentHash;
        currentHash = this._hashPair(currentHash, this.zeros[i]);
      } else {
        // Right child: pair with stored left sibling
        currentHash = this._hashPair(this.filledSubtrees[i], currentHash);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    // Update synced root
    this.syncedRoot = currentHash;
    this.nextLeafIndex = leafIndex + 1;

    // Also update leaves array for backwards compatibility
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
   * Generate Merkle proof for a commitment using filledSubtrees
   */
  generateMerkleProof(leafIndex: number): MerkleProof {
    if (leafIndex >= this.nextLeafIndex) {
      throw new Error(`Leaf index ${leafIndex} out of bounds (max: ${this.nextLeafIndex - 1})`);
    }

    const pathElements: string[] = [];
    const pathIndices: number[] = [];

    let currentIndex = leafIndex;

    for (let level = 0; level < this.TREE_DEPTH; level++) {
      // Determine if we're left (0) or right (1) child
      const isRightChild = currentIndex % 2 === 1;
      pathIndices.push(isRightChild ? 1 : 0);

      if (isRightChild) {
        // We're right child, sibling is the filledSubtree at this level
        pathElements.push(this.filledSubtrees[level]);
      } else {
        // We're left child, sibling is zero (or filledSubtree if exists)
        // For leaves after us, use zero; for leaves before, use filledSubtree
        const siblingIndex = currentIndex + 1;
        if (siblingIndex < this.nextLeafIndex || (level > 0 && this._hasFilledSibling(level, currentIndex))) {
          pathElements.push(this.filledSubtrees[level]);
        } else {
          pathElements.push(this.zeros[level]);
        }
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    // Use synced root or compute from filledSubtrees
    const root = this.syncedRoot || this._computeRootFromFilledSubtrees();

    return {
      root,
      pathElements,
      pathIndices,
    };
  }

  /**
   * Check if there's a filled sibling at this level
   */
  private _hasFilledSibling(level: number, index: number): boolean {
    // The sibling exists if there are enough leaves to fill it
    const siblingFirstLeaf = (index + 1) * Math.pow(2, level);
    return siblingFirstLeaf < this.nextLeafIndex;
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
   * Sync local Merkle tree with on-chain state
   * Reads filledSubtrees directly from contract (fast, no event scanning)
   */
  async syncWithChain(contractAddress: string): Promise<void> {
    const rpcUrl = process.env.RPC_URL || 'https://evm-t3.cronos.org';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Extended ABI to read filledSubtrees and zeros from contract
    const extendedABI = [
      ...MIXER_ABI,
      'function filledSubtrees(uint256) view returns (bytes32)',
      'function zeros(uint256) view returns (bytes32)',
    ];
    const contract = new ethers.Contract(contractAddress, extendedABI, provider);

    // Get deposit count and on-chain root
    const [depositCount, onChainRoot] = await Promise.all([
      contract.getDepositCount(),
      contract.getLastRoot(),
    ]);

    this.logger.info({ depositCount: Number(depositCount) }, '[MixerService] Syncing with chain');

    if (depositCount === 0n) {
      this.logger.info('[MixerService] No deposits to sync');
      return;
    }

    // Read filledSubtrees and zeros from contract sequentially
    // (Cronos RPC limits batch size to 10)
    const filledSubtrees: string[] = [];
    const contractZeros: string[] = [];

    for (let i = 0; i < this.TREE_DEPTH; i++) {
      const [filled, zero] = await Promise.all([
        contract.filledSubtrees(i),
        contract.zeros(i),
      ]);
      filledSubtrees.push(filled);
      contractZeros.push(zero);
    }

    this.logger.info('[MixerService] Loaded filledSubtrees from contract');

    // Store contract state
    this.filledSubtrees = filledSubtrees as string[];
    this.zeros = contractZeros as string[];
    this.nextLeafIndex = Number(depositCount);

    // Compute root using filledSubtrees (matches contract algorithm)
    const computedRoot = this._computeRootFromFilledSubtrees();

    if (computedRoot === onChainRoot) {
      this.logger.info(
        { root: computedRoot, deposits: Number(depositCount) },
        '[MixerService] Successfully synced with chain'
      );
    } else {
      this.logger.warn(
        { computedRoot, onChainRoot },
        '[MixerService] Root computation mismatch - using on-chain root'
      );
    }

    // Mark as synced - we can generate proofs now
    this.syncedRoot = onChainRoot;
  }

  /**
   * Compute root from filledSubtrees (matches contract logic exactly)
   */
  private _computeRootFromFilledSubtrees(): string {
    if (this.nextLeafIndex === 0) {
      return this._hashPair(this.zeros[this.TREE_DEPTH - 1], this.zeros[this.TREE_DEPTH - 1]);
    }

    // Trace path from last leaf to root
    let currentIndex = this.nextLeafIndex - 1;
    let currentHash = this.filledSubtrees[0];

    for (let i = 0; i < this.TREE_DEPTH; i++) {
      if (currentIndex % 2 === 0) {
        // Left child: pair with zero on right
        currentHash = this._hashPair(currentHash, this.zeros[i]);
      } else {
        // Right child: pair with filled subtree on left
        currentHash = this._hashPair(this.filledSubtrees[i], currentHash);
      }
      currentIndex = Math.floor(currentIndex / 2);
    }

    return currentHash;
  }

  // Synced state from contract
  private filledSubtrees: string[] = [];
  private nextLeafIndex: number = 0;
  private syncedRoot: string = '';

  // ============ Internal Functions ============

  private _initializeZeros(): void {
    let currentZero = ethers.ZeroHash;
    this.zeros.push(currentZero);
    this.filledSubtrees.push(currentZero);

    for (let i = 1; i < this.TREE_DEPTH; i++) {
      currentZero = this._hashPair(currentZero, currentZero);
      this.zeros.push(currentZero);
      this.filledSubtrees.push(currentZero);
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
