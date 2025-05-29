import express, { Request, Response } from 'express';
import auth from '../middlewares/auth';

const router = express.Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     description: Returns a welcome message
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the API' });
});

/**
 * @swagger
 * /protected:
 *   get:
 *     summary: Protected route
 *     description: Returns a message if authenticated
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.get('/protected', auth, (req: Request, res: Response) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

export default router;