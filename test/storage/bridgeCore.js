const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice, bob } = require("../utils/cli");

module.exports = {
  owner: alice.pkh,
  bridge_manager: alice.pkh,
  stop_manager: alice.pkh,
  validator: null,
  validators: [bob.pkh],
  fee_oracle: null,
  fee_collector: bob.pkh,
  asset_count: 0,
  bridge_assets: MichelsonMap.fromLiteral({}),
  bridge_asset_ids: MichelsonMap.fromLiteral({}),
  wrapped_token_count: 0,
  wrapped_token_infos: MichelsonMap.fromLiteral({}),
  wrapped_token_ids: MichelsonMap.fromLiteral({}),
  ledger: MichelsonMap.fromLiteral({}),
  enabled: true,
  test: bob.pkh,
};
