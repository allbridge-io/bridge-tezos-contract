const { Tezos, signerAlice, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const { confirmOperation } = require("../scripts/confirmation");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, eve, secpSigner } = require("../scripts/sandbox/accounts");
const toBytes = require("../scripts/toBytesForSign");

function calculateFee(amount, abrSupply, abrBalance) {
  const bp = 10000;
  const feemultiplier = 1000;
  const baseFee = 1000;
  const feePerToken = 1;
  const userSharesBp = (abrBalance * feemultiplier * bp) / abrSupply;
  const basicFee = (amount * bp) / (userSharesBp + (bp * bp) / baseFee);
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
        symbol: Buffer.from("wABR").toString("hex"),
        name: Buffer.from("Wrapped ABR").toString("hex"),
        decimals: Buffer.from("6").toString("hex"),
        icon: Buffer.from("").toString("hex"),
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
        chainId: bscChainId,
        tokenAddress: bscAddress,
        fee: 1,
      });
      await fa12Token.approveToken(bridge.address, 100000);

      await fa2Token.approveToken(
        bridge.address,
        100000,
        alice.pkh,
        fa2Token.tokenId,
      );
      const keccakBytes1 = toBytes({
        lockId: 24,
        recipient: alice.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature1 = await signerSecp.sign(keccakBytes1);

      await bridge.unlockAsset(
        bscChainId,
        24,
        wrappedAssetId,
        10000,
        alice.pkh,
        signature1.sig,
      );
      await bridge.updateOperator(
        "add_operator",
        alice.pkh,
        bridge.staking.address,
        0,
      );
      const keccakBytes2 = toBytes({
        lockId: 34,
        recipient: secpSigner.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature2 = await signerSecp.sign(keccakBytes2);

      await bridge.unlockAsset(
        bscChainId,
        34,
        wrappedAssetId,
        10000,
        secpSigner.pkh,
        signature2.sig,
      );
      await bridge.staking.deposit(10000);
      await bridge.staking.updateStorage();
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Lock_asset", async function () {
    it("Should lock fa12 asset", async function () {
      const lockAmount = 10000;
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(10000, abrSupply, abrBalance);
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
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(10000, abrSupply, abrBalance);
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
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(10000, abrSupply, abrBalance);
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
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(10000, abrSupply, abrBalance);

      const keccakBytes = toBytes({
        lockId: 3,
        recipient: alice.pkh,
        amount: 10000,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });

      const signature = await signerSecp.sign(keccakBytes);
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

      const prevAliceBalance = await bridge.getBalance(
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

      const aliceBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );
      const feeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
      );
      strictEqual(aliceBalance, prevAliceBalance - lockAmount);
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
      Tezos.setSignerProvider(signerSecp);
      await bridge.updateOperator(
        "add_operator",
        secpSigner.pkh,
        bridge.staking.address,
        0,
      );
      await bridge.staking.deposit(10000);
      await bridge.staking.updateStorage();
      const unlockAmount = 5000;
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(unlockAmount, abrSupply, abrBalance);
      const prevAsset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector,
      );
      const keccakBytes = toBytes({
        lockId: 0,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        tokenAddress: fa12Token.address,
      });

      const signature = await signerSecp.sign(keccakBytes);
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
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(unlockAmount, abrSupply, abrBalance);
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector,
      );
      const keccakBytes = toBytes({
        lockId: 1,
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
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 5000;
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(unlockAmount, abrSupply, abrBalance);
      const keccakBytes = toBytes({
        lockId: 2,
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
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 3000;
      const abrSupply = bridge.staking.storage.total_supply.toNumber();
      const abrBalance = await bridge.staking.getBalance(alice.pkh);
      const fee = calculateFee(unlockAmount, abrSupply, abrBalance);
      const keccakBytes = toBytes({
        lockId: 4,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const wrappedTokenId = await bridge.storage.wrapped_token_ids.get(
        prevAsset.asset_type.wrapped,
      );
      const prevAliceBalance = await bridge.getBalance(
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
      const aliceBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );
      const feeCollectorBalance = await bridge.getBalance(
        bridge.storage.fee_collector,
        wrappedTokenId.toNumber(),
      );
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount - fee);
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

      const keccakBytes = toBytes({
        lockId: 5,
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

      const keccakBytes = toBytes({
        lockId: 6,
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

      const keccakBytes = toBytes({
        lockId: 7,
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

      const keccakBytes = toBytes({
        lockId: 8,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);
      const wrappedTokenId = await bridge.storage.wrapped_token_ids.get(
        prevAsset.asset_type.wrapped,
      );
      const prevAliceBalance = await bridge.getBalance(
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
      const aliceBalance = await bridge.getBalance(
        alice.pkh,
        wrappedTokenId.toNumber(),
      );

      strictEqual(aliceBalance, prevAliceBalance + unlockAmount);

      strictEqual(
        asset.locked_amount.toNumber(),
        prevAsset.locked_amount.toNumber() + unlockAmount,
      );
    });
  });
});
