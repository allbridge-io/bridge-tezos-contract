const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { rejects, strictEqual, deepStrictEqual } = require("assert");
const { MichelsonMap } = require("@taquito/taquito");
const { alice, bob } = require("../scripts/sandbox/accounts");
const BridgeCore = require("./helpers/bridgeWrapper");
const toBytes = require("../scripts/toBytesForSign");
const accuracy = 10 ** 6;

const lockIdToBytes = require("../scripts/lockIdToBytes");
async function dtFormat(Tezos, sec, minus = false) {
  const ts = await Tezos.rpc.getBlockHeader();
  let currentTime = Date.parse(ts.timestamp) / 1000;
  if (minus) {
    currentTime -= sec;
  } else {
    currentTime += sec;
  }
  return currentTime.toString();
}
function dayToSec(days) {
  return days * 86400;
}
function sleep(sec) {
  return new Promise(resolve => setTimeout(resolve, sec * 1000));
}

describe("Staking tests", async function () {
  let staking;
  let bridge;
  const abrPerSec = 120;
  const abrChainId = Buffer.from("42", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      bridge = await new BridgeCore().init({
        startPeriod: await dtFormat(Tezos, 60000, true),
        endPeriod: await dtFormat(Tezos, 59960, true),
        abrPerSec: abrPerSec * 10 ** 6,
      });
      staking = bridge.staking;
    } catch (e) {
      console.log(e);
    }
    await bridge.wrappedToken.createToken(
      Buffer.from("56", "ascii").toString("hex"),
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
      precision: 0,
      pow_above: false,
    };
    await bridge.addAsset(newAsset);
    await bridge.updateStorage();

    let keccakBytes = toBytes({
      lockId: lockIdToBytes("00ffffffffffffffffffffffffffff00"),
      recipient: alice.pkh,
      amount: 60000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      tokenId: 0,
      tokenAddress: bridge.wrappedToken.address,
    });
    let signature = await signerSecp.sign(keccakBytes);
    await bridge.unlockAsset(
      abrChainId,
      lockIdToBytes("00ffffffffffffffffffffffffffff00"),
      0,
      60000,
      alice.pkh,
      signature.sig,
    );

    await bridge.updateStorage();
    await bridge.wrappedToken.updateOperator(
      "add_operator",
      alice.pkh,
      staking.address,
      0,
    );

    keccakBytes = toBytes({
      lockId: lockIdToBytes("00ffffffffffffffffffffffffffff01"),
      recipient: bob.pkh,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      tokenId: 0,
      tokenAddress: bridge.wrappedToken.address,
    });
    signature = await signerSecp.sign(keccakBytes);
    Tezos.setSignerProvider(signerBob);
    await bridge.unlockAsset(
      abrChainId,
      lockIdToBytes("00ffffffffffffffffffffffffffff01"),
      0,
      10000,
      bob.pkh,
      signature.sig,
    );
    await bridge.wrappedToken.updateOperator(
      "add_operator",
      bob.pkh,
      staking.address,
      0,
    );

    keccakBytes = toBytes({
      lockId: lockIdToBytes("00ffffffffffffffffffffffffffff02"),
      recipient: staking.address,
      amount: 10000,
      chainFromId: abrChainId,
      assetType: "wrapped",
      tokenId: 0,
      tokenAddress: bridge.wrappedToken.address,
    });
    signature = await signerSecp.sign(keccakBytes);
    Tezos.setSignerProvider(signerBob);
    await bridge.unlockAsset(
      abrChainId,
      lockIdToBytes("00ffffffffffffffffffffffffffff02"),
      0,
      10000,
      staking.address,
      signature.sig,
    );
    await bridge.wrappedToken.updateOperator(
      "add_operator",
      bob.pkh,
      staking.address,
      0,
    );
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
      const burnBalance = await bridge.wrappedToken.getBalance(
        "tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg",
        0,
      );
      strictEqual(aliceBalance, 10000);
      strictEqual(
        staking.storage.total_underlying_f.toNumber(),
        10000 * accuracy,
      );
      strictEqual(staking.storage.total_supply.toNumber(), 10000);
      strictEqual(burnBalance, 4800);
    });
    it("Should allow deposit 10000 bob", async function () {
      await staking.addReward(
        await dtFormat(Tezos, 10),
        await dtFormat(Tezos, 600),
        50000,
      );
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
    it("Should withdraw all shares Bob", async function () {
      Tezos.setSignerProvider(signerBob);
      const withdrawAmount = await staking.getBalance(bob.pkh);

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
