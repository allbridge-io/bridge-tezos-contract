const { Tezos, signerAlice, signerBob, signerSecp } = require("./utils/cli");
const {
  rejects,
  strictEqual,

  notStrictEqual,
} = require("assert");
const Validator = require("./helpers/validatorWrapper");

const { alice, bob } = require("../scripts/sandbox/accounts");
const toBytes = require("../scripts/toBytesForSign");

describe("BridgeValidator Validate tests", async function () {
  let validator;

  const bscChainId = Buffer.from("56", "ascii").toString("hex");
  const tezosChainId = Buffer.from("NetXdQprcVkpaWU", "ascii").toString("hex");
  const tokenAddress = alice.pkh;
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      validator = await new Validator().init();
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Validate_lock", async function () {
    it("Shouldn't validate if sender is not bridge-contract", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(
        validator.validateLock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          10000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
          tezosChainId,
          "fa12",
          tokenAddress,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/not-bridge");
          return true;
        },
      );
    });
    it("Shouldn't validate if the destination chain id is tezos chain id", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        validator.validateLock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          10000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
          tezosChainId,
          "fa12",
          tokenAddress,
        ),
        err => {
          strictEqual(
            err.message,
            "Validator-bridge/wrong-destination-chain-id",
          );
          return true;
        },
      );
    });
    it("Should validate lock fa12 asset", async function () {
      const lockAmount = 10000;

      await validator.validateLock(
        "01ffffffffffffffffffffffffffff00",
        bob.pkh,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        bscChainId,
        "fa12",
        tokenAddress,
      );
      await validator.updateStorage();
      const newLock = await validator.storage.validated_locks.get(
        "01ffffffffffffffffffffffffffff00",
      );
      notStrictEqual(newLock, undefined);
    });
    it("Should validate lock fa2 asset", async function () {
      const lockAmount = 10000;

      await validator.validateLock(
        "01ffffffffffffffffffffffffffff01",
        bob.pkh,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        bscChainId,
        "fa2",
        tokenAddress,
        0,
      );
      await validator.updateStorage();
      const newLock = await validator.storage.validated_locks.get(
        "01ffffffffffffffffffffffffffff01",
      );
      notStrictEqual(newLock, undefined);
    });
    it("Should validate lock tez asset", async function () {
      const lockAmount = 10000;
      await validator.validateLock(
        "01ffffffffffffffffffffffffffff02",
        bob.pkh,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        bscChainId,
        "tez",
      );
      await validator.updateStorage();
      const newLock = await validator.storage.validated_locks.get(
        "01ffffffffffffffffffffffffffff02",
      );
      notStrictEqual(newLock, undefined);
    });
    it("Should validate lock wrapped asset", async function () {
      const lockAmount = 10000;
      await validator.validateLock(
        "01ffffffffffffffffffffffffffff03",
        bob.pkh,
        lockAmount,
        Buffer.from(alice.pkh, "ascii").toString("hex"),
        bscChainId,
        "wrapped",
        alice.pkh,
        0,
      );
      await validator.updateStorage();
      const newLock = await validator.storage.validated_locks.get(
        "01ffffffffffffffffffffffffffff03",
      );
      notStrictEqual(newLock, undefined);
    });
    it("Shouldn't validate if lock is validated", async function () {
      await rejects(
        validator.validateLock(
          "01ffffffffffffffffffffffffffff00",
          bob.pkh,
          10000,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
          bscChainId,
          "fa12",
          tokenAddress,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/lock-already-exists");
          return true;
        },
      );
    });
  });
  describe("Testing entrypoint: Validate_unlock", async function () {
    it("Shouldn't validate if sender is not bridge-contract", async function () {
      Tezos.setSignerProvider(signerBob);
      const signature = await signerAlice.sign(
        Buffer.from("dasdsa", "ascii").toString("hex"),
      );
      await rejects(
        validator.validateUnlock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          1111111,
          tezosChainId,
          signature.sig,
          "fa12",
          tokenAddress,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/not-bridge");
          return true;
        },
      );
    });
    it("Shouldn't validate if signature is not validated", async function () {
      Tezos.setSignerProvider(signerAlice);
      const signature = await signerAlice.sign(
        Buffer.from("dasdsa", "ascii").toString("hex"),
      );
      await rejects(
        validator.validateUnlock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          1111111,
          tezosChainId,
          signature.sig,
          "fa12",
          tokenAddress,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/signature-not-validated");
          return true;
        },
      );
    });
    it("Should validate unlock fa12 asset", async function () {
      Tezos.setSignerProvider(signerAlice);
      const unlockAmount = 10000;
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa12",
        chainId: bscChainId,
        tokenAddress: tokenAddress,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff00",
        alice.pkh,
        unlockAmount,
        bscChainId,
        signature.sig,
        "fa12",
        tokenAddress,
      );
      await validator.updateStorage();
      const newUnlock = await validator.storage.validated_unlocks.get(
        "01ffffffffffffffffffffffffffff00",
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Should validate unlock fa2 asset", async function () {
      const unlockAmount = 10000;
      const keccakBytes = await toBytes({
        lockId: "01ffffffffffffffffffffffffffff01",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "fa2",
        chainId: bscChainId,
        tokenAddress: tokenAddress,
        tokenId: 0,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff01",
        alice.pkh,
        unlockAmount,
        bscChainId,
        signature.sig,
        "fa2",
        tokenAddress,
        0,
      );
      await validator.updateStorage();
      const newUnlock = await validator.storage.validated_unlocks.get(
        "01ffffffffffffffffffffffffffff01",
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Should validate unlock tez asset", async function () {
      const unlockAmount = 10000;
      const keccakBytes = await toBytes({
        lockId: "01ffffffffffffffffffffffffffff02",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "tez",
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff02",
        alice.pkh,
        unlockAmount,
        bscChainId,
        signature.sig,
        "tez",
      );
      await validator.updateStorage();
      const newUnlock = await validator.storage.validated_unlocks.get(
        "01ffffffffffffffffffffffffffff02",
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Should validate unlock wrapped asset", async function () {
      const unlockAmount = 10000;
      const keccakBytes = await toBytes({
        lockId: "01ffffffffffffffffffffffffffff03",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: alice.pkh,
        tokenId: 0,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff03",
        alice.pkh,
        unlockAmount,
        bscChainId,
        signature.sig,
        "wrapped",
        alice.pkh,
        0,
      );
      await validator.updateStorage();
      const newUnlock = await validator.storage.validated_unlocks.get(
        "01ffffffffffffffffffffffffffff03",
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Shouldn't validate if unlock is validated", async function () {
      const signature = await signerSecp.sign(
        Buffer.from("dasdsa", "ascii").toString("hex"),
      );
      await rejects(
        validator.validateUnlock(
          "01ffffffffffffffffffffffffffff03",
          alice.pkh,
          10000,
          bscChainId,
          signature.sig,
          "wrapped",
          alice.pkh,
          0,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/unlock-already-exists");
          return true;
        },
      );
    });
  });
});
