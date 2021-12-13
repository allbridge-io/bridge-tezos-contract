const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { rejects, strictEqual, deepStrictEqual } = require("assert");
const { BigNumber } = require("bignumber.js");
const { alice, bob } = require("../scripts/sandbox/accounts");
const BridgeCore = require("./helpers/bridgeWrapper");
const toBytes = require("../scripts/toBytesForSign");
const accuracy = 10 ** 6;
function dtFormat(days, minus = false) {
  const dt = new Date();
  if (minus) {
    dt.setDate(dt.getDate() - days);
  } else {
    dt.setDate(dt.getDate() + days);
  }
  return dt.toISOString();
}
function sleep(sec) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

describe("Staking tests", async function () {
  let staking;
  let bridge;
  const abrPerSec = 1200;
  const abrChainId = Buffer.from("42", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      bridge = await new BridgeCore().init({
        startPeriod: dtFormat(11, true),
        endPeriod: dtFormat(1, true),
        abrPerSec: abrPerSec,
      });
      staking = bridge.staking;
    } catch (e) {
      console.log(e);
    }
    const newAsset = {
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
      symbol: Buffer.from("wABR").toString("hex"),
      name: Buffer.from("Wrapped ABR").toString("hex"),
      decimals: Buffer.from("6").toString("hex"),
      icon: Buffer.from("").toString("hex"),
    };
    await bridge.addAsset(newAsset);
    await bridge.updateStorage();

    let keccakBytes = toBytes({
      lockId: 0,
      recipient: alice.pkh,
      amount: 60000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    });
    let signature = await signerSecp.sign(keccakBytes);
    await bridge.unlockAsset(abrChainId, 0, 0, 60000, alice.pkh, signature.sig);

    await bridge.updateStorage();
    await bridge.updateOperator("add_operator", alice.pkh, staking.address, 0);

    keccakBytes = toBytes({
      lockId: 1,
      recipient: bob.pkh,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    });
    signature = await signerSecp.sign(keccakBytes);
    Tezos.setSignerProvider(signerBob);
    await bridge.unlockAsset(abrChainId, 1, 0, 10000, bob.pkh, signature.sig);
    await bridge.updateOperator("add_operator", bob.pkh, staking.address, 0);

    keccakBytes = toBytes({
      lockId: 2,
      recipient: staking.address,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      chainId: abrChainId,
      tokenAddress: Buffer.from("abrAddress", "ascii").toString("hex"),
    });
    signature = await signerSecp.sign(keccakBytes);
    Tezos.setSignerProvider(signerBob);
    await bridge.unlockAsset(
      abrChainId,
      2,
      0,
      10000,
      staking.address,
      signature.sig,
    );
    await bridge.updateOperator("add_operator", bob.pkh, staking.address, 0);
  });

  describe("Testing entrypoint: Deposit", async function () {
    it("Shouldn't deposit with 0 tokens", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(staking.deposit(0), err => {
        strictEqual(err.message, "Bridge-staking/zero-deposit");
        return true;
      });
    });
    it("Should allow deposit 10000 alice with burn non-use rewards", async function () {
      await staking.deposit(10000);
      await staking.updateStorage();
      const aliceBalance = await staking.getBalance(alice.pkh);
      const burnBalance = await bridge.getBalance(
        "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg",
        0,
      );
      strictEqual(aliceBalance, 10000);
      strictEqual(
        staking.storage.total_underlying_f.toNumber(),
        10000 * accuracy,
      );
      strictEqual(staking.storage.total_supply.toNumber(), 10000);
      strictEqual(burnBalance, Math.floor((abrPerSec / accuracy) * 10 * 86400));
    });
    it("Should allow deposit 10000 bob", async function () {
      await staking.addReward(dtFormat(0.1, true), dtFormat(1), 50000);
      Tezos.setSignerProvider(signerBob);

      const prevTotalSupply = staking.storage.total_supply.toNumber();
      const prevTotalUnderlying = staking.storage.total_underlying_f.toNumber();
      await staking.deposit(10000);
      await staking.updateStorage();
      const exchangeRate = Math.floor(
        staking.storage.total_underlying_f.toNumber() /
          staking.storage.total_supply.toNumber(),
      );
      const shares = Math.floor((10000 * 10 ** 6) / exchangeRate);

      strictEqual(
        staking.storage.total_underlying_f.toNumber() >
          prevTotalUnderlying + 10000 * accuracy,
        true,
      );
      strictEqual(
        staking.storage.total_supply.toNumber(),
        prevTotalSupply + shares,
      );
    });
  });
  describe("Testing entrypoint: Withdraw", async function () {
    it("Shouldn't withdraw 0 tokens", async function () {
      Tezos.setSignerProvider(signerAlice);

      await rejects(staking.withdraw(0), err => {
        strictEqual(err.message, "Bridge-staking/zero-withdraw");
        return true;
      });
    });
    it("Should withdraw 10000 shares Alice", async function () {
      const withdrawAmount = 10000;

      const prevTotalSupply = staking.storage.total_supply.toNumber();
      const prevTotalUnderlying = staking.storage.total_underlying_f.toNumber();
      const exchangeRate = Math.floor(prevTotalUnderlying / prevTotalSupply);
      const out = Math.floor((withdrawAmount * exchangeRate) / accuracy);
      await staking.withdraw(withdrawAmount);
      await staking.updateStorage();

      const aliceBalance = await staking.getBalance(alice.pkh);

      strictEqual(aliceBalance, 0);
      strictEqual(
        staking.storage.total_supply.toNumber(),
        prevTotalSupply - withdrawAmount,
      );
    });
    it("Should withdraw 9993 shares Bob", async function () {
      Tezos.setSignerProvider(signerBob);
      const withdrawAmount = 9993;

      const prevTotalSupply = staking.storage.total_supply.toNumber();
      const prevTotalUnderlying = staking.storage.total_underlying_f.toNumber();
      const exchangeRate = Math.floor(prevTotalUnderlying / prevTotalSupply);
      const out = Math.floor((withdrawAmount * exchangeRate) / accuracy);
      await staking.withdraw(withdrawAmount);
      await staking.updateStorage();

      const bobBalance = await staking.getBalance(alice.pkh);

      strictEqual(bobBalance, 0);
      strictEqual(
        staking.storage.total_supply.toNumber(),
        prevTotalSupply - withdrawAmount,
      );
    });
  });
});
