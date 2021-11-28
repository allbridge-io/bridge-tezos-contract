const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  bridge: null,
  validator_pk: null,
  validated_locks: MichelsonMap.fromLiteral({}),
  validated_unlocks: MichelsonMap.fromLiteral({}),
};
