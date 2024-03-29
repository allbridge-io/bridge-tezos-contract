#include "../partial/FA2/IqToken.ligo"
#include "../partial/FA2/Permit.ligo"
#include "../partial/FA2/FA2Methods.ligo"
#include "../partial/FA2/RoleMethods.ligo"
#include "../partial/FA2/SupplyMethods.ligo"

function main(
  const action          : action_type;
  const s               : storage_type)
                        : return is
  case action of [
  | Create_token(params)      -> (no_operations, create_token(s, params))
  | Mint(params)              -> (no_operations, mint(s, params))
  | Mint_token(params)        -> (no_operations, mint_token(s, params))
  | Update_minter(params)     -> (no_operations, update_minter(s, params))
  | Update_admin(params)      -> (no_operations, update_admin(s, params))
  | Transfer(params)          -> (no_operations, transfer(s, params, action))
  | Update_operators(params)  -> (no_operations, update_operators(s, params, action))
  | Balance_of(params)        -> (get_balance_of(params, s), s)
  | Permit(params)            -> add_permit(params, s)
  | Set_expiry(params)        -> set_expiry(params, s, action)
  | Get_total_supply(params)  -> get_total_supply(params.0, params.1, s)
  ]
