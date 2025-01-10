import { writeFileSync } from "fs";
import dotenv from "dotenv";

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Configuración de Firebase desde las variables de entorno
const firebaseConfig = {
  apiKey: process.env["ANGULAR_FIREBASE_API_KEY"],
  authDomain: process.env["ANGULAR_FIREBASE_AUTH_DOMAIN"],
  projectId: process.env["ANGULAR_FIREBASE_PROJECT_ID"],
  storageBucket: process.env["ANGULAR_FIREBASE_STORAGE_BUCKET"],
  messagingSenderId: process.env["ANGULAR_FIREBASE_MESSAGING_SENDER_ID"],
  appId: process.env["ANGULAR_FIREBASE_APP_ID"],
  measurementId: process.env["ANGULAR_FIREBASE_MEASUREMENT_ID"],
  databaseURL: process.env["ANGULAR_FIREBASE_DATABASE_URL"]
};

// Generar el contenido para el archivo `environment.production.ts`
const content = `
export const environment = {
  production: true,
  firebase: ${JSON.stringify(firebaseConfig, null, 2)}
};
`;

// Escribir el contenido en el archivo `environment.production.ts`
writeFileSync("src/environments/environment.production.ts", content);

// Mostrar mensaje en consola
console.log("Environment variables written to environment.production.ts");
