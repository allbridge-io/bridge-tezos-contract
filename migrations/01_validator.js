const { network } = require("../env");
const { migrate } = require("../scripts/helpers");
const env = process.env;
const validatorStorage = require("../storage/validatorBridge");

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  validatorStorage.owner = sender;
  validatorStorage.validator_pk = env.VALIDATOR_PK;
  validatorStorage.bridge = sender;

  const contractAddress = await migrate(tezos, "validator", validatorStorage);

  console.log(`Bridge Validator: ${contractAddress}`);
};
