const { Parser, packDataBytes } = require("@taquito/michel-codec");
const keccak256 = require("keccak256");
function paramToBytes(params) {
  const parser = new Parser();
  const type = `(pair (bytes %lock_id)
          (pair (address %recipient)
                (pair (nat %amount)
                      (pair (bytes %chain_from_id)
                            (or %asset
                               (or (address %fa12_) (pair %fa2_ (address %address) (nat %id)))
                               (or (unit %tez_) (pair %wrapped_ (address %address) (nat %id))))))))`;
  let data;
  switch (params.assetType) {
    case "fa12":
      data = `(Pair 0x${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Left (Left "${params.tokenAddress}")))`;
      break;
    case "fa2":
      data = `(Pair 0x${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Left (Right (Pair "${params.tokenAddress}" ${params.tokenId}))))`;
      break;
    case "tez":
      data = `(Pair 0x${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Right (Left Unit)))`;
      break;
    case "wrapped":
      data = `(Pair 0x${params.lockId}
      "${params.recipient}"
      ${params.amount}
      0x${params.chainFromId}
      (Right (Right (Pair "${params.tokenAddress}" ${params.tokenId}))))`;
      break;
  }
  const dataJSON = parser.parseMichelineExpression(data);
  const typeJSON = parser.parseMichelineExpression(type);

  const packed = packDataBytes(dataJSON, typeJSON);
  const hashBytes = keccak256(Buffer.from(packed.bytes, "hex")).toString("hex");
  return hashBytes;
}

module.exports = paramToBytes;
