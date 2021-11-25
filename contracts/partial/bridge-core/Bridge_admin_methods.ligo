function change_owner(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.owner := new_address;
  } with s

function change_bridge_manager(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.bridge_manager := new_address
  } with s

function change_stop_manager(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.stop_manager := new_address;
  } with s

function change_validator(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.validator := new_address;
  } with s

function change_fee_oracle(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.fee_oracle := new_address;
  } with s

function change_fee_collector(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.fee_collector := new_address;
  } with s

function add_signer(
  const address_        : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.signers := Set.add(address_, s.signers)
  } with s

function remove_signer(
  const address_        : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, err_not_owner);
    s.signers := Set.remove(address_, s.signers)
  } with s

(* Stop bridge protocol entrypoint *)
function stop_bridge(
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.stop_manager, err_not_manager);
    s.enabled := False;
  } with s

(* Start bridge protocol entrypoint *)
function start_bridge(
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.stop_manager, err_not_manager);
    s.enabled := True;
  } with s

(* Stop bridge asset entrypoint *)
function stop_asset(
  const asset_id        : asset_id_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, err_not_manager);

    var asset := unwrap(s.bridge_assets[asset_id], err_asset_not_exist);
    asset.enabled := False;
    s.bridge_assets[asset_id] := asset;
  } with s

(* Start bridge asset entrypoint *)
function start_asset(
  const asset_id        : asset_id_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, err_not_manager);

    var asset := unwrap(s.bridge_assets[asset_id], err_asset_not_exist);
    asset.enabled := True;
    s.bridge_assets[asset_id] := asset;
  } with s

(* Add new asset entrypoint *)
function add_asset(
  const asset_type       : new_asset_t;
  var s                  : storage_t)
                         : storage_t is
  block {
    check_permission(s.bridge_manager, err_not_manager);
    (* Check bridge status *)
    assert_with_error(s.enabled, err_bridge_disabled);

    var new_asset := record[
      asset_type = asset_type;
      locked_amount = 0n;
      enabled = True;
    ];
    case asset_type of
    | Wrapped (info) -> {
      (* Check if the asset exists *)
      assert_none(s.wrapped_token_ids[info], err_wrapped_exist);

      s.wrapped_token_infos[s.wrapped_token_count] := info;
      s.wrapped_token_ids[info] := s.wrapped_token_count;
      s.wrapped_token_count := s.wrapped_token_count + 1n;
    }
    | _ -> skip
    end;

    (* Сheck that such an asset has not been added already *)
    assert_none(s.bridge_asset_ids[new_asset], err_bridge_exist);

    s.bridge_assets[s.asset_count] := new_asset;
    s.bridge_asset_ids[new_asset] := s.asset_count;
    s.asset_count := s.asset_count + 1n;

  } with s
