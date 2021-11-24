(* Change addresses entrypoint *)
function change_address(
  const param           : change_address_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    case param of
    | Change_owner(address_) -> s.owner := address_
    | Change_bridge(address_) -> s.bridge := address_
    end;
  } with s

(* Change validator public key entrypoint *)
function change_validator_pk(
  const new_key         : key;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.validator_pk := new_key;
  } with s
