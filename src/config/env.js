import {
  GOOGLE_DRIVE_API_KEY,
  OPENROUTER_API_KEY,
} from '@env';

function requireEnv(value, name) {
  if (!value || String(value).trim() === '') {
    throw new Error(`Variável de ambiente ausente: ${name}. Copie .env.example para .env`);
  }
  return String(value).trim();
}

export const env = {
  googleDriveApiKey: requireEnv(GOOGLE_DRIVE_API_KEY, 'GOOGLE_DRIVE_API_KEY'),
  openRouterApiKey: requireEnv(OPENROUTER_API_KEY, 'OPENROUTER_API_KEY'),
};


