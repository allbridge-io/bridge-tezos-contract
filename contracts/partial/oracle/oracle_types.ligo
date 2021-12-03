type token_fee_map_t    is big_map(asset_standard_t, nat);

type storage_t          is [@layout:comb] record[
  owner                   : address;
  staking_address         : address;
  fee_per_tokens          : token_fee_map_t;
  base_fee                : nat;
  fee_multiper            : nat;
]

type return_t           is list (operation) * storage_t

type change_token_fee_t is [@layout:comb] record[
  token                   : asset_standard_t;
  new_fee                 : nat;
]

type calculate_fee_t    is [@layout:comb] record[
  amount                  : nat;
  token                   : asset_standard_t;
  account                 : address;
]

type response_fee_t     is nat;

(* R means response *)
type r_abr_supply_t     is nat;
type r_abr_balance_t    is nat