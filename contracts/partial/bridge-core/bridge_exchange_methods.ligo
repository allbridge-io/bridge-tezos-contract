(* Lock asset entrypoint *)
function lock_asset(
  const params         : lock_asset_t;
  var s                : storage_t)
                       : return_t is
  block {
    var asset := unwrap(s.bridge_assets[params.asset_id], Errors.asset_not_exist);

    require(asset.enabled, Errors.asset_disabled);
    require(s.enabled, Errors.bridge_disabled);

    const lock_amount = case asset.asset_type of
    | Tez -> Tezos.amount / 1mutez
    | _ -> params.amount
    end;

    require(lock_amount > 0n, Errors.zero_transfer);

    const fee = get_oracle_fee(
      record[
        amount = lock_amount;
        token = asset.asset_type;
        account = Tezos.sender
      ],
      s.fee_oracle);

    const locked_amount = get_nat_or_fail(lock_amount - fee, Errors.not_nat);

    var operations := Constants.no_operations;
    case asset.asset_type of
    | Wrapped(token_) -> {
      asset.locked_amount := get_nat_or_fail(asset.locked_amount - locked_amount, Errors.not_nat);

      const burn_params : burn_params_t = record[
        token_id = token_.id;
        account = Tezos.sender;
        amount = locked_amount
      ];
      operations := list[
        Tezos.transaction(
          burn_params,
          0mutez,
          unwrap(
            (Tezos.get_entrypoint_opt("%burn", token_.address) : option(contract(burn_params_t))),
            Errors.burn_etp_404)
        );
        wrap_transfer(
          Tezos.sender,
          s.fee_collector,
          fee,
          asset.asset_type
        )
      ]
     }
    | Tez -> {
      operations := wrap_transfer(
        Tezos.self_address,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
      asset.locked_amount := asset.locked_amount + locked_amount;
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

      asset.locked_amount := asset.locked_amount + locked_amount;
    }
    end;
    s.bridge_assets[params.asset_id] := asset;

    var validate_lock := record[
      lock_id = params.lock_id;
      sender = Tezos.sender;
      recipient = params.recipient;
      amount = locked_amount;
      asset = asset.asset_type;
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
    var asset := unwrap(s.bridge_assets[params.asset_id], Errors.asset_not_exist);

    require(s.enabled, Errors.bridge_disabled);
    require(asset.enabled, Errors.asset_disabled);

    const fee = if s.approved_claimer = Tezos.sender
      then get_oracle_fee(
        record[
          amount = params.amount;
          token = asset.asset_type;
          account = Tezos.sender;
          ],
        s.fee_oracle
        )
      else 0n;

    const unlocked_amount = get_nat_or_fail(params.amount - fee, Errors.not_nat);

    var operations := Constants.no_operations;
    case asset.asset_type of
    | Wrapped(token_) -> {
      asset.locked_amount := asset.locked_amount + params.amount;

      const mint_params : mint_params_t = list[
        record[
          token_id = token_.id;
          recipient = params.recipient;
          amount = unlocked_amount
        ]
      ];
      operations := list[
        Tezos.transaction(
          mint_params,
          0mutez,
          unwrap(
            (Tezos.get_entrypoint_opt("%mint", token_.address) : option(contract(mint_params_t))),
            Errors.mint_etp_404
          )
        );
        wrap_transfer(
          Tezos.sender,
          s.fee_collector,
          fee,
          asset.asset_type
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
      asset.locked_amount := get_nat_or_fail(asset.locked_amount - params.amount, Errors.not_nat);
    }
    end;
    s.bridge_assets[params.asset_id] := asset;

    var validate_unlock := record[
      lock_id = params.lock_id;
      recipient = params.recipient;
      amount = params.amount;
      chain_from_id = params.chain_id;
      asset = asset.asset_type;
      signature = params.signature;
    ];

    operations := Tezos.transaction(
      validate_unlock,
      0mutez,
      get_unlock_contract(s.validator)
    ) # operations;
  } with (operations, s)