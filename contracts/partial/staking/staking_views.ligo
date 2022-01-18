[@view] function get_xabr_supply(
  const _unit           : unit;
  const s               : storage_t)
                        : nat is
  s.total_supply

[@view] function get_xabr_balance(
  const address_        : address;
  const s               : storage_t)
                        : nat is
  unwrap_or(s.ledger[address_], 0n)