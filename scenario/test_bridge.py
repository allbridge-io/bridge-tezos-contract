import copy
import json

from unittest import TestCase

from helpers import *
from pprint import pprint

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError

SOLANA_CHAIN_ID = "7263566b706157554e657458645170"

token_a_address = "KT18amZmM5W7qDWVt2pH6uj7sCEd3kbzLrHT"
token_b_address = "KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA"
token_c_address = "KT1XXAavg3tTj12W1ADvd3EEnm1pu6XTmiEF"
token_a = {"fA12": token_a_address}
token_b = {"fA12" : token_b_address}
token_c = {"fA12" : token_c_address}

oracle = "KT1LzyPS8rN375tC31WPAVHaQ4HyBvTSLwBu"
price_feed = "KT1Qf46j2x37sAN4t2MKRQRVt9gc4FZ5duMs"

fee_collector = "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"
dummy_sig = "sigY3oZknG7z2N9bj5aWVtdZBakTviKnwbSYTecbbT2gwQDrnLRNhP5KDcLroggq71AjXWkx27nSLfS8rodS4DYn14FyueS5"

vr = {
    f"{oracle}%calculate_fee": int(0.01 * FEE_PRECISION)
}

wrapped_asset_a = {
    "wrapped": {
        "chain_id": SOLANA_CHAIN_ID,
        "native_token_address": "0xdeadbeef"
    }
}

dummy_metadata = {
  "symbol" : "0x01",
  "name" : "0x02",
  "decimals" : "0x03",
  "icon" : "0x04",
}

class BridgeTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = json.load(open("./builds/bridge_core.json"))
        cls.ct = ContractInterface.from_micheline(code["michelson"])

        storage = cls.ct.storage.dummy()
        storage["owner"] = admin
        storage["bridge_manager"] = admin
        storage["validator"] = admin
        storage["fee_collector"] = fee_collector
        storage["enabled"] = True
        storage["fee_oracle"] = oracle
        cls.storage = storage

    def test_lock_unlock(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_asset({"fa12": token_a_address}, None), sender=admin)

        res = chain.execute(self.ct.lock_asset(SOLANA_CHAIN_ID, 0, 0, 101_000, SOLANA_CHAIN_ID), view_results=vr)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 2)
        self.assertEqual(trxs[0]["amount"], 1000)
        self.assertEqual(trxs[0]["destination"], fee_collector)
        self.assertEqual(trxs[0]["source"], me)

        self.assertEqual(trxs[1]["amount"], 100_000)
        self.assertEqual(trxs[1]["destination"], contract_self_address)
        self.assertEqual(trxs[1]["source"], me)

        res = chain.execute(self.ct.unlock_asset(SOLANA_CHAIN_ID, 0, 0, 100_000, me, dummy_sig))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100_000)
        self.assertEqual(trxs[0]["destination"], me)
        self.assertEqual(trxs[0]["source"], contract_self_address)

    def test_claimers_fee(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_asset({"fa12": token_a_address}, None), sender=admin)
        chain.execute(self.ct.add_claimer(carol), sender=admin)

        res = chain.execute(self.ct.lock_asset(SOLANA_CHAIN_ID, 0, 0, 101_000, SOLANA_CHAIN_ID), view_results=vr)
        
        res = chain.execute(self.ct.unlock_asset(SOLANA_CHAIN_ID, 0, 0, 100_000, me, dummy_sig), view_results=vr, sender=carol)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 2)
        self.assertEqual(trxs[0]["amount"], 1000)
        self.assertEqual(trxs[0]["source"], contract_self_address)
        self.assertEqual(trxs[0]["destination"], fee_collector)

        self.assertEqual(trxs[1]["amount"], 99_000)
        self.assertEqual(trxs[1]["source"], contract_self_address)
        self.assertEqual(trxs[1]["destination"], me)
        
    def test_transfer_wrapped(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_asset(wrapped_asset_a, dummy_metadata), sender=admin)

