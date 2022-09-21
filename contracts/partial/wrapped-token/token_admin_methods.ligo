function change_owner(
  const new_owner       : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);
    s.owner := new_owner;
  } with s

function change_bridge(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);
    s.bridge := new_address;
  } with s

function toggle_pause(
  var s                 : storage_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);
    s.paused := not s.paused;
  } with s
