const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");

module.exports = class GetBytes {
  address;
  contract;
  storage;

  constructor() {}
  async init() {
    const deployedContract = await migrate(
      Tezos,
      "GetKeccak",
      Buffer.from("dsads", "ascii").toString("hex"),
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

  async getKeccak(params) {
    let operation;

    switch (params.assetType) {
      case "fa12_":
        operation = await this.contract.methods
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "fa12_",
            params.tokenAddress,
          )
          .send();
        break;
      case "fa2_":
        operation = await this.contract.methods
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "fa2_",
            params.tokenAddress,
            params.tokenId,
          )
          .send();
        break;
      case "tez_":
        operation = await this.contract.methods
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "tez_",
            null,
          )
          .send();
        break;
      case "wrapped_":
        operation = await this.contract.methods
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "wrapped_",
            params.chainId,
            params.tokenAddress,
          )
          .send();
        break;
    }
    await confirmOperation(Tezos, operation.hash);
    await this.updateStorage();
    return this.storage;
  }
};
