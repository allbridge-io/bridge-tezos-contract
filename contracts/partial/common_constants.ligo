module Constants is {
  const no_operations     : list(operation) = nil;
  const empty_allowances  : set(address) = set[];
  const tezos_chain_id    : chain_id_t = 0x54455A00;
  const fee_accuracy      : nat = 10000n;
  const system_precision  : nat = 9n;
  const zero_address      : address = ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
  const lock_version      : bytes = 0x01;
}