[@view] function calculate_fee(
  const params          : calculate_fee_t;
  const s               : storage_t)
                        : response_fee_t is
  block {
    const fee_per_token = unwrap(s.fee_per_tokens[params.token], Errors.token_not_exist);
    const abr_balance = get_abr_balance(params.account, s.staking_address);
    const abr_supply = get_abr_supply(s.staking_address);
    const user_shares_bp = abr_balance * s.fee_multiper * Constants.bp / abr_supply;
    const basic_fee = params.amount * Constants.bp / (user_shares_bp + Constants.bp * Constants.bp / s.base_fee);
    const fee = if fee_per_token > basic_fee
      then fee_per_token
      else basic_fee;

  } with fee