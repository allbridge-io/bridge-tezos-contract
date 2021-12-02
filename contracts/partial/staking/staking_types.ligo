type reward_period_t    is [@layout:comb] record[
  abr_per_sec_f           : nat;
  start_period            : timestamp;
  end_period              : timestamp;
]

type ledger_t           is big_map(address, nat)
type permits_t          is big_map(address, set(address))

type period_set_t       is set(reward_period_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
  deposit_token           : address;
  ledger                  : ledger_t;
  permits                 : permits_t;
  periods                 : period_set_t;
  total_supply            : nat;
  total_underlying_f      : nat;
  exchange_rate_f         : nat;
  last_update_time        : timestamp;
]

type return_t           is list (operation) * storage_t

type new_period_t       is [@layout:comb] record[
  amount                  : nat;
  start_period            : timestamp;
  end_period              : timestamp;
]