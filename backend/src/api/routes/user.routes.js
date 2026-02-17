const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const {
  getMyProfile,
  updateProfile,
  uploadAvatar,
  upload,        // ← Import multer middleware from controller
  deleteAvatar,
  changePassword
} = require('../controllers/user.controller');


/**
 * @swagger
 * /api/users/me:
 *   get:
 *     tags: [Users]
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information including personal details and preferences
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                       format: email
 *                     email_verified:
 *                       type: boolean
 *                     phone:
 *                       type: string
 *                     role:
 *                       type: string
 *                       enum: [user, moderator, admin]
 *                     status:
 *                       type: string
 *                       enum: [active, suspended, deleted]
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 profile:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     avatar_url:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     country:
 *                       type: string
 *                     city:
 *                       type: string
 *                     timezone:
 *                       type: string
 *                     language:
 *                       type: string
 *                     is_public:
 *                       type: boolean
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.get('/me', protect, getMyProfile);

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     description: Update the authenticated user's profile information
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 description: Unique username
 *                 minLength: 3
 *                 maxLength: 30
 *               full_name:
 *                 type: string
 *                 description: User's full name
 *                 maxLength: 100
 *               bio:
 *                 type: string
 *                 description: User biography
 *                 maxLength: 500
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth in YYYY-MM-DD format
 *                 example: "1990-01-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               country:
 *                 type: string
 *                 description: Country of residence
 *               city:
 *                 type: string
 *                 description: City of residence
 *               timezone:
 *                 type: string
 *                 description: User's timezone (e.g., Africa/Nairobi)
 *               language:
 *                 type: string
 *                 description: Preferred language code
 *                 default: en
 *                 example: en
 *               is_public:
 *                 type: boolean
 *                 description: Whether profile is publicly visible
 *                 default: true
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *                 profile:
 *                   type: object
 *       400:
 *         description: Bad request - Validation error or username taken
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', protect, updateProfile);

/**
 * @swagger
 * /api/users/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload user avatar to AWS S3
 *     description: Upload a profile picture. The image will be stored in AWS S3 and the URL will be saved to the user's profile. Old avatar will be automatically deleted from S3.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Image file (JPG, PNG, GIF). Max size 5MB.
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully to S3
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 avatar_url:
 *                   type: string
 *                   example: "https://flixvideo-storage-prod.s3.us-east-1.amazonaws.com/avatars/user-id/timestamp-random.jpg"
 *                 message:
 *                   type: string
 *                   example: "Avatar uploaded successfully"
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       413:
 *         description: File too large (max 5MB)
 *       500:
 *         description: S3 upload failed
 */
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

/**
 * @swagger
 * /api/users/avatar:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user avatar from AWS S3
 *     description: Remove the user's profile picture from S3 and set avatar_url to null in the database
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Avatar deleted successfully"
 *       404:
 *         description: No avatar to delete
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: S3 deletion failed
 */
router.delete('/avatar', protect, deleteAvatar);

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     tags: [Users]
 *     summary: Change user password
 *     description: Update the authenticated user's password. Requires current password for verification.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *                 format: password
 *                 description: User's current password
 *                 example: "OldPassword123"
 *               new_password:
 *                 type: string
 *                 format: password
 *                 description: New password (minimum 8 characters)
 *                 minLength: 8
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password changed successfully"
 *       400:
 *         description: Bad request - Missing fields or password too short
 *       401:
 *         description: Current password is incorrect
 *       404:
 *         description: User not found
 */
router.put('/password', protect, changePassword);

module.exports = router;
