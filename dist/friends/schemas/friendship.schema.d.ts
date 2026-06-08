import { Document } from 'mongoose';
export declare enum FriendStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}
export declare class Friendship extends Document {
    user1Id: number;
    user2Id: number;
    status: string;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const FriendshipSchema: import("mongoose").Schema<Friendship, import("mongoose").Model<Friendship, any, any, any, any, any, Friendship>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Friendship, Document<unknown, {}, Friendship, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
    _id: import("mongoose").Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    _id?: import("mongoose").SchemaDefinitionProperty<import("mongoose").Types.ObjectId, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user1Id?: import("mongoose").SchemaDefinitionProperty<number, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    user2Id?: import("mongoose").SchemaDefinitionProperty<number, Friendship, Document<unknown, {}, Friendship, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Friendship & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Friendship>;
