(* Lock asset entrypoint *)
function lock_asset(
  const params          : lock_asset_t;
  var s                : storage_t)
                       : return_t is
  block {
    var asset := get_asset(params.asset_id, s.bridge_assets);

    const fee = get_oracle_fee(
      record[
        amount = params.amount;
        token = asset.asset_type;
        abr_balance = 1n;//abr_balance;
        abr_total_supply = 1n//abt_total_supply
      ],
      s.fee_oracle
    );
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
      fee_collector_account.balances[token_id] := collector_balance + fee;
      s.ledger[s.fee_collector] := fee_collector_account;

      asset.locked_amount := abs(asset.locked_amount - params.amount);
     }
    | _ -> {
      operations := wrap_transfer(
        Tezos.sender,
        Tezos.self_address,
        params.amount,
        asset.asset_type
      ) # operations;
      operations := wrap_transfer(
        Tezos.sender,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
      asset.locked_amount := asset.locked_amount + params.amount;
    }
    end;

    s.bridge_assets[params.asset_id] := asset;

  } with (operations, s)

(* Unlock asset entrypoint *)
function unlock_asset(
  var params            : unlock_asset_t;
  var s                 : storage_t)
                        : return_t is
  block {
    var asset := get_asset(params.asset_id, s.bridge_assets);

    const fee = case s.validators contains Tezos.sender of
    | True -> get_oracle_fee(
      record[
        amount = params.amount;
        token = asset.asset_type;
        abr_balance = 1n;//abr_balance;
        abr_total_supply = 1n//abt_total_supply
      ],
      s.fee_oracle)
    | False -> 0n
    end;

    params.amount := abs(params.amount - fee);

    var operations := no_operations;
    case asset.asset_type of
    | Wrapped(token_id) -> {
      var receiver_account := get_account(params.receiver, s.ledger);
      const receiver_balance = get_balance_by_token(receiver_account, token_id);

      receiver_account.balances[token_id] := receiver_balance + params.amount;
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
        params.amount,
        asset.asset_type
      ) # operations;
      operations := wrap_transfer(
        Tezos.sender,
        s.fee_collector,
        fee,
        asset.asset_type
      ) # operations;
      asset.locked_amount := abs(asset.locked_amount - params.amount);
    }
    end;
    s.bridge_assets[params.asset_id] := asset;
  } with (operations, s)