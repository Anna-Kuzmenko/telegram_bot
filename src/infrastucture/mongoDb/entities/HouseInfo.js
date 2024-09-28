import mongoose from "mongoose";

export const houseInfoSchema = new mongoose.Schema({
    entrance: String,
    floor: String,
    apartment: String
});