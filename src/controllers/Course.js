import { calculateGrades } from "../misc/utils.js";
import Course from "../models/Course.js"
import ExamResult from "../models/ExamResult.js";
import Faculty from "../models/Faculty.js";
import Student from "../models/Student.js";

export const list = async (req, res) => {
  const limit = req.query.limit ?? 20;
  const page = req.query.page ?? 1;
  const query = {};

  if (req.query.query && req.query.query != '') {
    query['$or'] = [
      {name: {$regex: req.query.query, $options: 'i'}},
      {course_code: {$regex: req.query.query, $options: 'i'}}
    ]
  }

  if (req.query.year && req.query.year != 'all') {
    query.year = req.query.year;
  }

  let courses = await Course.find(query).skip((page - 1) * limit).limit(limit);
  courses = courses.filter(course => req.user.admin || course.faculty.some(x => x.email == req.user.email))
  courses = courses.map(course => {
    const out = course.toObject();
    out.student_count = course.enrolled_students.length;
    out.enrolled_students = undefined;
    return out;
  })
  const count = await Course.count(query);

  res.status(200).json({
    courses,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(count / limit),
      total_count: count,
      limit,
      start: (page - 1) * limit + 1,
      end: Math.min(page * limit, count)
    },
  })
}

export const get = async (req, res) => {
  const course = await Course.findOne({year: req.params.year, semester: req.params.semester, course_code: req.params.course_code});
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.params.course_code} in ${req.params.year}-${req.params.semester}`
    })
  }

  res.status(200).json({
    success: true,
    course
  })
}

export const add = async (req, res) => {
  try {
    if (await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester})) {
      return res.status(400).send({
        success: false,
        message: "A Course with that Course Code already exists in that batch"
      })
    }

    const course = await Course.create({
      name: req.body.name,
      course_code: req.body.course_code,
      course_type: req.body.course_type,
      credits_theory: req.body.credits_theory,
      credits_lab: req.body.credits_lab,
      semester: req.body.semester,
      year: req.body.year,
      weightage_theory_ise: req.body.weightage_theory_ise,
      weightage_theory_mse: req.body.weightage_theory_mse,
      weightage_theory_ese: req.body.weightage_theory_ese,
      weightage_lab_ise: req.body.weightage_lab_ise,
      weightage_lab_mse: req.body.weightage_lab_mse,
      weightage_lab_ese: req.body.weightage_lab_ese,
    })

    recalculateStatistics(course.course_code, course.year, course.semester);

    return res.status(200).send({
      success: true,
      course
    })
  } catch (error) {
    return res.status(500).send({
      success: false,
      message: error.toString()
    })
  }
}

export const deleteCourse = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.params.course_code} in ${req.params.year}-${req.params.semester}`
    })
  }

  await course.deleteOne(); 
 
  const results = await ExamResult.find({courses: course._id});

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    result.courses = result.courses.filter(x => x._id.toString() != course._id.toString())
    
    result.result_data.forEach(student => {
      student.courses[course.course_code] = undefined;
    })

    await result.save()
  }

  res.status(200).json({
    success: true,
    message: "Course deleted successfully" 
  })
}  
  
export const enrollStudent = async (req, res) => { 
  const uid = req.body.uid;
  const course_code = req.body.course_code;
  const course = await Course.findOne({ course_code, year: req.body.year, semester: req.body.semester }, "enrolled_students course_code year semester");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "That course does not exist"
    })
  }

  if (course.enrolled_students.some(x => x.uid == uid)) {
    return res.status(400).json({
      success: false,
      message: "Student is already enrolled in this course"
    })
  }

  const student = await Student.findOne({uid}, "name uid _id batch branch").lean();

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "That student does not exist"
    })
  }

  const enrolledStudent = {
    student_id: student._id,
    uid: uid,
    name: student.name,
    batch: student.batch,
    branch: student.branch
  }
  course.enrolled_students.push(enrolledStudent);

  course.enrolled_students.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ))

  await course.save()

  await recalculateStatistics(course.course_code, course.year, course.semester);
  await calculateCourseGrades(course.course_code, course.year, course.semester);

  res.status(200).json({
    success: true,
    student: enrolledStudent
  })
}

