import { MessageType } from "./message_type";

export class Message {
    public type : MessageType;
    public data : any;

    constructor(data : any) {
        this.type = data.type;
        this.data = data.data;
    }
}