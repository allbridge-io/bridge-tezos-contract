function change_owner(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.owner := new_address;
  } with s

function change_bridge_manager(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.bridge_manager := new_address
  } with s

function change_stop_manager(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.stop_manager := new_address;
  } with s

function change_validator(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.validator := new_address;
  } with s

function change_fee_oracle(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.fee_oracle := new_address;
  } with s

function change_fee_collector(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.fee_collector := new_address;
  } with s

function add_claimer(
  const address_        : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.approved_claimers := Set.add(address_, s.approved_claimers)
  } with s

function remove_claimer(
  const address_        : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.approved_claimers := Set.remove(address_, s.approved_claimers)
  } with s

(* Stop bridge protocol entrypoint *)
function stop_bridge(
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.stop_manager, Errors.not_manager);
    s.enabled := False;
  } with s

(* Start bridge protocol entrypoint *)
function start_bridge(
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.stop_manager, Errors.not_manager);
    s.enabled := True;
  } with s

(* Stop bridge asset entrypoint *)
function stop_asset(
  const asset_id        : asset_id_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);

    var asset := unwrap(s.bridge_assets[asset_id], Errors.asset_not_exist);
    asset.enabled := False;
    s.bridge_assets[asset_id] := asset;
  } with s

(* Start bridge asset entrypoint *)
function start_asset(
  const asset_id        : asset_id_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);

    var asset := unwrap(s.bridge_assets[asset_id], Errors.asset_not_exist);
    asset.enabled := True;
    s.bridge_assets[asset_id] := asset;
  } with s

(* Add new asset entrypoint *)
function add_asset(
  const params           : new_asset_t;
  var s                  : storage_t)
                         : storage_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);
    (* Check bridge status *)
    assert_with_error(s.enabled, Errors.bridge_disabled);

    var new_asset := record[
      asset_type = params.asset_type;
      locked_amount = 0n;
      enabled = True;
    ];
    case params.asset_type of
    | Wrapped(info) -> {
      (* Check if the asset exists *)
      assert_none(s.wrapped_token_ids[info], Errors.wrapped_exist);

      s.wrapped_token_infos[s.wrapped_token_count] := info;
      s.wrapped_token_ids[info] := s.wrapped_token_count;
      const metadata_params = unwrap(params.metadata, Errors.not_metadata);
      const token_info = map[
        "symbol" -> metadata_params.symbol;
        "name" -> metadata_params.name;
        "decimals" -> metadata_params.decimals;
        "icon" -> metadata_params.icon
      ];
      s.token_metadata[s.wrapped_token_count] := record[
        token_id = s.wrapped_token_count;
        token_info = token_info];
      s.wrapped_token_count := s.wrapped_token_count + 1n;
    }
    | _ -> skip
    end;

    (* Сheck that such an asset has not been added already *)
    assert_none(s.bridge_asset_ids[params.asset_type], Errors.bridge_exist);

    s.bridge_assets[s.asset_count] := new_asset;
    s.bridge_asset_ids[params.asset_type] := s.asset_count;
    s.asset_count := s.asset_count + 1n;

  } with s
