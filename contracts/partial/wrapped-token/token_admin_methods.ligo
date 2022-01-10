function change_owner(
  var s                 : storage_t;
  const new_owner       : address)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);
    s.owner := new_owner;
  } with s

function update_minter(
  var s                 : storage_t;
  const param           : update_minter_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);
    s.minters := Set.update(param.minter, param.allowed, s.minters);
  } with s
