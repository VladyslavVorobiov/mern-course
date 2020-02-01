const {Router} = require("express");
const bcrypt = require("bcryptjs");
const config = require("config");
const jwt = require("jsonwebtoken");
const {check, validationResult} = require("express-validator");
const User = require("../models/User");
const router = Router();

// /api/auth/register
router.post(
    "/register", 
   [
    check("email", "Incorrect email").isEmail(),
    check("password", "Minimal length of password is 6 symbols").isLength({min: 6})
   ],
    async (request, response) => {
    try {
        
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return response.status(400).json({
                errors: errors.array(), 
                message: "Incorrect data during registration."
            })
        }

        const {email, password} = request.body;
        const candidate = await User.findOne({email: email});

        if(candidate){
            return response.status(400).json({
                message: "Such user has been already exists."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            email: email, 
            password: hashedPassword
        });

        await user.save();

        response.status(201).json({
            message: "User has been created"
        });

    } catch (error) {
        response.status(500).json({
            message: "Something has been wrong, let's try again."
        })
    }
});

// /api/auth/login
router.post(
    "/login", 
    [
        check("email", "Enter correct email").normalizeEmail().isEmail(),
        check("password", "Enter password").exists()
    ],
    async (request, response) => {
    try {
        const errors = validationResult(request);
        if(!errors.isEmpty()){
            return response.status(400).json({
                errors: errors.array(), 
                message: "Incorrect data during authorization."
            })
        }

        const {email, password} = request.body;
        const user = await User.findOne({ email });

        if(!user){
            return response.status(400).json({
                message: "User has not been found."
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return response.status(400).json({
                message: "Password is wrong, let's try again."
            });
        }
        const token = jwt.sign(
            {userId: user.id},
            config.get("jwtSecret"),
            {expiresIn: '1h'}
        );

        response.json({token, userId: user.id });

    } catch (error) {
        response.status(500).json({
            message: "Something has been wrong, let's try again."
        })
    }
});

module.exports = router;