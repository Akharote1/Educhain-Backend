import jwt from "jsonwebtoken"
import Course from "../models/Course.js";
import Faculty from "../models/Faculty.js";

export default async (req, res, next) => {
  try {
    if (!req.admin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this resource.'
      })
    }

    next()
  } catch (err) {
    console.log(err)
    return res.status(401).json({
      status: false,
      message: 'Missing or invalid authentication token'
    });
  }
}