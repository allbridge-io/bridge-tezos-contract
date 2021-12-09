const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  staking_address: null,
  fee_per_tokens: MichelsonMap.fromLiteral({}),
  base_fee_f: 1000,
  fee_multiper_f: 1000,
};
