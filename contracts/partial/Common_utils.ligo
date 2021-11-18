(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  case (Tezos.sender =/= owner) of
  | True -> failwith("Bridge-core/not-owner")
  | False -> unit
  end;
