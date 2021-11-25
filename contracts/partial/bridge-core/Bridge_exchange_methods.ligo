(* Lock asset entrypoint *)
function lock_asset(
  const params         : lock_asset_t;
  var s                : storage_t)
                       : return_t is
  block {
    var asset := unwrap(s.bridge_assets[params.asset_id], err_asset_not_exist);

    assert_with_error(asset.enabled, err_asset_disabled);
    assert_with_error(s.enabled, err_bridge_disabled);

    var locked_amount := 0n;
    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(info) -> {
      const token_id = unwrap(s.wrapped_token_ids[info], err_token_not_supported);
      const sender_key : ledger_key_t = (Tezos.sender, token_id);
      const account_balance = unwrap(s.ledger[sender_key], err_zero_balance);

      assert_with_error(params.amount <= account_balance, err_insufficient_balance);

      s.ledger[sender_key] := get_nat_or_fail(account_balance - params.amount);

      const collector_key = (s.fee_collector, token_id);
      const collector_balance = unwrap_or(s.ledger[collector_key], 0n);

      const fee = get_oracle_fee(
        record[
          amount = params.amount;
          token = asset.asset_type;
          abr_balance = 1n;//abr_balance;
          abr_total_supply = 1n//abt_total_supply
        ],
        s.fee_oracle);
      locked_amount := get_nat_or_fail(params.amount - fee);
      s.ledger[collector_key ] := collector_balance + fee;

      asset.locked_amount := get_nat_or_fail(asset.locked_amount - locked_amount);
     }
    | Tez -> {
      const tez_amount = Tezos.amount / 1mutez;
      const fee = get_oracle_fee(
        record[
          amount = tez_amount;
          token = asset.asset_type;
          abr_balance = 1n;//abr_balance;
          abr_total_supply = 1n//abt_total_supply
        ],
        s.fee_oracle);
      locked_amount := get_nat_or_fail(tez_amount - fee);

      operations := wrap_transfer(
        Tezos.self_address,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
      asset.locked_amount := asset.locked_amount + locked_amount;
    }
    | _ -> {
      const fee = get_oracle_fee(
        record[
          amount = params.amount;
          token = asset.asset_type;
          abr_balance = 1n;//abr_balance;
          abr_total_supply = 1n//abt_total_supply
        ],
        s.fee_oracle);
      locked_amount := get_nat_or_fail(params.amount - fee);

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
      recipient = params.receiver;
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
    var asset := unwrap(s.bridge_assets[params.asset_id], err_asset_not_exist);

    assert_with_error(s.enabled, err_bridge_disabled);
    assert_with_error(asset.enabled, err_asset_disabled);
    assert_with_error(params.amount > 0n, err_zero_transfer);

    const fee = if s.validators contains Tezos.sender
      then get_oracle_fee(
          record[
            amount = params.amount;
            token = asset.asset_type;
            abr_balance = 1n;//abr_balance;
            abr_total_supply = 1n//abt_total_supply
          ],
          s.fee_oracle
        )
      else 0n;

    const unlocked_amount = get_nat_or_fail(params.amount - fee);

    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(info) -> {
      const token_id = unwrap(s.wrapped_token_ids[info], err_token_not_supported);
      const receiver_key = (params.receiver, token_id);
      const receiver_balance = unwrap_or(s.ledger[receiver_key], 0n);
      s.ledger[receiver_key] := receiver_balance + unlocked_amount;

      asset.locked_amount := asset.locked_amount + params.amount;

      const collector_key = (s.fee_collector, token_id);
      const collector_balance = unwrap_or(s.ledger[collector_key], 0n);
      s.ledger[collector_key] := collector_balance + fee;
     }
    | _ -> {
      operations := wrap_transfer(
        Tezos.self_address,
        params.receiver,
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
      asset.locked_amount := get_nat_or_fail(asset.locked_amount - params.amount);
    }
    end;
    s.bridge_assets[params.asset_id] := asset;

    var validate_unlock := record[
      lock_id = params.lock_id;
      recipient = params.receiver;
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