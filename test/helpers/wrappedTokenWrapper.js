const storage = require("../storage/wrappedToken");
const { migrate } = require("../../scripts/helpers");
const { Tezos, signerAlice } = require("../utils/cli");
const { confirmOperation } = require("../../scripts/confirmation");

module.exports = class WrappedToken {
  address;
  contract;
  storage;
  tokenType;
  tokenId = 0;
  constructor(tokenType = "FA12") {
    this.tokenType = tokenType.toUpperCase();
  }

  async init(bridge) {
    storage.bridge = bridge;
    this.address = await migrate(Tezos, "wrapped_token", storage);
    this.contract = await Tezos.contract.at(this.address);

    this.storage = await this.contract.storage();

    return this;
  }

  async updateStorage() {
    this.storage = await this.contract.storage();
  }

  async approveToken(operator, owner = null, token_id = 0) {
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
  async createToken(chainId, nativeAddress, tokenMetadata) {
    const operation = await this.contract.methods
      .create_token(chainId, nativeAddress, tokenMetadata)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async transfer(from, receiver, amount, tokenId = 0) {
    const operation = await this.contract.methods
      .transfer([
        {
          from_: from,
          txs: [{ to_: receiver, token_id: tokenId, amount: amount }],
        },
      ])
      .send();

    await confirmOperation(Tezos, operation.hash);
  }
  async getBalance(address, token_id = 0) {
    await this.updateStorage();

    try {
      const account = await this.storage.account_info.get(address);

      const balance = await account.balances.get(token_id.toString());
      return balance.toNumber();
    } catch (e) {
      return 0;
    }
  }

  async getAllowance(address, trusted = null, token_id = 0) {
    await this.updateStorage();
    account = await this.storage.account_info.get(address);
    return account.permits;
  }
};
