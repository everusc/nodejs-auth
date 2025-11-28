const express = require('express');
const authMiddleware = require('../middleware/auth-middleware');
const isAdminUser = require('../middleware/admin-middleware');
const uploadMiddleware = require('../middleware/upload-middleware');
const {uploadImageController, fetchImageController, deleteImageController} = require('../controllers/image-controller');

const router = express.Router(); 

//upload the image
router.post(
    '/upload',
    authMiddleware, 
    isAdminUser, 
    uploadMiddleware.single('image'), 
    uploadImageController
);

//get all the image
router.get('/get', authMiddleware, fetchImageController);

//delete an image
router.delete('/:id', authMiddleware, isAdminUser, deleteImageController);

module.exports = router; 