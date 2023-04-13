import jwt from "jsonwebtoken"
import Course from "./../models/Course.js";
import Faculty from "./../models/Faculty.js";

export default async (req, res, next) => {
  try {
    const course = await Course.findOne({
      course_code: req.params.course_code ?? req.body.course_code,
      batch: req.params.batch ?? req.body.batch,
    });
  
    if(!course) {
      return res.status(404).json({
        success: false,
        message: 'Could not find that course'
      })
    }

    if (!course.faculty.includes(req.user._id) 
      && !course.faculty.some(faculty => faculty.email === req.user.email)
      && !req.admin) {
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