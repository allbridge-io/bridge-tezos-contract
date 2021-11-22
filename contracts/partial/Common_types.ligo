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

type asset_standard_t   is
| Fa12                    of address
| Fa2                     of token_t
| Tez
| Wrapped                 of wrapped_t

type standard_asset_t is
| Fa12_                     of address
| Fa2_                      of token_t
| Tez_
| Wrapped_                  of wrapped_token_t

type validate_lock_t    is [@layout:comb] record[
  lock_id                 : nat;
  sender                  : address;
  recipient               : bytes;
  amount                  : nat;
  asset                   : standard_asset_t;
  destination_chain_id    : chain_id_t;
]

type validate_unlock_t  is [@layout:comb] record[
  lock_id                 : nat;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : chain_id_t;
  asset                   : standard_asset_t;
  signature               : signature;
]

const tezos_chain_id : chain_id_t = 0x4e6574586451707263566b70615755;