const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const contractAddress = "KT";
const stakingContract = await Tezos.contract.at(contractAddress);

async function getStakedAmount(accountAddress) {
  const storage = await stakingContract.storage();
  const balance = await storage.get(accountAddress);
  return balance.toNumber();
}

async function getTotalSupply() {
  const storage = await stakingContract.storage();
  const totalSupply = storage.total_supply;
  return totalSupply.toNumber();
}

async function getPeriods() {
  const storage = await stakingContract.storage();
  return storage.periods;
}
