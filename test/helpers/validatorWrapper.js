const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");

const validatorStorage = require("../storage/validatorBridge");

module.exports = class Validator {
  address;
  contract;
  storage;

  constructor() {}
  async init() {
    const deployedContract = await migrate(
      Tezos,
      "Validator",
      validatorStorage,
    );
    this.contract = await Tezos.contract.at(deployedContract);
    this.address = deployedContract;
    this.storage = await this.updateStorage();

    return this;
  }

  async updateStorage() {
    const updatedStorage = await this.contract.storage();
    this.storage = updatedStorage;
    return updatedStorage;
  }

  async сhangeAddress(addressType, newAddress) {
    const operation = await this.contract.methods
      .change_address(addressType, newAddress)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async сhangeValidatorPK(newKey) {
    const operation = await this.contract.methods
      .change_validator_pk(newKey)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
};
