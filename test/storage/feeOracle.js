const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice } = require("../utils/cli");

module.exports = {
  owner: alice.pkh,
  fee_per_tokens: MichelsonMap.fromLiteral({}),
  base_fee_f: 1000,
};
