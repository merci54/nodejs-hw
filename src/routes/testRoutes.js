import { Router } from 'express';
import { getTestError } from '../controller/testController.js';

const router = Router();

router.get('/test-error', getTestError);

export default router;
