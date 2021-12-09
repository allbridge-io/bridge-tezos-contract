const { migrate } = require("../scripts/helpers");
const { confirmOperation } = require("../scripts/confirmation");
const envJs = require("../env");
const network = envJs.network;
const env = process.env;

module.exports = async (tezos) => {
  const sender = await tezos.signer.publicKeyHash();
  const bridgeAddress = require("../builds/bridge_core.json").networks[network][
    "bridge_core"
  ];
  const stakingAddress = require("../builds/staking.json").networks[network][
    "staking"
  ];
  const oracleAddress = require("../builds/oracle_fee.json").networks[network][
    "oracle_fee"
  ];
  const validatorAddress = require("../builds/validator.json").networks[
    network
  ]["validator"];

  const oracleContract = await tezos.contract.at(oracleAddress);
  const validatorContract = await tezos.contract.at(validatorAddress);
  const operation_1 = await oracleContract.methods
    .change_staking(stakingAddress)
    .send();
  await confirmOperation(tezos, operation_1.hash);
  const operation_2 = await validatorContract.methods
    .change_bridge(bridgeAddress)
    .send();
  await confirmOperation(tezos, operation_2.hash);

  console.log("Storage addresses was updated!");
};
