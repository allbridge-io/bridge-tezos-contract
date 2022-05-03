(* Validate lock entrypoint *)
function validate_lock(
  const params          : validate_lock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    check_permission(s.bridge, Errors.not_bridge);
    check_lock_id(params.lock_id);

    (* Check chain id length and value *)
    require(
      params.destination_chain_id =/= Constants.tezos_chain_id
        and Bytes.length(params.destination_chain_id) = 4n,
      Errors.wrong_chain_id
    );

    (* Check recipient length *)
    require(Bytes.length(params.recipient) = 32n, Errors.wrong_recipient);

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
    check_lock_id(params.lock_id);

    (* Check if the unlock has been not validated earlier *)
    require_none(s.validated_unlocks[params.lock_id], Errors.unlock_exist);

    const keccak_params : bytes = Crypto.keccak(Bytes.pack(
      (record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        token_source  = params.token_source;
        token_source_address = params.token_source_address;
        type_operation = "unlock";
      ] : get_keccak_t)
    ));

    require(
      Crypto.check(s.validator_pk, params.signature, keccak_params),
      Errors.invalid_signature
    );

    s.validated_unlocks[params.lock_id] := params;

  } with s