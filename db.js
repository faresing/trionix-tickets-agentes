import mongoose from "mongoose";

export async function conectarDB() {
  if (!process.env.MONGODB_URI) {
    throw new Error("Falta configurar MONGODB_URI en el archivo .env");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("MongoDB conectado correctamente");
}