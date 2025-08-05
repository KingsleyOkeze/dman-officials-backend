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
	const { 
        firstName,
        lastName,
        email,
        password,
        phone,
        country,
        dob,
        receiveUpdates
    } = req.body;

	console.log(
        'sign up info is', firstName, lastName, phone, email, password, country, dob, receiveUpdates
    );

	try {
		if (!email || !password) {
			return res.status(400).json({ error: 'All field required!' });
		}

        // Validate email
		if (!isValidEmail(email)) {
			console.log('Invalid email');
			return res.status(403).json({ error: "Invalid email!"})
		} 

		// Check if email already exist in the database
        const existAsAnAdmin = await adminModel.findOne({ email });

		if (existAsAnAdmin) {
			return res.status(401).json({ error: 'User already exist.' });
		}

		const user = await customerModel.findOne({ email });

		if (user) {
			return res.status(401).json({ error: 'User already exist.' });
		}

		const role = 'Customer';

		const hashedPassword = await bcrypt.hash(password, salt);

        // Token expiry time (in seconds)
        const tokenExpiryTime = 60 * 5; // 5 minutes

        // Generate unique verification token
        const verificationToken = jwt.sign({ email }, jwt_secret, {
            expiresIn: tokenExpiryTime,
        });
        console.log('v token', verificationToken);

        // Create new user and set verification token before saving
        const newUser = new customerModel({
            firstName,
            lastName,
            email,
            phoneNumber: phone,
            country,
            dob,
            receiveUpdates,
            password: hashedPassword,
            role,
            verificationToken, // Set token here
        });

        const createdUser = await newUser.save();

        if (!createdUser) {
            return res.status(401).json({ error: "Failed to create user account!" });
        }

		// Compile and send account sign up email
		const signUpEmailData = {
			logoUrl: `${process.env.CLIENT_URL}/dman-logo.png`, 
			title: 'Account Sign up - DMAN E-commerce',
			message: `
				Please click the following link to verify your email: \n
		 		${process.env.CLIENT_URL}/sign-up-email-verification/${verificationToken} <br><br>
				`,
			firstName: firstName,
		};

		const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

		emailingFunction(email, 'Account Sign up - DMAN E-commerce', signUpEmailHtml);
		
		console.log("customer account successfully created!")
		return res.status(201).json({ 
			userId: createdUser._id,
			message: "An email on how to complete sign up was sent to you"
		});

	} catch (error) {
		console.log('Sign up error', error);
		return res.status(500).json({ error: 'Internal Server Error!' });
	}
};


