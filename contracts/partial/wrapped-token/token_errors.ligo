module Errors is {
  const not_owner             : string = "NOT_ADMIN";
  const not_account_owner     : string = "Wrapped-token/not-account-owner";
  const not_minter            : string = "NOT_MINTER";
  const not_nat               : string = "Wrapped-token/not-nat";
  const token_undefined       : string = "Wrapped-token/token-undefined";

  (* Fa2 errors *)
  const fa2_not_operator      : string = "FA2_NOT_OPERATOR";
  const fa2_low_balance       : string = "FA2_INSUFFICIENT_BALANCE";
  const fa2_not_owner         : string = "FA2_NOT_OWNER";
  const fa2_token_undefined   : string = "FA2_TOKEN_UNDEFINED";
}