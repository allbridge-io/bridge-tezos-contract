# Description

Bridge project that consists of 4 smart contracts.
The core of the system is the **Bridge-core**. It receives the assets from the users that he is willing to transfer to another chain and locks it or burns the wrapped assets that represent the transferred assets. The transfer is registered on the **Validator** and the fee is charged.

When the tokens are transferred from the another chain the user call unlock method and provides proof(the signature) to prove the transfer and receive the assets. The transfer is validated on the **Validator**.

So, the bridge is the main gateway for user to interact with the protocol.

**Validator** is responsible for registering the transfers and their validation.

**Fee-Oracle** is responsible for fee calculation based on the tokens, transferred amount and user's staked shares balance in **Staking**.

**Staking** is smart contract that will allow to stake wABR and earn more wABR.

# Requirements

- Installed NodeJS (tested with NodeJS v14+)
- Installed Yarn

- Installed node modules:

```
yarn install
```

# Compile contract

```
yarn compile
```

# Quick Start tests

```
yarn start-sandbox
```

```
yarn test
```

```
yarn stop-sandbox
```

# Deploy contract

```
yarn migrate
```
