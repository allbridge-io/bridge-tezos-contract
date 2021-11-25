[@view] function calculate_fee(
  const params          : calculate_fee_t;
  const s               : storage_t)
                        : response_fee_t is
  block {
    // const fee_per_token = get_fee_per_token(params.token, s.fee_per_tokens);
    const fee_per_token = 1000n;
    const _user_shares_bp = params.abr_balance * s.fee_multiper * bp / 1n;

  } with fee_per_token