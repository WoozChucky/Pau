
import { ec } from 'elliptic';
import { sha3_256 } from "js-sha3";
import {logger} from "../../utils/logging";

/***
 * / wallet
 *
 * @class WalletManager
 */
export class WalletManager {

    // noinspection JSPotentiallyInvalidConstructorUsage
    private static EC = new ec('secp256k1');

    public static generateNewWallet() : object  {

        let privateKey = this.generatePrivateKey();
        let publicAddress = this.getPublicAddress(privateKey);

        let wallet = {
            address : publicAddress,
            key : privateKey
        };

        logger.info('Generated new wallet with info -> ', wallet);

        return wallet;
    }

    public static getPublicAddress(privateKey : string) : string {

        let key = WalletManager.EC.keyFromPrivate(privateKey, 'hex');

        let publicKey = key.getPublic().encode('hex');

        let publicSha = sha3_256(publicKey);

        return 'Px' + publicSha.toUpperCase().substr(publicSha.length - 40);
    }

    private static generatePrivateKey() : string {

        let keyPair = WalletManager.EC.genKeyPair();
        let privateKey = keyPair.getPrivate();

        return privateKey.toString(16);
    }

    /**
     * Checks if the given string is valid address
     *
     * @method isValidAddress
     * @param {String} address the given address
     * @return {Boolean}
     */
    private static isValidAddress(address : string) : boolean {
        if (!/^(Px)?[0-9a-f]{40}$/i.test(address)) {
            // check if it has the basic requirements of an address
            return false;
        } else {
            //check if address is all uppercase or lowercase
            return (/^(Px)?[0-9a-f]{40}$/.test(address) || /^(Px)?[0-9A-F]{40}$/.test(address));
        }
    };

}