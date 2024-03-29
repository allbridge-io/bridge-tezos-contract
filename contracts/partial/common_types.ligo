type token_id_t         is nat
type native_address_t   is bytes
type chain_id_t         is bytes
type lock_id_t          is bytes

type token_t            is [@layout:comb] record[
  address                 : address;
  id                      : token_id_t;
]

type asset_standard_t is
| Fa12                    of address
| Fa2                     of token_t
| Tez
| Wrapped                 of token_t

type validate_lock_t    is [@layout:comb] record[
  lock_id                 : lock_id_t;
  sender                  : address;
  recipient               : bytes;
  amount                  : nat;
  token_source            : bytes;
  token_source_address    : bytes;
  destination_chain_id    : chain_id_t;
]

type validate_unlock_t  is [@layout:comb] record[
  lock_id                 : lock_id_t;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  signature               : signature;
]

type get_keccak_t       is [@layout:comb] record[
  lock_id                 : lock_id_t;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  blockchain_id           : bytes;
  operation_type          : string;
]

type calculate_fee_t    is [@layout:comb] record[
  amount                  : nat;
  token                   : asset_standard_t;
  account                 : address;
]

type token_metadata_t   is [@layout:comb] record [
  token_id                : token_id_t;
  token_info              : map (string, bytes);
]

type mint_burn_params_t is [@layout:comb] record [
  token_id                : token_id_t;
  account                 : address;
  amount                  : nat;
]

type unlock_key_t       is [@layout:comb] record [
  chain                   : bytes;
  lock_id                 : lock_id_t;
]