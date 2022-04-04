(* Helper view function to get fee *)
function get_oracle_fee(
  const get_fee_param  : calculate_fee_t;
  const oracle_address : address)
                       : response_fee_t is
  unwrap(
    (Tezos.call_view("calculate_fee", get_fee_param, oracle_address) : option(response_fee_t)),
    Errors.oracle_not_found
  )

function get_min_fee(
  const token          : asset_standard_t;
  const oracle_address : address)
                       : response_fee_t is
  unwrap(
    (Tezos.call_view("min_fee", token, oracle_address) : option(response_fee_t)),
    Errors.oracle_not_found
  )

function get_lock_contract(
  const validator       : address)
                        : contract(validate_lock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_lock",
    validator)          : option(contract(validate_lock_t))) of
  | Some(contr) -> contr
  | None -> failwith(Errors.not_validator_lock)
  end;

// TODO::Replace with unwrap
function get_unlock_contract(
  const validator       : address)
                        : contract(validate_unlock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_unlock",
    validator)          : option(contract(validate_unlock_t))) of
  | Some(contr) -> contr
  | None -> failwith(Errors.not_validator_unlock)
  end;

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
          Errors.transfer_not_found))
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
    | Wrapped(token_) -> transfer_fa2(
        sender_,
        receiver,
        amount_,
        token_.id,
        token_.address)
    end;

function pow10(
  const value           : nat)
                        : nat is
       if value = 0n then 1n
  else if value = 1n then 10n
  else if value = 2n then 100n
  else if value = 3n then 1000n
  else if value = 4n then 10000n
  else if value = 5n then 100000n
  else if value = 6n then 1000000n
  else if value = 7n then 10000000n
  else if value = 8n then 100000000n
  else if value = 9n then 1000000000n
  else failwith(Errors.wrong_precision)

function to_system_precision(
  const value           : nat;
  const precision       : nat)
                        : nat is
  if precision > Constants.system_precision
  then value / pow10(abs(precision - Constants.system_precision))
  else value * pow10(abs(Constants.system_precision - precision))

function from_system_precision(
  const value           : nat;
  const precision       : nat)
                        : nat is
  if precision > Constants.system_precision
  then value * pow10(abs(precision - Constants.system_precision))
  else value / pow10(abs(Constants.system_precision - precision))
