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
  locked_amount           : nat;
  enabled                 : bool;
]

type asset_map_t        is big_map(asset_id_t, asset_t)
type asset_map_ids_t    is big_map(asset_standard_t, asset_id_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
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
  token_metadata          : big_map(token_id_t, token_metadata_t)
]

type return_t           is list (operation) * storage_t

type token_metadata_params_t is [@layout:comb] record[
  symbol                       : bytes;
  name                         : bytes;
  decimals                     : bytes;
  icon                         : bytes;
]

type new_asset_t        is asset_standard_t

type lock_asset_t       is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : nat;
  asset_id                : asset_id_t;
  amount                  : nat;
  recipient               : bytes;
]

type unlock_asset_t     is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : nat;
  asset_id                : asset_id_t;
  amount                  : nat;
  recipient               : address;
  signature               : signature;
]

type response_fee_t     is nat;
