import { validationResult } from "express-validator";

export default function validateInput(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array(), message: 'Invalid request' });
  }
  next()
}