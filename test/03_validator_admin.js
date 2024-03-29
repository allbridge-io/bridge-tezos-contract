const { Tezos, signerAlice, signerBob } = require("./utils/cli");
const { rejects, strictEqual } = require("assert");
const Validator = require("./helpers/validatorWrapper");

const { bob } = require("../scripts/sandbox/accounts");
const { confirmOperation } = require("../scripts/confirmation");

describe("Validator Admin tests", async function() {
  let validator;

  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      validator = await new Validator().init();
    } catch (e) {
      console.log(e);
    }
  });

  describe("Testing entrypoint: Change_owner", async function() {
    it("Shouldn't changing owner if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerBob);
      await rejects(validator.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Validator-bridge/not-owner");
        return true;
      });
    });
    it("Should allow start transfer ownership", async function () {
      Tezos.setSignerProvider(signerAlice);

      await validator.сhangeAddress("change_owner", bob.pkh);
      await validator.updateStorage();
      strictEqual(validator.storage.pending_owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Confirm_owner", async function () {
    it("Shouldn't confirm owner if the user is not an pending owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(validator.contract.methods.confirm_owner().send(), err => {
        strictEqual(err.message, "Validator-bridge/not-pending-owner");
        return true;
      });
    });
    it("Should allow confirm transfer ownership", async function () {
      Tezos.setSignerProvider(signerBob);

      const op = await validator.contract.methods.confirm_owner().send();
      await confirmOperation(Tezos, op.hash);
      await validator.updateStorage();

      strictEqual(validator.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_bridge", async function() {
    it("Shouldn't changing bridge if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(validator.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "Validator-bridge/not-owner");
        return true;
      });
    });
    it("Should allow change bridge address", async function() {
      Tezos.setSignerProvider(signerBob);

      await validator.сhangeAddress("change_bridge", bob.pkh);
      await validator.updateStorage();
      strictEqual(validator.storage.bridge, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_validator_pk", async function() {
    it("Shouldn't changing validator pk if the user is not an owner", async function() {
      Tezos.setSignerProvider(signerAlice);
      await rejects(validator.сhangeValidatorPK(bob.pk), err => {
        strictEqual(err.message, "Validator-bridge/not-owner");
        return true;
      });
    });
    it("Should allow change validator_pk", async function() {
      Tezos.setSignerProvider(signerBob);

      await validator.сhangeValidatorPK(bob.pk);
      await validator.updateStorage();
      strictEqual(validator.storage.validator_pk, bob.pk);
    });
  });
});
