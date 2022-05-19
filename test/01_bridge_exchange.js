const { Tezos, signerAlice, signerSecp } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const { confirmOperation } = require("../scripts/confirmation");
const { MichelsonMap } = require("@taquito/taquito");
const BridgeCore = require("./helpers/bridgeWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, eve, secpSigner, bob } = require("../scripts/sandbox/accounts");
const toBytes = require("../scripts/toBytesForSign");

const precision = 10 ** 6;
const fa2Precision = 10 ** 12;
const wrappedPrecision = 10 ** 9;

function calculateFee(amount) {
  const bp = 10000;
  const baseFee = 1000;
  const feePerToken = 1;
  const basicFee = (amount * baseFee) / bp;
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
  const bscChainId = "11223344";
  const tezosChainId = "54455A00";
  const bscAddress =
    "1122334455667788990011223344556677889900112233445566778899001122";
  const fa12Source = { chain_id: "1111", native_address: "449999" };
  const fa2Source = { chain_id: "1111", native_address: "559999" };
  const tezSource = { chain_id: "1111", native_address: "000000" };
  const wrappedSource = {
    chain_id: "2222",
    native_address: "33223344",
  };
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
        })
      );

      const fa12Asset = {
        assetType: "fa12",
        tokenAddress: fa12Token.address,
        precision: 6,
        chainId: fa12Source.chain_id,
        nativeAddress: fa12Source.native_address,
      };
      const fa2Asset = {
        assetType: "fa2",
        tokenAddress: fa2Token.address,
        tokenId: fa2Token.tokenId,
        precision: 12,
        chainId: fa2Source.chain_id,
        nativeAddress: fa2Source.native_address,
      };
      const tezAsset = {
        assetType: "tez",
        precision: 6,
        chainId: tezSource.chain_id,
        nativeAddress: tezSource.native_address,
      };
      const wrappedAsset = {
        assetType: "wrapped",
        tokenId: 0,
        tokenAddress: bridge.wrappedToken.address,
        precision: 9,
        chainId: wrappedSource.chain_id,
        nativeAddress: wrappedSource.native_address,
      };

      await bridge.addAsset(fa12Asset);
      await bridge.addAsset(fa2Asset);
      await bridge.addAsset(tezAsset);
      await bridge.addAsset(wrappedAsset);
      await bridge.updateStorage();

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
        fa2Token.tokenId
      );
      const keccakBytes1 = toBytes({
        lockId: "01ffffffffffffffffffffffffffff24",
        recipient: alice.pkh,
        amount: 10000 * wrappedPrecision,
        chainFromId: bscChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature1 = await signerSecp.sign(keccakBytes1);

      await bridge.unlockAsset(
        "01ffffffffffffffffffffffffffff24",
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        10000 * wrappedPrecision,
        alice.pkh,
        signature1.sig
      );

      const keccakBytes2 = toBytes({
        lockId: "01ffffffffffffffffffffffffffff22",
        recipient: secpSigner.pkh,
        amount: 10000 * wrappedPrecision,
        chainFromId: bscChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature2 = await signerSecp.sign(keccakBytes2);

      await bridge.unlockAsset(
        "01ffffffffffffffffffffffffffff22",
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        10000 * wrappedPrecision,
        secpSigner.pkh,
        signature2.sig
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
        bridge.storage.fee_collector
      );
      const lockId = "01ffffffffffffffffffffffffffff00";
      await bridge.lockAsset(
        bscChainId,
        lockId,
        fa12Source.chain_id,
        fa12Source.native_address,
        lockAmount,
        bscAddress
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa12AssetId);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(lock.amount.toNumber(), lockAmount * 1000 - fee * 1000);
      strictEqual(bridgeBalance, prevBridgeBalance + lockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock fa2 asset", async function () {
      const lockAmount = 1000 * fa2Precision;
      const fee = calculateFee(lockAmount);
      const prevAsset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector
      );
      const lockId = "01ffffffffffffffffffffffffffff01";
      await bridge.lockAsset(
        bscChainId,
        lockId,
        fa2Source.chain_id,
        fa2Source.native_address,
        lockAmount,
        bscAddress
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(fa2AssetId);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(
        lock.amount.toNumber(),
        Math.floor(lockAmount / 1000 - fee / 1000)
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
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      const prevFeeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      const lockId = "01ffffffffffffffffffffffffffff02";
      await bridge.lockAsset(
        bscChainId,
        lockId,
        tezSource.chain_id,
        tezSource.native_address,
        100000000,
        bscAddress,
        lockAmount
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(tezAssetId);
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      const bridgeBalance = await Tezos.tz
        .getBalance(bridge.address)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      const feeCollectorBalance = await Tezos.tz
        .getBalance(bridge.storage.fee_collector)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      strictEqual(lock.amount.toNumber(), lockAmount * 1e6 * 1000 - fee * 1000);
      strictEqual(
        bridgeBalance,
        prevBridgeBalance + lockAmount * 10 ** 6 - fee
      );
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should lock wrapped asset", async function () {
      const lockAmount = 5000 * wrappedPrecision;
      const fee = calculateFee(lockAmount);
      const lockId = "01ffffffffffffffffffffffffffff03";

      await bridge.updateStorage();
      const prevAsset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const prevAliceBalance = await bridge.wrappedToken.getBalance(alice.pkh);

      const prevFeeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector
      );
      await bridge.lockAsset(
        bscChainId,
        lockId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        lockAmount,
        bscAddress
      );
      await bridge.updateStorage();
      const asset = await bridge.storage.bridge_assets.get(wrappedAssetId);

      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh);
      const feeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector
      );
      const lock = await bridge.validator.storage.validated_locks.get(lockId);
      strictEqual(lock.amount.toNumber(), lockAmount - fee);
      strictEqual(aliceBalance, prevAliceBalance - lockAmount);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Shouldn't lock wrapped asset if low balance", async function () {
      await rejects(
        bridge.lockAsset(
          bscChainId,
          "01ffffffffffffffffffffffffffff53",
          wrappedSource.chain_id,
          wrappedSource.native_address,
          6000 * wrappedPrecision,
          bscAddress
        ),
        (err) => {
          strictEqual(err.message, "FA2_INSUFFICIENT_BALANCE");
          return true;
        }
      );
    });
  });
  describe("Testing entrypoint: Unlock_asset", async function () {
    it("Should unlock fa12 asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);

      const unlockAmount = 5000 * wrappedPrecision;
      const fee = 1;

      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector
      );
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      const lockId = "01ffffffffffffffffffffffffffff00";
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        fa12Source.chain_id,
        fa12Source.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const aliceBalance = await fa12Token.getBalance(alice.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa12Token.getBalance(
        bridge.storage.fee_collector
      );
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      const fromPrecUnlockAmount = Math.ceil(unlockAmount / 1000);
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(bridgeBalance, prevBridgeBalance - fromPrecUnlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + fromPrecUnlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock fa2 asset with fee", async function () {
      const unlockAmount = 500 * wrappedPrecision;
      const fee = 1;
      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const prevFeeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector
      );
      const lockId = "01ffffffffffffffffffffffffffff01";
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa2Source.chain_id,
        tokenSourceAddress: fa2Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        fa2Source.chain_id,
        fa2Source.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const aliceBalance = await fa2Token.getBalance(alice.pkh);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const feeCollectorBalance = await fa2Token.getBalance(
        bridge.storage.fee_collector
      );
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      const fromPrecUnlockAmount = unlockAmount * 1000;
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(bridgeBalance, prevBridgeBalance - fromPrecUnlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + fromPrecUnlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock tez asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 5 * wrappedPrecision;
      //TODO: Fee is not accounted for here

      const lockId = "01ffffffffffffffffffffffffffff02";
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: tezSource.chain_id,
        tokenSourceAddress: tezSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));

      await bridge.unlockAsset(
        lockId,
        bscChainId,
        tezSource.chain_id,
        tezSource.native_address,
        unlockAmount,
        eve.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const eveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(eveBalance, prevEveBalance + Math.ceil(unlockAmount / 1000));
    });
    it("Should unlock wrapped asset with fee", async function () {
      Tezos.setSignerProvider(signerSecp);
      const unlockAmount = 3000 * wrappedPrecision;
      const fee = 1;
      const lockId = "01ffffffffffffffffffffffffffff04";
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevAliceBalance = await bridge.wrappedToken.getBalance(
        alice.pkh,
        0
      );
      const prevFeeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
        0
      );
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh, 0);
      const feeCollectorBalance = await bridge.wrappedToken.getBalance(
        bridge.storage.fee_collector,
        0
      );
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount - fee);
      strictEqual(feeCollectorBalance, prevFeeCollectorBalance + fee);
    });
    it("Should unlock fa12 asset without fee", async function () {
      Tezos.setSignerProvider(signerAlice);
      const unlockAmount = 1000 * wrappedPrecision;
      const prevAliceBalance = await fa12Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa12Token.getBalance(bridge.address);
      const lockId = "01ffffffffffffffffffffffffffff05";

      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff05",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        fa12Source.chain_id,
        fa12Source.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );

      await bridge.updateStorage();
      const aliceBalance = await fa12Token.getBalance(alice.pkh);
      const bridgeBalance = await fa12Token.getBalance(bridge.address);
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(
        bridgeBalance,
        prevBridgeBalance - Math.ceil(unlockAmount / 1000)
      );
      strictEqual(
        aliceBalance,
        prevAliceBalance + Math.ceil(unlockAmount / 1000)
      );
    });
    it("Should unlock fa2 asset without fee", async function () {
      const unlockAmount = 300 * wrappedPrecision;

      const prevAliceBalance = await fa2Token.getBalance(alice.pkh);
      const prevBridgeBalance = await fa2Token.getBalance(bridge.address);
      const lockId = "01ffffffffffffffffffffffffffff06";

      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa2Source.chain_id,
        tokenSourceAddress: fa2Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        fa2Source.chain_id,
        fa2Source.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const aliceBalance = await fa2Token.getBalance(alice.pkh);
      const bridgeBalance = await fa2Token.getBalance(bridge.address);
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(bridgeBalance, prevBridgeBalance - unlockAmount * 1000);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount * 1000);
    });
    it("Should unlock tez asset without fee", async function () {
      const unlockAmount = 2 * wrappedPrecision;
      const lockId = "01ffffffffffffffffffffffffffff07";

      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: eve.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: tezSource.chain_id,
        tokenSourceAddress: tezSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);
      const prevEveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      await bridge.unlockAsset(
        lockId,
        bscChainId,
        tezSource.chain_id,
        tezSource.native_address,
        unlockAmount,
        eve.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const eveBalance = await Tezos.tz
        .getBalance(eve.pkh)
        .then((balance) => Math.floor(balance.toNumber()))
        .catch((error) => console.log(JSON.stringify(error)));
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(eveBalance, prevEveBalance + Math.ceil(unlockAmount / 1000));
    });
    it("Should unlock wrapped asset without fee", async function () {
      const unlockAmount = 2000 * wrappedPrecision;
      const lockId = "01ffffffffffffffffffffffffffff08";
      const keccakBytes = toBytes({
        lockId: lockId,
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerSecp.sign(keccakBytes);

      const prevAliceBalance = await bridge.wrappedToken.getBalance(
        alice.pkh,
        0
      );

      await bridge.unlockAsset(
        lockId,
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        unlockAmount,
        alice.pkh,
        signature.sig
      );
      await bridge.updateStorage();
      const aliceBalance = await bridge.wrappedToken.getBalance(alice.pkh, 0);
      const unlockKey = {
        chain: bscChainId,
        lock_id: lockId,
      };
      const unlock = await bridge.validator.storage.validated_unlocks.get(
        unlockKey
      );
      strictEqual(unlock.amount.toNumber(), unlockAmount);
      strictEqual(aliceBalance, prevAliceBalance + unlockAmount);
    });
  });
});
