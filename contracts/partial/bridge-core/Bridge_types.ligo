type chain_id_t         is nat;
type asset_id_t         is nat;
type native_address_t   is bytes;

type asset_t            is [@layout:comb] record[
  asset_type              : asset_standard_t;
  locked_amount           : nat;
  enabled                 : bool;
]

type asset_map_t        is big_map(asset_id_t, asset_t)
type asset_map_ids_t    is big_map(asset_t, asset_id_t)

type managers_set_t     is set(address);

type wrapped_token_t    is [@layout:comb] record[
  chain_id                : chain_id_t;
  native_token_address    : native_address_t;
]
type wrapped_token_map_t is big_map(token_id_t, wrapped_token_t)
type wrapped_token_ids_map_t is big_map(wrapped_token_t, token_id_t)

type validator_set_t    is set(address);

type balance_map_t      is map(token_id_t, nat);

type account_t          is [@layout:comb] record [
    balances              : balance_map_t;
    permits               : set(address);
  ]

type ledger_t           is big_map(address, account_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
  validator               : address;
  validators              : validator_set_t;
  fee_oracle              : address;
  fee_collector           : address;
  bridge_managers         : managers_set_t;
  stop_managers           : managers_set_t;
  asset_count             : nat;
  bridge_assets           : asset_map_t;
  bridge_asset_ids        : asset_map_ids_t;
  wrapped_token_count     : nat;
  wrapped_token_infos     : wrapped_token_map_t;
  wrapped_token_ids       : wrapped_token_ids_map_t;
  ledger                  : ledger_t;
  enabled                 : bool;
]

type return_t           is list (operation) * storage_t

type update_address_t   is
| Add                     of address
| Remove                  of address

type change_address_t   is
| Change_owner            of address
| Change_validator        of address
| Change_fee_oracle       of address
| Change_fee_collector    of address

type update_manager_t   is [@layout:comb] record[
  add                     : bool;
  manager                 : address
]

type update_managers_t  is
| Update_bridge_manager   of update_manager_t
| Update_stop_manager     of update_manager_t

type new_asset_standard_t is
| Fa12_                     of address
| Fa2_                      of token_t
| Tez_
| Wrapped_                  of wrapped_token_t

type remove_asset__t      is asset_id_t

type new_asset_t        is new_asset_standard_t;

type lock_asset_t       is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : nat;
  asset                   : asset_standard_t;
  lock_amount             : nat;
  receiver                : bytes;
]

const no_operations : list(operation) = nil;