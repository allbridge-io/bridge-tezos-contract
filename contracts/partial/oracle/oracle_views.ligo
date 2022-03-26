[@view] function calculate_fee(
  const params          : calculate_fee_t;
  const s               : storage_t)
                        : response_fee_t is
  block {
    const fee_per_token = unwrap(s.fee_per_tokens[params.token], Errors.token_not_exist);
    const fee = if params.amount = 0n
        or s.base_fee_f = 0n
      then fee_per_token
      else block {
        const basic_fee = params.amount * s.base_fee_f / Constants.fee_accuracy;
      } with if fee_per_token > basic_fee
        then fee_per_token
        else basic_fee;

  } with fee