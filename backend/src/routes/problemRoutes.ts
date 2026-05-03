import { Router } from "express";
import { authenticateToken } from "../middleware/auth.js";
import { addProblem, getProblems, getStats, deleteProblem } from "../controllers/problemController.js";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/problems', addProblem);
router.get('/problems', getProblems);
router.get('/stats', getStats);
router.delete('/problems/:id', deleteProblem);

export default router;

