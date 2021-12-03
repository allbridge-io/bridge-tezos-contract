const { MichelsonMap } = require("@taquito/michelson-encoder");

const { alice, bob } = require("../../scripts/sandbox/accounts");

module.exports = {
  owner: alice.pkh,
  deposit_token: { address: alice.pkh, id: 0 },
  ledger: MichelsonMap.fromLiteral({}),
  permits: MichelsonMap.fromLiteral({}),
  periods: [],
  total_supply: 0,
  total_underlying_f: 0,
  exchange_rate_f: 0,
  last_update_time: "2021-01-01T00:00:00Z",

  // metadata: MichelsonMap.fromLiteral({
  //   "": Buffer.from("tezos-storage:meta", "ascii").toString("hex"),
  //   meta: Buffer.from(
  //     JSON.stringify({
  //       version: "v0.0.1",
  //       name: "Staking-bridge",
  //       description: "Staking contract for bridge",
  //       authors: ["Madfish.Solutions"],
  //       homepage: "https://www.madfish.solutions//",
  //       source: {
  //         tools: ["Ligo", "Flextesa"],
  //         location: "https://ligolang.org/",
  //       },
  //       interfaces: ["TZIP-012"],
  //       errors: [],
  //     }),
  //     "ascii",
  //   ).toString("hex"),
  // }),
};
