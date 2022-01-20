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
    check_permission(s.bridge_manager, Errors.not_manager);
    s.fee_oracle := new_address;
  } with s

function change_fee_collector(
  const new_address     : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);
    s.fee_collector := new_address;
  } with s

function change_claimer(
  const address_        : address;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.owner, Errors.not_owner);
    s.approved_claimer := address_;
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
    check_permission(s.owner, Errors.not_owner);
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
    require(s.enabled, Errors.bridge_disabled);

    var new_asset := record[
      asset_type = params.asset_type;
      decimals = params.decimals;
      total_locked = 0n;
      enabled = True;
    ];

    (* Сheck that such an asset has not been added already *)
    require_none(s.bridge_asset_ids[params.asset_type], Errors.bridge_exist);

    s.bridge_assets[s.asset_count] := new_asset;
    s.bridge_asset_ids[params.asset_type] := s.asset_count;
    s.asset_count := s.asset_count + 1n;

  } with s

function remove_asset(
  const params           : remove_asset_t;
  var s                  : storage_t)
                         : return_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);

    const asset = unwrap(s.bridge_assets[params.asset_id], Errors.asset_not_exist);
    remove asset.asset_type from map s.bridge_asset_ids;
    remove params.asset_id from map s.bridge_assets;

    const operations = case asset.asset_type of
    | Wrapped(_) -> (nil: list(operation))
    | _ -> list[wrap_transfer(
        Tezos.self_address,
        params.recipient,
        asset.total_locked,
        asset.asset_type)
      ]
    end;
  } with (operations, s)

function add_pow(
  const params          : new_pow_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    check_permission(s.bridge_manager, Errors.not_manager);
    s.pows[params.pow] := params.value;
  } with s