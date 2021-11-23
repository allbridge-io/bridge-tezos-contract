(* Lock asset entrypoint *)
function lock_asset(
  const params         : lock_asset_t;
  var s                : storage_t)
                       : return_t is
  block {
    (* Check bridge status *)
    is_bridge_enabled(s.enabled);

    var asset := get_asset(params.asset_id, s.bridge_assets);
    (* Check asset status *)
    is_asset_enabled(asset.enabled);

    var locked_amount := 0n;
    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(token_id) -> {
      var account := get_account(Tezos.sender, s.ledger);
      const account_balance = get_balance_by_token(account, token_id);

      if params.amount > account_balance
      then failwith("Bridge-core/insufficient-balance")
      else skip;
      account.balances[token_id] := abs(account_balance - params.amount);
      s.ledger[Tezos.sender] := account;

      var fee_collector_account := get_account(s.fee_collector, s.ledger);
      const collector_balance = get_balance_by_token(fee_collector_account, token_id);

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
      asset = transform_asset(asset.asset_type, s.wrapped_token_infos);
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
    (* Check bridge status *)
    is_bridge_enabled(s.enabled);

    var asset := get_asset(params.asset_id, s.bridge_assets);
    (* Check asset status *)
    is_asset_enabled(asset.enabled);
    const fee = case s.validators contains Tezos.sender of
    | True -> get_oracle_fee(
        record[
          amount = params.amount;
          token = asset.asset_type;
          abr_balance = 1n;//abr_balance;
          abr_total_supply = 1n//abt_total_supply
        ],
        s.fee_oracle
      )
    | False -> 0n
    end;
    const unlocked_amount = abs(params.amount - fee);

    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(token_id) -> {
      var receiver_account := get_account(params.receiver, s.ledger);
      const receiver_balance = get_balance_by_token(receiver_account, token_id);

      receiver_account.balances[token_id] := receiver_balance + unlocked_amount;
      s.ledger[params.receiver] := receiver_account;

      asset.locked_amount := asset.locked_amount + params.amount;

      var fee_collector_account := get_account(s.fee_collector, s.ledger);
      const collector_balance = get_balance_by_token(fee_collector_account, token_id);
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
          Tezos.sender,
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
      asset = transform_asset(asset.asset_type, s.wrapped_token_infos);
      signature = params.signature;
    ];

    operations := Tezos.transaction(
      validate_unlock,
      0mutez,
      get_unlock_contract(s.validator)
    ) # operations;
  } with (operations, s)