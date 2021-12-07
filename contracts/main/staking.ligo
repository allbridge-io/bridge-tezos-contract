#include "../partial/common_types.ligo"
#include "../partial/common_constants.ligo"
#include "../partial/staking/staking_errors.ligo"
#include "../partial/common_helpers.ligo"
#include "../partial/fa2_types.ligo"
#include "../partial/fa2_helpers.ligo"
#include "../partial/staking/staking_types.ligo"
#include "../partial/staking/staking_helpers.ligo"
#include "../partial/staking/staking_admin_methods.ligo"
#include "../partial/staking/staking_methods.ligo"
#include "../partial/staking/staking_fa2_methods.ligo"
#include "../partial/staking/staking_views.ligo"

type parameter_t        is
  | Change_owner          of address
  | Change_deposit_token  of token_t
  | Add_reward            of new_period_t
  | Deposit               of nat
  | Withdraw              of nat
  | Transfer              of transfer_params_t
  | Update_operators      of update_operator_params_t
  | Balance_of            of balance_params_t


function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  | Change_owner(params)         -> (Constants.no_operations, change_owner(params, s))
  | Change_deposit_token(params) -> (Constants.no_operations, change_deposit_token(params, s))
  | Add_reward(params)           -> add_reward(params, s)
  | Deposit(params)              -> deposit(params, s)
  | Withdraw(params)             -> withdraw(params, s)

  (* Fa2 methods *)
  | Transfer(params)          -> transfer(s, params)
  | Update_operators(params)  -> (Constants.no_operations, update_operators(s, params))
  | Balance_of(params)        -> (get_balance_of(s, params), s)

  end