require("dotenv").config();

const { alice, dev } = require("./scripts/sandbox/accounts");

module.exports = {
  buildsDir: "builds",
  migrationsDir: "migrations",
  contractsDir: "contracts/main",
  contractsTestDir: "contracts/tests/main",
  ligoVersion: "0.29.0",
  network: "development",
  networks: {
    development: {
      rpc: "http://localhost:8732",
      network_id: "*",
      secretKey: alice.sk,
    },
    development_server: {
      host: "http://136.244.96.28",
      port: 8732,
      network_id: "*",
      secretKey: alice.pkh,
    },
    granadanet: {
      rpc: "https://granadanet.smartpy.io",
      port: 443,
      network_id: "*",
      secretKey: dev.pkh,
    },
    mainnet: {
      host: "https://mainnet.smartpy.io",
      port: 443,
      network_id: "*",
      secretKey: alice.pkh,
    },
  },
};
