
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

function assert_none(
  const param           : option(_a);
  const error           : string)
                        : unit is
  case param of
  | Some(_) -> failwith(error)
  | None -> unit
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
      "Fee-Collector/not-dep-contract")
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
          "Fee-Collector/not-dep-contract"))
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
    | _ -> failwith("Bridge-core/no-transfering-asset")
    end;

(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  case (Tezos.sender =/= owner) of
  | True -> failwith("Bridge-core/not-owner")
  | False -> unit
  end;

(* Helper to check permissions *)
function is_manager (
  const manager         : address)
                        : unit is
  case (Tezos.sender =/= manager) of
  | True -> failwith("Bridge-core/not-manager")
  | False -> unit
  end;

(* Helper function for get account *)
function get_account(
  const address_        : address;
  const ledger          : ledger_t)
                        : account_t is
  case ledger[address_] of
  | None -> record[
      balances = (Map.empty: balance_map_t);
      permits  = (set[]: set(address));
    ]
  | Some(acc) -> acc
  end

(* Helper function to get acount balance by token *)
function get_balance_by_token(
  const user            : account_t;
  const token_id        : token_id_t)
                        : nat is
  case user.balances[token_id] of
  | None -> 0n
  | Some(v) -> v
  end

(* Helper view function to get fee *)
function get_oracle_fee(
  const get_fee_param  : calculate_fee_t;
  const oracle_address : address)
                       : response_fee_t is
  case (Tezos.call_view("calculate_fee", get_fee_param, oracle_address) : option(response_fee_t)) of
  | Some(fee) -> fee
  | None -> failwith("Bridge-core/oracle-fee-404")
  end

function get_lock_contract(
  const validator       : address)
                        : contract(validate_lock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_lock",
    validator)        : option(contract(validate_lock_t))) of
  | Some(contr) -> contr
  | None -> failwith("Bridge-core/not-validator-lock")
  end;

function get_unlock_contract(
  const validator       : address)
                        : contract(validate_unlock_t) is
  case (Tezos.get_entrypoint_opt(
    "%validate_unlock",
    validator)        : option(contract(validate_unlock_t))) of
  | Some(contr) -> contr
  | None -> failwith("Bridge-core/not-validator-unlock")
  end;
