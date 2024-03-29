function change_owner(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner)
  } with s with record[pending_owner = Some(new_address)]

function confirm_owner(
  var s                 : storage_t)
                        : storage_t is
  block {
    const pending = unwrap(s.pending_owner, Errors.not_pending_owner);
    require(Tezos.sender = pending, Errors.not_pending_owner);
    s.owner := pending;
    s.pending_owner := (None : option(address));
  } with s
