(* Validate lock entrypoint *)
function validate_lock(
  const params          : validate_lock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    is_bridge(s.bridge);

    if params.destination_chain_id = tezos_chain_id
    then failwith(err_wrong_chain_id)
    else skip;

    is_validated_lock(params.lock_id, s.validated_locks);

    s.validated_locks[params.lock_id] := params;
  } with s

(* Validate unlock entrypoint *)
function validate_unlock(
  const params          : validate_unlock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Check sender is bridge-core conract *)
    is_bridge(s.bridge);

    (* Сheck if such an unlock was created earlier *)
    is_validated_unlock(params.lock_id, s.validated_unlocks);

    const kessak_params : bytes = Crypto.keccak(Bytes.pack(
      (record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        asset         = params.asset;
      ] : get_keccak_t)
    ));

    case Crypto.check(s.validator_pk, params.signature, kessak_params) of
    | False -> failwith(err_invalid_signature)
    | True -> skip
    end;

    s.validated_unlocks[params.lock_id] := params;

  } with s