Wallets
=====================================

This document aims to provide some information about:
1. Wallets 
2. Address Format
3. Address Generation
4. Address Uniqueness
5. FAQ

#### 1. Wallets

This is yet to be implemented, 'for now your address is your wallet/account'.

#### 2. Address Format

40 Hexadecimal characters prefixed by 'Px' characters.

All uppercase or lowercase, never mixed case.

Example: PxF639E627EBC992592698870B0D72BF37AA9A6EFF

#### 3. Address Generation

    1. Generate a random 32 byte private key.
    
    2. Multiply the private key by the elliptic curve generator (ECDSA secp256k1) point to get the public key.
    
    3. Concatenate the x and y coordinates of the public key, and compute a sha256 hash of it.
    
    4. Take the last 20 bytes of the hash, upper/lower case it, and prefix it with "Px".
    
    5. And there you have an address!

#### 4. Address Uniqueness

Addresses are 160 bit hashes, meaning there are 2^160 possible hashes. 
Per the [birthday problem](https://en.wikipedia.org/wiki/Birthday_problem), the chance of a collision rises to 50% when there are about 2^80 accounts created.

To give you an idea of how unlikely that is, if every person on earth spent all their time doing nothing but 
generating accounts, and they generated one a second, they'd only generate about 2^57 of them. 
To generate 2^80 and reach a 50% probability of finding a collision, they'd need to keep on generating one 
per second for about 8 million years.

> How can you be sure that the address is not already given to another user?

You can't be sure that someone else has not already generated a private key that corresponds to that address, no.

> When I create an address locally (if my node is not connected to the other nodes), how can I check if it is synced with the node network?

All addresses exist, it's just that someone must generate a keypair that maps to an address to be able to use it.
Once it is used, it appears in the blockchain data, and the network knows that someone has the private key.

When you generate a keypair/address locally, you can check if the address has been used already by checking the address on a block explorer 
(if me or someone else ever thinks about developing one). 
If it has, you can (obviously) infer that someone has already previously generated a private key that corresponds to that address.

What you can't tell is whether someone has already generated the private key to your new address, but not used it.
They may have the same private key as you sitting on their machine waiting to be used. You can't know that.

Also worth noting is that more than one private key can map to the same address. 
However, even given this, the chances of collisions - 
two people generating private keys that map to the same address - is very, very small.

If you still have doubts about your address uniqueness, take a look at
[this link](https://ethereum.stackexchange.com/questions/10055/is-each-ethereum-address-shared-by-theoretically-2-96-private-keys)
since this address implementation is based on Ethereum.



