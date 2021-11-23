type lock_id_t          is nat

type lock_map_t         is big_map(lock_id_t, validate_lock_t)
type unlock_map_t       is big_map(lock_id_t, validate_unlock_t)

type storage_t          is [@layout:comb] record[
  owner                   : address;
  bridge                  : address;
  validator_pk            : key;
  validated_locks         : lock_map_t;
  validated_unlocks       : unlock_map_t;
]

type change_address_t   is
| Change_owner            of address
| Change_bridge           of address

type return_t           is list (operation) * storage_t

const no_operations : list(operation) = nil;