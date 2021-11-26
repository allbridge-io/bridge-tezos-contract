const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");
const GetKeccak = require("./helpers/getKeccakWrapper");

const { alice, bob, eve } = require("../scripts/sandbox/accounts");

describe("BridgeCore Transfer tests", async function () {
  let bridge;
  let keccak;
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
      keccak = await new GetKeccak().init();
      const fa12Asset = {
        assetType: "fa12",
        tokenAddress: fa12Token.address,
      };
      const fa2Asset = {
        assetType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      };
      const tezAsset = {
        assetType: "tez",
      };
      const wrappedAsset = {
        assetType: "wrapped",
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
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Lock_asset", async function () {
    it("Should lock fa12 asset", async function () {
      const lockAmount = 10000;
      const fee = 1000;
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      await bridge.lockAsset(
        bscChainId,
        0,
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
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + lockAmount - fee,
      );
      strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock fa2 asset", async function () {
      const lockAmount = 10000;
      const fee = 1000;
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      await bridge.lockAsset(
        bscChainId,
        1,
        fa2AssetId,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + lockAmount - fee,
      );
      strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock tez asset", async function () {
      const lockAmount = 10000 / 1e6;
      const fee = 1000;
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      const prevBridgeBalance = await Tezos.tz
        .getBalance(bridge.address)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const prevFeeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      await bridge.lockAsset(
        bscChainId,
        2,
        tezAssetId,
        0,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        lockAmount,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(tezAssetId);
      const bridgeBalance = await Tezos.tz
        .getBalance(bridge.address)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const feeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + lockAmount * 10 ** 6 - fee,
      );
      strictEqual(
        bridgeBalance,
        prevBridgeBalance + lockAmount * 10 ** 6 - fee,
      );
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock wrapped asset", async function () {
      const lockAmount = 10000;
      const fee = 1000;

      const keccakBytes = await keccak.getKeccak({
        lockId: 3,
        recipient: alice.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });

      const signature = await Tezos.signer.sign(keccakBytes);
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
      const wrappedTokenId = await bridge.storage.wrapped_token_ids.get(
        prevAsset.asset_type.wrapped,
      );

      const prevAliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );

      const prevFeeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
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

      const aliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );
      const feeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
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
    it("Should unlock fa12 asset with fee", async function () {
      Tezos.setSignerProvider(signerBob);
      const unlockAmount = 5000;
      const fee = 1000;
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const keccakBytes = await keccak.getKeccak({
        lockId: 0,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        chainId: bscChainId,
        tokenAddress: fa12Token.address,
      });

      const signature = await signerAlice.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        0,
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
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock fa2 asset with fee", async function () {
      const unlockAmount = 5000;
      const fee = 1000;
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const keccakBytes = await keccak.getKeccak({
        lockId: 1,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa2",
        chainId: bscChainId,
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      });

      const signature = await signerAlice.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        1,
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
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock tez asset with fee", async function () {
      Tezos.setSignerProvider(signerBob);
      const unlockAmount = 5000;
      const fee = 1000;
      const keccakBytes = await keccak.getKeccak({
        lockId: 2,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "tez",
        chainId: bscChainId,
      });
      const signature = await signerAlice.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));

      await bridge.unlockAsset(
        bscChainId,
        2,
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

      strictEqual(eveBalance, prevEveBalance + unlockAmount - fee);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
    });
    it("Should unlock wrapped asset with fee", async function () {
      Tezos.setSignerProvider(signerBob);
      const unlockAmount = 3000;
      const fee = 1000;
      const keccakBytes = await keccak.getKeccak({
        lockId: 4,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature = await signerAlice.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const wrappedTokenId = await bridge.storage.wrapped_token_ids.get(
        prevAsset.asset_type.wrapped,
      );
      const prevAliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );
      const prevFeeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
      );
      await bridge.unlockAsset(
        bscChainId,
        4,
        wrappedAssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const aliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );
      const feeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
      );
      strictEqual(aliseBalance, prevAliseBalance + unlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + unlockAmount,
      );
    });
    it("Should unlock fa12 asset without fee", async function () {
      Tezos.setSignerProvider(signerAlice);
      const unlockAmount = 2000;
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);

      const keccakBytes = await keccak.getKeccak({
        lockId: 5,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        chainId: bscChainId,
        tokenAddress: fa12Token.address,
      });

      const signature = await signerAlice.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        5,
        fa12AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const aliceBalance = await fa12Token.getBalance(alice.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount);
    });
    it("Should unlock fa2 asset without fee", async function () {
      const unlockAmount = 2000;

      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);

      const keccakBytes = await keccak.getKeccak({
        lockId: 6,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa2",
        chainId: bscChainId,
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      });

      const signature = await signerAlice.sign(keccakBytes);
      await bridge.unlockAsset(
        bscChainId,
        6,
        fa2AssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const aliceBalance = await fa2Token.getBalance(alice.pkh);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount);
    });
    it("Should unlock tez asset without fee", async function () {
      const unlockAmount = 2000;

      const keccakBytes = await keccak.getKeccak({
        lockId: 7,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "tez",
        chainId: bscChainId,
      });
      const signature = await signerAlice.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(tezAssetId);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      await bridge.unlockAsset(
        bscChainId,
        7,
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

      strictEqual(eveBalance, prevEveBalance + unlockAmount);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() - unlockAmount,
      );
    });
    it("Should unlock wrapped asset without fee", async function () {
      const unlockAmount = 2000;

      const keccakBytes = await keccak.getKeccak({
        lockId: 8,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature = await signerAlice.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const wrappedTokenId = await bridge.storage.wrapped_token_ids.get(
        prevAsset.asset_type.wrapped,
      );
      const prevAliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );

      await bridge.unlockAsset(
        bscChainId,
        8,
        wrappedAssetId,
        unlockAmount,
        alice.pkh,
        signature.sig,
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const aliseBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );

      strictEqual(aliseBalance, prevAliseBalance + unlockAmount);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + unlockAmount,
      );
    });
  });
});
