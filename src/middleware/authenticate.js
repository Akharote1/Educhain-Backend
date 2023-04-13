import jwt from "jsonwebtoken"
import Faculty from "./../models/Faculty.js";

export default async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.userData = decoded;

    const user = await Faculty.findOne({_id: req.userData.id})
  
    if(!user) {
      return res.status(400).json({
        success: false,
        message: 'Could not find user'
      })
    }

    req.user = user;
    req.admin = user.admin

    next()
  } catch (err) {
    console.log(err)
    return res.status(401).json({
      status: false,
      message: 'Missing or invalid authentication token'
    });
  }
}