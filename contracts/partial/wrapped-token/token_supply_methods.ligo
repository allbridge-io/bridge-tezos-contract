(* Perform minting new tokens *)
function mint (
  const s               : storage_t;
  const params          : mint_params_t)
                        : storage_t is
  block {
    (* Ensure sender has the minter permissions *)
    require(s.minters contains Tezos.sender, Errors.not_minter);

    function make_mint(
      var s             : storage_t;
      const param       : mint_param_t)
                        : storage_t is
      block {
        require(param.token_id < s.token_count, Errors.fa2_token_undefined);

        const destination_key = (param.recipient, param.token_id);
        const destination_balance = unwrap_or(s.ledger[destination_key], 0n);

        (* Mint new tokens *)
        s.ledger[destination_key] := destination_balance + param.amount;

        const token_supply = unwrap_or(s.tokens_supply[param.token_id], 0n);

        (* Update token total supply *)
        s.tokens_supply[param.token_id] := token_supply + param.amount;
      } with s
  } with (List.fold(make_mint, params, s))

function create_token(
  var s                 : storage_t;
  const new_token       : new_token_t)
                        : storage_t is
  block {
    require(Tezos.sender = s.owner, Errors.not_owner);

    s.token_metadata[s.token_count] := record [
      token_id = s.token_count;
      token_info = new_token.metadata;
    ];
    s.token_ids[new_token.token] := s.token_count;
    s.token_infos[s.token_count] := new_token.token;
    s.token_count := s.token_count + 1n;
  } with s

function burn(
  const params          : burn_params_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    require(s.minters contains Tezos.sender, Errors.not_minter);
    require(Tezos.source = params.account, Errors.not_account_owner);

    const token_supply = unwrap(s.tokens_supply[params.token_id], Errors.token_undefined);
    s.tokens_supply[params.token_id] := get_nat_or_fail(token_supply - params.amount, Errors.not_nat);

    const ledger_key = (params.account, params.token_id);
    const account_balance = unwrap_or(s.ledger[ledger_key], 0n);

    s.ledger[ledger_key] := get_nat_or_fail(account_balance - params.amount, Errors.not_nat);
  } with s