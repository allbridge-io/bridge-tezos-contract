[@inline] function update_reward(
  var s                 : storage_t;
  var operations        : list(operation))
                        : return_t is
  block {
    var burnt_reward := 0n;
    for element in set s.periods
    block {
      if Tezos.now > element.start_period
      then {
        const interval_start = if s.last_update_time > element.start_period
          then s.last_update_time
          else element.start_period;

        const interval_end = if Tezos.now > element.end_period
          then element.end_period
          else Tezos.now;

        s.last_update_time := interval_end;

        const time = interval_end - interval_start;

        const reward_f = get_nat_or_fail(element.abr_per_sec_f * time, Errors.wrong_time);

        if s.total_supply = 0n
        then {
          burnt_reward := burnt_reward + reward_f / Constants.precision;
        } else {
          s.total_underlying_f := s.total_underlying_f + reward_f;
        };

        if Tezos.now >= element.end_period
        then {
          s.periods := Set.remove(element, s.periods)
        } else skip;
      } else skip;
    };

    if burnt_reward > 0n
    then operations := transfer_fa2(
          Tezos.self_address,
          Constants.zero_address,
          burnt_reward,
          s.deposit_token.id,
          s.deposit_token.address
      ) # operations
    else skip;
  } with (operations, s)