export const bulkEnrollStudents = async (req, res) => {
  const students = req.body.students;
  const course_code = req.body.course_code;
  const course = await Course.findOne({ course_code, year: req.body.year, semester: req.body.semester }, "enrolled_students course_code batch");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "That course does not exist"
    })
  }

  const commonStudents = course.enrolled_students.filter(x => (
    students.some(y => y.uid == x.uid)
  ));

  if (commonStudents.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Students ${commonStudents.map(x => x.uid).join(',')} are already enrolled in this course`
    })
  }

  const studentsData = await Student.find({uid: {$in: students.map(x => x.uid)}}, "name uid _id batch branch").lean();

  const enrolledStudents = studentsData.map(x => ({
    student_id: x._id,
    uid: x.uid,
    name: x.name,
    batch: x.batch,
    branch: x.branch
  }));
  course.enrolled_students = [...course.enrolled_students, ...enrolledStudents]
  course.enrolled_students.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ))

  await course.save()
  
  await recalculateStatistics(course.course_code, course.year, course.semester);
  await calculateCourseGrades(course.course_code, course.year, course.semester);
  
  res.status(200).json({
    success: true
  })
}

export const removeStudent = async (req, res) => {
  const course_code = req.body.course_code;
  const course = await Course.findOne({ course_code, year: req.body.year, semester: req.body.semester }, "enrolled_students course_code batch");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "That course does not exist"
    })
  }

  course.enrolled_students = course.enrolled_students.filter(x => x.uid != req.body.uid);
  course.enrolled_students.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ))

  await course.save()

  await recalculateStatistics(course.course_code, course.year, course.semester);
  await calculateCourseGrades(course.course_code, course.year, course.semester);
  
  res.status(200).json({
    success: true
  })
}

export const importGrades = async (req, res) => {
  const students = req.body.students;
  const course_code = req.body.course_code;
  const course = await Course.findOne({ course_code, year: req.body.year, semester: req.body.semester }, "enrolled_students course_code year semester");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "That course does not exist"
    })
  }

  if (course.scores_locked && !req.user.admin) {
    return res.status(400).json({
      success: false,
      message: "Scores have already been locked for this course"
    })
  }

  const uncommonStudents = students.filter(x => (
    course.enrolled_students.every(y => y.uid != x.uid)
  ));

  if (uncommonStudents.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Students ${uncommonStudents.map(x => x.uid).join(',')} are not enrolled in this course`
    })
  }

  const studentMap = {};
  students.forEach(x => {
    studentMap[x.uid] = x;
  });

  let maxScoreError = null;

  course.enrolled_students.forEach(x => {
    if (studentMap[x.uid]) {
      const gradeData = studentMap[x.uid];
      x.score_theory_ise = gradeData.score_theory_ise ?? x.score_theory_ise;
      x.score_theory_mse = gradeData.score_theory_mse ?? x.score_theory_mse;
      x.score_theory_ese = gradeData.score_theory_ese ?? x.score_theory_ese;
      x.score_lab_ise = gradeData.score_lab_ise ?? x.score_lab_ise;
      x.score_lab_mse = gradeData.score_lab_mse ?? x.score_lab_mse;
      x.score_lab_ese = gradeData.score_lab_ese ?? x.score_lab_ese;

      if (x.score_theory_ise > course.weightage_theory_ise) {  maxScoreError = "Theory ISE" }
      if (x.score_theory_mse > course.weightage_theory_mse) {  maxScoreError = "Theory MSE" }
      if (x.score_theory_ese > course.weightage_theory_ese) {  maxScoreError = "Theory ESE" }
      if (x.score_lab_ise > course.weightage_lab_ise) {  maxScoreError = "Lab ISE" }
      if (x.score_lab_mse > course.weightage_lab_mse) {  maxScoreError = "Lab MSE" }
      if (x.score_lab_ese > course.weightage_lab_ese) {  maxScoreError = "Lab ESE" } 
    }
  })

  if (maxScoreError) {
    return res.status(400).json({
      success: false,
      message: `Scores for ${maxScoreError} cannot be greater than the maximum score for that component`
    })
  }

  course.enrolled_students.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ))

  await course.save()

  await recalculateStatistics(course.course_code, course.year, course.semester);
  await calculateCourseGrades(course.course_code, course.year, course.semester);

  res.status(200).json({
    success: true
  })
}

