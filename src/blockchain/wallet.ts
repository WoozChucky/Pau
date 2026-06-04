import { existsSync, readFileSync, unlinkSync, writeFileSync } from "fs";

import { ec } from "elliptic";

const EC = new ec("secp256k1");
const privateKeyLocation = process.env.PRIVATE_KEY || "node/wallet/private_key";

const getPrivateFromWallet = (): string => {
  const buffer = readFileSync(privateKeyLocation, "utf8");
  return buffer.toString();
};

const getPublicFromWallet = (): string => {
  const privateKey = getPrivateFromWallet();
  const key = EC.keyFromPrivate(privateKey, "hex");
  return key.getPublic().encode("hex", false);
};

const generatePrivateKey = (): string => {
  const keyPair = EC.genKeyPair();
  const privateKey = keyPair.getPrivate();
  return privateKey.toString(16);
};

const initWallet = () => {
  // let's not override existing private keys
  if (existsSync(privateKeyLocation)) {
    return;
  }
  const newPrivateKey = generatePrivateKey();

  writeFileSync(privateKeyLocation, newPrivateKey);
  console.log(
    "new wallet with private key created to : %s",
    privateKeyLocation
  );
};

const deleteWallet = () => {
  if (existsSync(privateKeyLocation)) {
    unlinkSync(privateKeyLocation);
  }
};

export {
  getPublicFromWallet,
  getPrivateFromWallet,
  generatePrivateKey,
  initWallet,
  deleteWallet,
};
