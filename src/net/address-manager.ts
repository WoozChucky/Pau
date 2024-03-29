import { Mutex } from 'async-mutex';

import { Database } from '../database/database-manager';
import { Address } from '../model/address';
import { Logger } from '../utils/logging';
import { FileSystem } from '../utils/filesystem';

const mutex = new Mutex();

// 10 minutes, in milliseconds
const SAVE_TIMEOUT = 600000;

export class AddressManager {
  private static singletonInstance: AddressManager;

  public static get instance(): AddressManager {
    if (!AddressManager.singletonInstance) {
      AddressManager.singletonInstance = new AddressManager();
    }
    return AddressManager.singletonInstance;
  }

  private static parseAddress(input: string): Address | null {
    const arr = input.split(':');

    if (arr.length !== 2) return null;

    const port = parseInt(arr[1], 10);
    const ip = arr[0];

    if (Number.isInteger(port) && ip.split('.').length === 4) {
      return new Address(input);
    }

    return null;
  }

  private initialized = false;

  private addresses: Address[] = [];

  private constructor() {
    // empty on purpose
  }

  public async initialize(useAddressFile = false) {
    if (this.initialized) {
      throw new Error('AddressManager is already initialized.');
    }

    this.initialized = true;

    try {
      const addresses = await Database.instance.get(Database.ADDRESS_LIST_KEY);
      this.addresses = JSON.parse(addresses);
    } catch (error) {
      Logger.warn(`No addresses found in local db. ${error}`, error);
    }

    setInterval(this.saveLocally.bind(this), SAVE_TIMEOUT);
  }

  public async add(address: Address): Promise<void> {
    if (!this.initialized) {
      throw new Error('AddressManager is not initialized.');
    }

    const alreadyExists = await this.addressAlreadyExists(address);

    if (alreadyExists) {
      throw new Error(
        `Address ${address.toString()} already exists in AddressManager.`
      );
    }

    const unlock = await mutex.acquire();

    this.addresses.push(address);

    unlock();
  }

  public async getAll(): Promise<Address[]> {
    if (!this.initialized) {
      throw new Error('AddressManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const addresses = this.addresses;

    unlock();

    return addresses;
  }

  public async getAddress(addressEndpoint: string): Promise<Address> {
    if (!this.initialized) {
      throw new Error('AddressManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const foundAddress = this.addresses.find(
      (addr) => addr.endpoint === addressEndpoint
    );

    unlock();

    if (!foundAddress) {
      throw new Error('Address not found');
    }

    return foundAddress;
  }

  public async saveLocally(): Promise<void> {
    if (!this.initialized) {
      throw new Error('AddressManager is not initialized.');
    }

    const unlock = await mutex.acquire();

    const addressList = this.addresses;

    unlock();

    try {
      await Database.instance.put(
        Database.ADDRESS_LIST_KEY,
        JSON.stringify(addressList)
      );

      Logger.info('Safely written address database.');
    } catch (err) {
      Logger.warning(
        'An error occurred while saving addresses database -> ',
        err
      );
    }
  }

  private async addressAlreadyExists(address: Address): Promise<boolean> {
    const unlock = await mutex.acquire();

    const addressList = this.addresses;

    unlock();

    return (
      addressList.find((addr) => addr.endpoint === address.endpoint) !==
      undefined
    );
  }
}
