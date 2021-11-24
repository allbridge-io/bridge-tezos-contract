(* Permission erros *)
const err_not_owner : string              = "Bridge-core/not-owner"
const err_not_manager : string            = "Bridge-core/not-manager"
(* Asset/token erros*)
const err_bridge_disabled : string        = "Bridge-core/bridge-disabled"
const err_asset_disabled : string         = "Bridge-core/asset-disabled"
const err_asset_not_exist : string        = "Bridge-core/asset-doesn't-exist"
const err_wrapped_exist : string          = "Bridge-core/wrapped-asset-exist"
const err_bridge_exist : string           = "Bridge-core/bridge-exist"
const err_token_not_supported : string    = "Bridge-core/token-isn't-supported"
const err_non_transferable_asset : string = "Bridge-core/non-transferable-asset"
(* Account errors *)
const err_account_not_exist : string      = "Bridge-core/account-doesn't-exist"
const err_insufficient_balance : string   = "Bridge-core/insufficient-balance"
const err_zero_balance : string           = "Bridge-core/zero-balance"
(* Get contract entrypoint errors *)
const err_transfer_not_found : string     = "Bridge-core/not-transfer-contract"
const err_oracle_not_found : string       = "Bridge-core/oracle-fee-404"
const err_not_validator_lock : string     = "Bridge-core/not-validator-lock"
const err_not_validator_unlock : string   = "Bridge-core/not-validator-unlock"
(* Fa2 errors *)
const err_fa2_not_operator : string       = "FA2_NOT_OPERATOR"
const err_fa2_low_balance : string        = "FA2_INSUFFICIENT_BALANCE"
const err_fa2_not_owner : string          = "FA2_NOT_OWNER"