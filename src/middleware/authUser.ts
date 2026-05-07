import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction){
  try{
    const token = req.headers.authorization?.split(' ')[1];
    if(!token) return res.status(401).json({ message: 'Unauthorized' });
    
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET!);

    (req as any).user = {
      id: decodedToken.sub
    };

    next();

  }catch(error){
    return res.status(401).json({
      message: "Invalid token",
    });
  }
}