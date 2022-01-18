const {
  Tezos,
  signerAlice,
  alice,
  bob,
  signerSecp,
  signerBob,
} = require("./utils/cli");
const { MichelsonMap } = require("@taquito/taquito");
const { rejects, strictEqual, notStrictEqual } = require("assert");

const WrappedToken = require("./helpers/wrappedTokenWrapper");

describe("Wrapped token methods test", async function () {
  let token;
  const bscChainId = Buffer.from("56", "ascii").toString("hex");
  before(async () => {
    Tezos.setSignerProvider(signerAlice);
    try {
      token = await new WrappedToken().init(alice.pkh);
    } catch (e) {
      console.log(e);
    }
  });
  describe("Testing entrypoint: Change_owner", async function () {
    it("Shouldn't changing owner if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerBob);
      await rejects(token.сhangeAddress("change_owner", bob.pkh), err => {
        strictEqual(err.message, "NOT_ADMIN");
        return true;
      });
    });
    it("Should allow change owner", async function () {
      Tezos.setSignerProvider(signerAlice);

      await token.сhangeAddress("change_owner", bob.pkh);
      await token.updateStorage();
      strictEqual(token.storage.owner, bob.pkh);
    });
  });
  describe("Testing entrypoint: Change_bridge", async function () {
    it("Shouldn't changing bridge if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(token.сhangeAddress("change_bridge", bob.pkh), err => {
        strictEqual(err.message, "NOT_ADMIN");
        return true;
      });
    });
    it("Should allow change bridge", async function () {
      Tezos.setSignerProvider(signerBob);

      await token.сhangeAddress("change_bridge", bob.pkh);
      await token.updateStorage();
      strictEqual(token.storage.bridge, bob.pkh);
    });
  });
  describe("Testing entrypoint: Create_token", async function () {
    it("Shouldn't create_token if the user is not an owner", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(
        token.createToken(
          bscChainId,
          Buffer.from("bscAddress", "ascii").toString("hex"),
          MichelsonMap.fromLiteral({
            symbol: Buffer.from("wABR").toString("hex"),
            name: Buffer.from("Wrapped ABR").toString("hex"),
            decimals: Buffer.from("6").toString("hex"),
            icon: Buffer.from("").toString("hex"),
          }),
        ),
        err => {
          strictEqual(err.message, "NOT_ADMIN");
          return true;
        },
      );
    });
    it("Should allow create token", async function () {
      Tezos.setSignerProvider(signerBob);

      await token.createToken(
        bscChainId,
        Buffer.from("bscAddress", "ascii").toString("hex"),
        MichelsonMap.fromLiteral({
          symbol: Buffer.from("wABR").toString("hex"),
          name: Buffer.from("Wrapped ABR").toString("hex"),
          decimals: Buffer.from("6").toString("hex"),
          icon: Buffer.from("").toString("hex"),
        }),
      );
      await token.updateStorage();
      const newToken = await token.storage.token_infos.get("0");
      strictEqual(token.storage.token_count.toNumber(), 1);
      notStrictEqual(newToken, undefined);
    });
  });
  describe("Testing entrypoint: Mint", async function () {
    it("Shouldn't mint token if the user is not an bridge", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(token.mint(1000, 0, bob.pkh), err => {
        strictEqual(err.message, "Wrapped-token/not-bridge");
        return true;
      });
    });
    it("Should allow mint tokens", async function () {
      Tezos.setSignerProvider(signerBob);

      await token.mint(10000, 0, bob.pkh);
      await token.updateStorage();
      const tokenSupply = await token.storage.tokens_supply.get("0");
      const balance = await token.getBalance(bob.pkh, 0);
      strictEqual(tokenSupply.toNumber(), 10000);
      strictEqual(balance, 10000);
    });
  });
  describe("Testing entrypoint: Burn", async function () {
    it("Shouldn't burn tokens if the user is not an bridge", async function () {
      Tezos.setSignerProvider(signerAlice);
      await rejects(token.burn(1000, 0, bob.pkh), err => {
        strictEqual(err.message, "Wrapped-token/not-bridge");
        return true;
      });
    });
    it("Should allow burn tokens", async function () {
      Tezos.setSignerProvider(signerBob);

      await token.burn(10000, 0, bob.pkh);
      await token.updateStorage();
      const tokenSupply = await token.storage.tokens_supply.get("0");
      const balance = await token.getBalance(bob.pkh, 0);
      strictEqual(tokenSupply.toNumber(), 0);
      strictEqual(balance, 0);
    });
  });
});
