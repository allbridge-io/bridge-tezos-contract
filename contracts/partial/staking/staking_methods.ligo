function deposit(
  const amount_         : nat;
  var s                 : storage_t)
                        : return_t is
  block {
    require(amount_ > 0n, Errors.zero_deposit);
    const updated_reward = update_reward(s);
    var operations := updated_reward.0;
    s := updated_reward.1;

    const new_shares = if s.total_supply = 0n
    then amount_
    else amount_ * Constants.precision * s.total_supply / s.total_underlying_f;

    s := s with record[
      total_supply = s.total_supply + new_shares;
      total_underlying_f =  amount_ * Constants.precision + s.total_underlying_f;
      last_update_time = Tezos.now;
    ];

    const account_balance = unwrap_or(s.ledger[Tezos.sender], 0n);
    s.ledger[Tezos.sender] := account_balance + new_shares;

    operations :=
      transfer_fa2(
        Tezos.sender,
        Tezos.self_address,
        amount_,
        s.deposit_token.id,
        s.deposit_token.address
      ) # operations;

  } with (operations, s)

function withdraw(
  const shares          : nat;
  var s                 : storage_t)
                        : return_t is
  block {
    require(shares > 0n, Errors.zero_withdraw);

    const updated_reward = update_reward(s);
    var operations := updated_reward.0;
    s := updated_reward.1;

    const account_balance = unwrap_or(s.ledger[Tezos.sender], 0n);
    require(account_balance >= shares, Errors.insufficient_balance);

    const out = shares * s.total_underlying_f / (s.total_supply * Constants.precision);
    s := s with record[
      total_underlying_f = get_nat_or_fail(s.total_underlying_f - (out * Constants.precision), Errors.not_nat);
      total_supply = get_nat_or_fail(s.total_supply - shares, Errors.not_nat);
      last_update_time = Tezos.now;
    ];
    s.ledger[Tezos.sender] := get_nat_or_fail(account_balance - shares, Errors.not_nat);

    operations := transfer_fa2(
      Tezos.self_address,
      Tezos.sender,
      out,
      s.deposit_token.id,
      s.deposit_token.address
    ) # operations;
  } with (operations, s)