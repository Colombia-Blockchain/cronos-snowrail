import { expect } from "chai";
import { ethers } from "hardhat";
import type { Settlement } from "../typechain-types/Settlement";
import { loadTestSigners, TestFixture, signSettlement } from "./fixtures";

describe("Settlement Contract", function () {
  let settlement: Settlement;
  let signers: TestFixture;
  let executor: any;
  let contractAddress: string;
  let chainId: number;

  beforeEach(async function () {
    signers = await loadTestSigners();
    executor = signers.addr1;

    const SettlementFactory = await ethers.getContractFactory("Settlement");
    const deployed = await SettlementFactory.deploy(executor.address);
    await deployed.waitForDeployment();
    settlement = deployed as unknown as Settlement;
    contractAddress = settlement.target as string;

    // Get chain ID
    const network = await ethers.provider.getNetwork();
    chainId = Number(network.chainId);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await settlement.owner()).to.equal(signers.owner.address);
    });

    it("Should have zero balance initially", async function () {
      const balance = await ethers.provider.getBalance(settlement.target);
      expect(balance).to.equal(0);
    });

    it("Should set the executor address", async function () {
      expect(await settlement.executor()).to.equal(executor.address);
    });
  });

  describe("Deposits", function () {
    it("Should accept ETH deposits", async function () {
      const depositAmount = ethers.parseEther("1.0");

      await expect(
        signers.owner.sendTransaction({
          to: settlement.target,
          value: depositAmount,
        })
      )
        .to.emit(settlement, "Deposited")
        .withArgs(signers.owner.address, depositAmount);

      const balance = await ethers.provider.getBalance(settlement.target);
      expect(balance).to.equal(depositAmount);
    });

    it("Should emit Deposited event with correct parameters", async function () {
      const depositAmount = ethers.parseEther("2.0");

      await expect(
        signers.addr1.sendTransaction({
          to: settlement.target,
          value: depositAmount,
        })
      )
        .to.emit(settlement, "Deposited")
        .withArgs(signers.addr1.address, depositAmount);
    });

    it("Should allow multiple deposits and accumulate balance", async function () {
      const amount1 = ethers.parseEther("1.0");
      const amount2 = ethers.parseEther("2.0");

      await signers.owner.sendTransaction({
        to: settlement.target,
        value: amount1,
      });

      await signers.addr1.sendTransaction({
        to: settlement.target,
        value: amount2,
      });

      const balance = await ethers.provider.getBalance(settlement.target);
      expect(balance).to.equal(amount1 + amount2);
    });
  });

  describe("Settlement Execution", function () {
    const depositAmount = ethers.parseEther("10.0");

    beforeEach(async function () {
      // Deposit funds before testing settlements
      await signers.owner.sendTransaction({
        to: settlement.target,
        value: depositAmount,
      });
    });

    describe("Valid Settlements", function () {
      it("Should execute valid settlement", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("test-intent-1"));
        const nonce = 0n;

        const initialBalance = await ethers.provider.getBalance(recipient);

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        )
          .to.emit(settlement, "PaymentExecuted")
          .withArgs(intentHash, recipient, amount);

        const finalBalance = await ethers.provider.getBalance(recipient);
        expect(finalBalance).to.equal(initialBalance + amount);
      });

      it("Should execute settlement with exact balance remaining", async function () {
        const recipient = signers.addr2.address;
        const amount = depositAmount; // Transfer entire balance
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("test-intent-exact"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        )
          .to.emit(settlement, "PaymentExecuted")
          .withArgs(intentHash, recipient, amount);

        const contractBalance = await ethers.provider.getBalance(settlement.target);
        expect(contractBalance).to.equal(0);
      });

      it("Should execute multiple sequential settlements", async function () {
        const recipient1 = signers.addr2.address;
        const recipient2 = signers.addr1.address;
        const amount = ethers.parseEther("1.0");

        const hash1 = ethers.keccak256(ethers.toUtf8Bytes("intent-1"));
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes("intent-2"));

        // First settlement
        const sig1 = await signSettlement(
          executor,
          contractAddress,
          chainId,
          hash1,
          recipient1,
          amount,
          0n
        );

        await expect(
          settlement.executeSettlement(hash1, recipient1, amount, 0, sig1)
        ).to.emit(settlement, "PaymentExecuted");

        // Second settlement
        const sig2 = await signSettlement(
          executor,
          contractAddress,
          chainId,
          hash2,
          recipient2,
          amount,
          0n
        );

        await expect(
          settlement.executeSettlement(hash2, recipient2, amount, 0, sig2)
        ).to.emit(settlement, "PaymentExecuted");

        const finalBalance = await ethers.provider.getBalance(settlement.target);
        expect(finalBalance).to.equal(depositAmount - amount - amount);
      });
    });

    describe("Authorization", function () {
      it("Should reject signature from non-executor", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("unauthorized"));
        const nonce = 0n;

        // Sign with owner (not executor)
        const signature = await signSettlement(
          signers.owner,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "InvalidSigner");
      });

      it("Should reject settlement without valid signature", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("invalid-sig"));
        const nonce = 0n;

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, "0x00")
        ).to.be.reverted;
      });
    });

    describe("Replay Attack Prevention", function () {
      it("Should prevent replay attack - same intent twice", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("replay-test"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        // First execution should succeed
        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        ).to.emit(settlement, "PaymentExecuted");

        // Second execution with same intentHash should fail
        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "InvalidNonce");
      });

      it("Should track executed intents in mapping", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("mapping-test"));
        const nonce = 0n;

        // Intent should not be executed initially
        expect(await settlement.isIntentExecuted(intentHash)).to.equal(false);

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        // Execute settlement
        await settlement.executeSettlement(intentHash, recipient, amount, nonce, signature);

        // Intent should now be marked as executed
        expect(await settlement.isIntentExecuted(intentHash)).to.equal(true);
      });

      it("Should allow different intents with same recipient and amount", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("1.0");
        const hash1 = ethers.keccak256(ethers.toUtf8Bytes("intent-different-1"));
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes("intent-different-2"));

        const sig1 = await signSettlement(
          executor,
          contractAddress,
          chainId,
          hash1,
          recipient,
          amount,
          0n
        );

        const sig2 = await signSettlement(
          executor,
          contractAddress,
          chainId,
          hash2,
          recipient,
          amount,
          0n
        );

        // Both intents should execute successfully (different hashes)
        await expect(
          settlement.executeSettlement(hash1, recipient, amount, 0, sig1)
        ).to.emit(settlement, "PaymentExecuted");

        await expect(
          settlement.executeSettlement(hash2, recipient, amount, 0, sig2)
        ).to.emit(settlement, "PaymentExecuted");
      });
    });

    describe("Input Validation", function () {
      it("Should reject zero recipient address", async function () {
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("zero-addr"));
        const amount = ethers.parseEther("1.0");
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          ethers.ZeroAddress,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, ethers.ZeroAddress, amount, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "ZeroAddress");
      });

      it("Should reject zero amount", async function () {
        const recipient = signers.addr2.address;
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("zero-amount"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          0n,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, 0, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "ZeroAmount");
      });
    });

    describe("Balance Checking", function () {
      it("Should reject settlement with insufficient balance", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("20.0"); // More than available 10 ETH
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("insufficient"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "InsufficientBalance");
      });

      it("Should include available balance in InsufficientBalance error", async function () {
        const recipient = signers.addr2.address;
        const amount = ethers.parseEther("20.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("insufficient-error"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          recipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, recipient, amount, nonce, signature)
        ).to.be.revertedWithCustomError(settlement, "InsufficientBalance");
      });
    });

    describe("Transfer Failure Handling", function () {
      it("Should rollback state on transfer failure", async function () {
        // Create a contract that rejects ETH
        const RejectingContract = await ethers.getContractFactory("TestRejectingContract");
        const rejectingContract = await RejectingContract.deploy();
        await rejectingContract.waitForDeployment();

        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("transfer-fail"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          rejectingContract.target as string,
          amount,
          nonce
        );

        // Attempt to send to rejecting contract should fail
        await expect(
          settlement.executeSettlement(
            intentHash,
            rejectingContract.target as string,
            amount,
            nonce,
            signature
          )
        ).to.be.revertedWithCustomError(settlement, "TransferFailed");

        // Intent should NOT be marked as executed
        expect(await settlement.isIntentExecuted(intentHash)).to.equal(false);
      });

      it("Should allow retry after failed transfer", async function () {
        const RejectingContract = await ethers.getContractFactory("TestRejectingContract");
        const rejectingContract = await RejectingContract.deploy();
        await rejectingContract.waitForDeployment();

        const amount = ethers.parseEther("1.0");
        const intentHash = ethers.keccak256(ethers.toUtf8Bytes("retry-test"));
        const nonce = 0n;

        const signature = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          rejectingContract.target as string,
          amount,
          nonce
        );

        // First attempt fails
        await expect(
          settlement.executeSettlement(
            intentHash,
            rejectingContract.target as string,
            amount,
            nonce,
            signature
          )
        ).to.be.revertedWithCustomError(settlement, "TransferFailed");

        // Second attempt with different recipient should still work
        const validRecipient = signers.addr2.address;
        const sig2 = await signSettlement(
          executor,
          contractAddress,
          chainId,
          intentHash,
          validRecipient,
          amount,
          nonce
        );

        await expect(
          settlement.executeSettlement(intentHash, validRecipient, amount, nonce, sig2)
        ).to.emit(settlement, "PaymentExecuted");
      });
    });
  });

  describe("View Functions", function () {
    it("Should return correct contract balance", async function () {
      const amount = ethers.parseEther("2.5");

      await signers.owner.sendTransaction({
        to: settlement.target,
        value: amount,
      });

      const balance = await settlement.getBalance();
      expect(balance).to.equal(amount);
    });

    it("Should return zero balance initially", async function () {
      const balance = await settlement.getBalance();
      expect(balance).to.equal(0);
    });

    it("Should correctly report intent execution status", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("status-test"));
      const recipient = signers.addr2.address;
      const amount = ethers.parseEther("1.0");
      const nonce = 0n;

      // Deposit first
      await signers.owner.sendTransaction({
        to: settlement.target,
        value: ethers.parseEther("10.0"),
      });

      // Check status before execution
      expect(await settlement.isIntentExecuted(intentHash)).to.equal(false);

      const signature = await signSettlement(
        executor,
        contractAddress,
        chainId,
        intentHash,
        recipient,
        amount,
        nonce
      );

      // Execute settlement
      await settlement.executeSettlement(intentHash, recipient, amount, nonce, signature);

      // Check status after execution
      expect(await settlement.isIntentExecuted(intentHash)).to.equal(true);
    });

    it("Should correctly report intent nonce", async function () {
      const intentHash = ethers.keccak256(ethers.toUtf8Bytes("nonce-status"));

      // Check initial nonce is 0
      expect(await settlement.getIntentNonce(intentHash)).to.equal(0);
    });
  });
});
