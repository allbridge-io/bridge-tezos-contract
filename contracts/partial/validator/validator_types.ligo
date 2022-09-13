type lock_map_t         is big_map(lock_id_t, validate_lock_t)
type unlock_map_t       is big_map(unlock_key_t, validate_unlock_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
  pending_owner           : option(address);
  bridge                  : address;
  validator_pk            : key;
  validated_locks         : lock_map_t;
  validated_unlocks       : unlock_map_t;
]

type return_t           is list (operation) * storage_t
