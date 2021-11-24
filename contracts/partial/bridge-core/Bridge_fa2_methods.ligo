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
        var sender_account : account_t :=
          unwrap_or(s.ledger[trx_params.from_], new_account);
        var sender_balance :=
          unwrap_or(sender_account.balances[transfer.token_id], 0n);

        (* Check permissions *)
        assert_with_error(trx_params.from_ = Tezos.sender
          or Set.mem(Tezos.sender, sender_account.permits), err_fa2_not_operator);

        (* Balance check *)
        assert_with_error(sender_balance >= transfer.amount, err_fa2_low_balance);

        (* Update sender account *)
        sender_balance := abs(sender_balance - transfer.amount);
        sender_account.balances[transfer.token_id] := sender_balance;
        s.ledger[Tezos.sender] := sender_account;

        (* Create or get destination account *)
        var destination_account : account_t :=
          unwrap_or(s.ledger[transfer.to_], new_account);
        var destination_balance :=
          unwrap_or(destination_account.balances[transfer.token_id], 0n);

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
      assert_with_error(Tezos.sender = param.owner, err_fa2_not_owner);

      var account : account_t := unwrap_or(s.ledger[param.owner], new_account);
      (* Add operator *)
      account.permits := Set.add(param.operator, account.permits);

      (* Update storage *)
      s.ledger[param.owner] := account;
    }
    | Remove_operator(param) -> block {
      (* Check an owner *)
      assert_with_error(Tezos.sender = param.owner, err_fa2_not_owner);

      var account : account_t := unwrap_or(s.ledger[param.owner], new_account);
      (* Remove operator *)
      account.permits := Set.remove(param.operator, account.permits);

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
        const account : account_t = unwrap_or(s.ledger[request.owner], new_account);
        const balance_ = unwrap_or(account.balances[request.token_id], 0n);

        (* Form the response *)
        var response : balance_of_response_t := record [
            request = request;
            balance = balance_;
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

