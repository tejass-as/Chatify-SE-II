import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const conn = await(mongoose.connect(process.env.MONGODB_URL))
        console.log("Database connected " + conn.connection.host)
    } catch (error) {
        console.log("Database not connected " + error)
    }
};