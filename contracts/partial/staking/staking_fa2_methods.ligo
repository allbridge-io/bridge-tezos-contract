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
        const updated_reward = update_reward(s, operations);
        operations := updated_reward.0;
        var s := updated_reward.1;

        require(transfer.token_id = 0n, Errors.fa2_token_undefined);
        const sender_allowances = unwrap_or(s.allowances[trx_params.from_], Constants.empty_allowances);
        (* Check permissions *)
        require(trx_params.from_ = Tezos.sender
          or Set.mem(Tezos.sender, sender_allowances), Errors.fa2_not_operator);

        const sender_balance = unwrap(s.ledger[trx_params.from_], Errors.fa2_low_balance);

        (* Update sender account *)
        s.ledger[trx_params.from_] := get_nat_or_fail(sender_balance - transfer.amount, Errors.fa2_low_balance);

        (* Create or get destination account *)
        const destination_balance = unwrap_or(s.ledger[transfer.to_], 0n);

        (* Update destination account *)
        s.ledger[transfer.to_] := destination_balance + transfer.amount;

    } with (operations, s);
} with List.fold (make_transfer, trx_params.txs, result)

(* Perform single operator update *)
function iterate_update_operators(
  var s                 : storage_t;
  const params          : update_operator_param_t)
                        : storage_t is
  block {
    const (param, should_add) = case params of
    | Add_operator(param)    -> (param, True)
    | Remove_operator(param) -> (param, False)
    end;

    require(Tezos.sender = param.owner, Errors.fa2_not_owner);
    require(param.token_id = 0n, Errors.fa2_token_undefined);

    const account_allowances = unwrap_or(s.allowances[param.owner], Constants.empty_allowances);
    s.allowances[param.owner] := Set.update(param.operator, should_add, account_allowances);

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
        require(request.token_id = 0n, Errors.fa2_token_undefined);
        (* Retrieve the asked account from the storage *)
        const balance_ = unwrap_or(s.ledger[request.owner], 0n);

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
  } with list [
    Tezos.transaction(
      accumulated_response,
      0tz,
      balance_params.callback
    )]

function update_operators(
  const s               : storage_t;
  const params          : update_operator_params_t)
                        : storage_t is
  List.fold(iterate_update_operators, params, s)

function transfer(
  const s               : storage_t;
  const params          : transfer_params_t)
                        : return_t is
  List.fold(iterate_transfer, params, (Constants.no_operations, s))
