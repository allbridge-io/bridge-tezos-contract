const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const {
  rejects,
  strictEqual,
  deepStrictEqual,
  notStrictEqual,
} = require("assert");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");
const { BigNumber } = require("bignumber.js");
const { alice, bob } = require("../scripts/sandbox/accounts");
const { char2Bytes, bytes2Char } = require("@taquito/utils");
const GetBytes = require("./helpers/getBytesWrapper");

describe("BridgeCore Transfer tests", async function () {
  let bridge;
  let getBytes;
  let fa12Token;
  let fa2Token;
  let fa12AssetId = 0;
  let fa2AssetId = 1;
  let tezAssetId = 2;
  let wrappedAssetId = 3;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      fa12Token = await new Token().init();
      fa2Token = await new Token("fa2").init();

      bridge = await new BridgeCore().init();
      getBytes = await new GetBytes().init();

      const fa12Asset = {
        assetType: "fa12_",
        tokenAddress: fa12Token.address,
      };
      const fa2Asset = {
        assetType: "fa2_",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      };
      const tezAsset = {
        assetType: "tez_",
      };
      const wrappedAsset = {
        assetType: "wrapped_",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      };
      await bridge.addAsset(fa12Asset);
      await bridge.addAsset(fa2Asset);
      await bridge.addAsset(tezAsset);
      await bridge.addAsset(wrappedAsset);

      await fa12Token.approveToken(bridge.address, 100000);
      await fa2Token.approveToken(
        bridge.address,
        100000,
        alice.pkh,
        fa2Token.tokenId,
      );
      const sigBytes = await getBytes.getBytes({
        lockId: 3,
        recipient: alice.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        assetType: "wrapped_",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      console.log(sigBytes);
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Lock_asset", async function () {
    // it("Should lock fa12 asset", async function () {
    //   const lockAmount = 10000;
    //   const fee = 1000;
    //   const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
    //   const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
    //   const prevFeeCollectorBalance = await fa12Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   await bridge.lockAsset(
    //     bscChainId,
    //     0,
    //     fa12AssetId,
    //     lockAmount,
    //     Buffer.from(alice.pkh, "ascii").toString("hex"),
    //   );
    //   await bridge.updateStorage();
    //   const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
    //   const bridgeBalance = await fa12Token.getBalance(bridge.address);
    //   const feeCollectorBalance = await fa12Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   strictEqual(
    //     asset.locked_amount.toNumber(),
    //     prevAsset.locked_amount.toNumber() + lockAmount - fee,
    //   );
    //   strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
    //   strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    // });
    // it("Should lock fa2 asset", async function () {
    //   const lockAmount = 10000;
    //   const fee = 1000;
    //   const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
    //   const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
    //   const prevFeeCollectorBalance = await fa2Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   await bridge.lockAsset(
    //     bscChainId,
    //     1,
    //     fa2AssetId,
    //     lockAmount,
    //     Buffer.from(alice.pkh, "ascii").toString("hex"),
    //   );
    //   await bridge.updateStorage();
    //   const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
    //   const bridgeBalance = await fa12Token.getBalance(bridge.address);
    //   const feeCollectorBalance = await fa12Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   strictEqual(
    //     asset.locked_amount.toNumber(),
    //     prevAsset.locked_amount.toNumber() + lockAmount - fee,
    //   );
    //   strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
    //   strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    // });
    // it("Should lock tez asset", async function () {
    //   const lockAmount = 10000 / 1e6;
    //   const fee = 1000;
    //   const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
    //   const prevBridgeBalance = await Tezos.tz
    //     .getBalance(bridge.address)
    //     .then(balance => Math.floor(balance.toNumber()))
    //     .catch(error => console.log(JSON.stringify(error)));
    //   const prevFeeCollectorBalance = await Tezos.tz
    //     .getBalance(bridge.storage.fee_collector)
    //     .then(balance => Math.floor(balance.toNumber()))
    //     .catch(error => console.log(JSON.stringify(error)));
    //   await bridge.lockAsset(
    //     bscChainId,
    //     2,
    //     tezAssetId,
    //     0,
    //     Buffer.from(alice.pkh, "ascii").toString("hex"),
    //     lockAmount,
    //   );
    //   await bridge.updateStorage();
    //   const asset = await bridge.storage.bridge_assets.get(tezAssetId);
    //   const bridgeBalance = await Tezos.tz
    //     .getBalance(bridge.address)
    //     .then(balance => Math.floor(balance.toNumber()))
    //     .catch(error => console.log(JSON.stringify(error)));
    //   const feeCollectorBalance = await Tezos.tz
    //     .getBalance(bridge.storage.fee_collector)
    //     .then(balance => Math.floor(balance.toNumber()))
    //     .catch(error => console.log(JSON.stringify(error)));
    //   strictEqual(
    //     asset.locked_amount.toNumber(),
    //     prevAsset.locked_amount.toNumber() + lockAmount * 10 ** 6 - fee,
    //   );
    //   strictEqual(
    //     bridgeBalance,
    //     prevBridgeBalance + lockAmount * 10 ** 6 - fee,
    //   );
    //   strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    // });
    it("Should lock wrapped asset", async function () {
      const lockAmount = 10000;
      const fee = 1000;
      // const signature = await Tezos.signer.sign(
      //   "212bfd8bd278cc478f0baa300c52d5be3ca0c8c9ea7efe0185934569fee66068",
      // );
      const sigBytes = await getBytes.getBytes({
        lockId: 3,
        recipient: alice.pkh,
        amount: lockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped_",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });

      const signature = await Tezos.signer.sign(sigBytes);
      await bridge.unlockAsset(
        bscChainId,
        3,
        wrappedAssetId,
        lockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const wrappedTokenId = prevAsset.asset_type.wrapped.toNumber();
      const prevAliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId,
      );
      const prevFeeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId,
      );
      await bridge.lockAsset(
        bscChainId,
        3,
        wrappedAssetId,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const aliseBalance = await bridge.getBalance(alice.pkh, wrappedTokenId);
      const feeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId,
      );
      strictEqual(aliseBalance, prevAliseBalance - lockAmount);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - (lockAmount - fee),
      );
    });
    it("Shouldn't lock wrapped asset if low balance", async function () {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          3,
          wrappedAssetId,
          999999,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "Bridge-core/insufficient-balance");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Unlock_asset", async function () {
    // it("Should unlock fa12 asset", async function () {
    //   const unlockAmount = 9000;
    //   const fee = 1000;
    //   const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
    //   const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
    //   const prevFeeCollectorBalance = await fa12Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   const signature = await Tezos.signer.sign(
    //     "212bfd8bd278cc478f0baa300c52d5be3ca0c8c9ea7efe0185934569fee66068",
    //   );
    //   await bridge.unlockAsset(
    //     bscChainId,
    //     0,
    //     fa12AssetId,
    //     unlockAmount,
    //     alice.pkh,
    //     signature.sig,
    //   );
    //   await bridge.updateStorage();
    //   const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
    //   const bridgeBalance = await fa12Token.getBalance(bridge.address);
    //   const feeCollectorBalance = await fa12Token.getBalance(
    //     bridge.storage.fee_collector,
    //   );
    //   strictEqual(
    //     asset.locked_amount.toNumber(),
    //     prevAsset.locked_amount.toNumber() + lockAmount - fee,
    //   );
    //   strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
    //   strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    // });
    // it("Should unlock wrapped asset", async function () {
    //   const unlockAmount = 1000;
    //   const fee = 1000;
    //   const signature = await Tezos.signer.sign(
    //     "212bfd8bd278cc478f0baa300c52d5be3ca0c8c9ea7efe0185934569fee66068",
    //   );
    //   const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
    //   const wrappedTokenId = prevAsset.asset_type.wrapped.toNumber();
    //   const prevAliseBalance = await bridge.getBalance(
    //     alice.pkh,
    //     wrappedTokenId,
    //   );
    //   const prevFeeCollectorBalance = await bridge.getBalance(
    //     bridge.storage.fee_collector,
    //     wrappedTokenId,
    //   );
    //   await bridge.unlockAsset(
    //     bscChainId,
    //     3,
    //     wrappedAssetId,
    //     lockAmount,
    //     alice.pkh,
    //     signature.sig,
    //   );
    //   await bridge.updateStorage();
    //   const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
    //   const aliseBalance = await bridge.getBalance(alice.pkh, wrappedTokenId);
    //   const feeCollectorBalance = await bridge.getBalance(
    //     bridge.storage.fee_collector,
    //     wrappedTokenId,
    //   );
    //   strictEqual(aliseBalance, prevAliseBalance + unlockAmount);
    //   strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    //   strictEqual(
    //     asset.locked_amount.toNumber(),
    //     prevAsset.locked_amount.toNumber() + unlockAmount - fee,
    //   );
    // });
  });
});
