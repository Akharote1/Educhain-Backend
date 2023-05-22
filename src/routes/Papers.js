// http://dspace.spit.ac.in/xmlui/bitstream/handle/123456789/1726/MSE19-BE-com-sem8-hci-qp.pdf?sequence=1

import { Router } from "express"
import { body, query, validationResult } from "express-validator";
import * as PapersController from "../controllers/Papers.js";
import validateInput from "../middleware/validate.js";

const router = Router()

router.get('/proxy', 
  query('url').isString(),
  validateInput,
  PapersController.dspaceProxy
)

export default router;