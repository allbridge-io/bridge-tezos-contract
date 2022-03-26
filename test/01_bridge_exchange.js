const { Tezos, signerAlice, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const { confirmOperation } = require("../scripts/confirmation");
const { MichelsonMap } = require("@taquito/taquito");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, eve, secpSigner, bob } = require("../scripts/sandbox/accounts");
const toBytes = require("../scripts/toBytesForSign");
const lockIdToBytes = require("../scripts/lockIdToBytes");

const precision = 10 ** 6;
const fa2Precision = 10 ** 12;
const wrappedPrecision = 10 ** 9;

function calculateFee(amount) {
  const bp = 10000;
  const baseFee = 1000;
  const feePerToken = 1;
  const basicFee = amount * baseFee / bp;
  let fee;
  if (feePerToken > basicFee) {
    fee = feePerToken;
  } else {
    fee = basicFee;
  }

  return Math.floor(fee);
}
describe("BridgeCore Exchange tests", async function () {
  let bridge;
  let fa12Token;
  let fa2Token;
  let fa12AssetId = 0;
  let fa2AssetId = 1;
  let tezAssetId = 2;
  let wrappedAssetId = 3;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");
  const bscAddress = Buffer.from("bscAddress", "ascii").toString("hex");

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    const operation = await Tezos.contract.transfer({
      to: secpSigner.pkh,
      amount: 10,
    });
    await confirmOperation(Tezos, operation.hash);
    try {
      fa12Token = await new Token().init();
      fa2Token = await new Token("fa2").init();

      bridge = await new BridgeCore().init();

      await bridge.wrappedToken.createToken(
        bscChainId,
        Buffer.from("bscAddress", "ascii").toString("hex"),
        MichelsonMap.fromLiteral({
          symbol: Buffer.from("wABR").toString("hex"),
          name: Buffer.from("Wrapped ABR").toString("hex"),
          decimals: Buffer.from("6").toString("hex"),
          icon: Buffer.from("").toString("hex"),
        }),
      );

      const fa12Asset = {
        assetType: "fa12",
        tokenAddress: fa12Token.address,
        precision: 1000,
        pow_above: false,
      };
      const fa2Asset = {
        assetType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
        precision: 1000,
        pow_above: true,
      };
      const tezAsset = {
        assetType: "tez",
        precision: 1000,
        pow_above: false,
      };
      const wrappedAsset = {
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
        precision: 0,
        pow_above: false,
      };

      await bridge.addAsset(fa12Asset);
      await bridge.addAsset(fa2Asset);
      await bridge.addAsset(tezAsset);
      await bridge.addAsset(wrappedAsset);

      await bridge.feeOracle.сhangeFee("change_token_fee", {
        tokenType: "fa12",
        tokenAddress: fa12Token.address,
        fee: 1,
      });
      await bridge.feeOracle.сhangeFee("change_token_fee", {
        tokenType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: 0,
        fee: 1,
      });
      await bridge.feeOracle.сhangeFee("change_token_fee", {
        tokenType: "tez",
        fee: 1,
      });
      await bridge.feeOracle.сhangeFee("change_token_fee", {
        tokenType: "wrapped",
        tokenAddress: bridge.wrappedToken.address,
        tokenId: 0,
        fee: 1,
      });
      await fa12Token.approveToken(bridge.address, 10000 * precision);

      await fa2Token.approveToken(
        bridge.address,
        10000 * fa2Precision,
        alice.pkh,
        fa2Token.tokenId,
      );
      const keccakBytes1 = toBytes({
        lockId: lockIdToBytes("00ffffffffffffffffffffffffffff24"),
        recipient: alice.pkh,
        amount: 10000 * wrappedPrecision,
        chainFromId: bscChainId,
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
      });
      const signature1 = await signerSecp.sign(keccakBytes1);

      await bridge.unlockAsset(
        bscChainId,
        lockIdToBytes("00ffffffffffffffffffffffffffff24"),
        wrappedAssetId,
        10000 * wrappedPrecision,
        alice.pkh,
        signature1.sig,
      );
      const prevAliceBalance = await bridge.wrappedToken.getBalance(alice.pkh);
      const keccakBytes2 = toBytes({
        lockId: lockIdToBytes("00ffffffffffffffffffffffffffff34"),
        recipient: secpSigner.pkh,
        amount: 10000 * wrappedPrecision,
        chainFromId: bscChainId,
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
      });
      const signature2 = await signerSecp.sign(keccakBytes2);

      await bridge.unlockAsset(
        bscChainId,
        lockIdToBytes("00ffffffffffffffffffffffffffff34"),
        wrappedAssetId,
        10000 * wrappedPrecision,
        secpSigner.pkh,
        signature2.sig,
      );
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Lock_asset", async function () {
    it("Should lock fa12 asset", async function () {
      const lockAmount = 10000 * precision;
      const fee = calculateFee(lockAmount);
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff00");
      await bridge.lockAsset(
        bscChainId,
        lockId,
        fa12AssetId,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(lock.amount.toNumber(), lockAmount * 1000 - fee * 1000);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() + lockAmount - fee,
      );
      strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock fa2 asset", async function () {
      const lockAmount = 1000 * fa2Precision;
      const fee = calculateFee(lockAmount);
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff01");
      await bridge.lockAsset(
        bscChainId,
        lockId,
        fa2AssetId,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(
        lock.amount.toNumber(),
        Math.floor(lockAmount / 1000 - fee / 1000),
      );
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() + lockAmount - fee,
      );
      strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock tez asset", async function () {
      const lockAmount = 100000000 / 1e6;
      const fee = calculateFee(100000000);
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      const prevBridgeBalance = await Tezos.tz
        .getBalance(bridge.address)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const prevFeeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff02");
      await bridge.lockAsset(
        bscChainId,
        lockId,
        tezAssetId,
        100000000,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        lockAmount,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(tezAssetId);
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      const bridgeBalance = await Tezos.tz
        .getBalance(bridge.address)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const feeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      strictEqual(lock.amount.toNumber(), lockAmount * 1e6 * 1000 - fee * 1000);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() + lockAmount * 10 ** 6 - fee,
      );
      strictEqual(
        bridgeBalance,
        prevBridgeBalance + lockAmount * 10 ** 6 - fee,
      );
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock wrapped asset", async function () {
      const lockAmount = 5000 * wrappedPrecision;
      const fee = calculateFee(lockAmount);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff03");
      // const keccakBytes = toBytes({
      //   lockId: lockIdToBytes("00ffffffffffffffffffffffffffff93"),
      //   recipient: alice.pkh,
      //   amount: lockAmount,
      //   chainFromId: bscChainId,
      //   assetType: "wrapped",
      //   tokenId: 0,
      //   tokenAddress: bridge.wrappedToken.address,
      // });

      // const signature = await signerSecp.sign(keccakBytes);
      // await bridge.unlockAsset(
      //   bscChainId,
      //   lockIdToBytes("00ffffffffffffffffffffffffffff93"),
      //   wrappedAssetId,
      //   lockAmount,
      //   alice.pkh,
      //   signature.sig,
      // );

      await bridge.updateStorage();
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const prevAliceBalance = await bridge.wrappedToken.getBalance(alice.pkh);

      const prevFeeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
      );
      await bridge.lockAsset(
        bscChainId,
        lockId,
        wrappedAssetId,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh);
      const feeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(lock.amount.toNumber(), lockAmount - fee);
      strictEqual(aliceBalance, prevAliceBalance - lockAmount);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - (lockAmount - fee),
      );
    });
    it("Shouldn't lock wrapped asset if low balance", async function () {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          lockIdToBytes("00ffffffffffffffffffffffffffff53"),
          wrappedAssetId,
          6000 * wrappedPrecision,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "FA2_INSUFFICIENT_BALANCE");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Unlock_asset", async function () {
    it("Should unlock fa12 asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);

      const unlockAmount = 5000 * wrappedPrecision;
      const fee = calculateFee(5000 * 10 ** 6);
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);

      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const keccakBytes = toBytes({
        lockId: lockIdToBytes("00ffffffffffffffffffffffffffff00"),
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        tokenAddress: fa12Token.address,
      });

      const signature = await signerSecp.sign(keccakBytes);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff00");
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        fa12AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const aliceBalance = await fa12Token.getBalance(alice.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      const fromPrecUnlockAmount = Math.ceil(unlockAmount / 1000);
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - fromPrecUnlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - fromPrecUnlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + fromPrecUnlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock fa2 asset with fee", async function () {
      const unlockAmount = 500 * wrappedPrecision;
      const fee = calculateFee(500 * fa2Precision);
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff01");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa2",
        chainId: bscChainId,
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        fa2AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const aliceBalance = await fa2Token.getBalance(alice.pkh);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      const fromPrecUnlockAmount = unlockAmount * 1000;
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - fromPrecUnlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - fromPrecUnlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + fromPrecUnlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock tez asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 5 * wrappedPrecision;
      const fee = calculateFee(5);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff02");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "tez",
        chainId: bscChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      console.log(prevAsset.total_locked);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));

      await bridge.unlockAsset(
        bscChainId,
        lockId,
        tezAssetId,
        unlockAmount,
        eve.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(tezAssetId);
      const eveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(eveBalance, prevEveBalance + Math.ceil(unlockAmount / 1000));

      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - Math.ceil(unlockAmount / 1000),
      );
    });
    it("Should unlock wrapped asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 3000 * wrappedPrecision;
      const fee = calculateFee(unlockAmount);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff04");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const prevAliceBalance = await bridge.wrappedToken.getBalance(
        alice.pkh,
        0,
      );
      const prevFeeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
        0,
      );
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        wrappedAssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh, 0);
      const feeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
        0,
      );
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() + unlockAmount,
      );
    });
    it("Should unlock fa12 asset without fee", async function () {
      Tezos.setSignerProvider(signerAlice);
      const unlockAmount = 1000 * wrappedPrecision;
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff05");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        chainId: bscChainId,
        tokenAddress: fa12Token.address,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        fa12AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const aliceBalance = await fa12Token.getBalance(alice.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - Math.ceil(unlockAmount / 1000),
      );
      strictEqual(
        bridgeBalance,
        prevBridgeBalance - Math.ceil(unlockAmount / 1000),
      );
      strictEqual(
        aliceBalance,
        prevAliceBalance + Math.ceil(unlockAmount / 1000),
      );
    });
    it("Should unlock fa2 asset without fee", async function () {
      const unlockAmount = 300 * wrappedPrecision;

      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff06");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa2",
        chainId: bscChainId,
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        fa2AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const aliceBalance = await fa2Token.getBalance(alice.pkh);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - unlockAmount * 1000,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount * 1000);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount * 1000);
    });
    it("Should unlock tez asset without fee", async function () {
      const unlockAmount = 2 * wrappedPrecision;
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff07");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "tez",
        chainId: bscChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      await bridge.unlockAsset(
        bscChainId,
        lockId,
        tezAssetId,
        unlockAmount,
        eve.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(tezAssetId);
      const eveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(eveBalance, prevEveBalance + Math.ceil(unlockAmount / 1000));

      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() - Math.ceil(unlockAmount / 1000),
      );
    });
    it("Should unlock wrapped asset without fee", async function () {
      const unlockAmount = 2000 * wrappedPrecision;
      const lockId = lockIdToBytes("00ffffffffffffffffffffffffffff08");
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const prevAliceBalance = await bridge.wrappedToken.getBalance(
        alice.pkh,
        0,
      );

      await bridge.unlockAsset(
        bscChainId,
        lockId,
        wrappedAssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh, 0);
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        lockId,
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount);

      strictEqual(
        asset.total_locked.toNumber(),
        prevAsset.total_locked.toNumber() + unlockAmount,
      );
    });
  });
});
