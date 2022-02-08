import json
from unittest import TestCase
from decimal import Decimal

from helpers import *
from constants import *
from pytezos import ContractInterface, MichelsonRuntimeError

class StakingTransfers(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = json.load(open("./builds/staking.json"))
        cls.ct = ContractInterface.from_micheline(code["michelson"])

        storage = cls.ct.storage.dummy()
        storage["owner"] = admin
        cls.storage = storage

    def test_transfer_wrong_token_id(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)
        chain.execute(self.ct.deposit(100_000), sender=alice)

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
        chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)
        chain.execute(self.ct.deposit(100_000), sender=alice)

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
        self.assertEqual(res.storage["ledger"][alice], 99_999)
        self.assertEqual(res.storage["ledger"][bob], 1)

        # self.assertEqual(res.storage["ledger"][alice], 0)
        # self.assertEqual(res.storage["ledger"][bob], 1)
    
    def test_cant_double_transfer(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)
        chain.execute(self.ct.deposit(100_000), sender=alice)
        
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
        chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)
        chain.execute(self.ct.deposit(100_000), sender=alice)

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

        self.assertEqual(res.storage["ledger"][alice], 100_000)
        self.assertEqual(res.storage["ledger"][bob], 0)

    def test_transfer_in_the_middle_of_reward(self):
        chain = LocalChain(storage=self.storage)
        res = chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)

        chain.execute(self.ct.deposit(100_000), sender=alice)

        chain.advance_blocks(5)
        transfer = self.ct.transfer(
            [{"from_": alice,
                "txs": [{
                    "amount": 50_000,
                    "to_": bob,
                    "token_id": 0
                }]
              }])
        res = chain.execute(transfer, sender=alice)
        
        chain.advance_blocks(5)

        res = chain.execute(self.ct.withdraw(50_000), sender=alice)
        pprint(parse_transfers(res))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertAlmostEqual(trxs[0]["amount"], 133_333, delta=333)

        res = chain.execute(self.ct.withdraw(50_000), sender=bob)
        pprint(parse_transfers(res))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertAlmostEqual(trxs[0]["amount"], 66_666, delta=333)


    def test_transfer_multiple_froms(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000), sender=alice)

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

        self.assertEqual(res.storage["ledger"][alice], 50_000)
        self.assertEqual(res.storage["ledger"][bob], 20_000)
        self.assertEqual(res.storage["ledger"][carol], 30_000)

