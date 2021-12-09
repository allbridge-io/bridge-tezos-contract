[@inline] function update_reward(
  var s                 : storage_t)
                        : return_t is
  block {
    var burnt_reward := 0n;
    for element in set s.periods
    block {
      if Tezos.now > element.start_period
      then {
        const time = if element.start_period > s.last_update_time
        then if Tezos.now >= element.end_period
          then element.end_period - element.start_period
          else Tezos.now - element.start_period
        else Tezos.now - s.last_update_time;

        const reward_f = abs(element.abr_per_sec_f * time);

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

    const operations = if burnt_reward > 0n
      then list[
        transfer_fa2(
          Tezos.self_address,
          Constants.zero_address,
          burnt_reward,
          s.deposit_token.id,
          s.deposit_token.address
      )]
      else (nil: list(operation));
  } with (operations, s)