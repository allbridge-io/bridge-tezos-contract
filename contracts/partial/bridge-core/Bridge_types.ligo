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
type asset_map_ids_t    is big_map(asset_t, asset_id_t)

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
  bridge_manager          : address;
  stop_manager            : address;
  validator               : address;
  validators              : validator_set_t;
  fee_oracle              : address;
  fee_collector           : address;
  asset_count             : nat;
  bridge_assets           : asset_map_t;
  bridge_asset_ids        : asset_map_ids_t;
  wrapped_token_count     : nat;
  wrapped_token_infos     : wrapped_token_map_t;
  wrapped_token_ids       : wrapped_token_ids_map_t;
  ledger                  : ledger_t;
  enabled                 : bool;
  metadata                : big_map(string, bytes);
]

type return_t           is list (operation) * storage_t

type new_asset_t        is asset_standard_t;

type lock_asset_t       is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : nat;
  asset_id                : asset_id_t;
  amount                  : nat;
  receiver                : bytes;
]

type unlock_asset_t     is [@layout:comb] record[
  chain_id                : chain_id_t;
  lock_id                 : nat;
  asset_id                : asset_id_t;
  amount                  : nat;
  receiver                : address;
  signature               : signature;
]

type calculate_fee_t    is [@layout:comb] record[
  amount                  : nat;
  token                   : asset_standard_t;
  abr_balance             : nat;
  abr_total_supply        : nat;
]

type response_fee_t     is nat;

const no_operations : list(operation) = nil;
const new_account = record [
  balances = (map[]: balance_map_t);
  permits = (set[]: set(address))
];