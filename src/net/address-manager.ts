import {Database} from "../database/database-manager";
import {Address} from "../model/address";
import {Semaphore} from "prex";
import {Logger} from "../utils/logging";
import {FileSystem} from "../utils/filesystem";

const resourceLock = new Semaphore(1);

export class AddressManager {

    private static SAVE_TIMEOUT = 600000; //10 Minutes

    private static DEFAULT_FILE_LOCATION = 'addr.txt';

    private static inited = false;

    private static addresses : Address[] = [];

    public static async initialize(useAddressFile = false) {

        if(AddressManager.inited) {
            throw new Error("AddressManager is already initialized.")
        }

        this.inited = true;

        if(useAddressFile) {
            //Load from address file as well
            FileSystem.readFromFile(AddressManager.DEFAULT_FILE_LOCATION)
                .then( (lines : string[]) => {

                    lines.forEach((line) => {

                        const addr = AddressManager.parseAddress(line);

                        if(addr) {
                            AddressManager.add(addr)
                                .then(() => Logger.info('Added address -> ', addr))
                                .catch(err => Logger.warn(err));
                        }

                    });
                })
                .catch(err => {
                    Logger.warn(err);
                });
        } else {

            Database.get(Database.ADDRESS_LIST_KEY)
                .then((output) => {
                    AddressManager.addresses = JSON.parse(output);
                })
                .catch(err => {
                    Logger.warn(err.type, err.message);
                });
        }

        setInterval(this.saveLocally, this.SAVE_TIMEOUT);

    }

    public static async add(address : Address) : Promise<void> {
        return new Promise<void>(async (resolve, reject) => {

            if(!AddressManager.inited) {
                return reject("AddressManager is not initialized.");
            }

            await resourceLock.wait();

            if(AddressManager.addresses.filter(a => a.endpoint == address.endpoint).length > 0) {
                resourceLock.release();
                return reject(`Address ${address.toString()} already exists in AddressManager.`);
            }

            AddressManager.addresses.push(address);

            resourceLock.release();

            return resolve();

        });
    }

    public static async getAll() : Promise<Address[]> {

        if(!AddressManager.inited) {
            throw new Error("AddressManager is not initialized.");
        }

        await resourceLock.wait();

        const addresses = AddressManager.addresses;

        resourceLock.release();

        return addresses;

    }

    public static async saveLocally() : Promise<void> {

        if(!AddressManager.inited) {
            throw new Error("AddressManager is not initialized.");
        }

        await resourceLock.wait();

        const addressList = AddressManager.addresses;

        resourceLock.release();

        return await Database.put(Database.ADDRESS_LIST_KEY, JSON.stringify(addressList))
            .then(() => {
                Logger.info('Safely written address database.')
            })
            .catch(err => {
                Logger.warning('An error occurred while saving addresses database -> ', err);
            });
    }

    private static parseAddress(input : string ) : Address | null {

        const arr = input.split(':');

        if(arr.length != 2) return null;

        const port = parseInt(arr[1]);
        const ip = arr[0];

        if (Number.isInteger(port) && ip.split('.').length == 4) {
            return new Address(input);
        }

        return null;

    }
}
