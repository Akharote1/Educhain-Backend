import { Router } from "express"
import { body, param } from "express-validator";
import * as FacultyController from "../controllers/Faculty.js";
import validateInput from "../middleware/validate.js";


const router = Router()

router.get('/list', 
  validateInput,
  FacultyController.list
)

router.get('/get-short/:email',
  param('email').isEmail(),
  validateInput,
  FacultyController.getShort
)

router.post('/register', 
  body('name').isString().isLength({min: 1}),
  body('email').isEmail().toLowerCase().trim(),
  body('phone_number').isString(),
  body('password').isString(),
  body('publicAddress').isString(),
  body('admin').optional().isBoolean().default(false),
  validateInput,
  FacultyController.register
)

router.post('/login', 
  body('email').isEmail(),
  body('password').isString(),
  validateInput,
  FacultyController.login
)

router.post('/verify', 
  validateInput,
  FacultyController.verify
)


export default router;