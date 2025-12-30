import { expect } from "chai";
import { ethers } from "hardhat";
import type { Settlement } from "../typechain-types/Settlement";
import {
  loadTestSigners,
  TestFixture,
  signSettlement,
  getSettlementDomain,
  getSettlementTypes,
} from "./fixtures";

describe("Settlement - Signature Verification", function () {
  let settlement: Settlement;
  let signers: TestFixture;
  let executor: any;
  let owner: any;
  let recipient: any;
  let contractAddress: string;
  let chainId: number;

  beforeEach(async function () {
    signers = await loadTestSigners();
    owner = signers.owner;
    executor = signers.addr1;
    recipient = signers.addr2;

    // Deploy contract with executor address
    const SettlementFactory = await ethers.getContractFactory("Settlement");
    const deployed = await SettlementFactory.deploy(executor.address);
    await deployed.waitForDeployment();
    settlement = deployed as unknown as Settlement;
    contractAddress = settlement.target as string;

    // Get chain ID
    const network = await ethers.provider.getNetwork();
    chainId = Number(network.chainId);

    // Deposit funds
    await owner.sendTransaction({
      to: settlement.target,
      value: ethers.parseEther("10.0"),
    });
  });

  describe("Valid Signatures", function () {
    it("Should execute settlement with valid executor signature", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("test-intent-1"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      )
        .to.emit(settlement, "PaymentExecuted")
        .withArgs(intentHash, recipient.address, amount);
    });

    it("Should increment nonce after successful execution", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("nonce-test"));
      const amount = ethers.parseEther("1.0");

      // Check initial nonce is 0
      expect(await settlement.getIntentNonce(intentHash)).to.equal(0);

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        0n
      );

      await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        0,
        signature
      );

      // Check nonce incremented to 1
      expect(await settlement.getIntentNonce(intentHash)).to.equal(1);
    });

    it("Should execute multiple settlements with different intents and different nonces", async function () {
      const intentHash1 = ethers.keccak256(
        ethers.toUtf8Bytes("multi-intent-1")
      );
      const intentHash2 = ethers.keccak256(
        ethers.toUtf8Bytes("multi-intent-2")
      );
      const amount = ethers.parseEther("0.5");

      // Execute first settlement with intent 1, nonce 0
      const sig1 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash1,
        recipient.address,
        amount,
        0n
      );

      await settlement.executeSettlement(
        intentHash1,
        recipient.address,
        amount,
        0,
        sig1
      );

      expect(await settlement.getIntentNonce(intentHash1)).to.equal(1);

      // Execute second settlement with different intent, nonce 0
      const sig2 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash2,
        recipient.address,
        amount,
        0n
      );

      await settlement.executeSettlement(
        intentHash2,
        recipient.address,
        amount,
        0,
        sig2
      );

      expect(await settlement.getIntentNonce(intentHash2)).to.equal(1);
    });

    it("Should emit PaymentExecuted event with correct parameters", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("event-test"));
      const amount = ethers.parseEther("2.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      const tx = await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        nonce,
        signature
      );

      await expect(tx)
        .to.emit(settlement, "PaymentExecuted")
        .withArgs(intentHash, recipient.address, amount);
    });
  });

  describe("Invalid Signatures", function () {
    it("Should reject signature from non-executor address", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("wrong-signer"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      // Sign with wrong signer (owner instead of executor)
      const signature = await signSettlement(
        owner,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidSigner");
    });

    it("Should reject signature with wrong nonce (too low)", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("nonce-low"));
      const amount = ethers.parseEther("1.0");

      // Execute first settlement to increment nonce
      const sig1 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        0n
      );

      await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        0,
        sig1
      );

      // Try to use nonce 0 again
      const sig2 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        0n
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          0,
          sig2
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidNonce");
    });

    it("Should reject signature with wrong nonce (too high)", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("nonce-high"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      // Sign with nonce 5, but contract expects 0
      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        5n
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          5,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidNonce");
    });

    it("Should reject signature with tampered recipient", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("tamper-test"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      // Sign for recipient1, but try to use recipient2
      const wrongRecipient = signers.addrs[0];
      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        wrongRecipient.address,
        amount,
        nonce
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address, // Different recipient
          amount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidSigner");
    });

    it("Should reject signature with tampered amount", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("amount-tamper"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      const tamperedAmount = ethers.parseEther("2.0");

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          tamperedAmount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidSigner");
    });

    it("Should reject zero-length signature", async function () {
      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("zero-sig-test")
      );
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          "0x"
        )
      ).to.be.reverted;
    });
  });

  describe("Nonce Management", function () {
    it("Should initialize nonce at 0 for new intent", async function () {
      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("init-nonce-test")
      );
      expect(await settlement.getIntentNonce(intentHash)).to.equal(0);
    });

    it("Should prevent signature replay with same nonce", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("replay-test"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      // First execution succeeds
      await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        nonce,
        signature
      );

      // Try to replay with same signature (nonce now 1)
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidNonce");
    });

    it("Should rollback nonce on transfer failure", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("rollback-test"));
      const amount = ethers.parseEther("100.0"); // More than contract balance
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      // Transfer fails due to insufficient balance
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InsufficientBalance");

      // Nonce should still be 0 (rolled back)
      expect(await settlement.getIntentNonce(intentHash)).to.equal(0);
    });
  });

  describe("Executor Management", function () {
    it("Should allow owner to update executor", async function () {
      const newExecutor = signers.addrs[0];

      await expect(
        settlement.connect(owner).updateExecutor(newExecutor.address)
      )
        .to.emit(settlement, "ExecutorUpdated")
        .withArgs(executor.address, newExecutor.address);

      expect(await settlement.executor()).to.equal(newExecutor.address);
    });

    it("Should reject non-owner updating executor", async function () {
      const newExecutor = signers.addrs[0];

      await expect(
        settlement.connect(executor).updateExecutor(newExecutor.address)
      ).to.be.revertedWithCustomError(settlement, "Unauthorized");
    });

    it("Should reject zero address as new executor", async function () {
      await expect(
        settlement.connect(owner).updateExecutor(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(settlement, "ZeroAddress");
    });

    it("Should accept signatures from new executor after update", async function () {
      const newExecutor = signers.addrs[0];

      // Update executor
      await settlement.connect(owner).updateExecutor(newExecutor.address);

      // Sign with new executor
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("new-exec"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        newExecutor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      // Should execute successfully
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      )
        .to.emit(settlement, "PaymentExecuted")
        .withArgs(intentHash, recipient.address, amount);
    });

    it("Should reject signatures from old executor after update", async function () {
      const newExecutor = signers.addrs[0];

      // Update executor
      await settlement.connect(owner).updateExecutor(newExecutor.address);

      // Try to sign with old executor
      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("old-exec-reject")
      );
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor, // Old executor
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      // Should be rejected
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          nonce,
          signature
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidSigner");
    });
  });

  describe("Integration Tests", function () {
    it("Should execute end-to-end flow: deposit -> sign -> execute", async function () {
      const initialBalance = ethers.parseEther("10.0");
      expect(await settlement.getBalance()).to.equal(initialBalance);

      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("e2e-flow-test")
      );
      const amount = ethers.parseEther("1.5");
      const nonce = 0n;

      const recipientInitialBalance = await ethers.provider.getBalance(
        recipient.address
      );

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        nonce,
        signature
      );

      // Contract balance decreased
      expect(await settlement.getBalance()).to.equal(
        initialBalance - amount
      );

      // Recipient balance increased
      const recipientNewBalance = await ethers.provider.getBalance(
        recipient.address
      );
      expect(recipientNewBalance).to.equal(recipientInitialBalance + amount);

      // Intent marked as executed
      expect(await settlement.isIntentExecuted(intentHash)).to.be.true;
    });

    it("Should track nonce across sequential settlements for same intent", async function () {
      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("sequential-test")
      );
      const amount = ethers.parseEther("0.5");

      // Execute first settlement with nonce 0, then retrieve and update amount for retry
      const signature0 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        0n
      );

      await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        0,
        signature0
      );

      expect(await settlement.getIntentNonce(intentHash)).to.equal(1);

      // Try to sign and execute again with nonce 0 - should fail
      const signature0Again = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        0n
      );

      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          amount,
          0,
          signature0Again
        )
      ).to.be.revertedWithCustomError(settlement, "InvalidNonce");

      expect(await settlement.getIntentNonce(intentHash)).to.equal(1);
    });

    it("Should allow retry after transfer failure with new signature", async function () {
      const intentHash = ethers.keccak256(
        ethers.toUtf8Bytes("retry-test")
      );
      const excessiveAmount = ethers.parseEther("20.0"); // Exceeds contract balance
      const nonce = 0n;

      const signature1 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        excessiveAmount,
        nonce
      );

      // First attempt fails
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          excessiveAmount,
          nonce,
          signature1
        )
      ).to.be.revertedWithCustomError(settlement, "InsufficientBalance");

      // Nonce should still be 0, allowing retry
      expect(await settlement.getIntentNonce(intentHash)).to.equal(0);

      // Retry with valid amount
      const validAmount = ethers.parseEther("1.0");
      const signature2 = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        validAmount,
        nonce
      );

      // Retry succeeds
      await expect(
        settlement.executeSettlement(
          intentHash,
          recipient.address,
          validAmount,
          nonce,
          signature2
        )
      )
        .to.emit(settlement, "PaymentExecuted")
        .withArgs(intentHash, recipient.address, validAmount);
    });
  });

  describe("Gas Consumption", function () {
    it("Should measure gas cost of signature verification", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("gas-test"));
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient.address,
        amount,
        nonce
      );

      const tx = await settlement.executeSettlement(
        intentHash,
        recipient.address,
        amount,
        nonce,
        signature
      );

      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed;

      console.log(`Gas used for signature verification: ${gasUsed}`);

      // Verify gas is in reasonable range
      // ~6k for ecrecover + ~3k for EIP-712 + ~80k for state changes = ~90k total
      expect(gasUsed).to.be.greaterThan(6000);
      expect(gasUsed).to.be.lessThan(120000);
    });
  });
});
