const { migrate } = require("../scripts/helpers");
const oracleStorage = require("../storage/feeOracle");

module.exports = async tezos => {
  const sender = await tezos.signer.publicKeyHash();
  oracleStorage.owner = sender;
  oracleStorage.staking_address = sender;

  const contractAddress = await migrate(tezos, "oracle_fee", oracleStorage);

  console.log(`Oracle-fee address: ${contractAddress}`);
};
