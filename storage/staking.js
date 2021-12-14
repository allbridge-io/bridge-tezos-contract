const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  deposit_token: { address: null, id: 0 },
  ledger: MichelsonMap.fromLiteral({}),
  allowances: MichelsonMap.fromLiteral({}),
  periods: [],
  total_supply: 0,
  total_underlying_f: 0,
  last_update_time: "2021-01-01T00:00:00Z",
  metadata: MichelsonMap.fromLiteral({
    "": Buffer.from("tezos-storage:meta", "ascii").toString("hex"),
    meta: Buffer.from(
      JSON.stringify({
        version: "v0.0.1",
        name: "Staking-bridge",
        description: "Staking contract for bridge",
        authors: ["Madfish.Solutions"],
        homepage: "https://www.madfish.solutions//",
        source: {
          tools: ["Ligo", "Flextesa"],
          location: "https://ligolang.org/",
        },
        interfaces: ["TZIP-012", "TZIP-017"],
        errors: [],
      }),
      "ascii"
    ).toString("hex"),
  }),
  token_metadata: MichelsonMap.fromLiteral({
    0: {
      token_id: "0",
      token_info: MichelsonMap.fromLiteral({
        symbol: Buffer.from("swABR").toString("hex"),
        name: Buffer.from("Shares wABR").toString("hex"),
        decimals: Buffer.from("6").toString("hex"),
        icon: Buffer.from("").toString("hex"),
      }),
    },
  }),
};
