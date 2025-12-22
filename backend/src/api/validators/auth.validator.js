const { body, validationResult } = require('express-validator');
const { 
  PASSWORD_REQUIREMENTS, 
  USERNAME_REQUIREMENTS,
  ERROR_MESSAGES 
} = require('../../utils/constants');

// Validation middleware to check for errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Register validation
const registerValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isEmail()
    .withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .isLength({ max: PASSWORD_REQUIREMENTS.MAX_LENGTH })
    .withMessage(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`)
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@!#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
    .withMessage('Password must contain at least one special character (@!#$%^&* etc.)'),
  
  body('username')
    .optional()
    .trim()
    .isLength({ min: USERNAME_REQUIREMENTS.MIN_LENGTH, max: USERNAME_REQUIREMENTS.MAX_LENGTH })
    .withMessage(`Username must be ${USERNAME_REQUIREMENTS.MIN_LENGTH}-${USERNAME_REQUIREMENTS.MAX_LENGTH} characters long`)
    .matches(USERNAME_REQUIREMENTS.PATTERN)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  
  validate
];

// Login validation
const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isEmail()
    .withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),
  
  body('password')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD),
  
  validate
];

// Forgot password validation
const forgotPasswordValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isEmail()
    .withMessage(ERROR_MESSAGES.INVALID_EMAIL)
    .normalizeEmail(),
  
  validate
];

// Reset password validation
const resetPasswordValidator = [
  body('token')
    .trim()
    .notEmpty()
    .withMessage('Reset token is required'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .isLength({ max: PASSWORD_REQUIREMENTS.MAX_LENGTH })
    .withMessage(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`)
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@!#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
    .withMessage('Password must contain at least one special character (@!#$%^&* etc.)'),
  
  validate
];

// Update profile validation
const updateProfileValidator = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: USERNAME_REQUIREMENTS.MIN_LENGTH, max: USERNAME_REQUIREMENTS.MAX_LENGTH })
    .withMessage(`Username must be ${USERNAME_REQUIREMENTS.MIN_LENGTH}-${USERNAME_REQUIREMENTS.MAX_LENGTH} characters long`)
    .matches(USERNAME_REQUIREMENTS.PATTERN)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('full_name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name must not exceed 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must not exceed 100 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must not exceed 100 characters'),
  
  body('timezone')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Timezone must not exceed 100 characters'),
  
  body('language')
    .optional()
    .trim()
    .isIn(['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ar'])
    .withMessage('Invalid language code'),
  
  validate
];

// Change password validation
const changePasswordValidator = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage(ERROR_MESSAGES.REQUIRED_FIELD)
    .isLength({ min: PASSWORD_REQUIREMENTS.MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_REQUIREMENTS.MIN_LENGTH} characters long`)
    .isLength({ max: PASSWORD_REQUIREMENTS.MAX_LENGTH })
    .withMessage(`Password must not exceed ${PASSWORD_REQUIREMENTS.MAX_LENGTH} characters`)
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[@!#$%^&*()_+\-=\[\]{}|;:,.<>?]/)
    .withMessage('Password must contain at least one special character (@!#$%^&* etc.)')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  
  validate
];

module.exports = {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator
};
