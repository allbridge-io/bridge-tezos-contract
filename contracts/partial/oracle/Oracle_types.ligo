type token_fee_map_t    is big_map(asset_standard_t, nat);

type storage_t          is [@layout:comb] record[
  owner                   : address;
  fee_per_tokens          : token_fee_map_t;
  base_fee                : nat;
  fee_multiper            : nat;
]

type return_t           is list (operation) * storage_t

type change_token_fee_t is [@layout:comb] record[
  token                   : asset_standard_t;
  new_fee                 : nat;
]

type change_fee_t       is
| Change_token_fee        of change_token_fee_t
| Change_base_fee         of nat
| Change_fee_multiper     of nat

const no_operations : list(operation) = nil;
const bp = 10000n;