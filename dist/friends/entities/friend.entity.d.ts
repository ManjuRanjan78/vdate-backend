export declare enum FriendStatus {
    PENDING = "pending",
    ACCEPTED = "accepted",
    REJECTED = "rejected"
}
export declare class Friend {
    id: number;
    senderId: number;
    receiverId: number;
    status: FriendStatus;
    createdAt: Date;
    updatedAt: Date;
}
