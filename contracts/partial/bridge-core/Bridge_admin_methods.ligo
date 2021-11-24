(* Change service addresses entrypoint *)
function change_address(
  const changed_address : change_address_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Permission check *)
    is_owner(s.owner);

    case changed_address of
    | Change_owner (address_) -> s.owner := address_
    | Change_bridge_manager (address_) -> s.bridge_manager := address_
    | Change_stop_manager (address_) -> s.stop_manager := address_
    | Change_validator (address_) -> s.validator := address_
    | Change_fee_oracle (address_) -> s.fee_oracle := address_
    | Change_fee_collector (address_) -> s.fee_collector := address_
    end;
  } with s

(* Update validators set entrypoint *)
function update_validators(
  const param           : update_validators_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Permission check *)
    is_owner(s.owner);

    case param of
    | Add_validator(address_) -> s.validators := Set.add(address_, s.validators)
    | Remove_validator(address_) -> s.validators := Set.remove(address_, s.validators)
    end;
  } with s

(* Stop bridge protocol entrypoint *)
function stop_bridge(
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Checking user is stop manager *)
    is_manager(s.stop_manager);

    case s.enabled of
    | True -> s.enabled := False
    | False -> s.enabled := True
    end;
  } with s

(* Stop bridge asset entrypoint *)
function stop_asset(
  const asset_id        : asset_id_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    (* Checking user is bridge manager *)
    is_manager(s.bridge_manager);

    var asset := unwrap(s.bridge_assets[asset_id], "Asset doesn't exist");

    case asset.enabled of
    | True -> asset.enabled := False
    | False -> asset.enabled := True
    end;

    s.bridge_assets[asset_id] := asset;
  } with s

(* Add new asset entrypoint *)
function add_asset(
  const asset_type       : new_asset_t;
  var s                  : storage_t)
                         : storage_t is
  block {
    (* Checking user is bridge manager *)
    is_manager(s.bridge_manager);
    (* Check bridge status *)
    assert_with_error(s.enabled, "Bridge-core/bridge-disabled");

    var new_asset := record[
      asset_type = asset_type;
      locked_amount = 0n;
      enabled = True;
    ];
    case asset_type of
    | Wrapped (info) -> {
      assert_none(s.wrapped_token_ids[info], "Wrapped asset exist");
      s.wrapped_token_infos[s.wrapped_token_count] := info;
      s.wrapped_token_ids[info] := s.wrapped_token_count;
      s.wrapped_token_count := s.wrapped_token_count + 1n;
    }
    | _ -> skip
    end;

    (* Сheck that such an asset has not been added already *)
    assert_none(s.bridge_asset_ids[new_asset], "Bridge exist");

    s.bridge_assets[s.asset_count] := new_asset;
    s.bridge_asset_ids[new_asset] := s.asset_count;
    s.asset_count := s.asset_count + 1n;

  } with s
