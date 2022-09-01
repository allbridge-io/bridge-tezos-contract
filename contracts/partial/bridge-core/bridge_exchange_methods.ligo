(* Lock asset entrypoint *)
function lock_asset(
  const params         : lock_asset_t;
  var s                : storage_t)
                       : return_t is
  block {
    const token_source : source_token_t = record[
      chain_id = params.token_source;
      native_address = params.token_source_address;
    ];
    const asset_id = unwrap(s.bridge_asset_ids[token_source], Errors.asset_not_exist);
    const asset = unwrap(s.bridge_assets[asset_id], Errors.asset_not_exist);

    require(asset.enabled, Errors.asset_disabled);
    require(s.enabled, Errors.bridge_disabled);

    const locked_without_fee = case asset.asset_type of [
    | Tez -> Tezos.amount / 1mutez
    | _ -> block {
        require(Tezos.amount = 0mutez, Errors.unexpected_xtz_amount)
      } with params.amount
    ];

    require(locked_without_fee > 0n, Errors.zero_transfer);

    const fee = get_oracle_fee(
      record[
        amount = locked_without_fee;
        token = asset.asset_type;
        account = Tezos.sender
      ],
      s.fee_oracle);

    const locked_amount = get_nat_or_fail(locked_without_fee - fee, Errors.amount_too_low);
    require(locked_amount > 0n, Errors.zero_transfer);

    var operations := Constants.no_operations;
    case asset.asset_type of [
    | Wrapped(token_) -> {
      const burn_params : burn_params_t = record[
        token_id = token_.id;
        account = Tezos.sender;
        amount = locked_without_fee
      ];
      const mint_params : mint_params_t = list[
        record[
          token_id = token_.id;
          recipient = s.fee_collector;
          amount = fee
        ]
      ];
      operations := list[
        Tezos.transaction(
          burn_params,
          0mutez,
          unwrap(
            (Tezos.get_entrypoint_opt("%burn", token_.address) : option(contract(burn_params_t))),
            Errors.burn_etp_404)
        );
        Tezos.transaction(
          mint_params,
          0mutez,
          unwrap(
            (Tezos.get_entrypoint_opt("%mint", token_.address) : option(contract(mint_params_t))),
            Errors.mint_etp_404
          )
        );
      ]
     }
    | Tez -> {
      require(locked_without_fee = params.amount, Errors.amounts_mismatch);
      operations := wrap_transfer(
        Tezos.self_address,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
    }
    | _ -> {
      operations := wrap_transfer(
        Tezos.sender,
        Tezos.self_address,
        locked_amount,
        asset.asset_type
      ) # operations;
      operations := wrap_transfer(
        Tezos.sender,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
    }
    ];

    var validate_lock := record[
      lock_id = params.lock_id;
      sender = Tezos.sender;
      recipient = params.recipient;
      amount = to_system_precision(locked_amount, asset.precision);
      token_source = params.token_source;
      token_source_address = params.token_source_address;
      destination_chain_id = params.chain_id
    ];
    operations := Tezos.transaction(
      validate_lock,
      0mutez,
      get_lock_contract(s.validator)
    ) # operations;

  } with (operations, s)

(* Unlock asset entrypoint *)
function unlock_asset(
  const params          : unlock_asset_t;
  var s                 : storage_t)
                        : return_t is
  block {
    const token_source : source_token_t = record[
      chain_id = params.token_source;
      native_address = params.token_source_address;
    ];
    const asset_id = unwrap(s.bridge_asset_ids[token_source], Errors.asset_not_exist);
    var asset := unwrap(s.bridge_assets[asset_id], Errors.asset_not_exist);

    require(s.enabled, Errors.bridge_disabled);
    require(asset.enabled, Errors.asset_disabled);
    const amount_ = from_system_precision(params.amount, asset.precision);
    const fee = if s.approved_claimer = Tezos.sender
      then get_min_fee(asset.asset_type, s.fee_oracle)
      else 0n;

    const unlocked_amount = get_nat_or_fail(amount_ - fee, Errors.amount_too_low);

    case asset.asset_type of [
    | Tez -> require(unlocked_amount > 0n, Errors.zero_unlocked_tez)
    | _ -> require(Tezos.amount = 0mutez, Errors.unexpected_xtz_amount)
    ];

    var operations := Constants.no_operations;
    case asset.asset_type of [
    | Wrapped(token_) -> {
      var mint_params : mint_params_t := list[
        record[
          token_id = token_.id;
          recipient = params.recipient;
          amount = unlocked_amount
        ];
      ];
      if fee > 0n
      then mint_params := record[
            token_id = token_.id;
            recipient = s.fee_collector;
            amount = fee
        ] # mint_params
      else skip;
      operations := list[
        Tezos.transaction(
          mint_params,
          0mutez,
          unwrap(
            (Tezos.get_entrypoint_opt("%mint", token_.address) : option(contract(mint_params_t))),
            Errors.mint_etp_404
          )
        )
      ]
     }
    | _ -> {

      operations := wrap_transfer(
        Tezos.self_address,
        params.recipient,
        unlocked_amount,
        asset.asset_type
      ) # operations;
      if fee > 0n
      then {
        operations := wrap_transfer(
          Tezos.self_address,
          s.fee_collector,
          fee,
          asset.asset_type
        ) # operations}
      else skip;
    }
    ];

    var validate_unlock := record[
      lock_id = params.lock_id;
      recipient = params.recipient;
      amount = params.amount;
      chain_from_id = params.chain_from_id;
      token_source = params.token_source;
      token_source_address = params.token_source_address;
      signature = params.signature;
    ];

    operations := Tezos.transaction(
      validate_unlock,
      0mutez,
      get_unlock_contract(s.validator)
    ) # operations;
  } with (operations, s)