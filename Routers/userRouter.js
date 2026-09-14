import express from "express";
import { blockOrUnblockUser, changeRole, ChangeUserPassowrd, createUser, getAllUsers, getUser, googleLogin, loginuser, sendOTP, updateUserProfile, verifyOTP } from "../controllers/usercontroller.js";
//import { verify } from "jsonwebtoken";


const userRouter = express.Router();

userRouter.post("/", createUser)

userRouter.post("/login", loginuser)

userRouter.put("/update-password", ChangeUserPassowrd)

userRouter.post("/send-otp", sendOTP)

userRouter.post("/verify-otp", verifyOTP)

userRouter.post("/google-login", googleLogin)

userRouter.post("/toggle-block", blockOrUnblockUser)

userRouter.post("/toggle-role", changeRole)

userRouter.get("/profile", getUser )

userRouter.get("/all/:pageSize/:pageNumber" , getAllUsers)

userRouter.put("/updateUserProfile", updateUserProfile)

export default userRouter;
