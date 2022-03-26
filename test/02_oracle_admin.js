const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const FeeOracle = require("./helpers/feeOracleWrapper");

const { alice, bob } = require("../scripts/sandbox/accounts");

describe("FeeOracle Admin tests", async function () {
  let oracle;

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      oracle = await new FeeOracle().init(alice.pkh);
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Change_owner", async function () {
    it("Shouldn't changing owner if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(oracle.сhangeOwner(bob.pkh), err => {
        strictEqual(err.message, "Oracle-fee/not-owner");
        return true;
      });
    });
    it("Should allow change owner", async function () {
      Tezos.setSignerProvider(signerAlice);

      await oracle.сhangeOwner(bob.pkh);
      await oracle.updateStorage();
      strictEqual(oracle.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_token_fee", async function () {
    it("Shouldn't changing fee per token if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        oracle.сhangeFee("change_token_fee", {
          tokenType: "fa12",
          tokenAddress: alice.pkh,
          fee: 1000,
        }),
        err => {
          strictEqual(err.message, "Oracle-fee/not-owner");
          return true;
        },
      );
    });
    it("Should allow change token fee", async function () {
      Tezos.setSignerProvider(signerBob);
      await oracle.сhangeFee("change_token_fee", {
        tokenType: "fa12",
        tokenAddress: alice.pkh,
        fee: 1000,
      });
      await oracle.updateStorage();
      const tokenFee = await oracle.storage.fee_per_tokens.get({
        fa12: alice.pkh,
      });
      strictEqual(tokenFee.toNumber(), 1000);
    });
  });
  describe("Testing entrypoint: Change_base_fee", async function () {
    it("Shouldn't changing base fee if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(oracle.сhangeFee("change_base_fee", 1000), err => {
        strictEqual(err.message, "Oracle-fee/not-owner");
        return true;
      });
    });
    it("Should allow change base fee", async function () {
      Tezos.setSignerProvider(signerBob);
      await oracle.сhangeFee("change_base_fee", 1000);
      await oracle.updateStorage();

      strictEqual(oracle.storage.base_fee_f.toNumber(), 1000);
    });
  });
});
