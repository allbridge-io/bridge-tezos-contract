[@inline] function check_lock_id(
  const lock_id         : bytes)
                        : unit is
  block {
    require(Bytes.length(lock_id) = 16n, Errors.wrong_lock_id_length);
    require(Bytes.sub(0n, 1n, lock_id) = Constants.lock_version, Errors.wrong_lock_version);
  } with unit