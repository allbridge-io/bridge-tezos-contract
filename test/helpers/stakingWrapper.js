const { Tezos, signerAlice, alice } = require("../utils/cli");

const { migrate } = require("../../scripts/helpers");
const { confirmOperation } = require("../../scripts/confirmation");

const stakingStorage = require("../storage/staking");

module.exports = class Staking {
  address;
  contract;
  storage;

  constructor() {}
  async init(params = false) {
    if (params) {
      stakingStorage.periods = [
        {
          start_period: params.startPeriod,
          end_period: params.endPeriod,
          abr_per_sec_f: params.abrPerSec,
        },
      ];
    }
    const deployedContract = await migrate(Tezos, "staking", stakingStorage);
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
  async сhangeDepositToken(address, tokenId) {
    const operation = await this.contract.methods
      .change_deposit_token(address, tokenId)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async addReward(startPeriod, endPeriod, amount) {
    const operation = await this.contract.methods
      .add_reward(startPeriod, endPeriod, amount)
      .send();

    await confirmOperation(Tezos, operation.hash);
  }
  async deposit(amount) {
    const operation = await this.contract.methods.deposit(amount).send();

    await confirmOperation(Tezos, operation.hash);
  }
  async withdraw(amount) {
    const operation = await this.contract.methods.withdraw(amount).send();

    await confirmOperation(Tezos, operation.hash);
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
  async updateOperator(action, owner, operator) {
    const operation = await this.contract.methods
      .update_operators([
        {
          [action]: {
            owner: owner,
            operator: operator,
            token_id: 0,
          },
        },
      ])
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async getBalance(address) {
    await this.updateStorage();
    const balance = await this.storage.ledger.get(address);

    try {
      return balance.toNumber();
    } catch (e) {
      return 0;
    }
  }
};
