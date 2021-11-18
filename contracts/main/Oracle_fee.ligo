#include "../partial/Common_types.ligo"
#include "../partial/oracle/Oracle_types.ligo"
#include "../partial/Common_utils.ligo"
#include "../partial/oracle/Oracle_utils.ligo"
#include "../partial/oracle/Oracle_admin_methods.ligo"
#include "../partial/oracle/Oracle_methods.ligo"

type parameter_t        is
  | Change_owner          of address
  | Change_fee            of change_fee_t


function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  (* Admin methods *)
  | Change_owner (params) -> (no_operations, change_owner(params, s))
  | Change_fee (params) -> (no_operations, change_fee(params, s))
  end