export const updateGrades = async (req, res) => {
  const uid = req.body.uid;
  const course_code = req.body.course_code;
  const course = await Course.findOne({ course_code, year: req.body.year, semester: req.body.semester });

  if (!course) {
    return res.status(404).json({
      success: false,
      message: "That course does not exist"
    })
  }

  if (course.scores_locked && !req.user.admin) {
    return res.status(400).json({
      success: false,
      message: "Scores have already been locked for this course"
    })
  }

  const student = course.enrolled_students.find(x => x.uid == uid);

  if (!student) {
    return res.status(404).json({
      success: false,
      message: "That student is not enrolled in this course"
    })
  }

  student.score_theory_ise = req.body.score_theory_ise ?? student.score_theory_ise;
  student.score_theory_mse = req.body.score_theory_mse ?? student.score_theory_mse;
  student.score_theory_ese = req.body.score_theory_ese ?? student.score_theory_ese;
  student.score_lab_ise = req.body.score_lab_ise ?? student.score_lab_ise;
  student.score_lab_mse = req.body.score_lab_mse ?? student.score_lab_mse;
  student.score_lab_ese = req.body.score_lab_ese ?? student.score_lab_ese;
  student.flag_not_present = req.body.flag_not_present ?? false;
  student.flag_defaulter = req.body.flag_defaulter ?? false;

  if (student.score_theory_ise > course.weightage_theory_ise) {
    return res.status(400).json({
      success: false,
      message: `The maximum Theory ISE score is ${course.weightage_theory_ise}`
    })
  }

  if (student.score_theory_mse > course.weightage_theory_mse) {
    return res.status(400).json({
      success: false,
      message: `The maximum Theory MSE score is ${course.weightage_theory_mse}`
    })
  }

  if (student.score_theory_ese > course.weightage_theory_ese) {
    return res.status(400).json({
      success: false,
      message: `The maximum Theory ESE score is ${course.weightage_theory_ese}`
    })
  }

  if (student.score_lab_ise > course.weightage_lab_ise) {
    return res.status(400).json({
      success: false,
      message: `The maximum Lab ISE score is ${course.weightage_lab_ise}`
    })
  }

  if (student.score_lab_mse > course.weightage_lab_mse) {
    return res.status(400).json({
      success: false,
      message: `The maximum Lab MSE score is ${course.weightage_lab_mse}`
    })
  }

  if (student.score_lab_ese > course.weightage_lab_ese) {
    return res.status(400).json({
      success: false,
      message: `The maximum Lab ESE score is ${course.weightage_lab_ese}`
    })
  }

  course.enrolled_students.sort((a, b) => (
    a.uid.localeCompare(b.uid)
  ))

  await course.save()

  await recalculateStatistics(course.course_code, course.year, course.semester);
  await calculateCourseGrades(course.course_code, course.year, course.semester);
  
  res.status(200).json({
    success: true,
    student
  })
}

export const listStudents = async (req, res) => {
  try {
    const course = await Course.findOne({course_code: req.params.course_code, year: req.params.year, semester: req.params.semester}, "enrolled_students");
    
    if (!course) {
      return res.status(404).json({
        success: false,
        message: `Could not find course ${req.params.course_code} in ${req.params.year}-${req.params.semester}`
      })
    }

    res.status(200).json({
      success: true,
      enrolled_students: course.enrolled_students.sort((a, b) => a.uid.localeCompare(b.uid))
    })
  } catch (error) {
    
  }
}

export const recalculateStatistics = async (course_code, year, semester) => {
  const course = await Course.findOne({course_code, year, semester}, "enrolled_students statistics");

  if (!course) {
    console.log("Course not found in Recalculate Statistics")
    return;
  }

  const students = course.enrolled_students;

  const getTotalScore = (student) => {
    return (student.score_theory_ise || 0) 
    + (student.score_theory_mse || 0) 
    + (student.score_theory_ese || 0) 
    + (student.score_lab_ise || 0) 
    + (student.score_lab_mse || 0) 
    + (student.score_lab_ese || 0);
  }

  // Calculate the average scores
  const statistics = {
    student_count: students.length,
    mean_theory_ise: students.reduce((acc, x) => acc + (x.score_theory_ise || 0), 0) / students.length || 0,
    mean_theory_mse: students.reduce((acc, x) => acc + (x.score_theory_mse || 0), 0) / students.length || 0,
    mean_theory_ese: students.reduce((acc, x) => acc + (x.score_theory_ese || 0), 0) / students.length || 0,
    mean_lab_ise: students.reduce((acc, x) => acc + (x.score_lab_ise || 0), 0) / students.length || 0,
    mean_lab_mse: students.reduce((acc, x) => acc + (x.score_lab_mse || 0), 0) / students.length || 0,
    mean_lab_ese: students.reduce((acc, x) => acc + (x.score_lab_ese || 0), 0) / students.length || 0,
    mean_total: students.reduce((acc, x) => acc + getTotalScore(x), 0) / students.length || 0,
    median_total: students.map(x => getTotalScore(x)).sort().slice(Math.floor(students.length / 2), Math.floor(students.length / 2) + 1)[0] || 0
  }

  course.statistics = statistics;
  await course.save();
} 

export const getStatistics = async (req, res) => {
  const course = await Course.findOne({course_code: req.params.course_code, year: req.params.year, semester: req.params.semester}, "statistics");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.params.course_code} in ${req.params.year}-${req.params.semester}`
    })
  }

  res.status(200).json({
    success: true,
    statistics: course.statistics
  })
}

export const addFaculty = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.body.course_code} in ${req.body.year}-${req.body.semester}`
    })
  }

  const faculty = await Faculty.findOne({email: req.body.email});

  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: `Could not find faculty with email ${req.body.email}`
    })
  }

  const alreadyAdded = course.faculty.find(x => x.email === req.body.email);

  if (alreadyAdded) {
    return res.status(400).json({
      success: false,
      message: `Faculty with email ${req.body.email} is already added to the course`
    })
  }

  course.faculty.push({
    email: faculty.email,
    name: faculty.name,
    faculty_id: faculty._id
  });

  await course.save();

  res.status(200).json({
    success: true,
    faculty: course.faculty
  })
}

