const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


//register controller
const registerUser = async(req, res) => {
    try {
        //extract user info from request body
        const {username, email, password, role} = req.body;

        //check if the user is already in the database
        const checkExistingUser = await User.findOne({
            $or : [{username}, {email}],
        });
        if (checkExistingUser) {
           return res.status(400).json({
            success : false, 
            message : 'User already exists with either same username or same email.'
           }); 
        }

        //hash user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //create new user and add into database
        const newlyCreatedUser = new User({
            username, 
            email,
            password : hashedPassword, 
            role : role || 'user',
        })

        await newlyCreatedUser.save();
        if (newlyCreatedUser) {
            res.status(201).json({
                success : true,
                message : "User registered successfully"
            })
        } else {
            res.status(400).json({
                success : false,
                message : "Unable to register user"
            })
        }
    }catch(e) {
        console.log(e);
        res.status(500).json({
            success : false, 
            message : 'Error occurred, please try again!',
        })
    }
}

//login controller
const loginUser = async(req, res) => {
    try {
        const {username, password} = req.body;
//check if the current user is in the database
        const user = await User.findOne({username});
        if (!user) {
            return res.status(400).json({
                success : false,
                message : 'Invalid user name!' 
            })
        }
    //if password is correct
        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success : false,
                message : 'Invalid password!' 
            })
        }
//create user token
        const accessToken = jwt.sign({
            userId : user._id,
            username: user.username,
            role : user.role
        }, process.env.JWT_SECRET_KEY, {expiresIn : '15m'})

        res.status(200).json({
            success : true,
            message : 'Login successful',
            accessToken
        })

    }catch(e) {
        console.log(e);
        res.status(500).json({
            success : false, 
            message : 'Error occurred, please try again!',
        })
    }
}

const changePassword = async(req, res) => {
    try {
        const userId = req.userInfo.userId;

        const {oldPassword, newPassword} = req.body;
        // find the user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                success : false,
                message : 'User does not exist.'
            })
        }

        // check if old password is correct
        const isPasswordCorrect = await bcrypt.compare(oldPassword,user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success : false,
                message : 'Old password is not correct.'
            })
        }

        //hash the new password
        const salt = await bcrypt.genSalt(10); 
        const newHashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = newHashedPassword;
        await user.save();

        res.status(200).json({
            success : true, 
            message : 'Password changed successfully.'
        })

    }catch(e) {
        console.log(e);
        res.status(500).json({
            success : false, 
            message : 'Error occurred, please try again!',
        })      
    }

}

module.exports = { registerUser, loginUser, changePassword};