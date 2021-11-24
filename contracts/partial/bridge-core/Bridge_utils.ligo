function unwrap_or(
  const param           : option(_a);
  const default         : _a)
                        : _a is
  case param of
  | Some(instance) -> instance
  | None -> default
  end;

function unwrap(
  const param           : option(_a);
  const error           : string)
                        : _a is
  case param of
  | Some(instance) -> instance
  | None -> failwith(error)
  end;

(* Create tranfer tx param *)
function wrap_fa2_transfer_trx(
  const from_         : address;
  const to_           : address;
  const amount_       : nat;
  const token_id      : nat)
                        : fa2_transfer_t is
  block {
    const transfer_destination : transfer_destination_t = record [
      to_               = to_;
      token_id          = token_id;
      amount            = amount_;
    ];
    const transfer_param : fa2_transfer_param_t = record [
      from_             = from_;
      txs               = list[transfer_destination];
    ];
  } with list[transfer_param]

(* Helper function to transfer fa2 tokens *)
function transfer_fa2(
  const sender_         : address;
  const receiver        : address;
  const amount_         : nat;
  const token_id        : token_id_t;
  const contract_address : address) : operation is
  Tezos.transaction(
    wrap_fa2_transfer_trx(
      sender_,
      receiver,
      amount_,
      token_id),
    0mutez,
    unwrap(
      (Tezos.get_entrypoint_opt("%transfer", contract_address) : option(contract(fa2_transfer_t))),
      err_transfer_not_found)
  );

function wrap_transfer(
  const sender_          : address;
  const receiver         : address;
  const amount_          : nat;
  const token            : asset_standard_t)
                         : operation is
    case token of
    | Fa12(address_) -> Tezos.transaction(
        (sender_,
        (receiver, amount_)),
        0mutez,
        unwrap(
          (Tezos.get_entrypoint_opt("%transfer", address_) : option(contract(fa12_transfer_t))),
          err_transfer_not_found))
    | Fa2(token_) -> transfer_fa2(
        sender_,
        receiver,
        amount_,
        token_.id,
        token_.address)
    | Tez -> Tezos.transaction(
        unit,
        amount_ * 1mutez,
        (get_contract(receiver) : contract(unit)))
    | _ -> failwith(err_non_transferable_asset)
    end;

(* Helper view function to get fee *)
function get_oracle_fee(
  const get_fee_param  : calculate_fee_t;
  const oracle_address : address)
                       : response_fee_t is
  unwrap(
    (Tezos.call_view("calculate_fee", get_fee_param, oracle_address) : option(response_fee_t)),
    err_oracle_not_found
  )

function get_lock_contract(
  const validator       : address)
                        : contract(validate_lock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_lock",
    validator)        : option(contract(validate_lock_t))) of
  | Some(contr) -> contr
  | None -> failwith(err_not_validator_lock)
  end;

function get_unlock_contract(
  const validator       : address)
                        : contract(validate_unlock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_unlock",
    validator)        : option(contract(validate_unlock_t))) of
  | Some(contr) -> contr
  | None -> failwith(err_not_validator_unlock)
  end;
