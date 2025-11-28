const Image = require('../models/Image');
const {uploadToCloudinary} = require('../helpers/cloudinaryHelper');
//const fs = require('fs');
const cloudinary = require('../config/cloudinary');


const uploadImageController = async(req, res) => {
    try{
        //check if file is missing in request object
        if (!req.file) {
            return res.status(400).json({
               success : false,
               message : 'File is required.'
            })
        }
        //upload to Cloudinary
        const {url, publicId} = await uploadToCloudinary(req.file.path); 

        //store the image url & publicId to MongoDB
        const newlyUploadedImage = new Image({
            url, 
            publicId,
            uploadedBy: req.userInfo.userId
        })
        await newlyUploadedImage.save();
        //delete file from local storage
        //fs.unlinkSync(req.file.path); 

        res.status(201).json({
            success : true,
            message : 'Image save to database successfully',
            image : newlyUploadedImage
        })

    }catch(error) {
        console.log(error);
        res.status(500).json({
            success : false, 
            message : 'Image upload failed!'
        })
    }

}


const fetchImageController = async(req, res) => {
    
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;
        const sortBy = req.query.sortBy || 'createdAt';
        const sortOrder = req.query.sortOrder === 'asc'? 1 : -1;
        const totalImages = await Image.countDocuments();
        const totalPages = Math.ceil(totalImages/limit);

        const sortObj = {};
        sortObj[sortBy] = sortOrder;


        const images = await Image.find().sort(sortObj).skip(skip).limit(limit);
        if (images) {
            res.status(200).json({
                success : true,
                currentPage : page,
                totalPages : totalPages,
                totalImages : totalImages,
                data : images
            });
        }

    }catch(error) {
        console.log(error);
        res.status(500).json({
            success : false, 
            message : 'Image retrieval failed!'
        })  
    }
}

const deleteImageController = async(req, res) => {
    try {
        //get image id
        const idOfImageToBeDeleted = req.params.id;
        //get user id
        const userId = req.userInfo.userId;
        //find the image
        const imageToBeDeleted = await Image.findById(idOfImageToBeDeleted);
        if (!imageToBeDeleted) {
            return res.status(404).json({
                success : false, 
                message : "Image could not be found!"
            });
        }

        if (imageToBeDeleted.uploadedBy.toString() !== userId) {
            return res.status(403).json({
                success : false, 
                message : 'Image can only be deleted by the user who uploaded the image!'
            })
        }

        //delete image from cloudinary
        await cloudinary.uploader.destroy(imageToBeDeleted.publicId);
        
        //delete image from MongoDB
        await Image.findByIdAndDelete(idOfImageToBeDeleted);

        res.status(200).json({
            success : true, 
            message : 'Image has been deleted successfully.'
        })


    }catch(error) {
        console.log(error);
        res.status(500).json({
            success : false, 
            message : 'Image deletion failed!'
        });
    }
}

module.exports = {uploadImageController, fetchImageController, deleteImageController};