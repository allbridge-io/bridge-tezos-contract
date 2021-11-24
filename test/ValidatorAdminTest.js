const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const Validator = require("./helpers/validatorWrapper");
const Token = require("./helpers/tokenWrapper");

const { alice, bob } = require("../scripts/sandbox/accounts");

describe("Validator Admin tests", async function () {
  let validator;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      validator = await new Validator().init();
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Change_address", async function () {
    it("Shouldn't changing addresses if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(validator.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Validator-bridge/not-owner");
        return true;
      });
    });
    it("Should allow change owner", async function () {
      Tezos.setSignerProvider(signerAlice);

      await validator.сhangeAddress("change_owner", bob.pkh);
      await validator.updateStorage();
      strictEqual(validator.storage.owner, bob.pkh);
    });
    it("Should allow change bridge address", async function () {
      Tezos.setSignerProvider(signerBob);

      await validator.сhangeAddress("change_bridge", bob.pkh);
      await validator.updateStorage();
      strictEqual(validator.storage.bridge, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_validator_pk", async function () {
    it("Shouldn't changing validator pk if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(validator.сhangeValidatorPK(bob.pk), err => {
        strictEqual(err.message, "Validator-bridge/not-owner");
        return true;
      });
    });
    it("Should allow change validator_pk", async function () {
      Tezos.setSignerProvider(signerBob);

      await validator.сhangeValidatorPK(bob.pk);
      await validator.updateStorage();
      strictEqual(validator.storage.validator_pk, bob.pk);
    });
  });
});
