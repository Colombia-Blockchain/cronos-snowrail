// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Settlement
 * @notice Core settlement contract for Cronos Agentic Treasury
 * @dev Holds funds and executes authorized transfers with signature verification and replay attack prevention
 */
contract Settlement is EIP712 {
    using ECDSA for bytes32;

    // ============ Type Hashes ============
    /// @notice EIP-712 type hash for settlement signatures
    bytes32 private constant SETTLEMENT_TYPEHASH =
        keccak256("Settlement(bytes32 intentHash,address recipient,uint256 amount,uint256 nonce)");

    // ============ Custom Errors ============
    /// @notice Thrown when attempting to transfer more than available balance
    error InsufficientBalance(uint256 requested, uint256 available);

    /// @notice Thrown when attempting to execute an intent that has already been executed
    error IntentAlreadyExecuted(bytes32 intentHash);

    /// @notice Thrown when caller is not authorized to execute settlements
    error Unauthorized(address caller);

    /// @notice Thrown when ETH transfer to recipient fails
    error TransferFailed(address recipient, uint256 amount);

    /// @notice Thrown when recipient address is zero
    error ZeroAddress();

    /// @notice Thrown when amount is zero
    error ZeroAmount();

    /// @notice Thrown when signature verification fails
    error InvalidSignature();

    /// @notice Thrown when recovered signer is not the authorized executor
    error InvalidSigner(address recovered, address expected);

    /// @notice Thrown when signature nonce doesn't match expected value
    error InvalidNonce(bytes32 intentHash, uint256 provided, uint256 expected);

    // ============ State Variables ============
    /// @notice Contract owner - authorized to update executor and manage admin functions
    address public owner;

    /// @notice Address authorized to sign settlement transactions
    address public executor;

    /// @notice Tracks executed intents to prevent replay attacks
    /// @dev Maps intentHash -> isExecuted
    mapping(bytes32 => bool) public executedIntents;

    /// @notice Tracks nonce for each intent to prevent signature replay
    /// @dev Maps intentHash -> nonce
    mapping(bytes32 => uint256) public intentNonces;

    // ============ Events ============
    /// @notice Emitted when a settlement is successfully executed
    /// @param intentHash The intent identifier
    /// @param recipient Address receiving the funds
    /// @param amount Amount transferred in wei
    event PaymentExecuted(bytes32 indexed intentHash, address indexed recipient, uint256 amount);

    /// @notice Emitted when funds are deposited into the contract
    /// @param sender Address sending the funds
    /// @param amount Amount deposited in wei
    event Deposited(address indexed sender, uint256 amount);

    /// @notice Emitted when executor is updated
    /// @param oldExecutor The previous executor address
    /// @param newExecutor The new executor address
    event ExecutorUpdated(address indexed oldExecutor, address indexed newExecutor);

    // ============ Constructor ============
    /// @notice Initializes the Settlement contract with owner and executor
    /// @param _executor The address authorized to sign settlement transactions
    constructor(address _executor) EIP712("CronosSettlement", "1") {
        if (_executor == address(0)) revert ZeroAddress();

        owner = msg.sender;
        executor = _executor;
    }

    // ============ Modifiers ============
    /// @notice Restricts function execution to contract owner only
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized(msg.sender);
        _;
    }

    // ============ External Functions ============
    /**
     * @notice Executes a settlement transfer with signature verification
     * @dev Verifies EIP-712 signature from authorized executor before transferring funds
     * Uses checks-effects-interactions pattern to prevent reentrancy
     * @param intentHash The hash of the payment intent to execute
     * @param recipient The address to receive the funds
     * @param amount The amount of ETH to transfer in wei
     * @param nonce The nonce for this specific intent
     * @param signature The EIP-712 signature from the executor
     *
     * Requirements:
     * - Signature must be valid EIP-712 signature from executor
     * - Nonce must match expected nonce for this intent
     * - Intent must not have been previously executed
     * - Recipient must not be zero address
     * - Amount must be greater than zero
     * - Contract must have sufficient balance
     * - Transfer must succeed
     */
    function executeSettlement(
        bytes32 intentHash,
        address payable recipient,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        // ============ 1. SIGNATURE VERIFICATION ============
        // Verify nonce matches current state
        if (nonce != intentNonces[intentHash]) {
            revert InvalidNonce(intentHash, nonce, intentNonces[intentHash]);
        }

        // Construct EIP-712 typed data hash
        bytes32 structHash = keccak256(
            abi.encode(SETTLEMENT_TYPEHASH, intentHash, recipient, amount, nonce)
        );
        bytes32 digest = _hashTypedDataV4(structHash);

        // Recover signer from signature
        address recoveredSigner = digest.recover(signature);

        // Verify signer is authorized executor
        if (recoveredSigner != executor) {
            revert InvalidSigner(recoveredSigner, executor);
        }

        // Increment nonce to prevent signature replay
        intentNonces[intentHash]++;

        // ============ 2. CHECKS ============
        // Input validation
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // Replay attack prevention
        if (executedIntents[intentHash]) revert IntentAlreadyExecuted(intentHash);

        // Balance verification
        uint256 currentBalance = address(this).balance;
        if (currentBalance < amount) revert InsufficientBalance(amount, currentBalance);

        // ============ 3. EFFECTS ============
        // Mark intent as executed BEFORE making the external call
        // This prevents reentrancy attacks
        executedIntents[intentHash] = true;

        // ============ 4. INTERACTIONS ============
        // Execute the ETH transfer
        (bool success, ) = recipient.call{value: amount}("");

        // Handle transfer failure
        if (!success) {
            // Rollback state changes on failure
            executedIntents[intentHash] = false;
            intentNonces[intentHash]--;
            revert TransferFailed(recipient, amount);
        }

        // ============ 5. EVENT EMISSION ============
        emit PaymentExecuted(intentHash, recipient, amount);
    }

    // ============ View Functions ============
    /**
     * @notice Returns the current ETH balance of the contract
     * @return balance Amount of ETH held by the contract in wei
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Checks if a specific intent has been executed
     * @param intentHash The intent identifier to check
     * @return isExecuted True if the intent has been executed, false otherwise
     */
    function isIntentExecuted(bytes32 intentHash) external view returns (bool) {
        return executedIntents[intentHash];
    }

    /**
     * @notice Returns the current nonce for a specific intent
     * @param intentHash The intent identifier
     * @return nonce The current nonce value
     */
    function getIntentNonce(bytes32 intentHash) external view returns (uint256) {
        return intentNonces[intentHash];
    }

    // ============ Administrative Functions ============
    /**
     * @notice Updates the authorized executor address
     * @dev Only owner can call this function
     * @param newExecutor The new executor address
     *
     * Requirements:
     * - Caller must be the contract owner
     * - newExecutor must not be zero address
     */
    function updateExecutor(address newExecutor) external onlyOwner {
        if (newExecutor == address(0)) revert ZeroAddress();

        address oldExecutor = executor;
        executor = newExecutor;

        emit ExecutorUpdated(oldExecutor, newExecutor);
    }

    // ============ Receive Function ============
    /**
     * @notice Allows the contract to receive ETH deposits
     * @dev Emits Deposited event for off-chain tracking
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}

