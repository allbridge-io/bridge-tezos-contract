(* Helper view function to get abrTotalSupply *)
function get_xabr_supply(
  const staking_addr   : address)
                       : r_xabr_supply_t is
  unwrap(
    (Tezos.call_view("get_xabr_supply", unit, staking_addr) : option(r_xabr_supply_t)),
    Errors.get_supply_not_found
  )

(* Helper view function to get abr account balance *)
function get_xabr_balance(
  const requested_addr : address;
  const staking_addr   : address)
                       : r_xabr_balance_t is
  unwrap(
    (Tezos.call_view("get_xabr_balance", requested_addr, staking_addr) : option(r_xabr_balance_t)),
    Errors.get_balance_not_found
  )