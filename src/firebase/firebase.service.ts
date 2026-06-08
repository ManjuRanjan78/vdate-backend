import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private initialized = false;

  constructor() {
    this.initFirebase();
  }

  private initFirebase() {
    try {
      if (admin.apps.length > 0) {
        this.initialized = true;
        return;
      }

      let serviceAccountJson: any = null;

      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
        const keyPath = resolve(
          process.cwd(),
          process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
        );

        if (!existsSync(keyPath)) {
          this.logger.warn(
            `Firebase service account file not found at path: ${keyPath}. FCM notifications are disabled.`,
          );
        } else {
          serviceAccountJson = require(keyPath);
        }
      } else if (
        process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64
      ) {
        serviceAccountJson = JSON.parse(
          Buffer.from(
            process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
            'base64',
          ).toString('utf8'),
        );
      }

      if (!serviceAccountJson) {
        this.logger.warn(
          'Firebase service account not configured. FCM notifications are disabled.',
        );
        return;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountJson),
      });

      this.initialized = true;
      this.logger.log('Firebase Admin initialized for FCM notifications.');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error as Error);
    }
  }

  async sendNotification(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized; notification skipped');
      return false;
    }

    const message: admin.messaging.Message = {
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
    } catch (error) {
      this.logger.error('FCM send failed', error as Error);
      return false;
    }
  }
}
