const express = require('express');
const router = express.Router();
const {
  updateProfile,
  updateRoleProfile
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');

router.use(auth);

router.put('/profile', updateProfile);
router.put('/role-profile', updateRoleProfile);

module.exports = router;