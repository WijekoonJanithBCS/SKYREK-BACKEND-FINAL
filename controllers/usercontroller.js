import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
import OTP from '../models/otp.js';
import nodemailer from 'nodemailer';
import axios from 'axios';
dotenv.config()

const transporter= nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user:"wijekoonjanith72@gmail.com",
        pass: process.env.GMAIL_APP_PASSWORD
    }
})
        

export function createUser(req, res) {

    const hashedPassword = bcrypt.hashSync(req.body.password, 10);

    const user= new User({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: hashedPassword,
    });

    user.save()
        .then(result => {
            return res.status(201).json({
                message: 'User created successfully',
            });
        })
        .catch(err => {
            return res.status(500).json({
                message: 'Error creating user',
            });
        });
}

export function loginuser(req, res) {
    User.findOne({ email: req.body.email })
        .then((user)=>{
            if(user==null){
                return res.status(404).json({
                    message: 'User with given email not found',
                });
            }
            else{
                if(user.isBlocked){
                    return res.status(403).json({
                        message: "User is blocked"
                    });
                }

                const isPasswordValid = bcrypt.compareSync(req.body.password, user.password);
                if(isPasswordValid){

                    const token = jwt.sign({
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        image: user.image,
                        isEmailVerified: user.isEmailVerified
                        
                    } , process.env.JWT_SECRET )
                   
                           
                    //console.log(token);

                    return res.status(200).json({
                        message: 'Login successful',
                        token: token,
                        role: user.role
                    });
                }
                else{
                    return res.status(401).json({
                        message: 'Invalid password',
                    });
                }
            }
        })
}

export function getUser(req, res) {
    if(req.user == null){
        return res.status(401).json({
            message: 'Unauthorized',
        });
    }
    res.json({
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        image: req.user.image,
        isEmailVerified: req.user.isEmailVerified
    });
}

export async function updateUserProfile(req, res){
    if(req.user == null){
        res.status(401).json({
            message: "unauthorized"
        })
        return
    }
    try{
        await User.updateOne({email: req.user.email}, {firstName: req.body.firstName, lastName: req.body.lastName, image: req.body.image})
        const user = await User.findOne({email: req.user.email})
         const token = jwt.sign({
                        email: user.email,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        role: user.role,
                        image: user.image,
                        isEmailVerified: user.isEmailVerified
                        
                    } , process.env.JWT_SECRET )
                    
                    res.json({
                        message: "profile updated successfully", token: token
                    })
                   
    }
    catch(error){
        res.json({message: "error updating profile", error: error})
    }
    
}

export async function ChangeUserPassowrd(req, res){
    if(req.user==null){
        res.status(401).json({
            message: "unauthorized"
        })
        return
    }
    try{
        const hashedPassword = bcrypt.hashSync(req.body.password, 10); // no need double bracets 
         await User.updateOne({email: req.user.email}, {password: hashedPassword})
         res.json({
            message: "password changed successfully"
         })
    }
    catch(error){
        res.status(500).json({message: "error creating password", error: error})
        console.log(error)
    }
}

export function isAdmin(req){
    if(req.user == null){
        return false;
    }
    if(req.user.role != "admin"){
        return false;
    }
    return true;
}

export async function sendOTP(req, res){
    try{
        const user = await User.findOne({email: req.body.email})
        if(user==null){
            res.status(404).json({
                message: "user not found"
            })
            return
        }
        //generate OTP between 100000 and 999999
        const otp = Math.floor(100000 + Math.random() * 900000);

        await OTP.deleteMany({email: req.body.email});

        const newOTP = new OTP({
            email: req.body.email,
            otp: otp
        });
        await newOTP.save();
        const message = {
            from: "wijekoonjanith72@gmail.com",
            to: req.body.email,
            subject: "OTP for password reset",
            text: `Your OTP for password reset is ${otp}`
        
        }
        transporter.sendMail(message, (err, info)=>{
            if(err){
                console.log("Error sending OTP:", err);
                res.status(500).json({message: "error sending OTP", error: err})
                
            }
            else{
                console.log("OTP sent successfully:", info.response);
                res.json({message: "OTP sent successfully"})

            }
        })
    }
    catch(error){
        res.status(500).json({message: "error sending OTP", error: error})

    }

}

export async function verifyOTP(req, res){
    try{
        const otpCode = req.body.otp;
        const email= req.body.email;
        const newPassword = req.body.newPassword;

        const otp = await OTP.findOne({email: email,});
        if(otp==null){
            res.status(404).json({
                message: "OTP not found for the given email"})
            return
        }
        if(otp.otp != otpCode){
            res.status(400).json({
                message: "Invalid OTP"})
            return
        }
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await User.updateOne({email: email}, {password: hashedPassword})
        await OTP.deleteOne({email: email})
        res.json({
            message: "Password reset successfully",
            
        })
    }
    catch(error){
        res.status(500).json({message: "error verifying OTP", error: error})
    }
}

