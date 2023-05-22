import { Router } from "express"
import { body, param } from "express-validator";
import * as MiscController from "../controllers/Misc.js";
import validateInput from "../middleware/validate.js";


const router = Router()

router.get('/statistics', 
  validateInput,
  MiscController.statistics
)

export default router;