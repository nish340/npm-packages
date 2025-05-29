const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');

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
router.get('/', (req, res) => {
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
router.get('/protected', auth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

module.exports = router;