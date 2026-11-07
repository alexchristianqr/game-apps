import { writeFileSync } from "fs";
import dotenv from "dotenv";

// Carga las variables desde `.env` (en CI vienen del entorno).
dotenv.config();

const env = process.env;

const firebaseConfig = {
  apiKey: env["ANGULAR_FIREBASE_API_KEY"],
  authDomain: env["ANGULAR_FIREBASE_AUTH_DOMAIN"],
  projectId: env["ANGULAR_FIREBASE_PROJECT_ID"],
  storageBucket: env["ANGULAR_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: env["ANGULAR_FIREBASE_MESSAGING_SENDER_ID"],
  appId: env["ANGULAR_FIREBASE_APP_ID"],
  measurementId: env["ANGULAR_FIREBASE_MEASUREMENT_ID"],
  databaseURL: env["ANGULAR_FIREBASE_DATABASE_URL"]
};

// Sin estas no funciona ni Auth ni Firestore: un fallo de configuración no se publica (P9).
// Las demás son opcionales (analítica, Realtime Database).
const required = ["ANGULAR_FIREBASE_API_KEY", "ANGULAR_FIREBASE_AUTH_DOMAIN", "ANGULAR_FIREBASE_PROJECT_ID", "ANGULAR_FIREBASE_APP_ID"];
const missing = required.filter((name) => !env[name]);

if (missing.length > 0) {
  console.error(`Faltan variables obligatorias: ${missing.join(", ")}`);
  process.exit(1);
}

const content = `export const environment = {
  production: true,
  firebase: ${JSON.stringify(firebaseConfig, null, 2)}
};
`;

writeFileSync("src/environments/environment.production.ts", content);

// El entorno de desarrollo es el mismo contrato; en CI lo necesitan los specs y el lint.
writeFileSync("src/environments/environment.development.ts", content.replace("production: true", "production: false"));

console.log("Escritos environment.production.ts y environment.development.ts (sin imprimir valores)");
