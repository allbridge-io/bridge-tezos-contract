(* Helper view function to get fee *)
function get_oracle_fee(
  const get_fee_param  : calculate_fee_t;
  const oracle_address : address)
                       : response_fee_t is
  unwrap(
    (Tezos.call_view("calculate_fee", get_fee_param, oracle_address) : option(response_fee_t)),
    Errors.oracle_not_found
  )

function get_lock_contract(
  const validator       : address)
                        : contract(validate_lock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_lock",
    validator)        : option(contract(validate_lock_t))) of
  | Some(contr) -> contr
  | None -> failwith(Errors.not_validator_lock)
  end;

function get_unlock_contract(
  const validator       : address)
                        : contract(validate_unlock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_unlock",
    validator)        : option(contract(validate_unlock_t))) of
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
    | _ -> failwith(Errors.non_transferable_asset)
    end;