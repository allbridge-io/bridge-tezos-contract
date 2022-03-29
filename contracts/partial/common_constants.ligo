module Constants is {
  const default_token_id  : token_id_t = 0n;
  const no_operations     : list(operation) = nil;
  const empty_allowances  : set(address) = set[];
  const tezos_chain_id    : chain_id_t = 0x4e6574586451707263566b70615755;
  const fee_accuracy      : nat = 10000n;
  const system_precision  : nat = 9n;
  const zero_address      : address = ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
  const lock_version      : bytes = 0x01;
}