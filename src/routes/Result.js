import { Router } from "express"
import { body, param } from "express-validator";
import * as ResultController from "../controllers/Result.js";
import validateInput from "../middleware/validate.js";
import facultyCheck from "../middleware/faculty-check.js";
import adminCheck from "../middleware/admin-check.js";
import authenticate from "../middleware/authenticate.js";

const router = Router()

router.get('/list', 
  validateInput,
  authenticate,
  adminCheck,
  ResultController.list
)

router.get('/view/:id', 
  validateInput,
  authenticate,
  adminCheck,
  ResultController.view
)

router.post('/preview',
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('batch').isInt(),
  body('branch').isString(),
  body('semester_number').optional().isInt().default(1),
  validateInput,
  authenticate,
  adminCheck,
  ResultController.preview
)

router.post('/create',
  body('year').isInt(),
  body('semester').isString().isIn(['odd', 'even']),
  body('batch').isInt(),
  body('branch').isString(),
  body('courses').isArray(),
  body('semester_number').optional().isInt().default(1),
  validateInput,
  authenticate,
  adminCheck,
  ResultController.create
)

router.post('/generate',
  body('result_id').isString(),
  validateInput,
  authenticate,
  adminCheck,
  ResultController.generate
)

router.get('/marksheet/:result_id/:uid',
  param('result_id').isString(),
  param('uid').isString(),
  validateInput,
  ResultController.generateMarksheet
)

export default router;