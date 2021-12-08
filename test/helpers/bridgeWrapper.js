const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");
const { tzip16 } = require("@taquito/tzip16");
const bridgeStorage = require("../storage/bridgeCore");

const FeeOracle = require("./feeOracleWrapper");
const Validator = require("./validatorWrapper");
const Staking = require("./stakingWrapper");

module.exports = class BridgeCore {
  address;
  contract;
  storage;
  feeOracle;
  validator;
  staking;

  constructor() {}
  async init(params = false) {
    this.staking = await new Staking().init(params);
    this.feeOracle = await new FeeOracle().init(this.staking.address);
    this.validator = await new Validator().init();
    bridgeStorage.fee_oracle = this.feeOracle.address;
    bridgeStorage.validator = this.validator.address;
    const deployedContract = await migrate(Tezos, "bridge_core", bridgeStorage);
    this.contract = await Tezos.contract.at(deployedContract, tzip16);
    this.address = deployedContract;
    this.storage = await this.updateStorage();
    await this.validator.сhangeAddress("change_bridge", this.address);
    await this.validator.updateStorage();
    await this.staking.сhangeDepositToken(this.address, 0);

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

  async updateClaimers(typeOperation, address) {
    const operation = await this.contract.methods[typeOperation](
      address
    ).send();
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
          .add_asset("fa12", params.tokenAddress, null)
          .send();
        break;
      case "fa2":
        operation = await this.contract.methods
          .add_asset("fa2", params.tokenAddress, params.tokenId, null)
          .send();
        break;
      case "tez":
        operation = await this.contract.methods
          .add_asset("tez", null, null)
          .send();
        break;
      case "wrapped":
        operation = await this.contract.methods
          .add_asset(
            "wrapped",
            params.chainId,
            params.tokenAddress,
            params.symbol,
            params.name,
            params.decimals,
            params.icon
          )
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
    const balance = await this.storage.ledger.get([
      address,
      tokenId.toString(),
    ]);

    try {
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
  async updateOperator(action, owner, operator, tokenId) {
    const operation = await this.contract.methods
      .update_operators([
        {
          [action]: {
            owner: owner,
            operator: operator,
            token_id: tokenId,
          },
        },
      ])
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
};
