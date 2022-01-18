const { migrate } = require("../scripts/helpers");
const envJs = require("../env");
const network = envJs.network;
const tokenStorage = require("../storage/wrappedToken");

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  const bridgeAddress = require("../builds/bridge_core.json").networks[network][
    "bridge_core"
  ];

  tokenStorage.owner = sender;
  tokenStorage.bridge = bridgeAddress;

  const tokenAddress = await migrate(tezos, "wrapped_token", tokenStorage);

  console.log(`Wrapped-token address: ${tokenAddress}`);
};
