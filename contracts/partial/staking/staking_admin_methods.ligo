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
    require(params.start_period >= Tezos.now, Errors.earlier_period);

    require(params.amount > 0n, Errors.zero_period_reward);

    require(Tezos.now >= s.period.end_period, Errors.period_not_over);

    const period_time = params.end_period - params.start_period;
    const reward_per_sec_f = abs(params.amount * Constants.precision / period_time);

    const new_period = record[
      start_period = params.start_period;
      end_period = params.end_period;
      abr_per_sec_f = reward_per_sec_f
    ];

    s.period := new_period;

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
