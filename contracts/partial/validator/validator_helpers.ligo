[@inline] function check_lock_id(
  const lock_id         : bytes)
                        : unit is
  block {
    const unpacked_lock_id = unwrap((Bytes.unpack(lock_id) : option(nat)), Errors.wrong_lock_id);
    require(unpacked_lock_id / Constants.lock_id_base = Constants.lock_version, Errors.wrong_lock_version);
  } with unit