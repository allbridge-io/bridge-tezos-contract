const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");

const { alice, bob } = require("../scripts/sandbox/accounts");
const BridgeCore = require("./helpers/bridgeWrapper");
const toBytes = require("../scripts/toBytesForSign");
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
      recipient: alice.pkh,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    });
    const signature = await signerSecp.sign(keccakBytes);
    await bridge.unlockAsset(abrChainId, 0, 0, 10000, alice.pkh, signature.sig);
    await bridge.updateStorage();
  });

  describe("Testing entrypoint: Change_owner", async function () {
    it("Shouldn't changing owner if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(staking.сhangeOwner(bob.pkh), err => {
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
      await rejects(staking.сhangeDepositToken(bob.pkh, 9), err => {
        strictEqual(err.message, "Bridge-staking/not-owner");
        return true;
      });
    });
    it("Should allow change deposit token", async function () {
      Tezos.setSignerProvider(signerBob);

      await staking.сhangeDepositToken(bridge.address, 0);
      await staking.updateStorage();
      strictEqual(staking.storage.deposit_token.address, address);
      strictEqual(staking.storage.deposit_token.id.toNumber(), 0);
    });
  });
  describe("Testing entrypoint: Add_reward", async function () {
    it("Shouldn't add reward if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(staking.addReward("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Staking-bridge/not-owner");
        return true;
      });
    });
  });
});
