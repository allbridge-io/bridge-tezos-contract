const { MichelsonMap } = require("@taquito/michelson-encoder");

module.exports = {
  owner: null,
  bridge_manager: null,
  stop_manager: null,
  validator: null,
  signers: [],
  fee_oracle: null,
  fee_collector: null,
  asset_count: 0,
  bridge_assets: MichelsonMap.fromLiteral({}),
  bridge_asset_ids: MichelsonMap.fromLiteral({}),
  wrapped_token_count: 0,
  wrapped_token_infos: MichelsonMap.fromLiteral({}),
  wrapped_token_ids: MichelsonMap.fromLiteral({}),
  ledger: MichelsonMap.fromLiteral({}),
  permits: MichelsonMap.fromLiteral({}),
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
        views: [
          {
            name: "get_keccak",
            parameter: {
              prim: "pair",
              args: [
                {
                  prim: "nat",
                  annots: ["%lock_id"],
                },
                {
                  prim: "pair",
                  args: [
                    {
                      prim: "address",
                      annots: ["%recipient"],
                    },
                    {
                      prim: "pair",
                      args: [
                        {
                          prim: "nat",
                          annots: ["%amount"],
                        },
                        {
                          prim: "pair",
                          args: [
                            {
                              prim: "bytes",
                              annots: ["%chain_from_id"],
                            },
                            {
                              prim: "or",
                              args: [
                                {
                                  prim: "or",
                                  args: [
                                    {
                                      prim: "address",
                                      annots: ["%fa12_"],
                                    },
                                    {
                                      prim: "pair",
                                      args: [
                                        {
                                          prim: "address",
                                          annots: ["%address"],
                                        },
                                        {
                                          prim: "nat",
                                          annots: ["%id"],
                                        },
                                      ],
                                      annots: ["%fa2_"],
                                    },
                                  ],
                                },
                                {
                                  prim: "or",
                                  args: [
                                    {
                                      prim: "unit",
                                      annots: ["%tez_"],
                                    },
                                    {
                                      prim: "pair",
                                      args: [
                                        {
                                          prim: "bytes",
                                          annots: ["%chain_id"],
                                        },
                                        {
                                          prim: "bytes",
                                          annots: ["%native_token_address"],
                                        },
                                      ],
                                      annots: ["%wrapped_"],
                                    },
                                  ],
                                },
                              ],
                              annots: ["%asset"],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
              annots: ["%get_bytes"],
            },
            returnType: { prim: "bytes" },
            code: [
              {
                prim: "CAR",
              },
              {
                prim: "PACK",
              },
              {
                prim: "KECCAK",
              },
            ],
          },
        ],
        errors: [],
      }),
      "ascii",
    ).toString("hex"),
  }),
};
