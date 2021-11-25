(* Validate lock entrypoint *)
function validate_lock(
  const params          : validate_lock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    check_permission(s.bridge, err_not_bridge);

    assert_with_error(params.destination_chain_id =/= tezos_chain_id, err_wrong_chain_id);

    (* Check if the lock has been not validated earlier *)
    assert_none(s.validated_locks[params.lock_id], err_lock_exist);

    s.validated_locks[params.lock_id] := params;
  } with s

(* Validate unlock entrypoint *)
function validate_unlock(
  const params          : validate_unlock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    check_permission(s.bridge, err_not_bridge);

    (* Check if the unlock has been not validated earlier *)
    assert_none(s.validated_unlocks[params.lock_id], err_unlock_exist);

    const kessak_params : bytes = Crypto.keccak(Bytes.pack(
      (record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        asset         = params.asset;
      ] : get_keccak_t)
    ));

    assert_with_error(
      Crypto.check(s.validator_pk, params.signature, kessak_params),
      err_invalid_signature
    );

    s.validated_unlocks[params.lock_id] := params;

  } with s