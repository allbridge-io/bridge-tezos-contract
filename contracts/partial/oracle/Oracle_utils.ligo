(* Helper function to get fee per token *)
function get_fee_per_token(
  const token           : asset_standard_t;
  const token_fee_map   : token_fee_map_t)
                        : nat is
  case token_fee_map[token] of
  | Some(fee) -> fee
  | None -> failwith("Oracle-fee/wrong-token")
  end

(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  case (Tezos.sender =/= owner) of
  | True -> failwith("Oracle-fee/not-owner")
  | False -> unit
  end;