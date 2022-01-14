const { migrate } = require("../scripts/helpers");
const envJs = require("../env");
const network = envJs.network;
const env = process.env;
const bridgeStorage = require("../storage/bridgeCore");

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  const validatorAddress = require("../builds/validator.json").networks[
    network
  ]["validator"];
  const oracleAddress = require("../builds/oracle_fee.json").networks[network][
    "oracle_fee"
  ];
  bridgeStorage.owner = sender;
  bridgeStorage.bridge_manager = env.BRIDGE_MANAGER;
  bridgeStorage.stop_manager = env.STOP_MANAGER;
  bridgeStorage.validator = validatorAddress;
  bridgeStorage.fee_oracle = oracleAddress;
  bridgeStorage.fee_collector = env.FEE_COLLECTOR;
  bridgeStorage.approved_claimer = env.APPROVED_CLAIMER;

  const bridgeAddress = await migrate(tezos, "bridge_core", bridgeStorage);

  console.log(`Bridge-core address: ${bridgeAddress}`);
};
