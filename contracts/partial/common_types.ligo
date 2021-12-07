type token_id_t         is nat;
type native_address_t   is bytes;
type chain_id_t         is bytes;

type token_t            is [@layout:comb] record[
  address                 : address;
  id                      : token_id_t;
]

type wrapped_t          is nat

type wrapped_token_t    is [@layout:comb] record[
  chain_id                : chain_id_t;
  native_token_address    : native_address_t;
]

type asset_standard_t is
| Fa12                    of address
| Fa2                     of token_t
| Tez
| Wrapped                 of wrapped_token_t

type validate_lock_t    is [@layout:comb] record[
  lock_id                 : nat;
  sender                  : address;
  recipient               : bytes;
  amount                  : nat;
  asset                   : asset_standard_t;
  destination_chain_id    : chain_id_t;
]

type validate_unlock_t  is [@layout:comb] record[
  lock_id                 : nat;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  asset                   : asset_standard_t;
  signature               : signature;
]

type get_keccak_t       is [@layout:comb] record[
  lock_id                 : nat;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : bytes;
  asset                   : asset_standard_t;
]

type calculate_fee_t    is [@layout:comb] record[
  amount                  : nat;
  token                   : asset_standard_t;
  account                 : address;
]
