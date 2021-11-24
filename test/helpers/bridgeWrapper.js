const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");
const { Tzip16Module, tzip16 } = require("@taquito/tzip16");
const bridgeStorage = require("../storage/bridgeCore");

const feeOracle = require("./feeOracleWrapper");
const validator = require("./validatorWrapper");

module.exports = class BridgeCore {
  address;
  contract;
  storage;
  feeOracle;
  validator;

  constructor() {}
  async init() {
    this.feeOracle = await new feeOracle().init();
    this.validator = await new validator().init();
    bridgeStorage.fee_oracle = this.feeOracle.address;
    bridgeStorage.validator = this.validator.address;
    const deployedContract = await migrate(Tezos, "Bridge_core", bridgeStorage);
    this.contract = await Tezos.contract.at(deployedContract, tzip16);
    this.address = deployedContract;
    this.storage = await this.updateStorage();
    await this.validator.сhangeAddress("change_bridge", this.address);
    await this.validator.updateStorage();

    return this;
  }

  async updateStorage() {
    const updatedStorage = await this.contract.storage();
    this.storage = updatedStorage;
    return updatedStorage;
  }

  async сhangeAddress(typeAddress, address) {
    const operation = await this.contract.methods
      .change_address(typeAddress, address)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async updateValidators(typeOperation, address) {
    const operation = await this.contract.methods
      .update_validators(typeOperation, address)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async stopBridge() {
    const operation = await this.contract.methods.stop_bridge("unit").send();
    await confirmOperation(Tezos, operation.hash);
  }
  async stopAsset(assetId) {
    const operation = await this.contract.methods.stop_asset(assetId).send();
    await confirmOperation(Tezos, operation.hash);
  }
  async changeAsset(assetId) {
    const operation = await this.contract.methods.stop_asset(assetId).send();
    await confirmOperation(Tezos, operation.hash);
  }
  async addAsset(params) {
    const assetType = params.assetType.toLowerCase();

    let operation;
    switch (assetType) {
      case "fa12_":
        operation = await this.contract.methods
          .add_asset("fa12_", params.tokenAddress)
          .send();
        break;
      case "fa2_":
        operation = await this.contract.methods
          .add_asset("fa2_", params.tokenAddress, params.tokenId)
          .send();
        break;
      case "tez_":
        operation = await this.contract.methods.add_asset("tez_", null).send();
        break;
      case "wrapped_":
        operation = await this.contract.methods
          .add_asset("wrapped_", params.chainId, params.tokenAddress)
          .send();
        break;
    }
    await confirmOperation(Tezos, operation.hash);
  }
  async lockAsset(chainId, lockId, assetId, amount, receiver, tezAmount = 0) {
    const operation = await this.contract.methods
      .lock_asset(chainId, lockId, assetId, amount, receiver)
      .send({ amount: tezAmount });

    await confirmOperation(Tezos, operation.hash);
  }
  async unlockAsset(chainId, lockId, assetId, amount, receiver, signature) {
    const operation = await this.contract.methods
      .unlock_asset(chainId, lockId, assetId, amount, receiver, signature)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async getBalance(address, tokenId) {
    await this.updateStorage();
    const account = await this.storage.ledger.get(address);

    try {
      const balance = await account.balances.get(tokenId.toString());
      return balance.toNumber();
    } catch (e) {
      return 0;
    }
  }
  async transfer(from, receiver, amount) {
    const operation = await this.contract.methods
      .transfer([
        {
          from_: from,
          txs: [{ to_: receiver, token_id: 0, amount: amount }],
        },
      ])
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async getKeccak(params) {
    let operation;

    switch (params.assetType) {
      case "fa12_":
        operation = await this.contract.views
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "fa12_",
            params.tokenAddress,
          )
          .read();
        break;
      case "fa2_":
        operation = await this.contract.views
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "fa2_",
            params.tokenAddress,
            params.tokenId,
          )
          .read();
        break;
      case "tez_":
        operation = await this.contract.views
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "tez_",
            null,
          )
          .read();
        break;
      case "wrapped_":
        operation = await this.contract.views
          .get_keccak(
            params.lockId,
            params.recipient,
            params.amount,
            params.chainFromId,
            "wrapped_",
            params.chainId,
            params.tokenAddress,
          )
          .read();
        break;
    }
    await confirmOperation(Tezos, operation.hash);
    await this.updateStorage();
    return this.storage.kessak_bytes;
  }
};
