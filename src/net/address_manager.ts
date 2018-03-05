import {Database} from "../database";
import {Address} from "../model/address";
import {Semaphore} from "prex";
import {logger} from "../utils/logging";
import {FileSystem} from "../utils/filesystem";

const resourceLock = new Semaphore(1);

export class AddressManager {

    private static SAVE_TIMEOUT = 600000; //10 Minutes

    private static DEFAULT_FILE_LOCATION = 'addr.txt';

    private static inited : boolean = false;

    private static addresses : Address[] = [];

    public static async initialize(useAddressFile : boolean = false) {

        if(AddressManager.inited) {
            throw new Error("AddressManager is already initialized.")
        }

        this.inited = true;

        if(useAddressFile) {
            //Load from address file as well
            FileSystem.readFromFile(AddressManager.DEFAULT_FILE_LOCATION)
                .then( (lines : string[]) => {

                    lines.forEach((line) => {

                        let addr = AddressManager.parseAddress(line);

                        if(addr) {
                            AddressManager.add(addr)
                                .then(() => logger.info('Added address -> ', addr))
                                .catch(err => logger.warn(err));
                        }

                    });
                })
                .catch(err => {
                    logger.warn(err);
                });
        } else {

            Database.get(Database.ADDRESS_LIST_KEY)
                .then((output) => {
                    AddressManager.addresses = JSON.parse(output);
                })
                .catch(err => {
                    logger.warn(err.type, err.message);
                });
        }

        setTimeout(this.saveLocally, this.SAVE_TIMEOUT);

    }

    public static async add(address : Address) : Promise<void> {
        return new Promise<void>(async (resolve, reject) => {

            if(!AddressManager.inited) {
                return reject("AddressManager is not initialized.");
            }

            await resourceLock.wait();

            if(AddressManager.addresses.filter(a => a.ip == address.ip && a.port == a.port).length > 0) {
                resourceLock.release();
                return reject(`Address ${address.toString()} already exists in AddressManager.`);
            }

            AddressManager.addresses.push(address);

            resourceLock.release();

            return resolve();

        });
    }

    public static async getAll() {

        if(!AddressManager.inited) {
            throw new Error("AddressManager is not initialized.");
        }

        await resourceLock.wait();

        let addresses = AddressManager.addresses;

        resourceLock.release();

        return addresses;

    }

    public static async saveLocally() : Promise<void> {

        if(!AddressManager.inited) {
            throw new Error("AddressManager is not initialized.");
        }

        await resourceLock.wait();

        let addressList = AddressManager.addresses;

        resourceLock.release();

        return await Database.put(Database.ADDRESS_LIST_KEY, JSON.stringify(addressList))
            .then(() => {
                logger.info('Safely written address database.')
            })
            .catch(err => {
                logger.warning('An error occurred while saving addresses database -> ', err);
            });
    }

    private static parseAddress(input : string ) : Address {

        let arr = input.split(':');

        if(arr.length != 2) return null;

        let port = parseInt(arr[1]);
        let ip = arr[0];

        if (Number.isInteger(port) && ip.split('.').length == 4) {
            return new Address(ip, port);
        }

        return null;

    }
}