const { confirmOperation } = require("../scripts/confirmation");
const envJs = require("../env");
const network = envJs.network;

module.exports = async tezos => {
  const bridgeAddress = require("../builds/bridge_core.json").networks[network][
    "bridge_core"
  ];
  const validatorAddress = require("../builds/validator.json").networks[
    network
  ]["validator"];

  const validatorContract = await tezos.contract.at(validatorAddress);
  const operation = await validatorContract.methods
    .change_bridge(bridgeAddress)
    .send();
  await confirmOperation(tezos, operation.hash);

  console.log("Storage addresses was updated!");
};
