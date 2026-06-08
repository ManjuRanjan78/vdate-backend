import { Document } from 'mongoose';
export type CallHistoryDocument = CallHistory & Document;
export declare class CallHistory {
    callerId: string;
    receiverId: string;
    roomName: string;
    callerName: string;
    receiverName: string;
    callType: string;
    duration: number;
    status: string;
    startedAt: Date;
    endedAt: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
export declare const CallHistorySchema: import("mongoose").Schema<CallHistory, import("mongoose").Model<CallHistory, any, any, any, any, any, CallHistory>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CallHistory, Document<unknown, {}, CallHistory, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    callerId?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverId?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    roomName?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    callerName?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    receiverName?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    callType?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    duration?: import("mongoose").SchemaDefinitionProperty<number, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    startedAt?: import("mongoose").SchemaDefinitionProperty<Date, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    endedAt?: import("mongoose").SchemaDefinitionProperty<Date, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date | undefined, CallHistory, Document<unknown, {}, CallHistory, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CallHistory & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CallHistory>;
