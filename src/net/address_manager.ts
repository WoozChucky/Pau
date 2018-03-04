import {Database} from "../database";
import {Address} from "../model/address";
import {Semaphore} from "prex";
import {logger} from "../utils/logging";
import {FileSystem} from "../utils/filesystem";

const resourceLock = new Semaphore(1);

export class AddressManager {

    private static DEFAULT_FILE_LOCATION = 'addr.txt';

    private static inited : boolean = false;

    private static addresses : [Address];

    public static async initialize(useAddressFile : boolean = false) {

        if(AddressManager.inited) {
            throw new Error("AddressManager is already initialized.")
        }

        await resourceLock.wait();

        if(useAddressFile) {
            //Load from address file as well
            FileSystem.readFromFile(AddressManager.DEFAULT_FILE_LOCATION)
                .then( (lines : string[]) => {

                    lines.forEach(line => {

                        let addr = AddressManager.parseAddress(line);

                        if(addr) {
                            AddressManager.add(addr);
                        }

                    });

                })
                .catch(err => {
                    logger.warning(err);
                });
        }


        Database.get(Database.ADDRESS_LIST_KEY)
            .then((output) => {
                AddressManager.addresses = JSON.parse(output);
            })
            .catch(err => {
                logger.warning(err);
            });

        AddressManager.inited = true;

        resourceLock.release();
    }

    public static add(address : Address) : void {



    }

    private static parseAddress(input : string ) : Address {

        let arr = input.split(':');

        if(arr.length != 2) return null;

        let port = parseInt(arr[1]);
        let ip = arr[0];

        if (Number.isInteger(port) && ip.split('.').length == 3) {

            return new Address(ip, port);

        }

        return null;

    }
}