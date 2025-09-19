// CUSTOMER AUTH CONTROLLERS
require('dotenv').config();
const customerModel = require('../../models/customerModel');
const adminModel = require('../../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const emailingFunction = require("../../helpers/emailingFunction");
const { compileEmailTemplate } = require('../../helpers/emailTemplateHelper');
const { 
	jwt_secret, 
	accessTokenSecret, 
	refreshTokenSecret, 
	salt,
	isValidEmail,
} = require("../../config/config");
const activityLogsModel = require('../../models/activityLogsModel');


// Sign up function
const signupFunction = async (req, res) => {
    const { firstName, lastName, email, phone, password } = req.body;

    try {
        // Validate all required fields
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // Validate firstName and lastName (non-empty after trim)
        if (firstName.trim().length === 0) {
            return res.status(400).json({ error: 'First name is required.' });
        }
        if (lastName.trim().length === 0) {
            return res.status(400).json({ error: 'Last name is required.' });
        }

        // Validate email
        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        if (!isValidEmail(email)) {
            console.log('Invalid email');
            return res.status(400).json({ error: 'Invalid email format!' });
        }

        // Validate phone (basic check for length; adjust based on country if needed)
        if (phone.length < 10) {
            return res.status(400).json({ error: 'Phone number must be at least 10 digits.' });
        }

        // Validate password (minimum 6 characters, at least one uppercase, lowercase, number)
        if (password.length < 6 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long and include uppercase, lowercase, and a number.' });
        }

        // Check if email already exists in customer or admin models
        const existAsACustomer = await customerModel.findOne({ email });
        if (existAsACustomer) {
            return res.status(409).json({ error: 'User Already exists.' });
        }

        const user = await adminModel.findOne({ email });
        if (user) {
            return res.status(409).json({ error: 'Email already exists. Please use a different email or log in.' });
        }

        const role = 'Admin';

        const hashedPassword = await bcrypt.hash(password, salt);

        // Token expiry time (in seconds)
        const tokenExpiryTime = 60 * 5; // 5 minutes

        // Generate unique verification token
        const verificationToken = jwt.sign({ email }, jwt_secret, {
            expiresIn: tokenExpiryTime,
        });

        // Create new user and set verification token before saving
        const newUser = new adminModel({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: email.trim(),
            phoneNumber: phone,
            password: hashedPassword,
            role,
            verificationToken,
        });

        const createdUser = await newUser.save();

        if (!createdUser) {
            return res.status(500).json({ error: 'Failed to create user account!' });
        }

        const verificationLink = `${process.env.ADMIN_CLIENT_URL}/admin/sign-up-email-verification/${verificationToken}`;

        // Compile and send account sign up email
        const signUpEmailData = {
            logoUrl: `${process.env.ADMIN_CLIENT_URL}/dman-logo.png`,
            title: 'Account Sign up - DMAN Admin',
            firstName: firstName.trim(),
            verificationLink: verificationLink,
        };

        const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

        // Send email with timeout
        const emailResult = await Promise.race([
            emailingFunction(email.trim(), 'Account Sign up - DMAN Admin', signUpEmailHtml),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Email sending timeout')), 10000) // 10s timeout
            )
        ]);

        // Check the result of the email sending
        if (emailResult.success) {
            console.log('Admin account successfully created!');
            return res.status(201).json({
                userId: createdUser._id,
                message: 'An email on how to complete sign up was sent to you'
            });
        } else {
            console.error('Email sending failed:', emailResult.error);
            return res.status(201).json({
                userId: createdUser._id,
                message: 'Account created successfully, but email sending failed. Please check your spam folder or contact support.'
            });
        }
    } catch (error) {
        console.log('Sign up error', error);
        return res.status(500).json({ error: `Internal Server Error: ${error.message}` });
    }
};


