const { MichelsonMap } = require("@taquito/michelson-encoder");
const { alice } = require("../../scripts/sandbox/accounts");
module.exports = {
  owner: alice.pkh,
  bridge: alice.pkh,
  ledger: MichelsonMap.fromLiteral({}),
  allowances: MichelsonMap.fromLiteral({}),
  tokens_supply: MichelsonMap.fromLiteral({}),

  token_count: 0,
  token_infos: MichelsonMap.fromLiteral({}),
  token_ids: MichelsonMap.fromLiteral({}),
  metadata: MichelsonMap.fromLiteral({}),
  token_metadata: MichelsonMap.fromLiteral({}),
};
