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

  async createLoyaltyClass(userId: string, shopName: string, logoUrl?: string | null, walletColor?: string | null) {
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
      hexBackgroundColor: walletColor || '#a78bbd',
      textModulesData: [
        {
          header: 'Rewards',
          body: 'Collect stamps to earn rewards'
        }
      ]
    };

    await this.client.loyaltyclass.insert({
      requestBody: loyaltyClass
    });

    return classId;
  }

  async createLoyaltyPass(passData: LoyaltyPassData, userId: string, logoUrl?: string | null, walletColor?: string | null): Promise<string> {
    const classId = await this.createLoyaltyClass(userId, passData.shopName, logoUrl, walletColor);
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
              string: `${passData.stamps}/${passData.maxStamps}`
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
            string: `${stamps}/${maxStamps}`
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
}
