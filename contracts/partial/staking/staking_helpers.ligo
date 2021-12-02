function update_reward(
  var s                 : storage_t)
                        : storage_t is
  block {
    for element in set s.periods
    block {
      if Tezos.now > element.start_period
      then {
        const time = if element.start_period > s.last_update_time
        then Tezos.now - element.start_period
        else Tezos.now - s.last_update_time;

        const reward_f = abs(element.abr_per_sec_f * time);
        s.total_underlying_f := s.total_underlying_f + reward_f;
        s.exchange_rate_f := s.total_underlying_f / s.total_supply;

        if Tezos.now >= element.end_period
        then {
          s.periods := Set.remove(element, s.periods)
        } else skip;
      } else skip;
    }
  } with s