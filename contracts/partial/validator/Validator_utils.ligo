(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  case (Tezos.sender =/= owner) of
  | True -> failwith(err_not_owner)
  | False -> unit
  end;

(* Helper function to check lock *)
function is_validated_lock(
  const lock_id         : lock_id_t;
  const lock_map        : lock_map_t)
                        : unit is
  case lock_map[lock_id] of
  | Some(_) -> failwith(err_lock_exist)
  | None -> unit
  end

(* Helper function to check unlock *)
function is_validated_unlock(
  const lock_id         : lock_id_t;
  const lock_map        : unlock_map_t)
                        : unit is
  case lock_map[lock_id] of
  | Some(_) -> failwith(err_unlock_exist)
  | None -> unit
  end

(* helper function to check sender is bridge-core contract *)
function is_bridge(
  const bridge          : address)
                        : unit is
  case Tezos.sender = bridge of
  | True -> unit
  | False -> failwith(err_not_bridge)
  end