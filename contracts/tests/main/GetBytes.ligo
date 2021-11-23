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

type storage_t          is [@layout:comb] record[
  kessak_bytes            : bytes;
  some_field              : nat;
]

type standard_asset_t   is
| Fa12_                     of address
| Fa2_                      of token_t
| Tez_
| Wrapped_                  of wrapped_token_t

type get_bytes_t        is [@layout:comb] record[
  lock_id                 : nat;
  recipient               : address;
  amount                  : nat;
  chain_from_id           : bytes;
  asset                   : standard_asset_t;
]

type parameter_t        is
| Default                 of unit
| Get_bytes               of get_bytes_t

type return_t is list (operation) * storage_t
const no_operations : list(operation) = nil

function get_bytes (
  const params          : get_bytes_t;
  var s                 : storage_t)
                        : storage_t is
  block {
    const asset = Wrapped_(record[chain_id=0x3536; native_token_address=0x62736341646472657373]);
    // const kessak_bytes : bytes = Crypto.keccak(Bytes.pack(
    //   record[
    //     lock_id       = params.lock_id;
    //     recipient     = params.recipient;
    //     amount        = params.amount;
    //     chain_from_id = params.chain_from_id;
    //     asset         = params.asset;
    //   ]
    // ));
    const kessak_bytes : bytes = Crypto.keccak(Bytes.pack(
      record[
        lock_id       = 3n;
        recipient     = ("tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb": address);
        amount        = 10000n;
        chain_from_id = 0x3536;
        asset         = asset;
      ]
    ));
    s.kessak_bytes := kessak_bytes
  } with s

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
  | Get_bytes (params) -> (no_operations, get_bytes(params, s))
  end
