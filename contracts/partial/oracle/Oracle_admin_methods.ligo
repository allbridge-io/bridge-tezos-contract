(* Change owner entrypoint *)
function change_owner(
  const new_owner       : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Permission check *)
    is_owner(s.owner);

    s.owner := new_owner;
  } with s

(* Change fees entrypoint *)
function change_fee(
  const fee_param       : change_fee_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Permission check *)
    is_owner(s.owner);

    case fee_param of
    | Change_token_fee (params) -> s.fee_per_tokens[params.token] := params.new_fee
    | Change_base_fee (new_fee) -> s.base_fee := new_fee
    | Change_fee_multiper (new_fee) -> s.base_fee := new_fee
    end
  } with s