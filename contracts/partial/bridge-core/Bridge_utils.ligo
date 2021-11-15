(* Helper to check permissions *)
function is_owner (
  const owner           : address)
                        : unit is
  block {
    if Tezos.sender =/= owner
    then failwith("Bridge-core/not-owner")
    else skip;
} with unit

(* Helper to check permissions *)
function is_manager (
  const managers        : managers_set_t)
                        : unit is
  case managers contains Tezos.sender of
  | True -> failwith("Bridge-core/not-manager")
  | False -> unit
  end;

(* Helper function for get bridge asset *)
function get_asset(
  const asset_id         : asset_id_t;
  const asset_map        : asset_map_t)
                         : asset_t is
  case asset_map[asset_id] of
  | Some(asset) -> asset
  | None -> failwith("Bridge-core/wrong-asset-id")
  end;

(* Helper function for to check uniqueness *)
function is_uniq(
  const asset           : asset_t;
  const asset_map       : asset_map_ids_t)
                        : unit is
  case asset_map[asset] of
  | Some(_) -> failwith("Bridge-core/asset-already-exists")
  | None -> unit
  end;

(* Helper function for get wrapped token *)
function get_wrapped_token(
  const token_id         : token_id_t;
  const wraped_map       : wrapped_token_map_t)
                         : wrapped_token_t is
  case wraped_map[token_id] of
  | Some(token) -> token
  | None -> failwith("Bridge-core/wrong-token-id")
  end;