module Errors is {
  const not_owner             : string = "Bridge-staking/not-owner"
  const intersected_period    : string = "Bridge-staking/intersected-period"
  const wrong_period_time     : string = "Bridge-staking/wrong-period-time"
  const zero_period_reward    : string = "Bridge-staking/zero-period-reward"
  const overdue_period        : string = "Bridge-staking/overdue-period"
  const wrong_time            : string = "Bridge-staking/wrong-reward-time"

  const zero_transfer         : string = "Bridge-staking/zero-transfer"
  const zero_deposit          : string = "Bridge-staking/zero-deposit"
  const zero_withdraw         : string = "Bridge-staking/zero-withdraw"
  const insufficient_balance  : string = "Bridge-staking/insufficient-balance"
  const not_nat               : string = "Bridge-staking/not-nat"

  (* Fa2 errors *)
  const fa2_not_operator       : string = "FA2_NOT_OPERATOR"
  const fa2_low_balance        : string = "FA2_INSUFFICIENT_BALANCE"
  const fa2_not_owner          : string = "FA2_NOT_OWNER"
  const transfer_not_found     : string = "Bridge-core/not-transfer-contract"
}