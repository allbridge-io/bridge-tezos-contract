(* Perform transfers from one owner *)
function iterate_transfer (
  var result            : return_t;
  const trx_params      : transfer_param_t)
                        : return_t is
  block {

    (* Perform single transfer *)
    function make_transfer(
      var result        : return_t;
      var transfer      : transfer_destination_t)
                        : return_t is
      block {
        var operations := result.0;
        var s := result.1;
        var sender_account : account_t := get_account(trx_params.from_, s);
        var sender_balance := get_balance_by_token(sender_account, transer.token_id);

        (* Check permissions *)
        if trx_params.from_ =/= Tezos.sender
          and Set.mem (Tezos.sender, sender_account.permits )
        then failwith("FA2_NOT_OPERATOR")
        else skip;

        if transfer.amount = 0n
        then failwith("Bridge-core/zero-amount-in")
        else skip;

        (* Balance check *)
        if sender_balance < transfer.amount
        then failwith("FA2_INSUFFICIENT_BALANCE")
        else skip;

        (* Update sender account *)
        sender_balance := abs(sender_balance - transfer.amount);
        sender_account.balances[transfer.token_id] := sender_balance;
        s.ledger[Tezos.sender] := sender_account;

        (* Create or get destination account *)
        var destination_account : account_t :=
          get_account(transfer.to_, s);
        var destination_balance := get_balance_by_token(destination_account, transfer.token_id);

        (* Update destination account *)
        destination_balance := destination_balance + transfer.amount;
        destination_account.balances[transfer.token_id] := destination_balance;
        s.ledger[transfer.to_] := destination_account;

    } with (operations, s);
} with List.fold (make_transfer, trx_params.txs, result)

(* Perform single operator update *)
function iterate_update_operators(
  var s                 : storage_t;
  const params          : update_operator_param_t)
                        : storage_t is
  block {
    case params of
    | Add_operator(param) -> block {
      (* Check an owner *)
      if Tezos.sender =/= param.owner
      then failwith("FA2_NOT_OWNER")
      else skip;

      var account : account_t := get_account(param.owner, s.ledger);
      (* Add operator *)
      account.permits := Set.add(param.operator, account.permits);

      (* Update storage *)
      s.ledger[param.owner] := account;
    }
    | Remove_operator(param) -> block {
      (* Check an owner *)
      if Tezos.sender =/= param.owner
      then failwith("FA2_NOT_OWNER")
      else skip;

      var account : account_t := get_account(param.owner, s.ledger);
      (* Remove operator *)
      ledger.permits := Set.remove(param.operator, account.permits);

      (* Update storage *)
      s.ledger[param.owner] := account;
    }
    end
  } with s

(* Perform balance lookup *)
function get_balance_of(
  const s               : storage_t;
  const balance_params  : balance_params_t)
                        : list(operation) is
  block {
    (* Perform single balance lookup *)
    function look_up_balance(
      const l           : list(balance_of_response_t);
      const request     : balance_of_request_t)
                        : list(balance_of_response_t) is
      block {
        (* Retrieve the asked account from the storage *)
        const account : account_t = get_account(request.owner, s.ledger);
        const balance = get_balance_by_token(request.token_id, account);

        (* Form the response *)
        var response : balance_of_response_t := record [
            request = request;
            balance = balance;
          ];
      } with response # l;

    (* Collect balances info *)
    const accumulated_response : list(balance_of_response_t) =
      List.fold(
        look_up_balance,
        balance_params.requests,
        (nil: list(balance_of_response_t)));
  } with list [Tezos.transaction(
    accumulated_response,
    0tz,
    balance_params.callback
  )]

function update_operators(
  const s               : storage_t;
  const params          : update_operator_params_t)
                        : storage_t is
  block {
    skip
  } with List.fold(iterate_update_operators, params, s)

function transfer(
  const s               : storage_t;
  const params          : transfer_params_t)
                        : return_t is
  block {
    skip
  } with List.fold(iterate_transfer, params, (no_operations, s));

