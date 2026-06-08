import { Document } from 'mongoose';
export declare class ChatMessage extends Document {
    roomId: string;
    senderId: number;
    receiverId: number;
    predefinedMessageId?: number;
    text: string;
    deliveredAt: Date;
    readAt: Date;
    isAutoResponse: boolean;
    isSystem: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatMessageSchema: import("mongoose").Schema<ChatMessage, import("mongoose").Model<ChatMessage, any, any, any, any, any, ChatMessage>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatMessage, Document<unknown, {}, ChatMessage, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    text?: import("mongoose").SchemaDefinitionProperty<string, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverId?: import("mongoose").SchemaDefinitionProperty<number, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isAutoResponse?: import("mongoose").SchemaDefinitionProperty<boolean, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    senderId?: import("mongoose").SchemaDefinitionProperty<number, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    roomId?: import("mongoose").SchemaDefinitionProperty<string, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    predefinedMessageId?: import("mongoose").SchemaDefinitionProperty<number | undefined, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    deliveredAt?: import("mongoose").SchemaDefinitionProperty<Date, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    readAt?: import("mongoose").SchemaDefinitionProperty<Date, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isSystem?: import("mongoose").SchemaDefinitionProperty<boolean, ChatMessage, Document<unknown, {}, ChatMessage, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatMessage & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ChatMessage>;
