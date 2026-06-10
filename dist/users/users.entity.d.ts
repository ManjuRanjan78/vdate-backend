export declare enum UserRole {
    USER = "user",
    HOST = "host",
    AGENCY = "agency",
    ADMIN = "admin"
}
export declare class User {
    id: number;
    phone: string;
    email: string;
    googleId: string;
    facebookId: string;
    name: string;
    gender: string;
    age: number;
    dob: Date;
    bio: string;
    interests: string[];
    imageUrl: string;
    fcmToken: string;
    latitude: number;
    longitude: number;
    country: string;
    city: string;
    location: string;
    profileCompleted: boolean;
    isVerified: boolean;
    isOnline: boolean;
    isLive: boolean;
    liveStartedAt: Date | null;
    liveLikes: number;
    liveCoins: number;
    isActive: boolean;
    hostApproved: boolean;
    role: UserRole;
    agencyId: string;
    coins: number;
    followersCount: number;
    followingCount: number;
    likesCount: number;
    viewerCount: number;
    lastActiveAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
