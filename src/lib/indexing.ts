import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

export async function notifyGoogleIndexingAPI(
  url: string,
  type: 'URL_UPDATED' | 'URL_DELETED' = 'URL_UPDATED'
) {
  try {
    const jsonString = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

    if (!jsonString) {
      console.warn('GOOGLE_SERVICE_ACCOUNT_JSON is missing. Skipping Indexing API notification.');
      return false;
    }

    const credentials = JSON.parse(jsonString);

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const indexing = google.indexing('v3');

    const result = await indexing.urlNotifications.publish({
      auth,
      requestBody: {
        url,
        type,
      },
    });

    console.log(`Google Indexing API notified for ${url} with status: ${result.status}`);
    return true;
  } catch (error: any) {
    console.error('Error notifying Google Indexing API:', error.message);
    return false;
  }
}
