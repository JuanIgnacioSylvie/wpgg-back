import { ConfigService } from '@nestjs/config';
import type { ServiceAccount } from 'firebase-admin';

export function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, '\n').trim();
}

type FirebaseServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

export function parseFirebaseServiceAccount(
  config: ConfigService,
): ServiceAccount | null {
  const jsonRaw = config.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON')?.trim();
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw) as FirebaseServiceAccountJson;
      if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
        return null;
      }
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: normalizePrivateKey(parsed.private_key),
      };
    } catch {
      return null;
    }
  }

  const projectId = config.get<string>('FIREBASE_PROJECT_ID')?.trim();
  const clientEmail = config.get<string>('FIREBASE_CLIENT_EMAIL')?.trim();
  const privateKeyRaw = config.get<string>('FIREBASE_PRIVATE_KEY');

  if (!projectId || !clientEmail || !privateKeyRaw) {
    return null;
  }

  return {
    projectId,
    clientEmail,
    privateKey: normalizePrivateKey(privateKeyRaw),
  };
}
