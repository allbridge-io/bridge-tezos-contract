const {
  Parser,
  packDataBytes,
  MichelsonData,
  MichelsonType,
} = require("@taquito/michel-codec");
const createKeccakHash = require("keccak");
const keccak256 = require("keccak256");
function paramToBytes(params) {
  const parser = new Parser();
  const type = `(pair (nat %lock_id)
          (pair (address %recipient)
                (pair (nat %amount)
                      (pair (bytes %chain_from_id)
                            (or %asset
                               (or (address %fa12_) (pair %fa2_ (address %address) (nat %id)))
                               (or (unit %tez_) (pair %wrapped_ (bytes %chain_id) (bytes %native_token_address))))))))`;
  let data;
  switch (params.assetType) {
    case "fa12_":
      data = `(Pair ${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Right (Right (Pair "${params.tokenAddress}""))))`;
      break;
    case "wrapped_":
      data = `(Pair ${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Right (Right (Pair 0x${params.chainId} 0x${params.tokenAddress}))))`;
      break;
  }
  const dataJSON = parser.parseMichelineExpression(data);
  const typeJSON = parser.parseMichelineExpression(type);

  const packed = packDataBytes(dataJSON, typeJSON);
  // console.log(createKeccakHash("keccak256").update(packed.bytes).digest("hex"));
  return packed;
}

module.exports = paramToBytes;
