function deposit(
  const amount_         : nat;
  var s                 : storage_t)
                        : return_t is
  block {
    assert_with_error(amount_ > 0n, Errors.zero_deposit);

    const new_shares = if s.total_supply = 0n
    then amount_
    else block {
      s := update_reward(s);
      s.exchange_rate_f := s.total_underlying_f / s.total_supply;
    } with amount_ * Constants.precision / s.exchange_rate_f;

    s := s with record[
      total_supply = s.total_supply + new_shares;
      total_underlying_f =  amount_ * Constants.precision + s.total_underlying_f;
      last_update_time = Tezos.now;
    ];

    const account_balance = unwrap_or(s.ledger[Tezos.sender], 0n);
    s.ledger[Tezos.sender] := account_balance + new_shares;

    const operations = list[
      transfer_fa2(
        Tezos.sender,
        Tezos.self_address,
        amount_,
        Constants.default_token_id,
        s.deposit_token
      )
    ];

  } with (operations, s)

function withdraw(
  const shares          : nat;
  var s                 : storage_t)
                        : return_t is
  block {
    s := update_reward(s);
    s.exchange_rate_f := s.total_underlying_f / s.total_supply;

    const account_balance = unwrap_or(s.ledger[Tezos.sender], 0n);
    assert_with_error(account_balance >= shares, Errors.insufficient_balance);

    const out = shares * s.exchange_rate_f;
    s := s with record[
      total_underlying_f = get_nat_or_fail(s.total_underlying_f - out * Constants.precision, Errors.not_nat);
      total_supply = get_nat_or_fail(s.total_supply - shares, Errors.not_nat);
      last_update_time = Tezos.now;
    ];
    s.ledger[Tezos.sender] := get_nat_or_fail(account_balance - shares, Errors.not_nat);

    const operations = list[
      transfer_fa2(
        Tezos.self_address,
        Tezos.sender,
        out,
        Constants.default_token_id,
        s.deposit_token
      )
    ];
  } with (operations, s)