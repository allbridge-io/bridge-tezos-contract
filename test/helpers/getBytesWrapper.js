const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");

module.exports = class GetBytes {
  address;
  contract;
  storage;

  constructor() {}
  async init() {
    const deployedContract = await migrate(Tezos, "GetBytes", {
      kessak_bytes: Buffer.from("dsads", "ascii").toString("hex"),
      some_field: 1,
    });
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

  async getBytes(params) {
    let operation;

    switch (params.assetType) {
      case "fa12_":
        operation = await this.contract.methods
          .get_bytes(
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
          .get_bytes(
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
          .add_asset(
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
          .get_bytes(
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
    return this.storage.kessak_bytes;
  }
};
