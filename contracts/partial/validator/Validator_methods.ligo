(* Validate lock entrypoint *)
function validate_lock(
  const params          : validate_lock_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    is_trust_sender(s.trust_sender);

    if params.destination_chain_id = tezos_chain_id
    then failwith("Validator-bridge/wrong-destination-chain-id")
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
    is_trust_sender(s.trust_sender);
    is_validated_unlock(params.lock_id, s.validated_unlocks);

    const kessak_params : bytes = Crypto.keccak(Bytes.pack(
      record[
        lock_id       = params.lock_id;
        recipient     = params.recipient;
        amount        = params.amount;
        chain_from_id = params.chain_from_id;
        asset         = params.asset;
      ]
    ));

    case Crypto.check(s.validator_pk, params.signature, kessak_params) of
    | False -> failwith("Validator-bridge/signature-not-validated")
    | True -> skip
    end;

    s.validated_unlocks[params.lock_id] := params;

  } with s