// VERIFICATION EMAIL FUNCTION
const verifySignUpEmailFunction = async (req, res) => {
	const { token } = req.params;
	console.log('Received token:', token);

	try {
		if (!token) {
			return res.status(400).json({ error: "Verification Token empty!"})
		}
		const verifyToken = jwt.verify(token, jwt_secret);

		if (!verifyToken) {
			console.log('verification token has expired', verifyToken);
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
			console.log('Failed error while verifying email', savedUser);
			return res.status(401).json({ error: 'Error verifying your email.' });
		}

		console.log('success while verifying email', savedUser);
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
    console.log('usr', userId);

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

		// Compile and send account sign up email
		const signUpEmailData = {
			logoUrl: `${process.env.CLIENT_URL}/dman-logo.png`, 
			title: 'Account Sign up - DMAN E-commerce',
			message: `
				Please click the following link to verify your email: <br><br>
		 		${process.env.CLIENT_URL}/sign-up-email-verification/${verificationToken} 
				`,
			firstName: user.firstName,
		};

		const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

		emailingFunction(email, 'Account Sign up - DMAN E-commerce', signUpEmailHtml);

		return res.status(200).json({ message: 'An email was sent to you' });

	} catch (error) {
		console.log('server error while verifying email', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}

};


// LOGIN FUNCTION
const loginFunction = async (req, res) => {
	const { email, password, ip } = req.body;

	console.log("Login details", email, password);

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

			// Compile and send account sign up email
		    const signUpEmailData = {
			    logoUrl: `${process.env.CLIENT_URL}/dman-logo.png`, 
			    title: 'Account Sign up - DMAN E-commerce',
			    message: `
				    Please click the following link to verify your email: \n
		 		    ${process.env.CLIENT_URL}/sign-up-email-verification/${verificationToken}
				`,
			    firstName: user.firstName,
		    };

		    const signUpEmailHtml = compileEmailTemplate('accountEmailVerification', signUpEmailData);

		    emailingFunction(email, 'Account Sign up - DMAN E-commerce', signUpEmailHtml);
		
			return res.status(403).json({
				error: 'Email is not verified!',
				redirectUrl: `${process.env.CLIENT_URL}/email-sent/${user._id}`,
				userId: user._id,
				role: user.role,
			});
		
		
		}

		// Log login activity directly inside after user successfully login.
        await activityLogsModel.create({
            customerRef: user._id,
			ipAddress: ip,
            activityType: "Login",
        });

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
		  return res
				   .cookie('refreshToken', refreshToken, {
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
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate JWT token with expiration
        const resetToken = jwt.sign({ email }, jwt_secret, { expiresIn: '10m' });

        // Generate reset link
        const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // Compile and send reset password email
        const resetPasswordData = {
	        logoUrl: `${process.env.CLIENT_URL}/dman-logo.png`, 
	        title: 'Reset Account Password - DMAN E-commerce',
	        message: `
		        Click the link to reset your password: \n
		        "${resetLink}" \n <br><br>
			    This link will expire in 10 minutes. 
			    If you did not request a password reset, 
			    please ignore this email or contact our 
			    support.		 
		    `,
	        firstName: user.firstName,
        };

    const resetPasswordHtml = compileEmailTemplate('passwordReset', resetPasswordData);

    emailingFunction(email, 'Reset Password - DMAN E-commerce', resetPasswordHtml);

    return res.status(200).json({ message: 'Password reset link has been sent to your email.' });

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
		    return res.status(404).json({ message: 'User not found' });
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
  


const refereshTokenFunction = async (req, res) => {
	const refreshToken = req.cookies.refreshToken; // Refresh token from HTTP-only cookie
  
	// Log cookies for debugging
    console.log("Cookies:", req.cookies);
	console.log("Refresh Token:", refreshToken);

	if (!refreshToken) {
		console.log("Refresh Token not present:", refreshToken);
	    return res.status(401).json({ error: 'No refresh token provided' });
	}
  
	const decoded = jwt.verify(refreshToken, refreshTokenSecret);

	if (!decoded) {
		console.log("Refresh Token invalid:", decoded);
		return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

	// Issue a new access token
	const newAccessToken = jwt.sign(
		{ 
			userId: decoded.userId, 
			role: decoded.role 
		}, 
		accessTokenSecret, 
		{ expiresIn: '15m' }
	);
	return res.status(200).json({ accessToken: newAccessToken });

};



// Logout Function
const logoutFunction = async (req, res) => {
	const { customerId, activity, sessionDuration, ip } = req.body;
	console.log('logout extra details', customerId, activity, sessionDuration, ip);
        
	try {
        // Clear the refreshToken cookie
        res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production' ? true : false, // true in prod, fasle in dev
			sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' in prod, 'Lax' in dev
		});

		// Save logout customer activity
        await activityLogsModel.create({
            customerRef: customerId,
            activityType: activity || "Logout", // Default to "logout"
            sessionDuration: sessionDuration || 0, // Ensure session duration is set
            ipAddress: ip || "Unknown", // Handle missing IP gracefully
        });

		console.log(`User ${customerId} logged out after ${sessionDuration} sec time.`);
        // console.log(`User ${customerId} logged out successfully.`);
        return res.status(200).json({
            message: "Logged out successfully",
        });
    } catch (error) {
        console.error("Error during logout:", error);
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
	refereshTokenFunction,
	logoutFunction
}