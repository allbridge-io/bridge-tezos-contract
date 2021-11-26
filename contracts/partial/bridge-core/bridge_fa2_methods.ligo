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

        const sender_key : ledger_key_t = (Tezos.sender, transfer.token_id);
        const sender_permits = unwrap_or(s.permits[sender_key], empty_permits);
        (* Check permissions *)
        assert_with_error(trx_params.from_ = Tezos.sender
          or Set.mem(Tezos.sender, sender_permits), err_fa2_not_operator);

        assert_with_error(transfer.amount > 0n, err_zero_transfer);

        const sender_balance = unwrap(s.ledger[sender_key], err_fa2_low_balance);
        (* Balance check *)
        assert_with_error(sender_balance >= transfer.amount, err_fa2_low_balance);

        (* Update sender account *)
        s.ledger[sender_key] := get_nat_or_fail(sender_balance - transfer.amount);

        (* Create or get destination account *)
        const destination_key = (transfer.to_, transfer.token_id);
        const destination_balance = unwrap_or(s.ledger[destination_key], 0n);

        (* Update destination account *)
        s.ledger[destination_key] := destination_balance + transfer.amount;

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
      const account_key = (param.owner, param.token_id);
      const account_permits = unwrap_or(s.permits[account_key], empty_permits);
      (* Add operator *)
      s.permits[account_key] := Set.add(param.operator, account_permits);
    }
    | Remove_operator(param) -> block {
      (* Check an owner *)
      assert_with_error(Tezos.sender = param.owner, err_fa2_not_owner);
      const account_key = (param.owner, param.token_id);
      const account_permits = unwrap_or(s.permits[account_key], empty_permits);
      (* Remove operator *)
      s.permits[account_key] := Set.remove(param.operator, account_permits);
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
        const account_key = (request.owner, request.token_id);
        const balance_ = unwrap_or(s.ledger[account_key], 0n);

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