// VERIFICATION EMAIL FUNCTION
const verifySignUpEmailFunction = async (req, res) => {
	const { token } = req.params;

	try {
		if (!token) {
			return res.status(400).json({ error: "Verification Token empty!"})
		}
		const verifyToken = jwt.verify(token, jwt_secret);

		if (!verifyToken) {
			return res.status(401).json({ error: 'Verification token has expired!' });
		}

		console.log('verification token is verified', verifyToken);

		const user = await customerModel.findOne({ verificationToken: token });

		if (!user) {
			return res
				.status(404)
				.json({ error: 'User with verification token not found' });
		}

		user.isEmailVerified = true;
		user.verificationToken = null;

		const savedUser = await user.save();

		if (!savedUser) {
			return res.status(401).json({ error: 'Error verifying your email.' });
		}

		return res.status(200).json({
			userId: savedUser._id,
			role: savedUser.role,
			message: "Succssfully verified user's email.",
		});
	} catch (error) {
		console.log('server error while verifying email', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};



// RESEND VERIFICATION EMAIL FUNCTION
const resendSignUpVerificationEmailFunction = async (req, res) => {
	const { userId } = req.params;

	try {
		if (!userId) {
			return res.status(400).json({ message: 'User ID is missing' });
		}
	  
		const user = await customerModel.findOne({ _id: userId });

		if (!user) {
			return res.status(404).json({ error: 'Cannot find user' });
		}

		const email = user.email;

		// Token expiry time (in seconds)
		const tokenExpiryTime = 60 * 5; // 5 min

		// Generate unique verification token
		const verificationToken = jwt.sign({ email }, jwt_secret, {
			expiresIn: tokenExpiryTime,
		});

		user.verificationToken = verificationToken;

		const setVerificationToken = await user.save();

		if (!setVerificationToken) {
			console.log('Error setting verification token', setVerificationToken);
			return res.status(401).json({ error: 'Failed to set veriication token' });
		}

		const verificationLink = `${process.env.CUSTOMER_CLIENT_URL}/sign-up-email-verification/${verificationToken}`;

		// Compile and send account sign up email
		const signUpEmailData = {
			logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`, 
			title: 'Account Sign up - DMAN E-commerce',
			firstName: user.firstName,
			verificationLink: verificationLink,
		};

		const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

		// Await the email sending function
		const emailResult = await emailingFunction(email, 'Account Sign up - DMAN E-commerce', signUpEmailHtml);

        // Check the result of the email sending
        if (emailResult.success) {
			return res.status(200).json({ message: 'An email was sent to you' });
        } else {
            // If email sending failed, send an error response
            return res.status(500).json({ error: "Failed to send password reset email." });
        }

	} catch (error) {
		console.log('server error while verifying email', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}

};


// LOGIN FUNCTION
const loginFunction = async (req, res) => {
	const { email, password, ip } = req.body;

	try {
		if (!email || !password) {
			return res.status(400).json({ error: 'Email & password is required!' });
		}

		const user = await customerModel.findOne({ email });

		if (!user) {
			return res.status(404).json({ error: 'Account does not exist!' });
		}

		const isPasswordValid = bcrypt.compareSync(password, user.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid password' });
		}

		if (user.isEmailVerified !== true) {
			console.log('email not verified');
			// Token expiry time (in seconds)
			const tokenExpiryTime = 60 * 5; // 5 min

			// Generate unique verification token
			const verificationToken = jwt.sign({ email }, jwt_secret, {
				expiresIn: tokenExpiryTime,
			});

			user.verificationToken = verificationToken;

			const setVerificationToken = await user.save();

			if (!setVerificationToken) {
				return res.status(401).json({ error: "Error setting verification token"})
			}

			const verificationLink = `${process.env.CUSTOMER_CLIENT_URL}/sign-up-email-verification/${verificationToken}`;

			// Compile and send account sign up email
		    const signUpEmailData = {
			    logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`, 
			    title: 'Account Sign up - DMAN E-commerce',
			    firstName: user.firstName,
			    verificationLink: verificationLink,
		    };

		    const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

		    emailingFunction(email, 'Account Sign up - DMAN E-commerce', signUpEmailHtml);
		
			return res.status(403).json({
				error: 'Email is not verified!',
				redirectUrl: `${process.env.CUSTOMER_CLIENT_URL}/email-sent/${user._id}`,
				userId: user._id,
				role: user.role,
			});
		
		
		}

		// Sign JWT tokens
		const accessToken = jwt.sign(
			{
			  userId: user._id,
			  role: user.role,
			},
			accessTokenSecret,
			{ expiresIn: '15m' }
		  );
	  
		  const refreshToken = jwt.sign(
			{
			  userId: user._id,
			  role: user.role,
			},
			refreshTokenSecret,
			{ expiresIn: '7d' }
		  );
	  
		  console.log('successfully logged in.')
		  // Send tokens via cookies
		  // Set cookies with HttpOnly flag

		  // Role-specific cookie name: refreshToken_customer 
    	  const cookieName = `refreshToken_${user.role.toLowerCase()}`;

		  return res
				   .cookie(cookieName, refreshToken, {
					    httpOnly: true,
					    secure: process.env.NODE_ENV === 'production' ? true : false, // true in prod, fasle in dev
					    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
					    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' in prod, 'Lax' in dev
				    }) 
					 .status(200)
					 .json({
							role: user.role,
							userId: user._id,
							accessToken,
							message: 'Customer logged in successfully',
					  });
		
	} catch (error) {
		console.log("Error logging in", error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
	
};



const forgotPasswordFunction = async (req, res) => {
    const { email } = req.body;

	try { 

        // Check if the email exists in the system
        const user = await customerModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate JWT token with expiration
        const resetToken = jwt.sign({ email }, jwt_secret, { expiresIn: '10m' });

        // Generate reset link
        const resetLink = `${process.env.CUSTOMER_CLIENT_URL}/reset-password/${resetToken}`;

        // Compile and send reset password email
        const resetPasswordData = {
	        logoUrl: `${process.env.CUSTOMER_CLIENT_URL}/dman-logo.png`, 
	        title: 'Reset Account Password - DMAN E-commerce',
	        firstName: user.firstName,
	        resetLink: resetLink,
        };

		const resetPasswordHtml = compileEmailTemplate('passwordReset', resetPasswordData);

		// Await the email sending function
		const emailResult = await emailingFunction(email, 'Reset Password - DMAN E-commerce', resetPasswordHtml);

		// Check the result of the email sending
		if (emailResult.success) {
			return res.status(200).json({ message: 'Password reset link has been sent to your email.' });
		} else {
			// If email sending failed, send an error response
			return res.status(500).json({ error: "Failed to send password reset email." });
		}

    } catch (error) {
		return res.status(500).json({ error: "Internal Server Error!"});
	}

};


  
const resetPasswordFunction = async (req, res) => {
	const { token, newPassword } = req.body;
  
	try {
	    // Verify token
	    const decoded = jwt.verify(token, jwt_secret);

	    if (!decoded) {
		    return res.status(400).json({ error: 'Invalid or expired token' });
	    }
  
	    // Find user by email
	    const user = await customerModel.findOne({ email: decoded.email });

	    if (!user) {
		    return res.status(404).json({ error: 'User not found' });
	    }
  
	    // Hash the new password
	    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
	    // Update password
	    user.password = hashedPassword;
	    await user.save();
  
	    return res.status(200).json({ message: 'Password reset successfully!' });

	} catch (error) {
	    return res.status(500).json({ error: 'Internal Server Error!' });
	}

};


const refreshTokenFunction = async (req, res) => {
    try {
        // Explicitly check for customer-specific refresh token cookie
        const cookieName = 'refreshToken_customer';
        const refreshToken = req.cookies[cookieName];

        if (!refreshToken) {
            return res.status(401).json({ error: 'No refresh token provided' });
        }

        // Verify token signature
        const decoded = jwt.verify(refreshToken, refreshTokenSecret);

        // Issue new access token
        const newAccessToken = jwt.sign(
            { userId: decoded.userId, role: decoded.role },
            accessTokenSecret,
            { expiresIn: '15m' }
        );

        // Rotate refresh token (optional)
        const newRefreshToken = jwt.sign(
            { userId: decoded.userId, role: decoded.role },
            refreshTokenSecret,
            { expiresIn: '7d' }
        );

        // Set new refresh token in cookie with the same cookie name
        res.cookie(cookieName, newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production' ? true : false, // true in prod, false in dev
            sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' in prod, 'Lax' in dev
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Return new access token
        return res.status(200).json({ accessToken: newAccessToken });

    } catch (error) {
        console.error('Refresh token error:', error.name, error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Refresh token has expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        return res.status(500).json({ error: 'Internal server error' });
    }
};



// Logout Function
const logoutFunction = async (req, res) => {
    try {
        // Find all cookies starting with 'refreshToken_'
        const refreshTokenCookies = Object.keys(req.cookies).filter(key => key.startsWith('refreshToken_'));

        if (refreshTokenCookies.length === 0) {
            console.log("No refresh token cookies found for logout.");
            return res.status(200).json({ message: "Logged out successfully (no refresh token found)" });
        }

        // Clear all refresh token cookies
        refreshTokenCookies.forEach(cookieName => {
            res.clearCookie(cookieName, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production' ? true : false, // true in prod, false in dev
                sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' in prod, 'Lax' in dev
            });
        });

        console.log("User logged out successfully, cleared cookies:", refreshTokenCookies);
        return res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Error during logout:", error.name, error.message);
        return res.status(500).json({
            error: "Internal Server Error",
        });
    }
};



module.exports = {
    loginFunction,
    signupFunction,
	verifySignUpEmailFunction,
	resendSignUpVerificationEmailFunction,
	forgotPasswordFunction,
	resetPasswordFunction,
	refreshTokenFunction,
	logoutFunction
}