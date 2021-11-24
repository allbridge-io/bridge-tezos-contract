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
  async validateLock(
    lockId,
    sender,
    amount,
    receiver,
    destinationChainId,
    assetType,
    tokenAddress = null,
    tokenId = null,
  ) {
    let operation;
    switch (assetType) {
      case "fa12_":
        operation = await this.contract.methods
          .validate_lock(
            lockId,
            sender,
            receiver,
            amount,
            "fa12_",
            tokenAddress,
            destinationChainId,
          )
          .send();
        break;
      case "fa2_":
        operation = await this.contract.methods
          .validate_lock(
            lockId,
            sender,
            receiver,
            amount,
            "fa2_",
            tokenAddress,
            tokenId,
            destinationChainId,
          )
          .send();
        break;
      case "tez_":
        operation = await this.contract.methods
          .validate_lock(
            lockId,
            sender,
            receiver,
            amount,
            "tez_",
            null,
            destinationChainId,
          )
          .send();
        break;
      case "wrapped_":
        operation = await this.contract.methods
          .validate_lock(
            lockId,
            sender,
            receiver,
            amount,
            "wrapped_",
            tokenId,
            tokenAddress,
            destinationChainId,
          )
          .send();
        break;
    }

    await confirmOperation(Tezos, operation.hash);
  }
  async validateUnlock(
    lockId,
    receiver,
    amount,
    chainFromId,
    signature,
    assetType,
    tokenAddress = null,
    tokenId = null,
  ) {
    let operation;
    switch (assetType) {
      case "fa12_":
        operation = await this.contract.methods
          .validate_unlock(
            lockId,
            receiver,
            amount,
            chainFromId,
            "fa12_",
            tokenAddress,
            signature,
          )
          .send();
        break;
      case "fa2_":
        operation = await this.contract.methods
          .validate_unlock(
            lockId,
            receiver,
            amount,
            chainFromId,
            "fa2_",
            tokenAddress,
            tokenId,
            signature,
          )
          .send();
        break;
      case "tez_":
        operation = await this.contract.methods
          .validate_unlock(
            lockId,
            receiver,
            amount,
            chainFromId,
            "tez_",
            null,
            signature,
          )
          .send();
        break;
      case "wrapped_":
        operation = await this.contract.methods
          .validate_unlock(
            lockId,
            receiver,
            amount,
            chainFromId,
            "wrapped_",
            tokenId,
            tokenAddress,
            signature,
          )
          .send();
        break;
    }

    await confirmOperation(Tezos, operation.hash);
  }
};
