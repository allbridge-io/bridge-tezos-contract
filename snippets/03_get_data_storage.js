const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const contractAddress = "KT";

module.exports.getStakedAmount = async function (accountAddress) {
  try {
    const stakingContract = await Tezos.contract.at(contractAddress);
    const storage = await stakingContract.storage();
    const balance = await storage.ledger.get(accountAddress);
    return balance.toNumber();
  } catch (err) {
    console.log(err);
  }
};

module.exports.getTotalSupply = async function () {
  try {
    const stakingContract = await Tezos.contract.at(contractAddress);
    const storage = await stakingContract.storage();
    const totalSupply = storage.total_supply;
    return totalSupply.toNumber();
  } catch (err) {
    console.log(err);
  }
};

module.exports.getPeriods = async function () {
  try {
    const stakingContract = await Tezos.contract.at(contractAddress);
    const storage = await stakingContract.storage();
    return storage.periods;
  } catch (err) {
    console.log(err);
  }
};
