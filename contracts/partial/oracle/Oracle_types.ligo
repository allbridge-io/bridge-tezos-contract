type token_fee_map_t    is big_map(asset_standard_t, nat);

type storage_t          is [@layout:comb] record[
  owner                   : address;
  fee_per_tokens          : token_fee_map_t;
  base_fee                : nat;
  fee_multiper            : nat;
]

type return_t           is list (operation) * storage_t

type change_owner_t     is address


const no_operations : list(operation) = nil;
const bp = 10000n;