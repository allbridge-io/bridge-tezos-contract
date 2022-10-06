[@view] function validate_signature(
  const params          : validate_unlock_t;
  const s               : storage_t)
                        : bool is
  block {
    const keccak_params : bytes = get_keccak_params(params);

  } with Crypto.check(s.validator_pk, params.signature, keccak_params)