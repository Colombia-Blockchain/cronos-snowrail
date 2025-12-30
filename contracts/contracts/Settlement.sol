// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Settlement
 * @notice Core settlement contract for Cronos Agentic Treasury
 * @dev Holds funds and executes authorized transfers with replay attack prevention
 */
contract Settlement {
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

    // ============ State Variables ============
    /// @notice Contract owner - x402 Orchestrator address authorized to execute settlements
    address public owner;

    /// @notice Tracks executed intents to prevent replay attacks
    /// @dev Maps intentHash -> isExecuted
    mapping(bytes32 => bool) public executedIntents;

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

    // ============ Constructor ============
    constructor() {
        owner = msg.sender;
    }

    // ============ Modifiers ============
    /// @notice Restricts function execution to contract owner only
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized(msg.sender);
        _;
    }

    // ============ External Functions ============
    /**
     * @notice Executes a settlement transfer authorized by the AI Agent
     * @dev Uses checks-effects-interactions pattern to prevent reentrancy
     * @param intentHash The hash of the payment intent to execute
     * @param recipient The address to receive the funds
     * @param amount The amount of ETH to transfer in wei
     *
     * Requirements:
     * - Only the contract owner (x402 Orchestrator) can call
     * - Intent must not have been previously executed
     * - Recipient must not be zero address
     * - Amount must be greater than zero
     * - Contract must have sufficient balance
     * - Transfer must succeed
     */
    function executeSettlement(
        bytes32 intentHash,
        address payable recipient,
        uint256 amount
    ) external onlyOwner {
        // ============ 1. CHECKS ============
        // Input validation
        if (recipient == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();

        // Replay attack prevention
        if (executedIntents[intentHash]) revert IntentAlreadyExecuted(intentHash);

        // Balance verification
        uint256 currentBalance = address(this).balance;
        if (currentBalance < amount) revert InsufficientBalance(amount, currentBalance);

        // ============ 2. EFFECTS ============
        // Mark intent as executed BEFORE making the external call
        // This prevents reentrancy attacks
        executedIntents[intentHash] = true;

        // ============ 3. INTERACTIONS ============
        // Execute the ETH transfer
        (bool success, ) = recipient.call{value: amount}("");

        // Handle transfer failure
        if (!success) {
            // Rollback state change on failure
            executedIntents[intentHash] = false;
            revert TransferFailed(recipient, amount);
        }

        // ============ 4. EVENT EMISSION ============
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

    // ============ Receive Function ============
    /**
     * @notice Allows the contract to receive ETH deposits
     * @dev Emits Deposited event for off-chain tracking
     */
    receive() external payable {
        emit Deposited(msg.sender, msg.value);
    }
}

