import { Router } from "express";
import { userRouter } from '../controllers/UsersController.js';
import { authRouter } from '../controllers/AuthController.js';

const router = Router();

router.use('/users', userRouter);
router.use('/auth', authRouter);

export default router;