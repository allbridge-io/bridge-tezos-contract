const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice, secpSigner } = require("../../scripts/sandbox/accounts");

module.exports = {
  owner: alice.pkh,
  bridge: alice.pkh,
  validator_pk: secpSigner.pk,
  validated_locks: MichelsonMap.fromLiteral({}),
  validated_unlocks: MichelsonMap.fromLiteral({}),
};
