const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const contractAddress = "KT";

module.exports.lockAsset = async function (
  chainId,
  lockId,
  token_source,
  token_source_address,
  amount,
  receiver,
  tezAmount = 0,
) {
  try {
    const contract = await Tezos.contract.at(contractAddress);
    const operation = await contract.methods
      .lock_asset(
        chainId,
        lockId,
        token_source,
        token_source_address,
        amount,
        receiver,
      )
      .send({ amount: tezAmount });

    await confirmOperation(Tezos, operation.hash);
  } catch (err) {
    console.log(err);
  }
};

module.exports.unlockAsset = async function (
  chainId,
  lockId,
  token_source,
  token_source_address,
  amount,
  receiver,
  signature,
) {
  try {
    const contract = await Tezos.contract.at(contractAddress);
    const operation = await contract.methods
      .unlock_asset(
        chainId,
        lockId,
        token_source,
        token_source_address,
        amount,
        receiver,
        signature,
      )
      .send();
    await confirmOperation(Tezos, operation.hash);
  } catch (err) {
    console.log(err);
  }
};
