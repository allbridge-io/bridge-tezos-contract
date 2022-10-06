[@inline] function check_lock_id(
  const lock_id         : bytes)
                        : unit is
  block {
    require(Bytes.length(lock_id) = 16n, Errors.wrong_lock_id_length);
    require(Bytes.sub(0n, 1n, lock_id) = Constants.lock_version, Errors.wrong_lock_version);
  } with unit

function get_keccak_params(
  const params          : validate_unlock_t)
                        : bytes is
  Crypto.keccak(Bytes.pack(
    (record[
      lock_id       = params.lock_id;
      recipient     = params.recipient;
      amount        = params.amount;
      chain_from_id = params.chain_from_id;
      token_source  = params.token_source;
      token_source_address = params.token_source_address;
      blockchain_id = Constants.tezos_chain_id;
      operation_type = "unlock";
    ] : get_keccak_t)
  ));