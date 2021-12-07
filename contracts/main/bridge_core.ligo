#include "../partial/common_types.ligo"
#include "../partial/common_constants.ligo"
#include "../partial/bridge-core/bridge_types.ligo"
#include "../partial/bridge-core/bridge_errors.ligo"
#include "../partial/common_helpers.ligo"
#include "../partial/fa2_types.ligo"
#include "../partial/fa2_helpers.ligo"
#include "../partial/bridge-core/bridge_helpers.ligo"
#include "../partial/bridge-core/bridge_admin_methods.ligo"
#include "../partial/bridge-core/bridge_exchange_methods.ligo"
#include "../partial/bridge-core/bridge_fa2_methods.ligo"

type parameter_t        is
  | Change_owner          of address
  | Change_bridge_manager of address
  | Change_stop_manager   of address
  | Change_validator      of address
  | Change_fee_oracle     of address
  | Change_fee_collector  of address
  | Add_claimer           of address
  | Remove_claimer        of address
  | Stop_bridge           of unit
  | Start_bridge          of unit
  | Stop_asset            of asset_id_t
  | Start_asset           of asset_id_t
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
  | Change_owner(params)          -> (Constants.no_operations, change_owner(params, s))
  | Change_bridge_manager(params) -> (Constants.no_operations, change_bridge_manager(params, s))
  | Change_stop_manager(params)   -> (Constants.no_operations, change_stop_manager(params, s))
  | Change_validator(params)      -> (Constants.no_operations, change_validator(params, s))
  | Change_fee_oracle(params)     -> (Constants.no_operations, change_fee_oracle(params, s))
  | Change_fee_collector(params)  -> (Constants.no_operations, change_fee_collector(params, s))
  | Add_claimer(params)    -> (Constants.no_operations, add_claimer(params, s))
  | Remove_claimer(params) -> (Constants.no_operations, remove_claimer(params, s))
  | Stop_bridge            -> (Constants.no_operations, stop_bridge(s))
  | Start_bridge           -> (Constants.no_operations, start_bridge(s))
  | Stop_asset(params)     -> (Constants.no_operations, stop_asset(params, s))
  | Start_asset(params)    -> (Constants.no_operations, start_asset(params, s))
  | Add_asset(params)      -> (Constants.no_operations, add_asset(params, s))

  (* Common methods *)
  | Lock_asset(params)     -> lock_asset(params, s)
  | Unlock_asset(params)   -> unlock_asset(params, s)

  (* Fa2 methods *)
  | Transfer(params)          -> transfer(s, params)
  | Update_operators(params)  -> (Constants.no_operations, update_operators(s, params))
  | Balance_of(params)        -> (get_balance_of(s, params), s)
  end