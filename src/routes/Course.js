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

router.get('/get/:batch/:course_code',
  param('batch').isInt(),
  param('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.get
)

router.get('/students/list/:batch/:course_code',
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.listStudents
)

router.get('/statistics/:batch/:course_code',
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.getStatistics
)

router.post('/add', 
  body('name').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1, max: 10}),
  body('batch').isInt(),
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
  body('batch').isInt(),
  body('score_theory_ise').optional().isInt(),
  body('score_theory_mse').optional().isInt(),
  body('score_theory_ese').optional().isInt(),
  body('score_lab_ise').optional().isInt(),
  body('score_lab_mse').optional().isInt(),
  body('score_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.enrollStudent
)

router.post('/bulk-enroll-students', 
  body('students.*.uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('batch').isInt(),
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
  body('batch').isInt(),
  body('score_theory_ise').optional().isInt(),
  body('score_theory_mse').optional().isInt(),
  body('score_theory_ese').optional().isInt(),
  body('score_lab_ise').optional().isInt(),
  body('score_lab_mse').optional().isInt(),
  body('score_lab_ese').optional().isInt(),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.updateGrades
)

router.post('/import-grades',
  body('students.*.uid').isString().isLength({min: 1}),
  body('course_code').isString().isLength({min: 1}),
  body('batch').isInt(),
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
  body('batch').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.addFaculty
)

router.post('/remove-faculty',
  body('email').isEmail().toLowerCase(),
  body('course_code').isString().isLength({min: 1}),
  body('batch').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.removeFaculty
)

router.get('/faculty/list/:batch/:course_code',
  param('batch').isInt(),
  param('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.listFaculties
)

router.post('/lock-marks',
  body('batch').isInt(),
  body('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  facultyCheck,
  CourseController.lockMarks
)

router.post('/lock-grades',
  body('batch').isInt(),
  body('course_code').isString().isLength({min: 1}),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.lockGrades
)

router.post('/set-sa',
  body('batch').isInt(),
  body('course_code').isString().isLength({min: 1}),
  body('sa_score').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  CourseController.setSaScore
)

export default router;