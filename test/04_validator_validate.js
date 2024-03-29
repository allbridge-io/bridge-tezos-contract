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

  const bscChainId = "11223344";
  const recipient =
    "1122334455667788990011223344556677889900112233445566778899001122";
  const tezosChainId = "54455A00";
  const tokenAddress = alice.pkh;

  const fa12Source = { chain_id: "1111", native_address: "449999" };
  const fa2Source = { chain_id: "1111", native_address: "559999" };
  const tezSource = { chain_id: "1111", native_address: "000000" };
  const wrappedSource = {
    chain_id: "2222",
    native_address: "33223344",
  };
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
          recipient,
          10000,
          fa12Source.chain_id,
          fa12Source.native_address,
          bscChainId,
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
          recipient,
          10000,
          fa12Source.chain_id,
          fa12Source.native_address,
          tezosChainId,
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
    it("Shouldn't validate if the recipient wrong recipient", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        validator.validateLock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          Buffer.from(alice.pkh, "ascii").toString("hex"),
          10000,
          fa12Source.chain_id,
          fa12Source.native_address,
          bscChainId,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/wrong-recipient");
          return true;
        },
      );
    });
    it("Shouldn't validate if invalid lock_id wrong length", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        validator.validateLock(
          "01ffffffffffffffffffffffffff10",
          bob.pkh,
          recipient,
          10000,
          fa12Source.chain_id,
          fa12Source.native_address,
          bscChainId,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/wrong-lock-id-length");
          return true;
        },
      );
    });
    it("Shouldn't validate if invalid lock version", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        validator.validateLock(
          "02ffffffffffffffffffffffffffff00",
          bob.pkh,
          recipient,
          10000,
          fa12Source.chain_id,
          fa12Source.native_address,
          bscChainId,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/wrong-lock-version");
          return true;
        },
      );
    });
    it("Should validate lock fa12 asset", async function () {
      const lockAmount = 10000;

      await validator.validateLock(
        "01ffffffffffffffffffffffffffff00",
        bob.pkh,
        recipient,
        lockAmount,
        fa12Source.chain_id,
        fa12Source.native_address,
        bscChainId,
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
        recipient,
        lockAmount,
        fa2Source.chain_id,
        fa2Source.native_address,
        bscChainId,
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
        recipient,
        lockAmount,
        fa2Source.chain_id,
        fa2Source.native_address,
        bscChainId,
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
        recipient,
        lockAmount,
        tezSource.chain_id,
        tezSource.native_address,
        bscChainId,
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
          recipient,
          10000,
          wrappedSource.chain_id,
          wrappedSource.native_address,
          bscChainId,
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
          fa12Source.chain_id,
          fa12Source.native_address,
          signature.sig,
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
          fa12Source.chain_id,
          fa12Source.native_address,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/signature-not-validated");
          return true;
        },
      );
    });
    it("Shouldn't validate if signer is unknown", async function () {
      Tezos.setSignerProvider(signerAlice);
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: 1000,
        chainFromId: bscChainId,
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerBob.sign(keccakBytes);
      await rejects(
        validator.validateUnlock(
          "01ffffffffffffffffffffffffffff00",
          alice.pkh,
          1000,
          bscChainId,
          fa12Source.chain_id,
          fa12Source.native_address,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/signature-not-validated");
          return true;
        },
      );
    });
    it("Shouldn't validate if invalid lock_id length", async function () {
      Tezos.setSignerProvider(signerAlice);
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: 1000,
        chainFromId: bscChainId,
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerBob.sign(keccakBytes);
      await rejects(
        validator.validateUnlock(
          "01ffffffffffffffffffffffffff00",
          alice.pkh,
          1000,
          bscChainId,
          fa12Source.chain_id,
          fa12Source.native_address,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/wrong-lock-id-length");
          return true;
        },
      );
    });
    it("Shouldn't validate if invalid lock version", async function () {
      Tezos.setSignerProvider(signerAlice);
      const keccakBytes = toBytes({
        lockId: "02ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: 1000,
        chainFromId: bscChainId,
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });
      const signature = await signerBob.sign(keccakBytes);
      await rejects(
        validator.validateUnlock(
          "02ffffffffffffffffffffffffffff00",
          alice.pkh,
          1000,
          bscChainId,
          fa12Source.chain_id,
          fa12Source.native_address,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/wrong-lock-version");
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
        tokenSource: fa12Source.chain_id,
        tokenSourceAddress: fa12Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff00",
        alice.pkh,
        unlockAmount,
        bscChainId,
        fa12Source.chain_id,
        fa12Source.native_address,
        signature.sig,
      );
      await validator.updateStorage();
      const unlockKey = {
        chain: bscChainId,
        lock_id: "01ffffffffffffffffffffffffffff00",
      };
      const newUnlock = await validator.storage.validated_unlocks.get(
        unlockKey,
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Should validate unlock fa2 asset", async function () {
      const unlockAmount = 10000;
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff01",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa2Source.chain_id,
        tokenSourceAddress: fa2Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff01",
        alice.pkh,
        unlockAmount,
        bscChainId,
        fa2Source.chain_id,
        fa2Source.native_address,
        signature.sig,
      );
      await validator.updateStorage();
      const unlockKey = {
        chain: bscChainId,
        lock_id: "01ffffffffffffffffffffffffffff01",
      };
      const newUnlock = await validator.storage.validated_unlocks.get(
        unlockKey,
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
        tokenSource: tezSource.chain_id,
        tokenSourceAddress: tezSource.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff02",
        alice.pkh,
        unlockAmount,
        bscChainId,
        tezSource.chain_id,
        tezSource.native_address,
        signature.sig,
      );
      await validator.updateStorage();
      const unlockKey = {
        chain: bscChainId,
        lock_id: "01ffffffffffffffffffffffffffff02",
      };
      const newUnlock = await validator.storage.validated_unlocks.get(
        unlockKey,
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
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff03",
        alice.pkh,
        unlockAmount,
        bscChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        signature.sig,
      );
      await validator.updateStorage();
      const unlockKey = {
        chain: bscChainId,
        lock_id: "01ffffffffffffffffffffffffffff03",
      };
      const newUnlock = await validator.storage.validated_unlocks.get(
        unlockKey,
      );
      notStrictEqual(newUnlock, undefined);
    });
    it("Should validate unlock if the lock ID is repeated, but the original blockchain is different", async function () {
      const unlockAmount = 10000;
      const ethChainId = "11001122";
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff03",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: ethChainId,
        tokenSource: wrappedSource.chain_id,
        tokenSourceAddress: wrappedSource.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      await validator.validateUnlock(
        "01ffffffffffffffffffffffffffff03",
        alice.pkh,
        unlockAmount,
        ethChainId,
        wrappedSource.chain_id,
        wrappedSource.native_address,
        signature.sig,
      );
      await validator.updateStorage();
      const unlockKey = {
        chain: ethChainId,
        lock_id: "01ffffffffffffffffffffffffffff03",
      };
      const newUnlock = await validator.storage.validated_unlocks.get(
        unlockKey,
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
          wrappedSource.chain_id,
          wrappedSource.native_address,
          signature.sig,
        ),
        err => {
          strictEqual(err.message, "Validator-bridge/unlock-already-exists");
          return true;
        },
      );
    });
  });
  describe("Testing view entrypoint: Validate_signature", async function () {
    it("Should return validate true", async function () {
      Tezos.setSignerProvider(signerAlice);
      const unlockAmount = 10000;
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
      const response = await validator.callView("validate_signature", {
        lock_id: "01ffffffffffffffffffffffffffff00",
        recipient: alice.pkh,
        amount: unlockAmount,
        chain_from_id: bscChainId,
        token_source: fa12Source.chain_id,
        token_source_address: fa12Source.native_address,
        signature: signature.sig,
      });

      strictEqual(response, true);
    });
    it("Should return validate false", async function () {
      const unlockAmount = 10000;
      const keccakBytes = toBytes({
        lockId: "01ffffffffffffffffffffffffffff01",
        recipient: alice.pkh,
        amount: unlockAmount,
        chainFromId: bscChainId,
        tokenSource: fa2Source.chain_id,
        tokenSourceAddress: fa2Source.native_address,
        blockchainId: tezosChainId,
      });

      const signature = await signerSecp.sign(keccakBytes);
      const response = await validator.callView("validate_signature", {
        lock_id: "01ffffffffffffffffffffffffffff10",
        recipient: bob.pkh,
        amount: unlockAmount,
        chain_from_id: bscChainId,
        token_source: fa12Source.chain_id,
        token_source_address: fa12Source.native_address,
        signature: signature.sig,
      });

      strictEqual(response, false);
    });
  });
});
