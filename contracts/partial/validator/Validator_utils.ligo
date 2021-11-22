(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  case (Tezos.sender =/= owner) of
  | True -> failwith("Validator-bridge/not-owner")
  | False -> unit
  end;

(* Helper function to check lock *)
function is_validated_lock(
  const lock_id         : lock_id_t;
  const lock_map        : lock_map_t)
                        : unit is
  case lock_map[lock_id] of
  | Some(_) -> failwith("Validator-bridge/lock-already-exists")
  | None -> unit
  end

(* Helper function to check unlock *)
function is_validated_unlock(
  const lock_id         : lock_id_t;
  const lock_map        : unlock_map_t)
                        : unit is
  case lock_map[lock_id] of
  | Some(_) -> failwith("Validator-bridge/unlock-already-exists")
  | None -> unit
  end

(* helper function to check sender is trust sender *)
function is_trust_sender(
  const trust_sender    : address)
                        : unit is
  case Tezos.sender = trust_sender of
  | True -> unit
  | False -> failwith("Validator-bridge/not-trust-sender")
  end