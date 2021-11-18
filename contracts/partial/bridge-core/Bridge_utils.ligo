(* Helper to get the entrypoint of transfer fa12 contract *)
function get_transfer_fa12_contract(
  const token_address   : address)
                        : contract(fa12_transfer_t) is
  case (Tezos.get_entrypoint_opt("%transfer", token_address) : option(contract(fa12_transfer_t))) of
  | Some(contr) -> contr
  | None -> failwith("Fee-Collector/not-dep-fa12-contract")
  end

(* Helper to get the entrypoint of transfer fa2 contract *)
function get_transfer_fa2_contract(
  const token_address   : address)
                        : contract(fa2_transfer_t) is
  case (Tezos.get_entrypoint_opt("%transfer", token_address) : option(contract(fa2_transfer_t))) of
  | Some(contr) -> contr
  | None -> failwith("Fee-Collector/not-dep-contract")
  end

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
    get_transfer_fa2_contract(contract_address)
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
        get_transfer_fa12_contract(address_))
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
  block {
    if Tezos.sender =/= owner
    then failwith("Bridge-core/not-owner")
    else skip;
} with unit

(* Helper to check permissions *)
function is_manager (
  const manager         : address)
                        : unit is
  case (Tezos.sender =/= manager) of
  | True -> failwith("Bridge-core/not-manager")
  | False -> unit
  end;

(* Helper function for get bridge asset *)
function get_asset(
  const asset_id         : asset_id_t;
  const asset_map        : asset_map_t)
                         : asset_t is
  case asset_map[asset_id] of
  | Some(asset) -> asset
  | None -> failwith("Bridge-core/wrong-asset-id")
  end;

(* Helper function for get bridge asset id *)
function get_asset_id(
  const asset            : asset_t;
  const asset_map        : asset_map_ids_t)
                         : nat is
  case asset_map[asset] of
  | Some(id) -> id
  | None -> failwith("Bridge-core/wrong-asset")
  end;

(* Helper function for to check uniqueness *)
function is_uniq(
  const asset           : asset_t;
  const asset_map       : asset_map_ids_t)
                        : unit is
  case asset_map[asset] of
  | Some(_) -> failwith("Bridge-core/asset-already-exists")
  | None -> unit
  end;

(* Helper function for get wrapped token *)
function get_wrapped_token(
  const token_id         : token_id_t;
  const wraped_map       : wrapped_token_map_t)
                         : wrapped_token_t is
  case wraped_map[token_id] of
  | Some(token) -> token
  | None -> failwith("Bridge-core/wrong-token-id")
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