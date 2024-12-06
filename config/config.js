require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt_secret = process.env.JWT_SECRET_KEY;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const salt = bcrypt.genSaltSync(10);
const cloudinary = require('cloudinary').v2;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const isValidEmail = (email) => {
  return emailRegex.test(email);
};

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
}); 


module.exports = {
    jwt_secret,
    accessTokenSecret,
    refreshTokenSecret,
    salt,
    isValidEmail,
    cloudinary
}