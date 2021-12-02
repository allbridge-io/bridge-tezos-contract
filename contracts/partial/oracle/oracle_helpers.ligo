(* Helper view function to get abrTotalSupply *)
function get_abr_supply(
  const stake_address  : address)
                       : r_abr_supply_t is
  unwrap(
    (Tezos.call_view("get_abr_supply", unit, stake_address) : option(r_abr_supply_t)),
    Errors.get_supply_not_found
  )

(* Helper view function to get abr account balance *)
function get_abr_balance(
  const requested_addr : address;
  const stake_address  : address)
                       : r_abr_balance_t is
  unwrap(
    (Tezos.call_view("get_abr_supply", requested_addr, stake_address) : option(r_abr_balance_t)),
    Errors.get_balance_not_found
  )