const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  bridge: null,
  ledger: MichelsonMap.fromLiteral({}),
  allowances: MichelsonMap.fromLiteral({}),
  tokens_supply: MichelsonMap.fromLiteral({}),

  token_count: 0,
  token_infos: MichelsonMap.fromLiteral({}),
  token_ids: MichelsonMap.fromLiteral({}),
  metadata: MichelsonMap.fromLiteral({
    "": Buffer.from("tezos-storage:meta", "ascii").toString("hex"),
    meta: Buffer.from(
      JSON.stringify({
        version: "v0.0.1",
        name: "Wrapped-bridge-token",
        description: "Wrapped token of the Bridge",
        authors: ["Madfish.Solutions"],
        homepage: "https://www.madfish.solutions//",
        source: {
          tools: ["Ligo", "Flextesa"],
          location: "https://ligolang.org/",
        },
        interfaces: ["TZIP-012", "TZIP-016"],
        views: [],
        errors: [],
      }),
      "ascii",
    ).toString("hex"),
  }),
  token_metadata: MichelsonMap.fromLiteral({}),
};
