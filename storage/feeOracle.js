const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  fee_per_tokens: MichelsonMap.fromLiteral({}),
  base_fee: 1000,
  fee_multiper: 1000,
};
