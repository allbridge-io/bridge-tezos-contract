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

    require(params.end_period > params.start_period, Errors.wrong_period_time);
    require(params.start_period > s.last_update_time, Errors.overdue_period);
    require(params.amount > 0n, Errors.zero_period_reward);

    for element in set s.periods
    block {
      require(
        (params.start_period > element.end_period and params.start_period > element.start_period)
          or (params.start_period < element.end_period and params.end_period < element.start_period),
        Errors.intersected_period
      );
    };
    const period_time = params.end_period - params.start_period;
    const reward_per_sec_f = abs(params.amount * Constants.precision / period_time);

    const new_period = record[
      start_period = params.start_period;
      end_period = params.end_period;
      abr_per_sec_f = reward_per_sec_f
    ];
    s.periods := Set.add(new_period, s.periods);

    const operations = list[
      transfer_fa2(
        Tezos.sender,
        Tezos.self_address,
        params.amount,
        s.deposit_token.id,
        s.deposit_token.address
      )
    ];
  } with (operations, s)
