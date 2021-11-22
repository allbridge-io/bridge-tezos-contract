const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const {
  rejects,
  strictEqual,
  deepStrictEqual,
  notStrictEqual,
} = require("assert");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, bob } = require("../scripts/sandbox/accounts");

describe("BridgeCore Transfer tests", async function () {
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
      // await bridge.addAsset(fa2Asset);
      // await bridge.addAsset(tezAsset);
      // await bridge.addAsset(wrappedAsset);

      await fa12Token.approveToken(bridge.address, 100000);
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Lock_asset", async function () {
    it("Should lock fa12 asset", async function () {
      const lockAmount = 10000;
      const prevAsset = await bridge.storage.bridge_assets.get(0);
      await bridge.lockAsset(
        bscChainId,
        1,
        0,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(0);
      await bridge.validator.updateStorage();
      console.log("valid-test", bridge.validator.storage.test);
      console.log("valid-addr", bridge.validator.address);
      console.log("bridge-test", bridge.storage.test);
      console.log("bridge-addr", bridge.address);
      strictEqual(
        asset.locker_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + lockAmount,
      );
    });
  });
});
