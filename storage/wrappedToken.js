const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  bridge: null,
  ledger: MichelsonMap.fromLiteral({}),
  allowances: MichelsonMap.fromLiteral({}),
  tokens_supply: MichelsonMap.fromLiteral({}),

  token_count: 0,
  token_infos: MichelsonMap.fromLiteral({}),
  token_ids: MichelsonMap.fromLiteral({}),
  metadata: MichelsonMap.fromLiteral({}),
  token_metadata: MichelsonMap.fromLiteral({}),
};
