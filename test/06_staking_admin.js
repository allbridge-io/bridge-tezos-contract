const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");

const { alice, bob } = require("../scripts/sandbox/accounts");

const BridgeCore = require("./helpers/bridgeWrapper");
const { MichelsonMap } = require("@taquito/taquito");
const toBytes = require("../scripts/toBytesForSign");
const lockIdToBytes = require("../scripts/lockIdToBytes");

async function dtFormat(Tezos, sec, minus = false) {
  const ts = await Tezos.rpc.getBlockHeader();
  let currentTime = Date.parse(ts.timestamp) / 1000;
  if (minus) {
    currentTime -= sec;
  } else {
    currentTime += sec;
  }
  return new Date(currentTime * 1000).toISOString();
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
    await bridge.wrappedToken.createToken(
      abrChainId,
      Buffer.from("bscAddress", "ascii").toString("hex"),
      MichelsonMap.fromLiteral({
        symbol: Buffer.from("wABR").toString("hex"),
        name: Buffer.from("Wrapped ABR").toString("hex"),
        decimals: Buffer.from("6").toString("hex"),
        icon: Buffer.from("").toString("hex"),
      }),
    );
    const newAsset = {
      assetType: "wrapped",
      tokenId: 0,
      tokenAddress: bridge.wrappedToken.address,
      decimals: 10 ** 6,
    };
    await bridge.addAsset(newAsset);
    await bridge.updateStorage();
    const keccakBytes = toBytes({
      lockId: lockIdToBytes("00ffffffffffffffffffffffffffff00"),
      recipient: bob.pkh,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      tokenAddress: bridge.wrappedToken.address,
      tokenId: 0,
    });
    const signature = await signerSecp.sign(keccakBytes);
    await bridge.unlockAsset(
      abrChainId,
      lockIdToBytes("00ffffffffffffffffffffffffffff00"),
      0,
      10000,
      bob.pkh,
      signature.sig,
    );
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
  describe("Testing entrypoint: Add_reward", async function () {
    it("Shouldn't add reward if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      const startPeriod = await dtFormat(Tezos, 8);
      const endPeriod = await dtFormat(Tezos, 15);

      await rejects(staking.addReward(startPeriod, endPeriod, 10000), err => {
        strictEqual(err.message, "Bridge-staking/not-owner");
        return true;
      });
    });
    it("Shouldn't add reward with 0 abr amount ", async function () {
      Tezos.setSignerProvider(signerBob);
      const startPeriod = await dtFormat(Tezos, 10);
      const endPeriod = await dtFormat(Tezos, 50);

      await rejects(staking.addReward(startPeriod, endPeriod, 0), err => {
        strictEqual(err.message, "Bridge-staking/zero-period-reward");
        return true;
      });
    });
    it("Shouldn't add reward if start > end date", async function () {
      const startPeriod = await dtFormat(Tezos, 10);
      const endPeriod = await dtFormat(Tezos, 0);

      await rejects(staking.addReward(startPeriod, endPeriod, 10000), err => {
        strictEqual(err.message, "Bridge-staking/wrong-period-time");
        return true;
      });
    });
    it("Should add reward period", async function () {
      await bridge.wrappedToken.updateOperator(
        "add_operator",
        bob.pkh,
        staking.address,
        0,
      );

      const startPeriod = await dtFormat(Tezos, 1 * 86400);
      const endPeriod = await dtFormat(Tezos, 10 * 86400);

      await staking.addReward(startPeriod, endPeriod, 1000);
      await staking.updateStorage();
      const abrPerSec = 1286;

      const newPeriod = staking.storage.period;
      strictEqual(
        newPeriod.start_period.slice(0, -5),
        startPeriod.slice(0, -5),
      );
      strictEqual(newPeriod.end_period.slice(0, -5), endPeriod.slice(0, -5));
      strictEqual(newPeriod.abr_per_sec_f.toNumber(), abrPerSec);
    });

    it("Shouldn't add reward if prev period not over", async function () {
      const startPeriod = await dtFormat(Tezos, 5);
      const endPeriod = await dtFormat(Tezos, 20 * 86400);
      await rejects(staking.addReward(startPeriod, endPeriod, 10000), err => {
        strictEqual(err.message, "Bridge-staking/previous-period-not-over");
        return true;
      });
    });
  });
});
