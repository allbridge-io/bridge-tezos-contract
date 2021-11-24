[@view] function get_keccak(
  const params          : get_keccak_t;
  const _s              : storage_t)
                        : bytes is
  block {
    const kessak_bytes : bytes = Crypto.keccak(Bytes.pack(params));

  } with kessak_bytes