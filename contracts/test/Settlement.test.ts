import { expect } from "chai";
import { ethers } from "hardhat";
import type { Settlement } from "../typechain-types/Settlement";
import { loadTestSigners, TestFixture } from "./fixtures";

describe("Settlement Contract", function () {
  let settlement: Settlement;
  let signers: TestFixture;

  beforeEach(async function () {
    signers = await loadTestSigners();

    const SettlementFactory = await ethers.getContractFactory("Settlement");
    const deployed = await SettlementFactory.deploy();
    await deployed.waitForDeployment();
    settlement = deployed as unknown as Settlement;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await settlement.owner()).to.equal(signers.owner.address);
    });

    it("Should have zero balance initially", async function () {
      const balance = await ethers.provider.getBalance(settlement.target);
      expect(balance).to.equal(0);
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
  });

  describe("Settlement Execution", function () {
    beforeEach(async function () {
      // Deposit funds before testing settlements
      const depositAmount = ethers.parseEther("10.0");
      await signers.owner.sendTransaction({
        to: settlement.target,
        value: depositAmount,
      });
    });

    it("Should execute valid settlement", async function () {
      const recipient = signers.addr2.address;
      const amount = ethers.parseEther("1.0");
      const intentHash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";

      const initialBalance = await ethers.provider.getBalance(recipient);

      await expect(
        settlement.executeSettlement(intentHash, recipient, amount)
      )
        .to.emit(settlement, "PaymentExecuted")
        .withArgs(intentHash, recipient, amount);

      const finalBalance = await ethers.provider.getBalance(recipient);
      expect(finalBalance).to.equal(initialBalance + amount);
    });

    it("Should reject settlement with insufficient balance", async function () {
      const recipient = signers.addr2.address;
      const amount = ethers.parseEther("20.0"); // More than available
      const intentHash =
        "0x1234567890123456789012345678901234567890123456789012345678901234";

      await expect(
        settlement.executeSettlement(intentHash, recipient, amount)
      ).to.be.revertedWith("Insufficient balance");
    });
  });
});
