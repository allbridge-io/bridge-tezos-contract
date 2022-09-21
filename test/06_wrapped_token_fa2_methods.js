const {
  Tezos,
  signerAlice,
  alice,
  bob,
  eve,
  signerBob,
} = require("./utils/cli");

const { rejects, strictEqual, notStrictEqual } = require("assert");
const { MichelsonMap } = require("@taquito/taquito");
const WrappedToken = require("./helpers/wrappedTokenWrapper");
const { migrate } = require("../scripts/helpers");
const { confirmOperation } = require("../scripts/confirmation");
const toBytes = require("../scripts/toBytesForSign");

const transferAmount = 1000 * 10 ** 9;
describe("Wrapped token FA2 methods test", async function () {
  let token;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      token = await new WrappedToken().init(alice.pkh);

      await token.createToken(
        bscChainId,
        Buffer.from("bscAddress", "ascii").toString("hex"),
        MichelsonMap.fromLiteral({
          symbol: Buffer.from("wABR").toString("hex"),
          name: Buffer.from("Wrapped ABR").toString("hex"),
          decimals: Buffer.from("9").toString("hex"),
          icon: Buffer.from("").toString("hex"),
        }),
      );
      await token.mint(10000 * 10 ** 9, 0, alice.pkh);
    } catch (e) {
      console.log(e);
    }
  });
  describe("Scope: Test Transfer entrypoint", async function () {
    describe("Scenario 1: Shouldn't Transfer cases", async function () {
      it("Shouldn't transfer if token is paused", async function () {
        Tezos.setSignerProvider(signerAlice);
        await token.togglePause();
        await rejects(
          token.transfer(bob.pkh, alice.pkh, 999999 * 10 ** 9),
          err => {
            strictEqual(err.message, "Wrapped-token/contract-paused");
            return true;
          },
        );
        await token.togglePause();
      });
      it("Shouldn't Transfer if not operator or owner", async function () {
        Tezos.setSignerProvider(signerAlice);

        await rejects(
          token.transfer(bob.pkh, alice.pkh, 999999 * 10 ** 9),

          err => {
            strictEqual(err.message, "FA2_NOT_OPERATOR");
            return true;
          },
        );
      });
      it("Shouldn't Transfer with insufficient balance", async function () {
        await rejects(
          token.transfer(alice.pkh, bob.pkh, 100000 * 10 ** 9),
          err => {
            strictEqual(err.message, "FA2_INSUFFICIENT_BALANCE");
            return true;
          },
        );
      });
    });
    // Scenario 2
    describe("Scenario 2: Should cases Transfer", async function () {
      it("Should allow Transfer", async function () {
        const prevAliceBalance = await token.getBalance(alice.pkh, 0);
        const prevBobBalance = await token.getBalance(bob.pkh, 0);
        await token.transfer(alice.pkh, bob.pkh, transferAmount);
        await token.updateStorage();

        const aliceBalance = await token.getBalance(alice.pkh, 0);
        const bobBalance = await token.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance + transferAmount);
        strictEqual(aliceBalance, prevAliceBalance - transferAmount);
      });
      it("Should allow zero Transfer", async function () {
        const amt = 0;
        const prevAliceBalance = await token.getBalance(alice.pkh, 0);
        const prevBobBalance = await token.getBalance(bob.pkh, 0);
        await token.transfer(alice.pkh, bob.pkh, amt);
        await token.updateStorage();

        const aliceBalance = await token.getBalance(alice.pkh, 0);
        const bobBalance = await token.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance + amt);
        strictEqual(aliceBalance, prevAliceBalance - amt);
      });
      it("Should allow self-transfer", async function () {
        const amt = 100;
        const prevAliceBalance = await token.getBalance(alice.pkh, 0);
        const prevBobBalance = await token.getBalance(bob.pkh, 0);
        await token.transfer(alice.pkh, alice.pkh, amt);
        await token.updateStorage();

        const aliceBalance = await token.getBalance(alice.pkh, 0);
        const bobBalance = await token.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance);
        strictEqual(aliceBalance, prevAliceBalance);
      });
      it("Should allow batch Transfer which leaves 0 tokens", async function () {
        const prevAliceBalance = await token.getBalance(alice.pkh, 0);
        const transferAmt = prevAliceBalance / 2;

        const prevBobBalance = await token.getBalance(bob.pkh, 0);
        const prevEveBalance = await token.getBalance(eve.pkh, 0);
        const op = await token.contract.methods
          .transfer([
            {
              from_: alice.pkh,
              txs: [
                { to_: bob.pkh, token_id: 0, amount: transferAmt },
                { to_: eve.pkh, token_id: 0, amount: transferAmt },
              ],
            },
          ])
          .send();
        await confirmOperation(Tezos, op.hash);
        await token.updateStorage();

        const aliceBalance = await token.getBalance(alice.pkh, 0);
        const eveBalance = await token.getBalance(eve.pkh, 0);
        const bobBalance = await token.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance + transferAmt);
        strictEqual(eveBalance, prevEveBalance + transferAmt);
        strictEqual(aliceBalance, 0);
      });
      it("Should allow transfer where operator transfer asset", async function () {
        const amt = 10000;
        const prevAliceBalance = await token.getBalance(alice.pkh, 0);
        const prevBobBalance = await token.getBalance(bob.pkh, 0);
        Tezos.setSignerProvider(signerBob);
        await token.updateOperator("add_operator", bob.pkh, alice.pkh, 0);
        Tezos.setSignerProvider(signerAlice);
        await token.transfer(bob.pkh, alice.pkh, amt);
        await token.updateStorage();

        const aliceBalance = await token.getBalance(alice.pkh, 0);
        const bobBalance = await token.getBalance(bob.pkh, 0);

        strictEqual(bobBalance, prevBobBalance - amt);
        strictEqual(aliceBalance, prevAliceBalance + amt);
      });
    });
  });
  describe("Scope: Test Update_operators entrypoint.", async function () {
    describe("Scenario 1: Shouldn't Update_operators cases", async function () {
      it("Shouldn't Add_operator if the user is not an owner", async function () {
        await rejects(
          token.updateOperator("add_operator", bob.pkh, alice.pkh, 0),
          err => {
            strictEqual(err.message, "FA2_NOT_OWNER");
            return true;
          },
        );
      });
      it("Shouldn't Remove_operator if the user is not an owner", async function () {
        await rejects(
          token.updateOperator("remove_operator", bob.pkh, alice.pkh, 0),
          err => {
            strictEqual(err.message, "FA2_NOT_OWNER");
            return true;
          },
        );
      });
    });
    describe("Scenario 2: Should Update_operators cases", async function () {
      it("Should allow add operator", async function () {
        await token.updateOperator("add_operator", alice.pkh, bob.pkh, 0);
        await token.updateStorage();
        const senderAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          bob.pkh,
        ]);
        notStrictEqual(senderAllowed, undefined);
      });

      it("Should allow remove_operator", async function () {
        await token.updateOperator("remove_operator", alice.pkh, bob.pkh, 0);
        await token.updateStorage();
        const senderAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          bob.pkh,
        ]);
        strictEqual(senderAllowed, undefined);
      });
      it("Should allow batch add operator", async function () {
        const op = await token.contract.methods
          .update_operators([
            {
              add_operator: {
                owner: alice.pkh,
                operator: bob.pkh,
                token_id: 0,
              },
            },
            {
              add_operator: {
                owner: alice.pkh,
                operator: eve.pkh,
                token_id: 0,
              },
            },
          ])
          .send();
        await confirmOperation(Tezos, op.hash);
        await token.updateStorage();
        const bobAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          bob.pkh,
        ]);
        const eveAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          eve.pkh,
        ]);
        notStrictEqual(bobAllowed, undefined);
        notStrictEqual(eveAllowed, undefined);
      });
      it("Should allow batch remove operator", async function () {
        const op = await token.contract.methods
          .update_operators([
            {
              remove_operator: {
                owner: alice.pkh,
                operator: bob.pkh,
                token_id: 0,
              },
            },
            {
              remove_operator: {
                owner: alice.pkh,
                operator: eve.pkh,
                token_id: 0,
              },
            },
          ])
          .send();
        await confirmOperation(Tezos, op.hash);
        await token.updateStorage();
        const bobAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          bob.pkh,
        ]);
        const eveAllowed = await token.storage.allowances.get([
          alice.pkh,
          "0",
          eve.pkh,
        ]);
        strictEqual(bobAllowed, undefined);
        strictEqual(eveAllowed, undefined);
      });
    });
  });
  describe("Scope: Test Balance_of entrypoint.", async function () {
    let deployedGb;
    let gbContract;
    before(async () => {
      deployedGb = await migrate(Tezos, "get_balance", {
        response: 0,
        bridge_address: token.address,
      });
      gbContract = await Tezos.contract.at(deployedGb);
    });
    it("Should allow get balance", async function () {
      const bobBalance = await token.getBalance(bob.pkh);
      const op = await gbContract.methods.balance_of(bob.pkh, 0).send();
      await confirmOperation(Tezos, op.hash);
      const storage = await gbContract.storage();

      strictEqual(storage.response.toNumber(), bobBalance);
    });
    Tezos.setSignerProvider(signerAlice);
  });
});
