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
  async mint(amount, tokenId, recipient) {
    const operation = await this.contract.methods
      .mint([{ token_id: tokenId, recipient: recipient, amount: amount }])
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async burn(amount, tokenId, account) {
    const operation = await this.contract.methods
      .burn(tokenId, account, amount)
      .send();
    await confirmOperation(Tezos, operation.hash);
  }
  async сhangeAddress(typeAddress, address) {
    const operation = await this.contract.methods[typeAddress](address).send();
    await confirmOperation(Tezos, operation.hash);
  }
  async updateOperator(action, owner, operator, tokenId = 0) {
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
      const balance = await this.storage.ledger.get([
        address,
        this.tokenId.toString(),
      ]);
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
  async callView(viewName, params, caller = this.address) {
    return await this.contract.contractViews[viewName](params).executeView({
      viewCaller: caller,
    });
  }
};
