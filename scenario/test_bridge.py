import copy
import json

from unittest import TestCase

from helpers import *
from constants import *
from pprint import pprint

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError

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
        chain.execute(self.ct.add_asset({"fa12": token_a_address}, 6), sender=admin)

        res = chain.execute(self.ct.lock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 101_000, SOLANA_RECEIVER), view_results=vr)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 2)
        self.assertEqual(trxs[0]["amount"], 1000)
        self.assertEqual(trxs[0]["destination"], fee_collector)
        self.assertEqual(trxs[0]["source"], me)

        self.assertEqual(trxs[1]["amount"], 100_000)
        self.assertEqual(trxs[1]["destination"], contract_self_address)
        self.assertEqual(trxs[1]["source"], me)

        res = chain.execute(self.ct.unlock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 100_000, me, dummy_sig))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100_000)
        self.assertEqual(trxs[0]["destination"], me)
        self.assertEqual(trxs[0]["source"], contract_self_address)

    def test_wrapped_unlock_lock(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_asset(wrapped_asset_a, 6), sender=admin)

        res = chain.execute(self.ct.unlock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 100_000, me, dummy_sig))
        mints = parse_mints(res)
        self.assertEqual(len(mints), 2)
        self.assertEqual(mints[0]["amount"], 100_000)
        self.assertEqual(mints[0]["destination"], me)
        self.assertEqual(mints[0]["token_address"], wrapped_token_address)

        res = chain.execute(self.ct.lock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 100_000, SOLANA_RECEIVER), view_results=vr)
        mints = parse_mints(res)
        self.assertEqual(len(mints), 1)
        self.assertEqual(mints[0]["amount"], 1000)
        self.assertEqual(mints[0]["destination"], fee_collector)
        self.assertEqual(mints[0]["token_address"], wrapped_token_address)

        burns = parse_burns(res)
        self.assertEqual(len(burns), 1)
        self.assertEqual(burns[0]["amount"], 100_000)
        self.assertEqual(burns[0]["destination"], me)
        self.assertEqual(burns[0]["token_address"], wrapped_token_address)

    def test_claimers_fee(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_asset({"fa12": token_a_address}, 6), sender=admin)
        chain.execute(self.ct.change_claimer(carol), sender=admin)

        res = chain.execute(self.ct.lock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 101_000, SOLANA_RECEIVER), view_results=vr)

        res = chain.execute(self.ct.unlock_asset(
            SOLANA_CHAIN_ID, DUMMY_LOCK_0, 0, 100_000, me, dummy_sig), view_results=vr, sender=carol)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 2)
        self.assertEqual(trxs[0]["amount"], 1000)
        self.assertEqual(trxs[0]["source"], contract_self_address)
        self.assertEqual(trxs[0]["destination"], fee_collector)

        self.assertEqual(trxs[1]["amount"], 99_000)
        self.assertEqual(trxs[1]["source"], contract_self_address)
        self.assertEqual(trxs[1]["destination"], me)