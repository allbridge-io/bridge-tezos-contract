[@inline] function update_reward(
  var s                 : storage_t;
  var operations        : list(operation))
                        : return_t is
  block {
    var burnt_reward := 0n;
    if s.period.start_period <= Tezos.now and s.period.end_period > s.last_update_time
    then {
      const interval_start = if s.last_update_time > s.period.start_period
        then s.last_update_time
        else s.period.start_period;

      const interval_end = if Tezos.now > s.period.end_period
        then s.period.end_period
        else Tezos.now;

      s.last_update_time := interval_end;

      const time = interval_end - interval_start;

      const reward_f = get_nat_or_fail(s.period.abr_per_sec_f * time, Errors.wrong_time);

      if s.total_supply = 0n
      then {
        burnt_reward := burnt_reward + reward_f / Constants.precision;
      } else {
        s.total_underlying_f := s.total_underlying_f + reward_f;
      };
    } else skip;

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