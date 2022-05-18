import json

from unittest import TestCase

from helpers import *
from constants import *

from pytezos import ContractInterface

staking = "KT1LzyPS8rN375tC31WPAVHaQ4HyBvTSLwBu"

class OracleFeeTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = json.load(open("./builds/oracle_fee.json"))
        cls.ct = ContractInterface.from_micheline(code["michelson"])

        storage = cls.ct.storage.dummy()
        storage["owner"] = admin
        storage["base_fee_f"] = 1000
        cls.storage = storage

    def test_calculate_fee(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.change_token_fee(wrapped_asset_a, 1000), sender=admin)

        fee = chain.view(self.ct.calculate_fee(
            amount=1000,
            token=wrapped_asset_a,
            account=alice), view_results=vr)
        self.assertEqual(fee, 1000)

        fee = chain.view(self.ct.calculate_fee(
            amount=10_000_000,
            token=wrapped_asset_a,
            account=alice), view_results=vr)
        self.assertEqual(fee, int(10_000_000 * 0.1))