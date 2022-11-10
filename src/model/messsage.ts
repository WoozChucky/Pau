import { MessageType } from "./message_type";

export interface Message {
    type : MessageType;
    data : any;
}
