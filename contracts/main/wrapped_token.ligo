#include "../partial/wrapped-token/token_errors.ligo"
#include "../partial/fa2_types.ligo"
#include "../partial/common_helpers.ligo"
#include "../partial/common_types.ligo"
#include "../partial/wrapped-token/token_types.ligo"
#include "../partial/common_constants.ligo"
#include "../partial/wrapped-token/token_errors.ligo"
#include "../partial/wrapped-token/token_admin_methods.ligo"
#include "../partial/wrapped-token/token_supply_methods.ligo"
#include "../partial/wrapped-token/token_fa2_methods.ligo"
#include "../partial/wrapped-token/token_views.ligo"

type action_t           is
| Change_owner            of address
| Change_bridge           of address
| Create_token            of new_token_t
| Mint                    of mint_params_t
| Burn                    of burn_params_t
| Transfer                of transfer_params_t
| Update_operators        of update_operator_params_t
| Balance_of              of balance_params_t

function main(
  const action          : action_t;
  const s               : storage_t)
                        : return_t is
  case action of [
  | Change_owner(params)      -> (Constants.no_operations, change_owner(params, s))
  | Change_bridge(params)     -> (Constants.no_operations, change_bridge(params, s))
  | Create_token(params)      -> (Constants.no_operations, create_token(params, s))
  | Mint(params)              -> (Constants.no_operations, mint(params, s))
  | Burn(params)              -> (Constants.no_operations, burn(params, s))

  | Transfer(params)          -> (Constants.no_operations, transfer(s, params))
  | Update_operators(params)  -> (Constants.no_operations, update_operators(s, params))
  | Balance_of(params)        -> (get_balance_of(s, params), s)
  ]
