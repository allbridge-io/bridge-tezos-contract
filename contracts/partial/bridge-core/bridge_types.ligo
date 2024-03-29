type transfer_destination_t is [@layout:comb] record [
    to_                       : address;
    token_id                  : token_id_t;
    amount                    : nat;
  ]

type fa2_transfer_param_t is [@layout:comb] record [
    from_                   : address;
    txs                     : list(transfer_destination_t);
  ]

type fa2_transfer_t     is list(fa2_transfer_param_t)

type fa12_transfer_t    is michelson_pair(address, "from", michelson_pair(address, "to", nat, "value"), "")

type asset_id_t         is nat;

type asset_t            is [@layout:comb] record[
  asset_type              : asset_standard_t;
  precision               : nat;
  enabled                 : bool;
]

type source_token_t     is [@layout:comb] record[
  chain_id                : bytes;
  native_address          : bytes;
]

type asset_map_t        is big_map(asset_id_t, asset_t)
type asset_map_ids_t    is big_map(source_token_t, asset_id_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
  pending_owner           : option(address);
  bridge_manager          : address;
  stop_manager            : address;
  validator               : address;
  approved_claimer        : address;
  fee_oracle              : address;
  fee_collector           : address;
  asset_count             : nat;
  bridge_assets           : asset_map_t;
  bridge_asset_ids        : asset_map_ids_t;
  enabled                 : bool;
  metadata                : big_map(string, bytes);
]

type return_t           is list (operation) * storage_t

type new_asset_t        is [@layout:comb] record[
  asset_type              : asset_standard_t;
  precision               : nat;
  token_source            : source_token_t;
]

type lock_asset_t       is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : lock_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  amount                  : nat;
  recipient               : bytes;
]

type remove_asset_t     is [@layout:comb] record[
  asset_id                : asset_id_t;
  amount                  : nat;
  recipient               : address;
  token_source            : source_token_t;
]

type unlock_asset_t     is [@layout:comb] record[
  lock_id                 : lock_id_t;
  chain_from_id           : chain_id_t;
  token_source            : bytes;
  token_source_address    : bytes;
  amount                  : nat;
  recipient               : address;
  signature               : signature;
]

type response_fee_t     is nat;
