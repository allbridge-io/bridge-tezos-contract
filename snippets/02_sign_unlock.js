const { TezosToolkit } = require("@taquito/taquito");
const { InMemorySigner } = require("@taquito/signer");

const rpc = "https://mainnet.smartpy.io";
const secretKey = "edsk3QoqBuvdamxouPhin7swCvkQNgq4jP5KZPbwWNnwdZpSpJiEbq";

const Tezos = new TezosToolkit(rpc);
const signer = new InMemorySigner(secretKey);
Tezos.setSignerProvider(signer);

const { Parser, packDataBytes } = require("@taquito/michel-codec");
const keccak256 = require("keccak256");

const params = {
  tokenSource: "1042",
  tokenSourceAddress: "FfF456cc8990D78591e6689DC5B185F99ee66e13",
  lockId: "01ffffffffffffffffffffffffffff00",
  recipient: "tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb",
  chainFromId: 3536,
  amount: 1000000,
  tokenAddress: "KT1RQcMbTJC71y2CDw2r24pp6dergDZXhc35",
};

async function sign() {
  const parser = new Parser();
  const type = `
        (pair (bytes %lock_id)
          (address %recipient)
          (nat %amount)
          (bytes %chain_from_id)
          (bytes %token_source)
          (bytes %token_source_address)
          (bytes %blockchain_id)
          (string %operation_type)
        )`;
  let data = `
    (Pair 0x${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      0x${params.tokenSource}
      0x${params.tokenSourceAddress}
      0x${params.blockchainId}
      "unlock")`;

  const dataJSON = parser.parseMichelineExpression(data);
  const typeJSON = parser.parseMichelineExpression(type);

  const packed = packDataBytes(dataJSON, typeJSON);
  const hashBytes = keccak256(Buffer.from(packed.bytes, "hex")).toString("hex");
  const signature = await signer.sign(hashBytes);
  console.log(signature.sig);
}

sign();
