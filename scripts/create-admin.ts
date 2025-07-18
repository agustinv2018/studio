import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
dotenv.config({ path: '.env' });

async function main() {
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        console.error("❌ Error: Las variables de entorno FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, y FIREBASE_PRIVATE_KEY son requeridas.");
        process.exit(1);
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      });
    }

    const email = "admin@ejemplo.com";
    const password = "password";

    try {
        let userRecord;
        try {
            // Verificar si el usuario ya existe
            userRecord = await admin.auth().getUserByEmail(email);
            console.log(`El usuario "${email}" ya existe con UID: ${userRecord.uid}`);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Si no existe, crearlo
                userRecord = await admin.auth().createUser({
                    email: email,
                    password: password,
                    displayName: "Admin User",
                });
                console.log("✅ Usuario administrador creado:", userRecord.uid);
            } else {
                throw error; // Lanzar otros errores
            }
        }

        await admin.firestore().doc(`usuarios/${userRecord.uid}`).set({
          nombre: "Admin User",
          email: email,
          rol: "admin",
          fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log("✅ Documento Firestore creado/actualizado para el usuario admin.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error creando o actualizando usuario admin:", error);
        process.exit(1);
    }
}

main();
