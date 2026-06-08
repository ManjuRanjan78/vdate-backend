"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = __importStar(require("firebase-admin"));
const fs_1 = require("fs");
const path_1 = require("path");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    logger = new common_1.Logger(FirebaseService_1.name);
    initialized = false;
    constructor() {
        this.initFirebase();
    }
    initFirebase() {
        try {
            if (admin.apps.length > 0) {
                this.initialized = true;
                return;
            }
            let serviceAccountJson = null;
            if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
                const keyPath = (0, path_1.resolve)(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
                if (!(0, fs_1.existsSync)(keyPath)) {
                    this.logger.warn(`Firebase service account file not found at path: ${keyPath}. FCM notifications are disabled.`);
                }
                else {
                    serviceAccountJson = require(keyPath);
                }
            }
            else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64) {
                serviceAccountJson = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, 'base64').toString('utf8'));
            }
            if (!serviceAccountJson) {
                this.logger.warn('Firebase service account not configured. FCM notifications are disabled.');
                return;
            }
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountJson),
            });
            this.initialized = true;
            this.logger.log('Firebase Admin initialized for FCM notifications.');
        }
        catch (error) {
            this.logger.error('Failed to initialize Firebase Admin', error);
        }
    }
    async sendNotification(token, title, body, data) {
        if (!this.initialized) {
            this.logger.warn('Firebase not initialized; notification skipped');
            return false;
        }
        const message = {
            token,
            notification: {
                title,
                body,
            },
            data: data ?? {},
            android: {
                priority: 'high',
            },
            apns: {
                payload: {
                    aps: {
                        sound: 'default',
                    },
                },
            },
        };
        try {
            await admin.messaging().send(message);
            return true;
        }
        catch (error) {
            this.logger.error('FCM send failed', error);
            return false;
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map