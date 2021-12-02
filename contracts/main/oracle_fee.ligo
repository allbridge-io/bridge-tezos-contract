#include "../partial/common_types.ligo"
#include "../partial/common_constants.ligo"
#include "../partial/oracle/oracle_errors.ligo"
#include "../partial/common_helpers.ligo"
#include "../partial/oracle/oracle_types.ligo"
#include "../partial/oracle/oracle_helpers.ligo"
#include "../partial/oracle/oracle_admin_methods.ligo"

type parameter_t        is
  | Change_owner          of address
  | Change_token_fee      of change_token_fee_t
  | Change_base_fee       of nat
  | Change_fee_multiper   of nat


function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  | Change_owner(params)        -> (Constants.no_operations, change_owner(params, s))
  | Change_token_fee(params)    -> (Constants.no_operations, change_token_fee(params.token, params.new_fee, s))
  | Change_base_fee(params)     -> (Constants.no_operations, change_base_fee(params, s))
  | Change_fee_multiper(params) -> (Constants.no_operations, change_fee_multiper(params, s))
  end