module Errors is {
  const not_owner : string         = "Validator-bridge/not-owner"
  const lock_exist : string        = "Validator-bridge/lock-already-exists"
  const unlock_exist : string      = "Validator-bridge/unlock-already-exists"
  const not_bridge : string        = "Validator-bridge/not-bridge"
  const invalid_signature : string = "Validator-bridge/signature-not-validated"
  const wrong_chain_id : string    = "Validator-bridge/wrong-destination-chain-id"
}