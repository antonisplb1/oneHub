import { google } from 'googleapis';
import jwt from 'jsonwebtoken';

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export interface LoyaltyPassData {
  customerId: string;
  customerName: string;
  shopName: string;
  stamps: number;
  maxStamps: number;
  rewardText: string;
  customerQrCode: string;
}

export class GoogleWalletService {
  private issuerId: string;
  private credentials: ServiceAccountCredentials;
  private client: any;

  constructor() {
    this.issuerId = process.env.GOOGLE_WALLET_ISSUER_ID!;
    
    try {
      const jsonString = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON!;
      
      if (!jsonString || jsonString.trim() === '') {
        throw new Error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON is empty');
      }
      
      const trimmed = jsonString.trim();
      
      let parsedData;
      if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        parsedData = JSON.parse(JSON.parse(jsonString));
      } else if (trimmed.startsWith('{')) {
        parsedData = JSON.parse(jsonString);
      } else {
        throw new Error(`JSON does not start with { or ", starts with: ${trimmed.substring(0, 50)}`);
      }
      
      this.credentials = parsedData;
      
      if (!this.credentials.client_email || !this.credentials.private_key) {
        throw new Error('Missing required fields: client_email or private_key');
      }
    } catch (error: any) {
      throw new Error(`Invalid GOOGLE_WALLET_SERVICE_ACCOUNT_JSON format: ${error.message}`);
    }

    const auth = new google.auth.GoogleAuth({
      credentials: this.credentials,
      scopes: ['https://www.googleapis.com/auth/wallet_object.issuer']
    });

    this.client = google.walletobjects({
      version: 'v1',
      auth
    });
  }

  async createLoyaltyClass(userId: string, shopName: string, logoUrl?: string | null, cardBackgroundColor?: string | null) {
    const classId = `${this.issuerId}.loyalty_${userId}`;

    try {
      await this.client.loyaltyclass.get({ resourceId: classId });
      return classId;
    } catch (err: any) {
      if (err.response?.status !== 404) {
        throw err;
      }
    }

    const defaultLogoUrl = 'https://www.gstatic.com/images/branding/product/1x/googleg_64dp.png';
    let validLogoUrl = defaultLogoUrl;
    
    if (logoUrl && logoUrl.startsWith('https://')) {
      validLogoUrl = logoUrl;
    } else if (logoUrl && logoUrl.startsWith('data:')) {
      const domain = process.env.REPLIT_DOMAINS 
        ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}` 
        : 'http://localhost:5000';
      validLogoUrl = `${domain}/api/logo/${userId}`;
    }

    const validBackgroundColor = (cardBackgroundColor && /^#[0-9A-Fa-f]{6}$/.test(cardBackgroundColor)) 
      ? cardBackgroundColor 
      : '#4285F4';

    const loyaltyClass: any = {
      id: classId,
      issuerName: shopName,
      reviewStatus: 'UNDER_REVIEW',
      programName: 'Loyalty Program',
      programLogo: {
        sourceUri: {
          uri: validLogoUrl
        }
      },
      hexBackgroundColor: validBackgroundColor,
      textModulesData: [
        {
          header: 'Rewards',
          body: 'Collect stamps to earn rewards'
        }
      ],
      classTemplateInfo: {
        listTemplateOverride: {
          firstRowOption: {
            fieldOption: {
              fields: [
                {
                  fieldPath: 'object.loyaltyPoints'
                }
              ]
            }
          }
        }
      }
    };

    await this.client.loyaltyclass.insert({
      requestBody: loyaltyClass
    });

    return classId;
  }

  async createLoyaltyPass(passData: LoyaltyPassData, userId: string, logoUrl?: string | null, cardBackgroundColor?: string | null): Promise<string> {
    const classId = await this.createLoyaltyClass(userId, passData.shopName, logoUrl, cardBackgroundColor);
    const objectId = `${this.issuerId}.customer_${passData.customerId}`;

    try {
      await this.client.loyaltyobject.get({ resourceId: objectId });
    } catch (err: any) {
      if (err.response?.status === 404) {
        const loyaltyObject = {
          id: objectId,
          classId: classId,
          state: 'ACTIVE',
          accountId: passData.customerId,
          accountName: passData.customerName,
          loyaltyPoints: {
            label: 'Stamps',
            balance: {
              int: passData.stamps
            }
          },
          barcode: {
            type: 'QR_CODE',
            value: passData.customerQrCode,
            alternateText: passData.customerQrCode
          },
          textModulesData: [
            {
              header: 'Reward',
              body: passData.rewardText
            },
            {
              header: 'Progress',
              body: `${passData.stamps} / ${passData.maxStamps}`
            }
          ]
        };

        await this.client.loyaltyobject.insert({
          requestBody: loyaltyObject
        });
      } else {
        throw err;
      }
    }

    const claims = {
      iss: this.credentials.client_email,
      aud: 'google',
      origins: [],
      typ: 'savetowallet',
      iat: Math.floor(Date.now() / 1000),
      payload: {
        loyaltyObjects: [
          {
            id: objectId
          }
        ]
      }
    };

    const token = jwt.sign(claims, this.credentials.private_key, {
      algorithm: 'RS256'
    });

    return `https://pay.google.com/gp/v/save/${token}`;
  }

  async updateLoyaltyPoints(customerId: string, stamps: number, maxStamps: number) {
    const objectId = `${this.issuerId}.customer_${customerId}`;

    try {
      const patchBody = {
        loyaltyPoints: {
          label: 'Stamps',
          balance: {
            int: stamps
          }
        }
      };

      await this.client.loyaltyobject.patch({
        resourceId: objectId,
        requestBody: patchBody
      });
    } catch (err: any) {
      console.error('Error updating loyalty points:', err.message);
    }
  }

  async sendMessage(
    classId: string,
    header: string | null | undefined,
    body: string,
    displayStartTime: Date,
    displayEndTime: Date
  ) {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const startDateString = displayStartTime.toISOString();
    const endDateString = displayEndTime.toISOString();
    
    const message: any = {
      id: messageId,
      messageType: 'TEXT_AND_NOTIFY',
      body: body,
      displayInterval: {
        start: {
          date: startDateString
        },
        end: {
          date: endDateString
        }
      }
    };

    if (header) {
      message.header = header;
    }

    try {
      await this.client.loyaltyclass.addmessage({
        resourceId: classId,
        requestBody: { message }
      });

      return { success: true, messageId };
    } catch (err: any) {
      console.error('Error sending message to Google Wallet:', err.message);
      throw new Error(`Failed to send message: ${err.message}`);
    }
  }
}
