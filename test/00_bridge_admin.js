const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const {
  rejects,
  strictEqual,
  deepStrictEqual,
  notStrictEqual,
} = require("assert");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, bob, secpSigner } = require("../scripts/sandbox/accounts");

describe("BridgeCore Admin tests", async function () {
  let bridge;
  let fa12Token;
  let fa2Token;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      fa12Token = await new Token().init();
      fa2Token = await new Token("fa2").init();

      bridge = await new BridgeCore().init();
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
    it("Should allow change owner", async function () {
      Tezos.setSignerProvider(signerAlice);

      await bridge.сhangeAddress("change_owner", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_bridge_manager", async function () {
    it("Shouldn't changing bridge manager if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow change bridge manager", async function () {
      Tezos.setSignerProvider(signerBob);

      await bridge.сhangeAddress("change_bridge_manager", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.bridge_manager, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_stop_manager", async function () {
    it("Shouldn't changing stop manager if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });

    it("Should allow change stop manager", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_stop_manager", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.stop_manager, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_validator", async function () {
    it("Shouldn't changing validator if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow change bridge validator", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_validator", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.validator, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_fee_oracle", async function () {
    it("Shouldn't changing fee oracle if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow change fee oracle", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_fee_oracle", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.fee_oracle, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_fee_collector", async function () {
    it("Shouldn't changing fee collector if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });

    it("Should allow change fee collector", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.сhangeAddress("change_fee_collector", bob.pkh);
      await bridge.updateStorage();
      strictEqual(bridge.storage.fee_collector, bob.pkh);
    });
  });
  describe("Testing entrypoint: Add_claimer", async function () {
    it("Shouldn't add approved claimer if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.updateClaimers("add_claimer", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow add claimer to approved claimers", async function () {
      Tezos.setSignerProvider(signerBob);

      await bridge.updateClaimers("add_claimer", bob.pkh);
      await bridge.updateStorage();
      deepStrictEqual(bridge.storage.approved_claimers, [
        bob.pkh,
        secpSigner.pkh,
      ]);
    });
  });
  describe("Testing entrypoint: Remove_claimer", async function () {
    it("Shouldn't remove claimer if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.updateClaimers("add_claimer", bob.pkh), err => {
        strictEqual(err.message, "Bridge-core/not-owner");
        return true;
      });
    });
    it("Should allow remove claimer  from approved claimers", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.updateClaimers("remove_claimer", bob.pkh);
      await bridge.updateStorage();
      deepStrictEqual(bridge.storage.approved_claimers, [secpSigner.pkh]);
    });
  });
  describe("Testing entrypoint: Add_asset", async function () {
    it("Shouldn't add asset if the user is not bridge manager", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/not-manager");
          return true;
        },
      );
    });
    it("Should allow add fa12 asset", async function () {
      Tezos.setSignerProvider(signerBob);
      const newAsset = {
        assetType: "fa12",
        tokenAddress: fa12Token.address,
      };

      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(
        bridge.storage.asset_count.toNumber() - 1,
      );
      strictEqual(bridge.storage.asset_count.toNumber(), 1);
      notStrictEqual(addedAsset, undefined);

      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(addedAsset.asset_type),
        undefined,
      );
    });
    it("Should allow add fa2 asset", async function () {
      const newAsset = {
        assetType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
      };

      const prevAssetCount = bridge.storage.asset_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);
      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);

      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(addedAsset.asset_type),
        undefined,
      );
    });
    it("Should allow add tez asset", async function () {
      const newAsset = {
        assetType: "tez",
      };
      const prevAssetCount = bridge.storage.asset_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);
      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      notStrictEqual(addedAsset, undefined);

      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(addedAsset.asset_type),
        undefined,
      );
    });
    it("Should allow add wrapped asset", async function () {
      const newAsset = {
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      };
      const prevAssetCount = bridge.storage.asset_count.toNumber();
      const prevWrappedCount = bridge.storage.wrapped_token_count.toNumber();
      await bridge.addAsset(newAsset);
      await bridge.updateStorage();
      const addedAsset = await bridge.storage.bridge_assets.get(prevAssetCount);
      const addedWrapped = await bridge.storage.wrapped_token_infos.get(
        prevWrappedCount,
      );
      strictEqual(bridge.storage.asset_count.toNumber(), prevAssetCount + 1);
      strictEqual(
        bridge.storage.wrapped_token_count.toNumber(),
        prevWrappedCount + 1,
      );
      notStrictEqual(addedAsset, undefined);
      notStrictEqual(
        await bridge.storage.bridge_asset_ids.get(addedAsset.asset_type),
        undefined,
      );
      notStrictEqual(addedWrapped, undefined);
      notStrictEqual(
        await bridge.storage.wrapped_token_ids.get(addedWrapped),
        undefined,
      );
    });
    it("Shouldn't add asset if asset is exists", async function () {
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-exist");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Stop_bridge", async function () {
    it("Shouldn't stop bridge if the user is not stop manager", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopBridge(), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow stop bridge", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.stopBridge();
      await bridge.updateStorage();
      strictEqual(bridge.storage.enabled, false);
    });
    it("Shouldn't add asset if bridge is disabled", async function () {
      await rejects(
        bridge.addAsset({
          assetType: "fa12",
          tokenAddress: fa12Token.address,
        }),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
    it("Shouldn't lock asset if bridge is disabled", async function () {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          1,
          1,
          1000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
    it("Shouldn't unlock asset if bridge is disabled", async function () {
      const signature = await Tezos.signer.sign(bscChainId);
      await rejects(
        bridge.unlockAsset(bscChainId, 1, 1, 1000, alice.pkh, signature.sig),
        err => {
          strictEqual(err.message, "Bridge-core/bridge-disabled");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Start_bridge", async function () {
    it("Shouldn't start bridge if the user is not stop manager", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.startBridge(), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow start bridge", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.startBridge();
      await bridge.updateStorage();
      strictEqual(bridge.storage.enabled, true);
    });
  });
  describe("Testing entrypoint: Stop_asset", async function () {
    it("Shouldn't stop asset if the user is not bridge manager", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopAsset(0), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow stop asset", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.stopAsset(0);
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(0);
      strictEqual(asset.enabled, false);
    });
    it("Shouldn't lock asset if asset is disabled", async function () {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          1,
          0,
          1000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
        ),
        err => {
          strictEqual(err.message, "Bridge-core/asset-disabled");
          return true;
        },
      );
    });
    it("Shouldn't unlock asset if bridge is disabled", async function () {
      const signature = await Tezos.signer.sign(bscChainId);
      await rejects(
        bridge.unlockAsset(bscChainId, 1, 0, 1000, alice.pkh, signature.sig),
        err => {
          strictEqual(err.message, "Bridge-core/asset-disabled");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Start_asset", async function () {
    it("Shouldn't start asset if the user is not bridge manager", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(bridge.stopAsset(0), err => {
        strictEqual(err.message, "Bridge-core/not-manager");
        return true;
      });
    });
    it("Should allow start asset", async function () {
      Tezos.setSignerProvider(signerBob);
      await bridge.startAsset(0);
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(0);
      strictEqual(asset.enabled, true);
    });
  });
});
