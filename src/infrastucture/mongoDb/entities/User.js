import mongoose from "mongoose";
import {houseInfoSchema} from "./HouseInfo.js";
export const userSchema = new mongoose.Schema({
    tgId: { type: String, unique: true, required: true, index: true },
    firstName: String,
    lastName: String,
    username: String,
    type: String,
    houseInfo: {
        type: houseInfoSchema,
        default: null
    }
}, {
    timestamps: true
})

export const User = mongoose.model('User', userSchema);
