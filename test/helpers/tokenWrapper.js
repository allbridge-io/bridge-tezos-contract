const storageFa2 = require("../storage/FA2");
const { migrate } = require("../../scripts/helpers");
const { Tezos, signerAlice } = require("../utils/cli");
const { confirmOperation } = require("../../scripts/confirmation");

module.exports = class Token {
  address;
  contract;
  storage;
  tokenType;
  tokenId = 0;
  constructor(tokenType = "FA12") {
    this.tokenType = tokenType.toUpperCase();
  }

  async init(tokenAddress = null) {
    let tokenStorage = require("../storage/FA12");
    if (this.tokenType === "FA2") {
      tokenStorage = storageFa2;
    }

    let tokenContract;
    if (tokenAddress) {
      tokenContract = await Tezos.contract.at(tokenAddress);
    } else {
      const deployedToken = await migrate(
        Tezos,
        this.tokenType.toUpperCase(),
        tokenStorage,
      );
      tokenContract = await Tezos.contract.at(deployedToken);
    }

    this.address = tokenContract.address;
    this.contract = tokenContract;

    this.storage = await tokenContract.storage();

    return this;
  }

  async updateStorage() {
    this.storage = await this.contract.storage();
  }

  async approveToken(operator, amount = 0, owner = null, token_id = 0) {
    if (this.tokenType.toLowerCase() === "fa12") {
      const operation = await this.contract.methods
        .approve(operator, amount)
        .send();
      await confirmOperation(Tezos, operation.hash);
    } else {
      const operation = await this.contract.methods
        .update_operators([
          {
            add_operator: {
              owner: owner,
              operator: operator,
              token_id: token_id,
            },
          },
        ])
        .send();
      await confirmOperation(Tezos, operation.hash);
    }
  }
  async transfer(from, receiver, amount, tokenId = 0) {
    let operation;
    switch (this.tokenType) {
      case "FA12":
        operation = await this.contract.methods
          .transfer(from, receiver, amount)
          .send();
        break;
      case "FA2":
        operation = await this.contract.methods
          .transfer([
            {
              from_: from,
              txs: [{ to_: receiver, token_id: tokenId, amount: amount }],
            },
          ])
          .send();
      default:
        break;
    }

    await confirmOperation(Tezos, operation.hash);
  }
  async getBalance(address, token_id = 0) {
    await this.updateStorage();

    switch (this.tokenType) {
      case "FA12":
        try {
          const account = await this.storage.ledger.get(address);
          return account.balance.toNumber();
        } catch (e) {
          return 0;
        }
      case "FA2":
        try {
          const account = await this.storage.account_info.get(address);

          const balance = await account.balances.get(token_id.toString());
          return balance.toNumber();
        } catch (e) {
          return 0;
        }
      default:
        break;
    }
  }

  async getAllowance(address, trusted = null, token_id = 0) {
    await this.updateStorage();
    let account;
    switch (this.tokenType) {
      case "FA12":
        account = await this.storage.ledger.get(address);
        const amount = await account.allowances.get(trusted);
        return amount.toNumber();

      case "FA2":
        account = await this.storage.account_info.get(address);
        return account.permits;
      default:
        break;
    }
  }
};
