const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const { eve, dev } = require("../scripts/sandbox/accounts");
const {
  rejects,
  strictEqual,
  deepStrictEqual,
  notStrictEqual,
} = require("assert");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, bob, secpSigner } = require("../scripts/sandbox/accounts");
const { MichelsonMap } = require("@taquito/taquito");
const toBytes = require("../scripts/toBytesForSign");
const { confirmOperation } = require("../scripts/confirmation");

describe("BridgeCore Admin tests", async function() {
  let bridge;
  let fa12Token;
  let fa2Token;
  const bscChainId = "11223344";
  const bscAddress =
    "1122334455667788990011223344556677889900112233445566778899001122";

  const fa12Source = { chain_id: "1111", native_address: "449999" };
  const fa2Source = { chain_id: "1111", native_address: "559999" };
  const tezSource = { chain_id: "1111", native_address: "000000" };
  const wrappedSource = { chain_id: "2222", native_address: "11223344" };
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
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
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Change_owner", async function () {
    it("Shouldn't changing owner if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow start transfer ownership", async function () {
      Tezos.setSignerProvider(signerAlice);

      await bridge.сhangeAddress("change_owner", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.pending_owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Confirm_owner", async function () {
    it("Shouldn't confirm owner if the user is not an pending owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.contract.methods.confirm_owner().send(), err => {
        strictEqual(err.message, "Bridge-core/not-pending-owner");
        return true;
      });
    });
    it("Should allow confirm transfer ownership", async function () {
      Tezos.setSignerProvider(signerBob);

      const op = await bridge.contract.methods.confirm_owner().send();
      await confirmOperation(Tezos, op.hash);
      await bridge.updateStorage();

      strictEqual(bridge.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_bridge_manager", async function() {
    it("Shouldn't changing bridge manager if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.сhangeAddress("change_bridge_manager", bob.pkh),
        err => {
          strictEqual(err.message, "Bridge-core/not-owner");
          return true;
        },
      );
    });
    it("Should allow change bridge manager", async function() {
      Tezos.setSignerProvider(signerBob);

      await bridge.сhangeAddress("change_bridge_manager", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.bridge_manager, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_stop_manager", async function() {
    it("Shouldn't changing stop manager if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.сhangeAddress("change_stop_manager", bob.pkh),
        err => {
          strictEqual(err.message, "Bridge-core/not-owner");
          return true;
        },
      );
    });

    it("Should allow change stop manager", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_stop_manager", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.stop_manager, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_validator", async function() {
    it("Shouldn't changing validator if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_validator", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow change bridge validator", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_validator", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.validator, bob.pkh);
      await bridge.сhangeAddress("change_validator", bridge.validator.address);
    });
  });
  describe("Testing entrypoint: Change_fee_oracle", async function() {
    it("Shouldn't changing fee oracle if the user is not an bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_fee_oracle", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow change fee oracle", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_fee_oracle", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.fee_oracle, bob.pkh);
      await bridge.сhangeAddress("change_fee_oracle", bridge.feeOracle.address);
    });
  });
  describe("Testing entrypoint: Change_fee_collector", async function() {
    it("Shouldn't changing fee collector if the user is not an bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.сhangeAddress("change_fee_collector", bob.pkh),
        err => {
          strictEqual(err.message, "Bridge-core/not-manager");
          return true;
        },
      );
    });

    it("Should allow change fee collector", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_fee_collector", eve.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.fee_collector, eve.pkh);
    });
  });
  describe("Testing entrypoint: Change_claimer", async function() {
    it("Shouldn't changing approved claimer if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_claimer", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow change claimer to approved claimers", async function() {
      Tezos.setSignerProvider(signerBob);

      await bridge.сhangeAddress("change_claimer", bob.pkh);
      await bridge.updateStorage();
      deepStrictEqual(bridge.storage.approved_claimer, bob.pkh);
    });
  });
  describe("Testing entrypoint: Add_asset", async function() {
    it("Shouldn't add asset if the user is not bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
          precision: 6,
          chainId: fa12Source.chain_id,
          nativeAddress: fa12Source.native_address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/not-manager");
          return true;
        },
      );
    });
    it("Should allow add fa12 asset", async function() {
      Tezos.setSignerProvider(signerBob);
      const newAsset = {
        assetType: "fa12",
        tokenAddress: fa12Token.address,
        precision: 6,
        chainId: fa12Source.chain_id,
        nativeAddress: fa12Source.native_address,
      };
      const prevAssetCount = bridge.storage.asset_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(
        bridge.storage.asset_count.toNumber() - 1,
      );

      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);
      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(fa12Source),
        undefined,
      );
    });
    it("Should allow add fa2 asset", async function() {
      const newAsset = {
        assetType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
        precision: 6,
        chainId: fa2Source.chain_id,
        nativeAddress: fa2Source.native_address,
      };

      const prevAssetCount = bridge.storage.asset_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);

      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);

      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(fa2Source),
        undefined,
      );
    });
    it("Should allow add tez asset", async function() {
      const newAsset = {
        assetType: "tez",
        precision: 6,
        chainId: tezSource.chain_id,
        nativeAddress: tezSource.native_address,
      };
      const prevAssetCount = bridge.storage.asset_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);

      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);

      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(tezSource),
        undefined,
      );
    });
    it("Should allow add wrapped asset", async function() {
      const prevAssetCount = bridge.storage.asset_count.toNumber();

      const newAssetParam = {
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
        precision: 6,
        chainId: wrappedSource.chain_id,
        nativeAddress: wrappedSource.native_address,
      };
      await bridge.addAsset(newAssetParam);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);

      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);
      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(wrappedSource),
        undefined,
      );
    });
    it("Shouldn't add asset if asset is exists", async function() {
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
          precision: 6,
          chainId: fa12Source.chain_id,
          nativeAddress: fa12Source.native_address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-exist");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Stop_bridge", async function() {
    it("Shouldn't stop bridge if the user is not stop manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopBridge(), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow stop bridge", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.stopBridge();
      await bridge.updateStorage();
      strictEqual(bridge.storage.enabled, false);
    });
    it("Shouldn't add asset if bridge is disabled", async function() {
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
          precision: 6,
          chainId: fa12Source.chain_id,
          nativeAddress: fa12Source.native_address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
    it("Shouldn't lock asset if bridge is disabled", async function() {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          "12",
          fa12Source.chain_id,
          fa12Source.native_address,
          1000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
    it("Shouldn't unlock asset if bridge is disabled", async function() {
      const signature = await Tezos.signer.sign(bscChainId);
      console.log(signature);
      await rejects(
        bridge.unlockAsset(
          bscChainId,
          "12",
          fa12Source.chain_id,
          fa12Source.native_address,
          1000,
          alice.pkh,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Start_bridge", async function() {
    it("Shouldn't start bridge if the user is not owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.startBridge(), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow start bridge", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.startBridge();
      await bridge.updateStorage();
      strictEqual(bridge.storage.enabled, true);
    });
  });
  describe("Testing entrypoint: Stop_asset", async function() {
    it("Shouldn't stop asset if the user is not bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopAsset(0), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow stop asset", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.stopAsset(0);
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(0);
      strictEqual(asset.enabled, false);
    });
    it("Shouldn't lock asset if asset is disabled", async function() {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          "12",
          fa12Source.chain_id,
          fa12Source.native_address,
          1000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "Bridge-core/asset-disabled");
          return true;
        },
      );
    });
    it("Shouldn't unlock asset if bridge is disabled", async function() {
      const signature = await Tezos.signer.sign(bscChainId);
      await rejects(
        bridge.unlockAsset(
          bscChainId,
          "12",
          fa12Source.chain_id,
          fa12Source.native_address,
          1000,
          alice.pkh,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Bridge-core/asset-disabled");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Start_asset", async function() {
    it("Shouldn't start asset if the user is not bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopAsset(0), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow start asset", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.startAsset(0);
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(0);
      strictEqual(asset.enabled, true);
    });
  });
  describe("Testing entrypoint: Remove_asset", async function() {
    before(async () => {
      Tezos.setSignerProvider(signerAlice);
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
      const lockAmount = 10000;

      Tezos.setSignerProvider(signerBob);
      await fa12Token.approveToken(bridge.address, lockAmount);

      await fa2Token.approveToken(
        bridge.address,
        lockAmount,
        bob.pkh,
        fa2Token.tokenId,
      );
      await bridge.lockAsset(
        bscChainId,
        "01ffffffffffffffffffffffffffff01",
        fa12Source.chain_id,
        fa12Source.native_address,
        lockAmount,
        bscAddress,
      );

      await bridge.lockAsset(
        bscChainId,
        "01ffffffffffffffffffffffffffff02",
        fa2Source.chain_id,
        fa2Source.native_address,
        lockAmount,
        bscAddress,
      );

      await bridge.lockAsset(
        bscChainId,
        "01ffffffffffffffffffffffffffff03",
        tezSource.chain_id,
        tezSource.native_address,
        lockAmount,
        bscAddress,
        lockAmount / 1e6,
      );

      Tezos.setSignerProvider(signerAlice);

      const lockId = "01ffffffffffffffffffffffffffff00";

      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: bob.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: "54455A00",
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        10000,
        bob.pkh,
        signature.sig,
      );
    });
    it("Shouldn't remove asset if the user is not bridge manager", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.removeAsset(
          0,
          0,
          alice.pkh,
          fa12Source.chain_id,
          fa12Source.native_address,
        ),
        err => {
          strictEqual(err.message, "Bridge-core/not-manager");
          return true;
        },
      );
    });
    it("Should allow remove fa12 asset", async function() {
      Tezos.setSignerProvider(signerBob);
      const prevBalance = await fa12Token.getBalance(bridge.address);

      await bridge.removeAsset(
        0,
        prevBalance,
        dev.pkh,
        fa12Source.chain_id,
        fa12Source.native_address,
      );
      await bridge.updateStorage();
      const devBalance = await fa12Token.getBalance(dev.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const asset = await bridge.storage.bridge_assets.get(0);
      const removedInfo = await bridge.storage.bridge_asset_ids.get(fa12Source);

      strictEqual(removedInfo, undefined);
      strictEqual(asset, undefined);
      strictEqual(devBalance, prevBalance);
      strictEqual(bridgeBalance, 0);
    });
    it("Should allow remove fa2 asset", async function() {
      Tezos.setSignerProvider(signerBob);
      const prevBalance = await fa2Token.getBalance(bridge.address);
      await bridge.removeAsset(
        1,
        prevBalance,
        dev.pkh,
        fa2Source.chain_id,
        fa2Source.native_address,
      );
      await bridge.updateStorage();
      const devBalance = await fa12Token.getBalance(dev.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const asset = await bridge.storage.bridge_assets.get(1);
      const removedInfo = await bridge.storage.bridge_asset_ids.get(fa2Source);

      strictEqual(removedInfo, undefined);
      strictEqual(asset, undefined);
      strictEqual(devBalance, prevBalance);
      strictEqual(bridgeBalance, 0);
    });
    it("Should allow remove Tez asset", async function() {
      Tezos.setSignerProvider(signerBob);
      const prevDevBalance = await Tezos.tz
        .getBalance(dev.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const prevBalance = await Tezos.tz
        .getBalance(bridge.address)

        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      await bridge.removeAsset(
        2,
        prevBalance,
        dev.pkh,
        tezSource.chain_id,
        tezSource.native_address,
      );

      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(2);
      strictEqual(asset, undefined);

      const devBalance = await Tezos.tz
        .getBalance(dev.pkh)
        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const bridgeBalance = await Tezos.tz
        .getBalance(bridge.address)

        .then(balance => Math.floor(balance.toNumber()))
        .catch(error => console.log(JSON.stringify(error)));
      const removedInfo = await bridge.storage.bridge_asset_ids.get(tezSource);

      strictEqual(removedInfo, undefined);
      strictEqual(devBalance, prevDevBalance + prevBalance);
      strictEqual(bridgeBalance, 0);
    });
    it("Should allow remove wrapped asset", async function() {
      Tezos.setSignerProvider(signerBob);
      await bridge.removeAsset(
        3,
        0,
        dev.pkh,

        wrappedSource.chain_id,
        wrappedSource.native_address,
      );
      await bridge.updateStorage();

      const asset = await bridge.storage.bridge_assets.get(3);

      const removedInfo = await bridge.storage.bridge_asset_ids.get(
        wrappedSource,
      );

      strictEqual(asset, undefined);
      strictEqual(removedInfo, undefined);
    });
  });
});
