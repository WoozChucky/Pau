import { TxIn } from "./tx_in";
import { TxOut } from "./tx_out";

export class Transaction {

    public id: string;
    public txIns: TxIn[];
    public txOuts: TxOut[];

}