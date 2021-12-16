const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");

const oracleStorage = require("../storage/feeOracle");

module.exports = class Validator {
  address;
  contract;
  storage;

  constructor() {}
  async init() {
    const deployedContract = await migrate(Tezos, "oracle_fee", oracleStorage);
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

  async сhangeOwner(newOwner) {
    const operation = await this.contract.methods.change_owner(newOwner).send();
    await confirmOperation(Tezos, operation.hash);
  }
  async сhangeStaking(newAddress) {
    const operation = await this.contract.methods
      .change_staking(newAddress)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async сhangeFee(feeType, value) {
    let operation;
    switch (feeType) {
      case "change_token_fee":
        switch (value.tokenType) {
          case "fa12":
            operation = await this.contract.methods[feeType](
              "fa12",
              value.tokenAddress,
              value.fee,
            ).send();
            break;
          case "fa2":
            operation = await this.contract.methods[feeType](
              "fa2",
              value.tokenAddress,
              value.tokenId,
              value.fee,
            ).send();
            break;
          case "tez":
            operation = await this.contract.methods[feeType](
              "tez",
              null,
              value.fee,
            ).send();
            break;
          case "wrapped":
            operation = await this.contract.methods[feeType](
              "wrapped",
              value.chainId,
              value.tokenAddress,
              value.fee,
            ).send();
            break;
        }
        break;
      default:
        operation = await this.contract.methods[feeType](value).send();
        break;
    }

    await confirmOperation(Tezos, operation.hash);
  }
};
