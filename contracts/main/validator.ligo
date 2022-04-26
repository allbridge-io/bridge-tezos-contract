#include "../partial/common_types.ligo"
#include "../partial/common_constants.ligo"
#include "../partial/validator/validator_types.ligo"
#include "../partial/validator/validator_errors.ligo"
#include "../partial/common_helpers.ligo"
#include "../partial/validator/validator_helpers.ligo"
#include "../partial/validator/validator_admin_methods.ligo"
#include "../partial/validator/validator_methods.ligo"
#include "../partial/validator/validator_views.ligo"

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
  case action of [
  | Change_owner(params)        -> (Constants.no_operations, change_owner(params, s))
  | Change_bridge(params)       -> (Constants.no_operations, change_bridge(params, s))
  | Change_validator_pk(params) -> (Constants.no_operations, change_validator_pk(params, s))
  | Validate_lock(params)       -> (Constants.no_operations, validate_lock(params, s))
  | Validate_unlock(params)     -> (Constants.no_operations, validate_unlock(params, s))
  ]