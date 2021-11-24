#include "../partial/Common_types.ligo"
#include "../partial/bridge-core/Bridge_types.ligo"
#include "../partial/bridge-core/Bridge_fa2_types.ligo"
#include "../partial/bridge-core/Bridge_errors.ligo"
#include "../partial/bridge-core/Bridge_utils.ligo"
#include "../partial/bridge-core/Bridge_admin_methods.ligo"
#include "../partial/bridge-core/Bridge_exchange_methods.ligo"
#include "../partial/bridge-core/Bridge_fa2_methods.ligo"
#include "../partial/bridge-core/Bridge_views.ligo"

type parameter_t        is
  | Change_address        of change_address_t
  | Update_validators     of update_validators_t
  | Stop_bridge           of unit
  | Stop_asset            of asset_id_t
  | Add_asset             of new_asset_t
  | Lock_asset            of lock_asset_t
  | Unlock_asset          of unlock_asset_t
  | Transfer              of transfer_params_t
  | Update_operators      of update_operator_params_t
  | Balance_of            of balance_params_t

function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  (* Admin methods *)
  | Change_address (params)    -> (no_operations, change_address(params, s))
  | Update_validators (params) -> (no_operations, update_validators(params, s))
  | Stop_bridge           -> (no_operations, stop_bridge(s))
  | Stop_asset (params)   -> (no_operations, stop_asset(params, s))
  | Add_asset (params)    -> (no_operations, add_asset(params, s))

  | Lock_asset (params)   -> lock_asset(params, s)
  | Unlock_asset (params) -> unlock_asset(params, s)

  (* Fa2 methods *)
  | Transfer (params)          -> transfer(s, params)
  | Update_operators (params)  -> (no_operations, update_operators(s, params))
  | Balance_of (params)        -> (get_balance_of(s, params), s)
  end