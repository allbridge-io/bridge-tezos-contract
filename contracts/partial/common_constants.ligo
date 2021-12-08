module Constants is {
  const default_token_id  : token_id_t = 0n;
  const no_operations     : list(operation) = nil;
  const empty_permits     : set(address) = set[];
  const tezos_chain_id    : chain_id_t = 0x4e6574586451707263566b70615755;
  const fee_accuracy      : nat = 10000n;
  const precision         : nat = 1_000_000n;
  const zero_address      : address = ("tz1ZZZZZZZZZZZZZZZZZZZZZZZZZZZZNkiRg" : address);
}