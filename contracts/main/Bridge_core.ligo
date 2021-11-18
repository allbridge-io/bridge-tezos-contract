#include "../partial/Common_types.ligo"
#include "../partial/bridge-core/Bridge_types.ligo"
#include "../partial/bridge-core/Bridge_fa2_types.ligo"
#include "../partial/bridge-core/Bridge_utils.ligo"
#include "../partial/bridge-core/Bridge_admin_methods.ligo"
#include "../partial/bridge-core/Bridge_exchange_methods.ligo"

type parameter_t        is
  | Change_address        of change_address_t
  | Update_manager        of update_managers_t
  | Stop_bridge           of unit
  | Stop_asset            of asset_id_t
  | Add_asset             of new_asset_t
  | Lock_asset            of lock_asset_t
  | Unlock_asset          of unlock_asset_t

function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  (* Admin methods *)
  | Change_address (params) -> (no_operations, change_address(params, s))
  | Update_manager (params) -> (no_operations, update_manager(params, s))
  | Stop_bridge             -> (no_operations, stop_bridge(s))
  | Stop_asset (params)     -> (no_operations, stop_asset(params, s))
  | Add_asset (params)      -> (no_operations, add_asset(params, s))
  | Lock_asset (params)     -> lock_asset(params, s)
  | Unlock_asset (params)   -> unlock_asset(params, s)
  end