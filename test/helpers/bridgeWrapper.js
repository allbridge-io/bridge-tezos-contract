const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");
const { tzip16 } = require("@taquito/tzip16");
const bridgeStorage = require("../storage/bridgeCore");
const tokenStorage = require("../storage/wrappedToken");
const FeeOracle = require("./feeOracleWrapper");
const Validator = require("./validatorWrapper");
const WrappedToken = require("./wrappedTokenWrapper");

module.exports = class BridgeCore {
  address;
  contract;
  storage;
  feeOracle;
  validator;

  constructor() {}
  async init(params = false) {
    this.feeOracle = await new FeeOracle().init();
    this.validator = await new Validator().init();
    bridgeStorage.fee_oracle = this.feeOracle.address;
    bridgeStorage.validator = this.validator.address;
    const deployedContract = await migrate(Tezos, "bridge_core", bridgeStorage);
    this.contract = await Tezos.contract.at(deployedContract, tzip16);
    this.address = deployedContract;
    this.storage = await this.updateStorage();
    tokenStorage.bridge = this.address;
    this.wrappedToken = await new WrappedToken().init(this.address);

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
    const operation = await this.contract.methods[typeAddress](address).send();
    await confirmOperation(Tezos, operation.hash);
  }

  async stopBridge() {
    const operation = await this.contract.methods.stop_bridge("unit").send();
    await confirmOperation(Tezos, operation.hash);
  }
  async startBridge() {
    const operation = await this.contract.methods.start_bridge("unit").send();
    await confirmOperation(Tezos, operation.hash);
  }
  async stopAsset(assetId) {
    const operation = await this.contract.methods.stop_asset(assetId).send();
    await confirmOperation(Tezos, operation.hash);
  }
  async startAsset(assetId) {
    const operation = await this.contract.methods.start_asset(assetId).send();
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
      case "fa12":
        operation = await this.contract.methods
          .add_asset(
            "fa12",
            params.tokenAddress,
            params.precision,
            params.chainId,
            params.nativeAddress,
          )
          .send();
        break;
      case "fa2":
        operation = await this.contract.methods
          .add_asset(
            "fa2",
            params.tokenAddress,
            params.tokenId,
            params.precision,
            params.chainId,
            params.nativeAddress,
          )
          .send();
        break;
      case "tez":
        operation = await this.contract.methods
          .add_asset(
            "tez",
            null,
            params.precision,
            params.chainId,
            params.nativeAddress,
          )
          .send();
        break;
      case "wrapped":
        operation = await this.contract.methods
          .add_asset(
            "wrapped",
            params.tokenAddress,
            params.tokenId,
            params.precision,
            params.chainId,
            params.nativeAddress,
          )
          .send();
        break;
    }
    await confirmOperation(Tezos, operation.hash);
  }
  async lockAsset(
    chainId,
    lockId,
    tokenSource,
    tokenSourceAddress,
    amount,
    recipient,
    tezAmount = 0,
  ) {
    const operation = await this.contract.methods
      .lock_asset(
        chainId,
        lockId,
        tokenSource,
        tokenSourceAddress,
        amount,
        recipient,
      )
      .send({ amount: tezAmount });

    await confirmOperation(Tezos, operation.hash);
  }
  async unlockAsset(
    lockId,
    chainFromId,
    tokenSource,
    tokenSourceAddress,
    amount,
    recipient,
    signature,
    tezAmount = 0,
  ) {
    const operation = await this.contract.methods
      .unlock_asset(
        lockId,
        recipient,
        amount,
        chainFromId,
        tokenSource,
        tokenSourceAddress,
        signature,
      )
      .send({ amount: tezAmount });
    await confirmOperation(Tezos, operation.hash);
  }
  async removeAsset(assetId, amount, receiver, chainId, nativeAddress) {
    const operation = await this.contract.methods
      .remove_asset(assetId, amount, receiver, chainId, nativeAddress)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
};
