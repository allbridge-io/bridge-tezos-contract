FEE_PRECISION = pow(10, 5)
PRECISION = 1_000_000
SOLANA_CHAIN_ID = "7263566b706157554e657458645170"
SOLANA_RECEIVER = "1234567890"

DUMMY_LOCK_0="00aa"

token_a_address = "KT18amZmM5W7qDWVt2pH6uj7sCEd3kbzLrHT"
token_b_address = "KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA"
token_c_address = "KT1XXAavg3tTj12W1ADvd3EEnm1pu6XTmiEF"
fa12_token_a = ("fa12", token_a_address)

oracle = "KT1LzyPS8rN375tC31WPAVHaQ4HyBvTSLwBu"
bridge = "KT1LzyPS8rN375tC31WPAVHaQ4HyBvTSLwBu"
price_feed = "KT1Qf46j2x37sAN4t2MKRQRVt9gc4FZ5duMs"

fee_collector = "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"
dummy_sig = "sigY3oZknG7z2N9bj5aWVtdZBakTviKnwbSYTecbbT2gwQDrnLRNhP5KDcLroggq71AjXWkx27nSLfS8rodS4DYn14FyueS5"

wrapped_token_address = "KT1LTqpmGJ11EebMVWAzJ7DWd9msgExvHM94"

wrapped_asset_a = {
    "wrapped": {
        "address": wrapped_token_address,
        "id": 0,
    }
}

dummy_metadata = {
    "symbol": "0x01",
    "name": "0x02",
    "decimals": "0x03",
    "icon": "0x04",
}

token_source = {
    "chain_id" : "0x01",
    "native_address" : "0x02",
}

vr = {
    f"{oracle}%calculate_fee": int(0.01 * FEE_PRECISION),
    f"{oracle}%min_fee": int(0.01 * FEE_PRECISION)
}

