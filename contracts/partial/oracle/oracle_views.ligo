[@view] function calculate_fee(
  const params          : calculate_fee_t;
  const s               : storage_t)
                        : response_fee_t is
  block {
    const fee_per_token = unwrap(s.fee_per_tokens[params.token], Errors.token_not_exist);
    const xabr_balance = get_xabr_balance(params.account, s.staking_address);
    const xabr_supply = get_xabr_supply(s.staking_address);
    const fee = if xabr_supply = 0n
        or params.amount = 0n
        or s.base_fee_f = 0n
      then fee_per_token
      else block {
        const user_shares_fee_f = xabr_balance * s.fee_multiplier_f * Constants.fee_accuracy / xabr_supply;
        const basic_fee = params.amount * Constants.fee_accuracy / (user_shares_fee_f + Constants.fee_accuracy * Constants.fee_accuracy / s.base_fee_f);
      } with if fee_per_token > basic_fee
        then fee_per_token
        else basic_fee;

  } with fee