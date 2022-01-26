from doctest import SKIP
import json
from unittest import TestCase, skip
from decimal import Decimal

from helpers import *
from constants import *
from pytezos import ContractInterface, MichelsonRuntimeError

foreign_token_a = {
    "chain_id" : "deafbeef",
    "native_token_address": "cafebabe"
}

class WrappedTransfers(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = json.load(open("./builds/wrapped_token.json"))
        cls.ct = ContractInterface.from_micheline(code["michelson"])

        storage = cls.ct.storage.dummy()
        storage["owner"] = admin
        storage["bridge"] = bridge
        cls.storage = storage

    def test_transfer_wrong_token_id(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.create_token(token=foreign_token_a, metadata={"":""}), sender=admin)
        chain.execute(self.ct.mint([dict(token_id=0, recipient=alice, amount=100_000)]), sender=bridge)

        with self.assertRaises(MichelsonRuntimeError):
            transfer = self.ct.transfer(
                [{"from_": alice,
                    "txs": [{
                        "amount": 40,
                        "to_": alice,
                        "token_id": 1
                    }]
                }])
            chain.execute(transfer, sender=alice)

        with self.assertRaises(MichelsonRuntimeError):
            transfer = self.ct.transfer(
                [{"from_": alice,
                    "txs": [{
                        "amount": 40,
                        "to_": alice,
                        "token_id": 0
                    },
                    {
                        "amount": 40,
                        "to_": bob,
                        "token_id": 1
                    }]
                }])
            chain.execute(transfer, sender=alice)

    def test_transfer_self(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.create_token(token=foreign_token_a, metadata={"":""}), sender=admin)
        chain.execute(self.ct.mint([dict(token_id=0, recipient=alice, amount=100_000)]), sender=bridge)

        transfer = self.ct.transfer(
            [{"from_": alice,
                "txs": [{
                    "amount": 100_000,
                    "to_": alice,
                    "token_id": 0
                },{
                    "amount": 1,
                    "to_": bob,
                    "token_id": 0
                }]
              }])
        res = chain.execute(transfer, sender=alice)

        # actual amount is transferred
        self.assertEqual(res.storage["ledger"][(alice, 0)], 99_999)
        self.assertEqual(res.storage["ledger"][(bob, 0)], 1)

        # self.assertEqual(res.storage["ledger"][alice], 0)
        # self.assertEqual(res.storage["ledger"][bob], 1)
    
    def test_cant_double_transfer(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.create_token(token=foreign_token_a, metadata={"":""}), sender=admin)
        chain.execute(self.ct.mint([dict(token_id=0, recipient=alice, amount=100_000)]), sender=bridge)
        
        transfer = self.ct.transfer(
            [{ "from_" : alice,
                "txs" : [
                    {
                        "amount": 50_000,
                        "to_": bob,
                        "token_id": 0
                    },
                    {
                        "amount": 60_000,
                        "to_": bob,
                        "token_id": 0
                    }
                ]
            }])
        
        with self.assertRaises(MichelsonRuntimeError):
            res = chain.execute(transfer, sender=alice)

    def test_transfer_zero(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.create_token(token=foreign_token_a, metadata={"":""}), sender=admin)
        chain.execute(self.ct.mint([dict(token_id=0, recipient=alice, amount=100_000)]), sender=bridge)

        transfer = self.ct.transfer(
            [{"from_": alice,
                "txs": [{
                    "amount": 0,
                    "to_": alice,
                    "token_id": 0
                },
                {
                    "amount": 0,
                    "to_": bob,
                    "token_id": 0
                }]
              }])
        res = chain.execute(transfer, sender=alice)

        self.assertEqual(res.storage["ledger"][(alice, 0)], 100_000)
        self.assertEqual(res.storage["ledger"][(bob, 0)], 0)

    def test_transfer_multiple_froms(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.create_token(token=foreign_token_a, metadata={"":""}), sender=admin)
        chain.execute(self.ct.mint([dict(token_id=0, recipient=alice, amount=100_000)]), sender=bridge)

        add_operator = self.ct.update_operators([{
                "add_operator": {
                    "owner": bob,
                    "operator": alice,
                    "token_id": 0
                }}])
        res = chain.execute(add_operator, sender=bob)

        transfer = self.ct.transfer(
            [
                {
                    "from_": alice,
                        "txs": [{
                            "amount": 50_000,
                            "to_": bob,
                            "token_id": 0
                        }]
                },
                {
                    "from_": bob,
                        "txs": [{
                            "amount": 30_000,
                            "to_": carol,
                            "token_id": 0
                        }]
                }
            ])
        res = chain.execute(transfer, sender=alice)

        self.assertEqual(res.storage["ledger"][(alice, 0)], 50_000)
        self.assertEqual(res.storage["ledger"][(bob, 0)], 20_000)
        self.assertEqual(res.storage["ledger"][(carol, 0)], 30_000)

