function change_owner(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.owner := new_address;
  } with s

function change_bridge(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.bridge := new_address;
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
