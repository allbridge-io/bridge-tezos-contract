[@view] function validate_siqnature(
  const params          : validate_unlock_t;
  const s               : storage_t)
                        : bool is
  block {
     const keccak_params : bytes = Crypto.keccak(Bytes.pack(
      (record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        token_source  = params.token_source;
        token_source_address = params.token_source_address;
        blockchain_id = Constants.tezos_chain_id;
        type_operation = "unlock";
      ] : get_keccak_t)
    ));

  } with Crypto.check(s.validator_pk, params.signature, keccak_params)