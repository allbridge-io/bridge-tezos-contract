(* Helper view function to get abrTotalSupply *)
function get_abr_supply(
  const staking_addr   : address)
                       : r_abr_supply_t is
  unwrap(
    (Tezos.call_view("get_abr_supply", unit, staking_addr) : option(r_abr_supply_t)),
    Errors.get_supply_not_found
  )

(* Helper view function to get abr account balance *)
function get_abr_balance(
  const requested_addr : address;
  const staking_addr   : address)
                       : r_abr_balance_t is
  unwrap(
    (Tezos.call_view("get_abr_supply", requested_addr, staking_addr) : option(r_abr_balance_t)),
    Errors.get_balance_not_found
  )