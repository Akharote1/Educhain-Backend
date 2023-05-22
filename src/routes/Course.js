import { Router } from "express"
import { body, param, validationResult } from "express-validator";
import * as CourseController from "../controllers/Course.js";
import validateInput from "../middleware/validate.js";
import facultyCheck from "../middleware/faculty-check.js";
import adminCheck from "../middleware/admin-check.js";
import authenticate from "../middleware/authenticate.js";

const router = Router()

router.get('/list', 
  validateInput,
  authenticate,
  CourseController.list
)

router.get('/get/:year/:semester/:course_code',
  param('year').isInt(),
  param('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.get
)

router.get('/students/list/:year/:semester/:course_code',
  param('year').isInt(),
  param('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.listStudents
)

router.get('/statistics/:year/:semester/:course_code',
  param('year').isInt(),
  param('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.getStatistics
)

router.post('/add', 
  body('name').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1, max: 10}),
  body('course_type').isString().isIn(['core', 'hss', 'seva-satva', 'program-elective', 'open-elective']),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('credits_lab').isInt(), 
  body('credits_theory').isInt(),
  body('weightage_theory_ise').isInt(), 
  body('weightage_theory_mse').isInt(),
  body('weightage_theory_ese').isInt(),
  body('weightage_lab_ise').isInt(),
  body('weightage_lab_mse').isInt(),
  body('weightage_lab_ese').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.add
)

router.post('/enroll-student', 
  body('uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('score_theory_ise').optional().isInt(),
  body('score_theory_mse').optional().isInt(),
  body('score_theory_ese').optional().isInt(),
  body('score_lab_ise').optional().isInt(),
  body('score_lab_mse').optional().isInt(),
  body('score_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.enrollStudent
)

router.post('/delete', 
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  validateInput, 
  authenticate,
  adminCheck,
  CourseController.deleteCourse
) 

router.post('/remove-student', 
  body('uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.removeStudent
)

router.post('/bulk-enroll-students', 
  body('students.*.uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('students.*.score_theory_ise').optional().isInt(),
  body('students.*.score_theory_mse').optional().isInt(),
  body('students.*.score_theory_ese').optional().isInt(),
  body('students.*.score_lab_ise').optional().isInt(),
  body('students.*.score_lab_mse').optional().isInt(),
  body('students.*.score_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.bulkEnrollStudents
)

router.post('/update-grades',
  body('uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('score_theory_ise').optional().isInt(),
  body('score_theory_mse').optional().isInt(),
  body('score_theory_ese').optional().isInt(),
  body('score_lab_ise').optional().isInt(),
  body('score_lab_mse').optional().isInt(),
  body('score_lab_ese').optional().isInt(),
  body('flag_defaulter').optional().isBoolean(),
  body('flag_not_present').optional().isBoolean(),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.updateGrades
)

router.post('/import-grades',
  body('students.*.uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('students.*.score_theory_ise').optional().isInt(),
  body('students.*.score_theory_mse').optional().isInt(),
  body('students.*.score_theory_ese').optional().isInt(),
  body('students.*.score_lab_ise').optional().isInt(),
  body('students.*.score_lab_mse').optional().isInt(),
  body('students.*.score_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.importGrades
)

router.post('/add-faculty',
  body('email').isEmail().toLowerCase(),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.addFaculty
)

router.post('/remove-faculty',
  body('email').isEmail().toLowerCase(),
  body('course_code').isString().isLength({min: 1}),
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.removeFaculty
)

router.get('/faculty/list/:year/:semester/:course_code',
  param('year').isInt(),
  param('semester').isString().isIn(['odd', 'even']),
  param('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.listFaculties
)

router.post('/lock-marks',
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('course_code').isString().isLength({min: 1}),
  body('locked').optional().isBoolean().default(true),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.lockMarks
)

router.post('/lock-grades',
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.lockGrades
)

router.post('/set-sa',
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('course_code').isString().isLength({min: 1}),
  body('sa_score').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.setSaScore
)

router.post('/update/:id',
  body('course_code').optional().isString().isLength({min: 1}),
  body('name').optional().isString().isLength({min: 1}),
  body('credits_theory').optional().isInt(),
  body('credits_lab').optional().isInt(),
  body('course_type').optional().isString().isIn(['core', 'hss', 'seva-satva', 'program-elective', 'open-elective']),
  body('year').optional().isInt(),
  body('semester').optional().isString().isIn(['odd', 'even']),
  body('weightage_theory_ise').optional().isInt(), 
  body('weightage_theory_mse').optional().isInt(),
  body('weightage_theory_ese').optional().isInt(),
  body('weightage_lab_ise').optional().isInt(),
  body('weightage_lab_mse').optional().isInt(),
  body('weightage_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.updateCourse
)

export default router;