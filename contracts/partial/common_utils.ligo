(* Helper to check permissions *)
function check_permission(
  const address_        : address;
  const error           : string)
                        : unit is
  case Tezos.sender = address_ of
  | True -> unit
  | False -> failwith(error)
  end

function assert_none(
  const param           : option(_a);
  const error           : string)
                        : unit is
  case param of
  | Some(_) -> failwith(error)
  | None -> unit
  end;