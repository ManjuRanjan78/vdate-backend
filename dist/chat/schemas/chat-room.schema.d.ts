import { Document, Types } from 'mongoose';
export declare class ChatRoom extends Document {
    user1Id: number;
    user2Id: number;
    lastMessage?: string;
    lastMessageAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const ChatRoomSchema: import("mongoose").Schema<ChatRoom, import("mongoose").Model<ChatRoom, any, any, any, any, any, ChatRoom>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ChatRoom, Document<unknown, {}, ChatRoom, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user1Id?: import("mongoose").SchemaDefinitionProperty<number, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user2Id?: import("mongoose").SchemaDefinitionProperty<number, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessage?: import("mongoose").SchemaDefinitionProperty<string | undefined, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    lastMessageAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, ChatRoom, Document<unknown, {}, ChatRoom, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ChatRoom & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ChatRoom>;
