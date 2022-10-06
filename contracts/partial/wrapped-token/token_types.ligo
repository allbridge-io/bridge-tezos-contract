type chain_id_t         is bytes

type ledger_key_t       is (address * nat)

type ledger_t           is big_map(ledger_key_t, nat)

type allowances_t       is big_map(ledger_key_t * address, unit)

type token_t            is [@layout:comb] record[
  chain_id                : chain_id_t;
  native_token_address    : bytes;
]

type token_map_t        is big_map(token_id_t, token_t)

type token_ids_map_t    is big_map(token_t, token_id_t)

type token_metadata_t   is [@layout:comb] record [
  token_id                : token_id_t;
  token_info              : map(string, bytes);
]

type storage_t          is [@layout:comb] record [
  owner                   : address;
  pending_owner           : option(address);
  bridge                  : address;
  ledger                  : ledger_t;
  allowances              : allowances_t;
  tokens_supply           : big_map(token_id_t, nat);
  token_count             : nat;
  token_infos             : token_map_t;
  token_ids               : token_ids_map_t;
  metadata                : big_map(string, bytes);
  token_metadata          : big_map(token_id_t, token_metadata_t);
  paused                  : bool;
]

type return_t           is list(operation) * storage_t

type new_token_t        is [@layout:comb] record [
  token                   : token_t;
  metadata                : map(string, bytes);
]
