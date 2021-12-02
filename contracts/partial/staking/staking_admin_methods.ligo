function change_owner(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.owner := new_address;
  } with s

function add_reward(
  const params          : new_period_t;
  var s                 : storage_t)
                        : return_t is
  block {
    check_permission(s.owner, Errors.not_owner);

    for element in set s.periods
    block {
      if params.start_period < element.end_period
      then failwith(Errors.intersected_period)
      else skip;

      if params.end_period <= params.start_period
      then failwith(Errors.wrong_period_time)
      else skip;

      if params.amount < 0n
      then failwith(Errors.zero_period_reward)
      else skip;
    };
    const period_time = params.end_period - params.start_period;
    const reward_per_sec_f = abs(params.amount * Constants.precision / period_time);

    const new_period = record[
      abr_per_sec_f = reward_per_sec_f;
      start_period = params.start_period;
      end_period = params.end_period
    ];
    s.periods := Set.add(new_period, s.periods);
  } with ((nil: list(operation)), s)
