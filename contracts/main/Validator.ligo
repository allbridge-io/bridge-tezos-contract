#include "../partial/Common_types.ligo"
#include "../partial/validator/Validator_types.ligo"
#include "../partial/validator/Validator_errors.ligo"
#include "../partial/Common_utils.ligo"
#include "../partial/validator/Validator_admin_methods.ligo"
#include "../partial/validator/Validator_methods.ligo"

type parameter_t        is
  | Change_owner          of address
  | Change_bridge         of address
  | Change_validator_pk   of key
  | Validate_lock         of validate_lock_t
  | Validate_unlock       of validate_unlock_t

function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  | Change_owner (params) -> (no_operations, change_owner(params, s))
  | Change_bridge (params) -> (no_operations, change_bridge(params, s))
  | Change_validator_pk (params) -> (no_operations, change_validator_pk(params, s))
  | Validate_lock (params) -> (no_operations, validate_lock(params, s))
  | Validate_unlock (params) -> (no_operations, validate_unlock(params, s))
  end