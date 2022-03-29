module Errors is {
  (* Permission erros *)
  const not_owner              : string = "Bridge-core/not-owner";
  const not_manager            : string = "Bridge-core/not-manager";
  (* Asset/token erros*)
  const bridge_disabled        : string = "Bridge-core/bridge-disabled";
  const asset_disabled         : string = "Bridge-core/asset-disabled"
  const asset_not_exist        : string = "Bridge-core/asset-doesn't-exist";
  const wrapped_exist          : string = "Bridge-core/wrapped-asset-exist";
  const bridge_exist           : string = "Bridge-core/bridge-exist";
  const token_not_supported    : string = "Bridge-core/token-isn't-supported";
  const non_transferable_asset : string = "Bridge-core/non-transferable-asset";
  (* Account errors *)
  const account_not_exist      : string = "Bridge-core/account-doesn't-exist";
  const insufficient_balance   : string = "Bridge-core/insufficient-balance";
  const zero_balance           : string = "Bridge-core/zero-balance";
  const not_metadata           : string = "Bridge-core/not-metadata";
  (* Get contract entrypoint errors *)
  const transfer_not_found     : string = "Bridge-core/not-transfer-contract";
  const oracle_not_found       : string = "Bridge-core/oracle-fee-404";
  const not_validator_lock     : string = "Bridge-core/not-validator-lock";
  const not_validator_unlock   : string = "Bridge-core/not-validator-unlock";
  const mint_etp_404           : string = "Bridge-core/mint-etp-404";
  const burn_etp_404           : string = "Bridge-core/burn-etp-404";
  (* Fa2 errors *)
  const fa2_not_operator       : string = "FA2_NOT_OPERATOR";
  const fa2_low_balance        : string = "FA2_INSUFFICIENT_BALANCE";
  const fa2_not_owner          : string = "FA2_NOT_OWNER";
  const fa2_token_undefined    : string = "FA2_TOKEN_UNDEFINED";
  (* Other *)
  const not_nat                : string = "Bridge-core/not-nat";
  const zero_transfer          : string = "Bridge-core/zero-transfer";
  const amounts_mismatch       : string = "Bridge-core/amounts-mismatch";
  const wrong_precision        : string = "Bridge-core/wrong-precision";
  }