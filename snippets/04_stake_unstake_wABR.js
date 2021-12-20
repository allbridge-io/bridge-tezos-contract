const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const contractAddress = "KT";

module.exports.stake = async function (amount) {
  try {
    const stakingContract = await Tezos.contract.at(contractAddress);
    const operation = await stakingContract.methods.deposit(amount).send();
    await confirmOperation(Tezos, operation.hash);
  } catch (err) {
    console.log(err);
  }
};

module.exports.unstake = async function (shares) {
  try {
    const stakingContract = await Tezos.contract.at(contractAddress);
    const operation = await stakingContract.methods.withdraw(shares).send();
    await confirmOperation(Tezos, operation.hash);
  } catch (err) {
    console.log(err);
  }
};