export const removeFaculty = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.body.course_code} in ${req.body.year}-${req.body.semester}`
    })
  }

  const faculty = course.faculty?.find(x => x.email === req.body.email);

  if (!faculty) {
    return res.status(404).json({
      success: false,
      message: `Faculty with email ${req.body.email} is not added to the course`
    })
  }

  course.faculty = course.faculty.filter(x => x.email !== req.body.email);

  await course.save();

  res.status(200).json({
    success: true,
    faculty: course.faculty
  })
}

export const listFaculties = async (req, res) => {
  const course = await Course.findOne({course_code: req.params.course_code, year: req.params.year, semester: req.params.semester}, "faculty");

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.params.course_code} in ${req.params.year}-${req.params.semester}`
    })
  }

  res.status(200).json({
    success: true,
    faculty: course.faculty
  })
}

export const lockMarks = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.body.course_code} in ${req.body.year}-${req.body.semester}`
    })
  }

  const flag = req.body.locked;

  if (course.scores_locked == flag) {
    return res.status(400).json({
      success: false,
      message: `Scores for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} are already ${flag ? "locked" : "unlocked"}`
    })
  }

  course.scores_locked = flag;
  course.scores_locked_by = {
    email: req.user.email,
    name: req.user.name,
    faculty_id: req.user._id
  }
  course.scores_locked_at = new Date();

  await course.save();

  res.status(200).json({
    success: true,
    message: `Scores for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} are ${flag ? "locked" : "unlocked"}`
  })
}

export const lockGrades = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.body.course_code} in ${req.body.year}-${req.body.semester}`
    })
  }

  if (course.grades_locked) {
    return res.status(400).json({
      success: false,
      message: `Grades for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} are already locked`
    })
  }

  if (!course.scores_locked) {
    return res.status(400).json({
      success: false,
      message: `Scores for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} should be locked before locking grades`
    })
  }

  course.grades_locked = true;
  course.grades_locked_by = {
    email: req.user.email,
    name: req.user.name,
    faculty_id: req.user._id
  }
  course.grades_locked_at = new Date();

  await course.save();

  res.status(200).json({
    success: true,
    message: `Grades for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} are locked`
  })
}

export const setSaScore = async (req, res) => {
  const course = await Course.findOne({course_code: req.body.course_code, year: req.body.year, semester: req.body.semester});
  
  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course ${req.body.course_code} in ${req.body.year}-${req.body.semester}`
    })
  }

  course.sa_score = req.body.sa_score;
  await course.save();

  res.status(200).json({
    success: true,
    message: `SA score for course ${req.body.course_code} in ${req.body.year}-${req.body.semester} is set`
  })

  calculateCourseGrades(course.course_code, course.year, course.semester);
}

export const calculateCourseGrades = async (course_code, year, semester) => {
  const course = await Course.findOne({course_code, year, semester});
  if (!course || course.enrolled_students.length == 0) return;
  if (['core', 'open-elective', 'program-elective'].includes(course.course_type) && !course.sa_score) return;

  const students = course.enrolled_students;
  course.enrolled_students = calculateGrades(students, course);

  await course.save();
}

export const updateCourse = async (req, res) => {
  const course = await Course.findOne({_id: req.params.id});

  if (!course) {
    return res.status(404).json({
      success: false,
      message: `Could not find course with id ${req.params.id}`
    })
  }

  course.course_code = req.body.course_code ?? course.course_code;
  course.name = req.body.name ?? course.name;
  course.course_type = req.body.course_type ?? course.course_type;
  course.credits_theory = req.body.credits_theory ?? course.credits_theory;
  course.credits_lab = req.body.credits_lab ?? course.credits_lab;
  course.weightage_theory_ise = req.body.weightage_theory_ise ?? course.weightage_theory_ise;
  course.weightage_theory_mse = req.body.weightage_theory_mse ?? course.weightage_theory_mse;
  course.weightage_theory_ese = req.body.weightage_theory_ese ?? course.weightage_theory_ese;
  course.weightage_lab_ise = req.body.weightage_lab_ise ?? course.weightage_lab_ise;
  course.weightage_lab_mse = req.body.weightage_lab_mse ?? course.weightage_lab_mse;
  course.weightage_lab_ese = req.body.weightage_lab_ese ?? course.weightage_lab_ese;
  course.year = req.body.year ?? course.year;
  course.semester = req.body.semester ?? course.semester;

  await course.save();

  res.status(200).json({
    success: true,
    message: `Course ${req.params.id} updated`,
    course
  });
} 