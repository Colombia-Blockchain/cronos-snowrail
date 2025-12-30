// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TestRejectingContract
 * @notice Test contract that rejects ETH transfers
 * @dev Used for testing transfer failure handling in Settlement contract
 */
contract TestRejectingContract {
    /**
     * @notice Reject all ETH transfers
     * @dev This contract deliberately rejects ETH to test error handling
     */
    receive() external payable {
        revert("ETH transfer rejected");
    }
}
