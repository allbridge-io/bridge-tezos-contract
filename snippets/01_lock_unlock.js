const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const contractAddress = "KT";
const contract = await Tezos.contract.at(contractAddress);

async function lockAsset(
  chainId,
  lockId,
  assetId,
  amount,
  receiver,
  tezAmount = 0,
) {
  const operation = await contract.methods
    .lock_asset(chainId, lockId, assetId, amount, receiver)
    .send({ amount: tezAmount });

  await confirmOperation(Tezos, operation.hash);
}

async function unlockAsset(
  chainId,
  lockId,
  assetId,
  amount,
  receiver,
  signature,
) {
  const operation = await contract.methods
    .unlock_asset(chainId, lockId, assetId, amount, receiver, signature)
    .send();
  await confirmOperation(Tezos, operation.hash);
}
