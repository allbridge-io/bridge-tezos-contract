function change_bridge(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
  } with s with record[bridge = new_address]

(* Change validator public key entrypoint *)
function change_validator_pk(
  const new_key         : key;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
  } with s with record[validator_pk = new_key]
