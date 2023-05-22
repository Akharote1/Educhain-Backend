import { Router } from "express"
import { body, validationResult } from "express-validator";
import * as StudentController from "../controllers/Student.js";
import validateInput from "../middleware/validate.js";
import authenticate from "../middleware/authenticate.js";
import adminCheck from "../middleware/admin-check.js";


const router = Router()

router.get('/list', 
  validateInput,
  StudentController.list
)

router.post('/add', 
  body('name').isString().isLength({min: 1}),
  body('uid').isString().isLength({min: 10, max: 10}),
  body('email').isEmail(),
  body('phone_number').isString(),
  body('branch').isString(),
  body('batch').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  StudentController.add
)

router.get('/get-short/:uid', 
  validateInput,
  StudentController.getShort
)

router.post('/bulk-add',
  body('students').isArray(),
  body('students.*.name').isString().isLength({min: 1}),
  body('students.*.uid').isString().isLength({min: 10, max: 10}),
  body('students.*.email').isEmail(),
  body('students.*.phone_number').isString(),
  body('students.*.branch').isString(),
  body('students.*.batch').isInt(),
  validateInput,
  authenticate,
  adminCheck,
  StudentController.bulkAdd
)

router.post('/update/:uid',
  body('name').optional().isString().isLength({min: 1}),
  body('email').optional().isEmail(),
  body('phone_number').optional().isString(),
  body('branch').optional().isString(),
  body('batch').optional().isInt(),
  validateInput,
  authenticate,
  adminCheck,
  StudentController.update
)

export default router;