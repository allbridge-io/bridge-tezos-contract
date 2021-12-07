const { Tezos, signerAlice, alice, bob, signerSecp } = require("./utils/cli");

const { rejects, strictEqual } = require("assert");

const Bridge = require("./helpers/bridgeWrapper");
const { migrate } = require("../scripts/helpers");
const toBytes = require("../scripts/toBytesForSign");

const transferAmount = 1000;
describe("Bridge FA2 methods test", async function () {
  let bridge;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      bridge = await new Bridge().init();

      const wrappedAsset = {
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      };

      await bridge.addAsset(wrappedAsset);
      const keccakBytes = await toBytes({
        lockId: 0,
        recipient: alice.pkh,
        amount: transferAmount,
        chainFromId: bscChainId,
        assetType: "wrapped",
        chainId: bscChainId,
        tokenAddress: Buffer.from("bscAddress", "ascii").toString("hex"),
      });
      const signature = await signerSecp.sign(keccakBytes);

      await bridge.unlockAsset(
        bscChainId,
        0,
        0,
        transferAmount,
        alice.pkh,
        signature.sig
      );
    } catch (e) {
      console.log(e);
    }
  });
  describe("Scope: Test Transfer entrypoint", async function () {
    describe("Scenario 1: Shouldn't Transfer cases", async function () {
      it("Shouldn't Transfer if not operator or owner", async function () {
        Tezos.setSignerProvider(signerAlice);

        await rejects(
          bridge.transfer(bob.pkh, alice.pkh, 1000),

          (err) => {
            strictEqual(err.message, "FA2_NOT_OPERATOR");
            return true;
          }
        );
      });
      it("Shouldn't Transfer with insufficient balance", async function () {
        await rejects(bridge.transfer(alice.pkh, bob.pkh, 10000), (err) => {
          strictEqual(err.message, "FA2_INSUFFICIENT_BALANCE");
          return true;
        });
      });
      it("Shouldn't Transfer with 0", async function () {
        Tezos.setSignerProvider(signerAlice);
        await rejects(bridge.transfer(alice.pkh, bob.pkh, 0), (err) => {
          strictEqual(err.message, "Bridge-core/zero-transfer");
          return true;
        });
      });
    });
    // Scenario 2
    describe("Scenario 2: Should cases Transfer", async function () {
      it("Should allow Transfer", async function () {
        const prevAliceBalance = await bridge.getBalance(alice.pkh, 0);
        const prevBobBalance = await bridge.getBalance(bob.pkh, 0);
        await bridge.transfer(alice.pkh, bob.pkh, transferAmount);
        await bridge.updateStorage();

        const aliceBalance = await bridge.getBalance(alice.pkh, 0);
        const bobBalance = await bridge.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance + transferAmount);
        strictEqual(aliceBalance, prevAliceBalance - transferAmount);
      });
    });
  });
  describe("Scope: Test Update_operators entrypoint.", async function () {
    describe("Scenario 1: Shouldn't Update_operators cases", async function () {
      it("Shouldn't Add_operator if the user is not an owner", async function () {
        await rejects(
          bridge.updateOperator("add_operator", bob.pkh, alice.pkh, 0),
          (err) => {
            strictEqual(err.message, "FA2_NOT_OWNER");
            return true;
          }
        );
      });
      it("Shouldn't Remove_operator if the user is not an owner", async function () {
        await rejects(
          bridge.updateOperator("remove_operator", bob.pkh, alice.pkh, 0),
          (err) => {
            strictEqual(err.message, "FA2_NOT_OWNER");
            return true;
          }
        );
      });
    });
    describe("Scenario 2: Should Update_operators cases", async function () {
      it("Should allow add operator", async function () {
        await bridge.updateOperator("add_operator", alice.pkh, bob.pkh, 0);
        await bridge.updateStorage();
        const alicePermits = await bridge.storage.permits.get([alice.pkh, 0]);
        strictEqual(alicePermits[0], bob.pkh);
      });

      it("Should allow remove_operator", async function () {
        await bridge.updateOperator("remove_operator", alice.pkh, bob.pkh, 0);
        await bridge.updateStorage();
        const alicePermits = await bridge.storage.permits.get([alice.pkh, 0]);
        strictEqual(alicePermits[0], undefined);
      });
    });
  });
  describe("Scope: Test Balance_of entrypoint.", async function () {
    let deployedGb;
    let gbContract;
    before(async () => {
      deployedGb = await migrate(Tezos, "get_balance", {
        response: 0,
        bridge_address: bridge.address,
      });
      gbContract = await Tezos.contract.at(deployedGb);
    });
    it("Should allow get balance", async function () {
      const op = await gbContract.methods.balance_of(bob.pkh, 0).send();
      await op.confirmation();
      const storage = await gbContract.storage();

      strictEqual(storage.response.toNumber(), transferAmount);
    });
    Tezos.setSignerProvider(signerAlice);
  });
});
