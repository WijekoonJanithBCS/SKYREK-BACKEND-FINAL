import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export default function authorizeUser(req, res, next) {
    const header = req.headers['authorization'];
    //console.log("Authorization header:", req.headers.authorization);

    if (!header) {
        // No token → continue as guest
        return next();
    }

    const token = header.replace("Bearer ", "");

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Token invalid → stop here
            return res.status(401).json({ message: "Unauthorized, invalid token" });
        }

        // Token valid → attach user and continue
        req.user = decoded;
        //console.log("DECODED USER:", decoded);
        //console.log("ROLE:", decoded?.role);
        return next(); // ✅ call next exactly once
    });
} 