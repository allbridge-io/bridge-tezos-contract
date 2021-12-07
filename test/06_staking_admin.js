const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const { alice, bob } = require("../scripts/sandbox/accounts");
const BridgeCore = require("./helpers/bridgeWrapper");
const toBytes = require("../scripts/toBytesForSign");

function dtFormat(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString();
}
describe("Staking Admin tests", async function () {
  let staking;
  let bridge;

  const abrChainId = Buffer.from("42", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      bridge = await new BridgeCore().init();
      staking = bridge.staking;
    } catch (e) {
      console.log(e);
    }
    const newAsset = {
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    };
    await bridge.addAsset(newAsset);
    await bridge.updateStorage();
    const keccakBytes = toBytes({
      lockId: 0,
      recipient: bob.pkh,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    });
    const signature = await signerSecp.sign(keccakBytes);
    await bridge.unlockAsset(abrChainId, 0, 0, 10000, bob.pkh, signature.sig);
    await bridge.updateStorage();
  });

  describe("Testing entrypoint: Change_owner", async function () {
    it("Shouldn't changing owner if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(staking.сhangeOwner(bob.pkh), (err) => {
        strictEqual(err.message, "Bridge-staking/not-owner");
        return true;
      });
    });
    it("Should allow change owner", async function () {
      Tezos.setSignerProvider(signerAlice);

      await staking.сhangeOwner(bob.pkh);
      await staking.updateStorage();
      strictEqual(staking.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_deposit_token", async function () {
    it("Shouldn't changing deposit token if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(staking.сhangeDepositToken(bob.pkh, 9), (err) => {
        strictEqual(err.message, "Bridge-staking/not-owner");
        return true;
      });
    });
    it("Should allow change deposit token", async function () {
      Tezos.setSignerProvider(signerBob);

      await staking.сhangeDepositToken(bridge.address, 0);
      await staking.updateStorage();
      strictEqual(staking.storage.deposit_token.address, bridge.address);
      strictEqual(staking.storage.deposit_token.id.toNumber(), 0);
    });
  });
  describe("Testing entrypoint: Add_reward", async function () {
    it("Shouldn't add reward if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      const startPeriod = dtFormat(0);
      const endPeriod = dtFormat(10);

      await rejects(staking.addReward(startPeriod, endPeriod, 10000), (err) => {
        strictEqual(err.message, "Bridge-staking/not-owner");
        return true;
      });
    });
    it("Shouldn't add reward with 0 abr amount ", async function () {
      Tezos.setSignerProvider(signerBob);
      const startPeriod = dtFormat(0);
      const endPeriod = dtFormat(10);

      await rejects(staking.addReward(startPeriod, endPeriod, 0), (err) => {
        strictEqual(err.message, "Bridge-staking/zero-period-reward");
        return true;
      });
    });
    it("Shouldn't add reward if ", async function () {
      const startPeriod = dtFormat(10);
      const endPeriod = dtFormat(0);

      await rejects(staking.addReward(startPeriod, endPeriod, 10000), (err) => {
        strictEqual(err.message, "Bridge-staking/wrong-period-time");
        return true;
      });
    });
    it("Should add reward 0, 10", async function () {
      await bridge.updateOperator("add_operator", bob.pkh, staking.address, 0);

      const startPeriod = dtFormat(0);
      const endPeriod = dtFormat(10);
      await staking.addReward(startPeriod, endPeriod, 1000);
      await staking.updateStorage();
      const abrPerSec = 1157;

      const newPeriod = staking.storage.periods[0];
      strictEqual(
        newPeriod.start_period.slice(0, -5),
        startPeriod.slice(0, -5)
      );
      strictEqual(newPeriod.end_period.slice(0, -5), endPeriod.slice(0, -5));
      strictEqual(newPeriod.abr_per_sec_f.toNumber(), abrPerSec);
    });
    it("Should add reward 11, 21)", async function () {
      Tezos.setSignerProvider(signerBob);
      const startPeriod = dtFormat(11);
      const endPeriod = dtFormat(21);

      await staking.addReward(startPeriod, endPeriod, 1000);
      await staking.updateStorage();
      const abrPerSec = 1157;
      const newPeriod = staking.storage.periods[1];
      strictEqual(
        newPeriod.start_period.slice(0, -5),
        startPeriod.slice(0, -5)
      );
      strictEqual(newPeriod.end_period.slice(0, -5), endPeriod.slice(0, -5));
      strictEqual(newPeriod.abr_per_sec_f.toNumber(), abrPerSec);
    });
    it("Should add reward 30, 40", async function () {
      Tezos.setSignerProvider(signerBob);
      const startPeriod = dtFormat(30);
      const endPeriod = dtFormat(40);

      await staking.addReward(startPeriod, endPeriod, 1000);
      await staking.updateStorage();
      const abrPerSec = 1157;
      const newPeriod = staking.storage.periods[2];
      strictEqual(
        newPeriod.start_period.slice(0, -5),
        startPeriod.slice(0, -5)
      );
      strictEqual(newPeriod.end_period.slice(0, -5), endPeriod.slice(0, -5));
      strictEqual(newPeriod.abr_per_sec_f.toNumber(), abrPerSec);
    });
    it("Shouldn't add reward 0 20", async function () {
      const startPeriod = dtFormat(0);
      const endPeriod = dtFormat(20);
      await rejects(staking.addReward(startPeriod, endPeriod, 10000), (err) => {
        strictEqual(err.message, "Bridge-staking/intersected-period");
        return true;
      });
    });
    it("Shouldn't add reward 10 15", async function () {
      const startPeriod = dtFormat(10);
      const endPeriod = dtFormat(15);
      await rejects(staking.addReward(startPeriod, endPeriod, 10000), (err) => {
        strictEqual(err.message, "Bridge-staking/intersected-period");
        return true;
      });
    });

    it("Shouldn't add reward 22 40", async function () {
      const startPeriod = dtFormat(22);
      const endPeriod = dtFormat(40);
      await rejects(staking.addReward(startPeriod, endPeriod, 10000), (err) => {
        strictEqual(err.message, "Bridge-staking/intersected-period");
        return true;
      });
    });
    it("Should add reward 22, 29)", async function () {
      const startPeriod = dtFormat(22);
      const endPeriod = dtFormat(29);

      await staking.addReward(startPeriod, endPeriod, 1000);
      await staking.updateStorage();
      const abrPerSec = 1653;
      const periods = staking.storage.periods;
      const newPeriod = periods[periods.length - 2];

      strictEqual(
        newPeriod.start_period.slice(0, -5),
        startPeriod.slice(0, -5)
      );
      strictEqual(newPeriod.end_period.slice(0, -5), endPeriod.slice(0, -5));
      strictEqual(newPeriod.abr_per_sec_f.toNumber(), abrPerSec);
    });
  });
});