export async function googleLogin(req, res){
    try{
        const googleresponse = await axios.get ("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: {
                Authorization : "Bearer" + req.body.token
            }
        })
        console.log(googleresponse)
        const user = await User.findOne({email : googleresponse.data.email})
        console.log(user)
        
        if(user ==null){
            const newUser = new User({
                email: googleresponse.data.email,
                firstName: googleresponse.data.given_name,
                lastName: googleresponse.data.family_name,
                password: "google-login",
                image: googleresponse.data.picture,
                isEmailVerified: true
            })
            await newUser.save()

            const token = jwt.sign({
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: newUser.role,
                image: newUser.image,
                isEmailVerified: newUser.isEmailVerified
        },
        process.env.JWT_SECRET
        //{ expiresIn: req.body.rememberme ? "30d" : "48h"}
    );
    res.json({
        message: "Login successful",
        token: token,
        role: newUser.role
    });

        }
        else{
            if(user.isBlocked){
                res.status(403).json({
                    message: "User is blocked"
                })
                return
            }

            const token = jwt.sign ({
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role:user.role,
                image:user.image,
                isEmailVerified: user.isEmailVerified
            },
            process.env.JWT_SECRET
            //{ expiresIn: req.body.rememberme ? "30d" : "48h"}
        );
        res.json({
            message: "Login successful",
            token: token,
            role: user.role
        })
        }
    }
    catch(error){
        console.log("Error logging in with google:", error)
        res.status(500).json({message: "Error logging in with google", error: error})
    }
}

export async function getAllUsers(req, res){
    console.log("came to get all users")

    // console.log("REQ.USER:", req.user);
    console.log("IS ADMIN:", isAdmin(req));
    //frontend eken ena request eka enne methanata e nisa api methanadith check karala balamu catch ekak dala error eka  mokakda kiyala

    if(!isAdmin(req)){
        res.status(403).json({
            message: "Forbidden"
        })
        return
    }
    try{
        //pageSizeI"N"String -> N akura capital thiyenne.👇
        // const pageSizeINString = req.params.pageSize || "10";
         const pageSizeInString = req.params.pageSize || "10";
        const pageNumberInString = req.params.pageNumber || "1";
        const pageSize = parseInt(pageSizeInString);
        const pageNumber = parseInt(pageNumberInString);

        const numberOfusers = await User.countDocuments();
        const numberOfPages = Math.ceil(numberOfusers / pageSize);
                    //  👇                  👇 MENNA ME WARAHAN DEKA ANAWASHYAI. Eka ain karama wade hari. 
        // const usres = (await User.find({})).skip((pageNumber - 1) * pageSize).limit(pageSize);
        const usres = await User.find({}).skip((pageNumber - 1) * pageSize).limit(pageSize);
                //  |        1️⃣          |             2️⃣                |       3️⃣      |
                // 1️⃣ - Usersla okkoma hoyaganna code eka
                // 2️⃣ - Api page walata kadala users lawa ganiddi mulin thiyena kalin page walata aithi data skip karna code eka
                // 3️⃣ - Api page walata kadala users lawa ganiddi illana page eken passe page wala thiyena data tika ain karana code eka
         res.json({
            //message: "Users fetched successfully",
            users: usres,
            totalPages: numberOfPages
        })
    }
    catch(error){
        //error eka print karanawa
        console.log(error)
        res.status(500).json({message: "Error getting all users", error: error})
    }
}

export async function blockOrUnblockUser(req, res){
    if(!isAdmin(req)){
        res.status(403).json({
            message: "Forbidden"
        })
        return
    }
    const email = req.body.email;

    if(req.user.email === email){
        res.status(400).json({
            message: "You cannot block/unblock yourself"
        })
        return
    }
    try{
        const user = await User.findOne({email: email});
        if(user==null){
            res.status(404).json({
                message: "User not found"
            })
            return
        }
        await User.updateOne({email: email}, {isBlocked: !user.isBlocked})
        res.json({
            message: `User ${user.isBlocked ? "unblocked" : "blocked"} successfully`
        })
    }
    catch(error){
        res.status(500).json({message: "Error blocking/unblocking user", error: error})
    }
}

export async function changeRole(req, res){
    if(!isAdmin(req)){
        res.status(403).json({
            message: "Forbidden"
        })
        return
    }
    const email = req.body.email;
    
    if(req.user.email === email){
        res.status(400).json({
            message: "You cannot change your own role"
        })
        return
    }
    try{
        const user = await User.findOne({email: email});
        if(user==null){
            res.status(404).json({
                message: "User not found"
            })
            return
        }
        await User.updateOne({email: email}, {role: user.role === "admin" ? "customer" : "admin"})
        res.json({
            message: `User role changed to ${user.role === "admin" ? "customer" : "admin"} successfully`
        })
    }
    catch(error){
        res.status(500).json({message: "Error changing user role", error: error})
    }
}

