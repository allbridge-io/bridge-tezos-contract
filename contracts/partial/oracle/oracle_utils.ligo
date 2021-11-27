(* Helper function to get fee per token *)
function get_fee_per_token(
  const token           : asset_standard_t;
  const token_fee_map   : token_fee_map_t)
                        : nat is
  case token_fee_map[token] of
  | Some(fee) -> fee
  | None -> failwith(Errors.token_not_exist)
  end