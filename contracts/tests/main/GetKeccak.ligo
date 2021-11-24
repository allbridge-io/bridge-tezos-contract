type token_id_t         is nat;
type native_address_t   is bytes;
type chain_id_t         is bytes;

type token_t            is [@layout:comb] record[
  address                 : address;
  id                      : token_id_t;
]
type wrapped_token_t    is [@layout:comb] record[
  chain_id                : chain_id_t;
  native_token_address    : native_address_t;
]

type storage_t          is bytes;


type asset_standard_t   is
| Fa12_                     of address
| Fa2_                      of token_t
| Tez_
| Wrapped_                  of wrapped_token_t

type get_keccak_t        is [@layout:comb] record[
  lock_id                 : nat;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : bytes;
  asset                   : asset_standard_t;
]

type parameter_t        is
| Default                 of unit
| Get_keccak              of get_keccak_t

type return_t is list (operation) * storage_t
const no_operations : list(operation) = nil

function get_keccak (
  const params          : get_keccak_t;
  var _s                : storage_t)
                        : storage_t is
  block {
    const kessak_bytes : bytes = Crypto.keccak(Bytes.pack(params));
  } with kessak_bytes

function default(
  const _s              : storage_t)
                        : storage_t is
  _s

function main(
  const action          : parameter_t;
  const s               : storage_t)
                        : return_t is
  case action of
  | Default            -> (no_operations, default(s))
  | Get_keccak (params) -> (no_operations, get_keccak(params, s))
  end