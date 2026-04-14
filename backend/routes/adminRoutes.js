const express = require('express');
const router = express.Router();
const { 
    getDoctors, 
    getStaff, 
    createUser, 
    updateUser, 
    getUserById 
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes here are protected and restricted to Admin
router.use(protect);
router.use(admin);

router.get('/doctors', getDoctors);
router.get('/staff', getStaff);

router.route('/users')
    .post(createUser);

router.route('/users/:id')
    .get(getUserById)
    .put(updateUser);

module.exports = router;
