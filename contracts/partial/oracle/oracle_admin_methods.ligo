(* Change owner entrypoint *)
function change_owner(
  const new_owner       : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.owner := new_owner;
  } with s

function change_staking(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.staking_address := new_address;
  } with s

function change_token_fee(
  const token           : asset_standard_t;
  const new_fee         : nat;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.fee_per_tokens[token] := new_fee
  } with s

function change_base_fee(
  const new_fee_f       : nat;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.base_fee_f := new_fee_f
  } with s

function change_fee_multiper(
  const new_fee_f       : nat;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.fee_multiper_f := new_fee_f
  } with s