const { Parser, packDataBytes } = require("@taquito/michel-codec");
const keccak256 = require("keccak256");
function paramToBytes(params) {
  const parser = new Parser();
  const type = `
        (pair (bytes %lock_id)
          (address %recipient)
          (nat %amount)
          (bytes %chain_from_id)
          (bytes %token_source)
          (bytes %token_source_address)
          (bytes %blockchain_id)
          (string %type_operation)
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
  return hashBytes;
}

module.exports = paramToBytes;
