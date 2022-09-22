const { MichelsonMap } = require("@taquito/michelson-encoder");

const {
  alice,
  bob,
  eve,
  secpSigner,
} = require("../../scripts/sandbox/accounts");

module.exports = {
  owner: alice.pkh,
  bridge_manager: alice.pkh,
  stop_manager: alice.pkh,
  validator: null,
  approved_claimer: secpSigner.pkh,
  fee_oracle: null,
  fee_collector: eve.pkh,
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
        interfaces: ["TZIP-012", "TZIP-016"],
        views: [],
        errors: [],
      }),
      "ascii",
    ).toString("hex"),
  }),
};
