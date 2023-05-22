import Course from "../models/Course.js";
import ExamResult from "../models/ExamResult.js";
import Student from "../models/Student.js";

export const statistics = async (req, res) => {
  const students = await Student.count({});
  const courses = await Course.count({});
  const results = await ExamResult.count({status: {$not: {$eq: "declared"}}});
  
  return res.status(200).send({
    success: true,
    students,
    courses, 
    results
  });
}