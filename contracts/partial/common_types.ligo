type token_id_t         is nat
type native_address_t   is bytes
type chain_id_t         is bytes
type lock_id_t          is bytes

type token_t            is [@layout:comb] record[
  address                 : address;
  id                      : token_id_t;
]

type wrapped_token_t    is [@layout:comb] record[
  chain_id                : chain_id_t;
  native_token_address    : native_address_t;
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
  asset                   : asset_standard_t;
  destination_chain_id    : chain_id_t;
]

type validate_unlock_t  is [@layout:comb] record[
  blockchain_id           : bytes;
  lock_id                 : lock_id_t;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  signature               : signature;
]

type get_keccak_t       is [@layout:comb] record[
  blockchain_id           : bytes;
  lock_id                 : lock_id_t;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  type_operation          : string;
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

type mint_param_t       is [@layout:comb] record [
  token_id                : token_id_t;
  recipient               : address;
  amount                  : nat;
]

type mint_params_t      is list(mint_param_t)

type burn_params_t      is [@layout:comb] record [
  token_id                : token_id_t;
  account                 : address;
  amount                  : nat;
]