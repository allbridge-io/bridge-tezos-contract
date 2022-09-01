const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  bridge_manager: null,
  stop_manager: null,
  validator: null,
  approved_claimer: null,
  fee_oracle: null,
  fee_collector: null,
  asset_count: 0,
  bridge_assets: MichelsonMap.fromLiteral({}),
  bridge_asset_ids: MichelsonMap.fromLiteral({}),
  enabled: true,
  metadata: MichelsonMap.fromLiteral({
    "": Buffer.from("tezos-storage:meta", "ascii").toString("hex"),
    meta: Buffer.from(
      JSON.stringify({
        version: "v0.0.1",
        name: "Bridge-core",
        description: "Bridge project",
        authors: ["Madfish.Solutions"],
        homepage: "https://www.madfish.solutions//",
        source: {
          tools: ["Ligo", "Flextesa"],
          location: "https://ligolang.org/",
        },
        interfaces: ["TZIP-016"],
        views: [],
        errors: [],
      }),
      "ascii",
    ).toString("hex"),
  }),
};
