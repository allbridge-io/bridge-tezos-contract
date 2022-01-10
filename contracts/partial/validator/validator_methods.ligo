(* Validate lock entrypoint *)
function validate_lock(
  const params          : validate_lock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    check_permission(s.bridge, Errors.not_bridge);

    const unpacked_lock_id = unwrap((Bytes.unpack(params.lock_id) : option(int)), Errors.wrong_lock_id);
    require(unpacked_lock_id / Constants.foo = Constants.lock_version, Errors.wrong_lock_version);

    assert_with_error(
      params.destination_chain_id =/= Constants.tezos_chain_id,
      Errors.wrong_chain_id
    );

    (* Check if the lock has been not validated earlier *)
    require_none(s.validated_locks[params.lock_id], Errors.lock_exist);

    s.validated_locks[params.lock_id] := params;
  } with s

(* Validate unlock entrypoint *)
function validate_unlock(
  const params          : validate_unlock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    check_permission(s.bridge, Errors.not_bridge);
    const unpacked_lock_id = unwrap((Bytes.unpack(params.lock_id) : option(int)), Errors.wrong_lock_id);
    require(unpacked_lock_id / Constants.foo = Constants.lock_version, Errors.wrong_lock_version);

    (* Check if the unlock has been not validated earlier *)
    require_none(s.validated_unlocks[params.lock_id], Errors.unlock_exist);

    const keccak_params : bytes = Crypto.keccak(Bytes.pack(
      (record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        asset         = params.asset;
      ] : get_keccak_t)
    ));

    assert_with_error(
      Crypto.check(s.validator_pk, params.signature, keccak_params),
      Errors.invalid_signature
    );

    s.validated_unlocks[params.lock_id] := params;

  } with s