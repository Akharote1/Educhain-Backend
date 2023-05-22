import { calculateWeightedScore, getGradePoints } from "../misc/utils.js";
import Course from "../models/Course.js";
import ExamResult from "../models/ExamResult.js"
import Student from "../models/Student.js";
import { sendResultEmail } from "../services/mail.js";
import { generateMarksheetDocument } from "../services/marksheet.js";

export const list = async (req, res) => {
  try {
    const results = await ExamResult.find({}, "year semester students_batch students_branch _id courses semester_number");
    return res.status(200).send({
      success: true,
      results
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const view = async (req, res) => {
  try {
    const result = await ExamResult.findOne({_id: req.params.id}).populate("courses", "name course_code credits_theory credits_lab year semester _id");

    if (!result) {
      return res.status(404).send({
        success: false,
        message: "Result not found"
      })
    }

    return res.status(200).send({
      success: true,
      result
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const preview = async (req, res) => {
  const { year, semester, batch, branch } = req.body;

  const students = await Student.find({ batch, branch });
  const studentUids = students.map(x => x.uid);
  const courses = await Course.find({year, semester, "enrolled_students.uid": {$in: studentUids}}, "name course_code enrolled_students");

  return res.status(200).send({
    success: true,
    student_count: students.length,
    courses: courses.map(x => ({
      name: x.name,
      course_code: x.course_code,
      students: x.enrolled_students.filter(y => studentUids.includes(y.uid)).length
    })),
    year,
    batch,
    branch,
    semester
  });
}

export const create = async (req, res) => {
  const { year, semester, batch, branch, courses: courseCodes, semester_number } = req.body;
  try {
    const oldResult = await ExamResult.find({year, semester, students_batch: batch, students_branch: branch});

    if (oldResult.length > 0) {
      return res.status(400).send({
        success: false,
        message: "Result with given criteria already exists"
      })
    }

    const courses = await Course.find({year, semester, course_code: {$in: courseCodes}}, "name course_code enrolled_students _id");
    if (courses.length !== courseCodes.length) {
      return res.status(400).send({
        success: false,
        message: "Invalid course codes"
      })
    }
    
    const result = await ExamResult.create({
      year,
      semester,
      students_batch: batch,
      students_branch: branch,
      semester_number: semester_number,
      courses: courses.map(x => x._id),
    });

    const finalResult = await generateResults(result._id);

    res.status(200).send({
      success: true,
      finalResult
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const generate = async (req, res) => {
  const result = await generateResults(req.body.result_id);

  if (!result) {
    return res.status(404).send({
      success: false,
      message: "Result not found"
    })
  }

  return res.status(200).send({
    success: true,
    result
  })
}

export const generateResults = async (result_id) => {
  const result = await ExamResult.findOne({_id: result_id});
  if (!result) return null;

  const { year, semester, students_batch: batch, students_branch: branch } = result;
  const students = await Student.find({ batch, branch });

  const courses = await Course.find({_id: {$in: result.courses}});
  const studentResults = [];

  for (const student of students) {
    const studentResult = {
      uid: student.uid,
      name: student.name,
      failed: false,
      courses: {}
    };

    const coursesSet = new Set();

    for (const course of courses) {
      const studentCourse = course.enrolled_students.find(x => x.uid === student.uid);
      if (!studentCourse) continue;

      const courseLabel = ['hss', 'seva-satva'].includes(course.course_type) ? course.course_type : course.course_code;

      studentResult.courses[courseLabel] = ({
        course_id: course._id,
        course_code: course.course_code,
        course_name: course.name,
        course_type: course.course_type,
        course_label: courseLabel,
        score: calculateWeightedScore(studentCourse, course),
        grade: studentCourse.grade,
        grade_points: getGradePoints(studentCourse.grade),
        credits: (course.credits_theory + course.credits_lab) * getGradePoints(studentCourse.grade)
      })

      coursesSet.add(course.course_code)

      if (studentResult.courses[courseLabel].grade_points === 0) studentResult.failed = true;
    }

    const denom = courses.filter(x => coursesSet.has(x.course_code)).reduce((a, b) => a + (b.credits_theory || + b.credits_lab), 0);
    if (denom != 0 && !studentResult.failed) {
      studentResult.sgpa = Object.values(studentResult.courses).reduce((a, b) => a + (b.credits || 0), 0) / denom;
      studentResult.sgpa = studentResult.sgpa.toFixed(2);
    } else {
      studentResult.sgpa = 0;
    }
    
    studentResults.push(studentResult);
  }

  studentResults.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ));

  result.result_data = studentResults;
  result.generated_at = new Date();
  await result.save();
  await recalculateCGPAs(batch, branch);

  return await ExamResult.findOne({_id: result_id});
}

export const generateMarksheet = async (req, res) => {
  const { result_id, uid } = req.params;
  const result = await ExamResult.findOne({_id: result_id}).lean();

  if (!result) {
    return res.status(404).send({
      success: false,
      message: "Result not found"
    })
  }

  const studentResult = result.result_data.find(x => x.uid === uid);
  const student = await Student.findOne({uid});

  if (!studentResult || !student) {
    return res.status(404).send({
      success: false,
      message: "Student not found"
    })
  }

  const file = await generateMarksheetDocument({
    sgpa: studentResult.sgpa,
    cgpa: studentResult.cgpa,
    student_name: studentResult.name,
    student_uid: studentResult.uid + '',
    student_branch: student.branch,
    student_batch: student.batch + '',
    semester: result.year + '- ' + result.semester,
    courses: Object.values(studentResult.courses).map(x => ({
      course_code: x.course_code,
      course_name: x.course_name,
      course_credits: (x.credits / x.grade_points) || '-',
      grade: x.grade,
    }))
  })

  res.writeHead(200, [
    ['Content-Type', 'application/pdf'],
    ["Content-Disposition", `attachment; filename=${student.name} Marksheet - Semester ${result.semester_number}.pdf`]
  ]);
  res.end(file);
}

export const declareResult = async (req, res) => {
  const uid = req.body.uid;
  const result = await ExamResult.findOne({_id: req.body.result_id}).lean();

  if (!result) {
    return res.status(404).send({
      success: false,
      message: "Result not found"
    })
  }

  const studentResult = result.result_data.find(x => x.uid === uid);
  const student = await Student.findOne({uid});

  if (!studentResult || !student) {
    return res.status(404).send({
      success: false,
      message: "Student not found"
    })
  }

  const file = await generateMarksheetDocument({
    sgpa: studentResult.sgpa,
    cgpa: studentResult.sgpa,
    student_name: studentResult.name,
    student_uid: studentResult.uid + '',
    student_branch: student.branch,
    student_batch: student.batch + '',
    semester: result.year + '- ' + result.semester,
    courses: Object.values(studentResult.courses).map(x => ({
      course_code: x.course_code,
      course_name: x.course_name,
      course_credits: (x.credits / x.grade_points) || '-',
      grade: x.grade,
    }))
  })

  sendResultEmail(
    "aditya.kharote@spit.ac.in", 
    `Results Declared for Semester ${result.semester_number}`,
    "Dear Student, <br><br> Your results for the semester have been declared. Please find the attached marksheet for the same. <br><br> Regards, <br> SPIT",
    [{
      filename: `${student.name} Marksheet - Semester ${result.semester_number}.pdf`,
      content: file
    }]
  )
}

export const recalculateCGPAs = async (batch, branch) => {
  const results = await ExamResult.find({students_batch: batch, students_branch: branch});
  const studentSGPAs = {};

  for (const result of results) {
    const courses = await Course.find({_id: {$in: result.courses}});

    for (const studentResult of result.result_data) {
      if (!studentSGPAs[studentResult.uid]) studentSGPAs[studentResult.uid] = {earned: 0, credits: 0};
      for (const course of courses) {
        const studentCourse = course.enrolled_students.find(x => x.uid === studentResult.uid);
        if (!studentCourse) continue;
        
        studentSGPAs[studentResult.uid].earned += (course.credits_theory + course.credits_lab) * getGradePoints(studentCourse.grade);
        studentSGPAs[studentResult.uid].credits += (course.credits_theory + course.credits_lab);
      } 
    }
  }

  const studentCGPAs = {};

  for (const student in studentSGPAs) {
    let denom = studentSGPAs[student].credits;
    denom = denom === 0 ? 1 : denom;

    const cgpa = (studentSGPAs[student].earned / denom).toFixed(2);
    studentCGPAs[student] = cgpa;
    await Student.updateOne({uid: student}, { cgpa });
  }

  for (const result of results) {
    for (const studentResult of result.result_data) {
      studentResult.cgpa = studentCGPAs[studentResult.uid];
    }
    await result.save();
  }
}