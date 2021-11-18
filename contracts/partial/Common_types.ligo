type token_id_t         is nat;

type token_t            is [@layout:comb] record[
  address                 : address;
  id                      : token_id_t;
]

type wrapped_t          is nat

type asset_standard_t   is
| Fa12                    of address
| Fa2                     of token_t
| Tez
| Wrapped                 of wrapped_t

type transfer_destination_t is [@layout:comb] record [
    to_                   : address;
    token_id              : token_id_t;
    amount                : nat;
  ]

type fa2_transfer_param_t is [@layout:comb] record [
    from_                   : address;
    txs                     : list(transfer_destination_t);
  ]

type fa2_transfer_t     is list(fa2_transfer_param_t)

type fa12_transfer_t    is michelson_pair(address, "from", michelson_pair(address, "to", nat, "value"), "")

type calculate_fee_t    is [@layout:comb] record[
  amount                  : nat;
  token                   : asset_standard_t;
  abr_balance             : nat;
  abr_total_supply        : nat;
]

type response_fee_t     is nat;