(* Helper to check permissions *)
function check_permission(
  const address_        : address;
  const error           : string)
                        : unit is
  assert_with_error(Tezos.sender = address_, error)

function assert_none(
  const param           : option(_a);
  const error           : string)
                        : unit is
  case param of
  | Some(_) -> failwith(error)
  | None -> unit
  end;

function unwrap_or(
  const param           : option(_a);
  const default         : _a)
                        : _a is
  case param of
  | Some(instance) -> instance
  | None -> default
  end;

function unwrap(
  const param           : option(_a);
  const error           : string)
                        : _a is
  case param of
  | Some(instance) -> instance
  | None -> failwith(error)
  end;

function get_nat_or_fail(
  const value           : int;
  const error           : string)
                        : nat is
  case is_nat(value) of
  | Some(natural) -> natural
  | None -> (failwith(error): nat)
  end;