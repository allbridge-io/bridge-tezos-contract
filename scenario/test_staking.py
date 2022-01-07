import copy
import json
from re import template

from unittest import TestCase

from helpers import *
from constants import *
from pprint import pprint

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError

class StakingTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        code = json.load(open("./builds/staking.json"))
        cls.ct = ContractInterface.from_micheline(code["michelson"])

        storage = cls.ct.storage.dummy()
        storage["owner"] = admin
        cls.storage = storage

    def test_deposit_withdraw(self):
        chain = LocalChain(storage=self.storage)

        res = chain.execute(self.ct.deposit(100_000), view_results=vr)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100_000)
        self.assertEqual(trxs[0]["destination"], contract_self_address)
        self.assertEqual(trxs[0]["source"], me)

        with self.assertRaises(MichelsonRuntimeError):
            chain.execute(self.ct.withdraw(100_001), view_results=vr)

        res = chain.execute(self.ct.withdraw(100_000), view_results=vr)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100_000)
        self.assertEqual(trxs[0]["destination"], me)
        self.assertEqual(trxs[0]["source"], contract_self_address)

    def test_add_reward(self):
        chain = LocalChain(storage=self.storage)

        res = chain.execute(self.ct.deposit(100_000))
        res = chain.execute(self.ct.add_reward(0, 10 * 30, 100), sender=admin)
        # TODO verify money is taken from admin
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100)
        self.assertEqual(trxs[0]["destination"], contract_self_address)
        self.assertEqual(trxs[0]["source"], admin)
        
        print(res.storage)

        chain.advance_blocks(10)
        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 100_099)
        self.assertEqual(trxs[0]["destination"], me)
        self.assertEqual(trxs[0]["source"], contract_self_address)

        pprint(add_delimiters(res.storage))

    def test_reward_distribution(self):
        chain = LocalChain(storage=self.storage)

        res = chain.execute(self.ct.deposit(100_000), sender=alice)
        res = chain.execute(self.ct.deposit(200_000), sender=bob)
        res = chain.execute(self.ct.add_reward(0, 10 * 30, 1_000), sender=admin)
        
        chain.advance_blocks(10)

        res = chain.execute(self.ct.withdraw(100_000),sender=alice)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["destination"], alice)
        self.assertEqual(trxs[0]["source"], contract_self_address)
        self.assertAlmostEqual(trxs[0]["amount"], 100_333, delta=1)

        res = chain.execute(self.ct.withdraw(200_000), sender=bob)
        pprint(add_delimiters(res.storage))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["destination"], bob)
        self.assertEqual(trxs[0]["source"], contract_self_address)
        self.assertAlmostEqual(trxs[0]["amount"], 200_666, delta=1)

    def test_multistep_distribution(self):
        chain = LocalChain(storage=self.storage)

        initial_investment = 100_000
        res = chain.execute(self.ct.deposit(initial_investment), sender=alice)
        res = chain.execute(self.ct.deposit(initial_investment), sender=bob)
        res = chain.execute(self.ct.add_reward(0, 10 * 30, 10_000), sender=admin)
        
        chain.advance_blocks(10)

        alice_withdrawn = 0
        steps = 10
        shares_per_step = initial_investment // 10
        for _ in range(steps):
            res = chain.execute(self.ct.withdraw(shares_per_step),sender=alice)
            transfers = parse_transfers(res)
            alice_withdrawn += transfers[0]["amount"]

        res = chain.execute(self.ct.withdraw(initial_investment), sender=bob)
        trxs = parse_transfers(res)
        bob_withdrawn = trxs[0]["amount"]
        self.assertAlmostEqual(bob_withdrawn, alice_withdrawn, delta=1)

    def test_multiple_periods(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000))
        chain.execute(self.ct.add_reward(0, 300, 1_000), sender=admin)
        chain.execute(self.ct.add_reward(301, 600, 3_000), sender=admin)

        chain.advance_blocks(20)

        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 104_000, delta=1)

        # chain.advance_blocks(100)

    def test_uneven_periods(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000))
        chain.execute(self.ct.add_reward(0, 45, 1_000), sender=admin)
        chain.execute(self.ct.add_reward(46, 60, 1_000), sender=admin)

        chain.advance_blocks(2)

        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 102_000, delta=1)

    def test_periods_intersections(self):
        chain = LocalChain(storage=self.storage)
        chain.execute(self.ct.add_reward(0, 300, 1_000), sender=admin)

        with self.assertRaises(MichelsonRuntimeError):
            chain.execute(self.ct.add_reward(300, 310, 1), sender=admin)

        with self.assertRaises(MichelsonRuntimeError):
            chain.execute(self.ct.add_reward(0, 1, 1), sender=admin)

        with self.assertRaises(MichelsonRuntimeError):
            chain.execute(self.ct.add_reward(90, 120, 1), sender=admin)

    def test_periods_gap(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000))
        chain.execute(self.ct.add_reward(0, 60, 10_000), sender=admin)
        chain.execute(self.ct.add_reward(120, 300, 30_000), sender=admin)

        chain.advance_blocks(10)

        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 140_000, delta=1)

    def test_partial_withdraw(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000))
        chain.execute(self.ct.add_reward(0, 300, 10_000), sender=admin)

        chain.advance_blocks(5)
        
        res = chain.execute(self.ct.withdraw(10_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 10_500, delta=1)

        chain.advance_blocks(5)
        res = chain.execute(self.ct.withdraw(90_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 99_500, delta=1)

    def test_deposit_in_the_middle(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(10_000), sender=alice)
        res = chain.execute(self.ct.add_reward(0, 300, 100_000), sender=admin)

        chain.advance_blocks(5)
        
        # deposit and immediately withdraw to mess around
        res = chain.execute(self.ct.deposit(10_000), sender=bob)
        bob_shares = res.storage["ledger"][bob]
        pprint(res.storage)
        # res = chain.execute(self.ct.withdraw(bob_shares), sender=bob)
        # trxs = parse_transfers(res)
        # pprint(trxs)
        # pprint(bob_shares)

        # self.assertAlmostEqual(trxs[0]["amount"], 100_000, delta=1)

        # actually deposit
        # chain.execute(self.ct.deposit(100_000), sender=bob)

        chain.advance_blocks(5)

        res = chain.execute(self.ct.withdraw(10_000), sender=alice)
        trxs = parse_transfers(res)
        pprint(trxs)
        # self.assertAlmostEqual(trxs[0]["amount"], 100_000 + 7_562, delta=1)

        res = chain.execute(self.ct.withdraw(bob_shares - 1), sender=bob)
        trxs = parse_transfers(res)
        pprint(trxs)
        # self.assertAlmostEqual(trxs[0]["amount"], 100_000 + 2_500, delta=1)

    def test_late_withdrawal(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(100_000))
        chain.execute(self.ct.add_reward(0, 300, 10_000), sender=admin)
        chain.advance_blocks(100)

        chain.execute(self.ct.deposit(1))
        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 110_000, delta=1)

    def test_early_withdrawal(self):
        chain = LocalChain(storage=self.storage)
        
        chain.execute(self.ct.add_reward(300, 600, 10_000), sender=admin)

        chain.execute(self.ct.deposit(100_000))

        chain.advance_blocks(10)
        res = chain.execute(self.ct.withdraw(100_000))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 100_000, delta=1)

        # do it all over again
        chain.execute(self.ct.deposit(100))

        chain.advance_blocks(10)

        res = chain.execute(self.ct.withdraw(100))
        trxs = parse_transfers(res)
        self.assertAlmostEqual(trxs[0]["amount"], 10_000 + 100, delta=1)


    def test_smallest_reward(self):
        chain = LocalChain(storage=self.storage)

        res = chain.execute(self.ct.deposit(1), sender=alice)
        res = chain.execute(self.ct.deposit(100_000_000), sender=bob)
        res = chain.execute(self.ct.add_reward(0, 300, 10_000_000), sender=admin)
        
        chain.advance_blocks(10)

        res = chain.execute(self.ct.withdraw(1),sender=alice)
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["destination"], alice)
        self.assertEqual(trxs[0]["source"], contract_self_address)
        self.assertEqual(trxs[0]["amount"], 1)

    def test_multiple_rewards_in_block(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.deposit(1))
        chain.execute(self.ct.add_reward(5, 8, 100), sender=admin)
        chain.execute(self.ct.add_reward(9, 13, 100), sender=admin)
        chain.execute(self.ct.add_reward(14, 21, 100), sender=admin)
        chain.execute(self.ct.add_reward(34, 55, 100), sender=admin)
        
        chain.advance_blocks(1)

        res = chain.interpret(self.ct.withdraw(1))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 300)

        chain.advance_blocks(1)
        res = chain.interpret(self.ct.withdraw(1))
        trxs = parse_transfers(res)
        self.assertEqual(len(trxs), 1)
        self.assertEqual(trxs[0]["amount"], 400)

    def test_many_users(self):
        chain = LocalChain(storage=self.storage)

        chain.execute(self.ct.add_reward(0, 300, 10_000), sender=admin)

        users = []
        for i in range(10):
            users.append(generate_random_address())

        stake = 1
        for user in users:
            chain.execute(self.ct.deposit(stake), sender=user)
            stake *= 10
        
        chain.advance_blocks(5)

        res = chain.execute(self.ct.deposit(10_000), sender=bob)
        bob_shares = res.storage["ledger"][bob]

        chain.advance_blocks(5)

        print("")

        for user in users:
            shares = res.storage["ledger"][user]
            res = chain.execute(self.ct.withdraw(shares), sender=user)
            trxs = parse_transfers(res)
            print("User staked", shares, "Withdrawn", trxs[0]["amount"])

        res = chain.execute(self.ct.withdraw(bob_shares), sender=bob)
        trxs = parse_transfers(res)
        print("Bob staked", 10_000, "in the middle. Withdrawn", trxs[0]["amount"])