const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice } = require("../utils/cli");

module.exports = {
  owner: alice.pkh,
  bridge: alice.pkh,
  validator_pk: alice.pk,
  validated_locks: MichelsonMap.fromLiteral({}),
  validated_unlocks: MichelsonMap.fromLiteral({}),
};
