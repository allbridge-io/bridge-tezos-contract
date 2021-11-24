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
      var account := unwrap(s.ledger[Tezos.sender], err_account_not_exist);
      const account_balance = unwrap(account.balances[token_id], err_zero_balance);

      assert_with_error(params.amount <= account_balance, err_insufficient_balance);

      account.balances[token_id] := abs(account_balance - params.amount);
      s.ledger[Tezos.sender] := account;

      var fee_collector_account := unwrap_or(s.ledger[s.fee_collector],
        record [
          balances = (map[]: balance_map_t);
          permits = (set[]: set(address));
        ]);
      const collector_balance = unwrap_or(fee_collector_account.balances[token_id], 0n);

      const fee = get_oracle_fee(
        record[
          amount = params.amount;
          token = asset.asset_type;
          abr_balance = 1n;//abr_balance;
          abr_total_supply = 1n//abt_total_supply
        ],
        s.fee_oracle);
      locked_amount := abs(params.amount - fee);
      fee_collector_account.balances[token_id] := collector_balance + fee;
      s.ledger[s.fee_collector] := fee_collector_account;

      asset.locked_amount := abs(asset.locked_amount - locked_amount);
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
      locked_amount := abs(tez_amount - fee);

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
      locked_amount := abs(params.amount - fee);
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

    const unlocked_amount = abs(params.amount - fee);

    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(info) -> {
      const token_id = unwrap(s.wrapped_token_ids[info], err_token_not_supported);
      var receiver_account := unwrap_or(s.ledger[Tezos.sender],
        record [
          balances = (map[]: balance_map_t);
          permits = (set[]: set(address));
        ]);
      const receiver_balance = unwrap_or(receiver_account.balances[token_id], 0n);

      receiver_account.balances[token_id] := receiver_balance + unlocked_amount;
      s.ledger[params.receiver] := receiver_account;

      asset.locked_amount := asset.locked_amount + params.amount;

      var fee_collector_account := unwrap_or(s.ledger[s.fee_collector],
        record [
          balances = (map[]: balance_map_t);
          permits = (set[]: set(address));
        ]);
      const collector_balance = unwrap(fee_collector_account.balances[token_id], err_zero_balance);
      fee_collector_account.balances[token_id] := collector_balance + fee;
      s.ledger[s.fee_collector] := fee_collector_account;
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
      asset.locked_amount := abs(asset.locked_amount - params.amount);
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