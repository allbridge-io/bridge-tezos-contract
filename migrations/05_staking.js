const { migrate } = require("../scripts/helpers");
const envJs = require("../env");
const network = envJs.network;
const stakingStorage = require("../storage/staking");

module.exports = async (tezos) => {
  const sender = await tezos.signer.publicKeyHash();
  const bridgeAddress = require("../builds/bridge_core.json").networks[network][
    "bridge_core"
  ];

  stakingStorage.owner = sender;
  stakingStorage.deposit_token = { address: bridgeAddress, id: 0 };
  const stakingAddress = await migrate(tezos, "staking", stakingStorage);

  console.log(`Bridge-staking address: ${stakingAddress}`);
};
