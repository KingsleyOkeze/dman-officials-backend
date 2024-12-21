require('dotenv').config();
const customerModel = require('../../models/customerModel');
const adminModel = require('../../models/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailFunction = require('../../helpers/emailingFunction');
const { 
	jwt_secret, 
	accessTokenSecret, 
	refreshTokenSecret, 
	salt,
	isValidEmail,
	// isValidPhoneNumber
} = require("../../config/config");


// Sign up function
const signupFunction = async (req, res) => {
	const { 
        firstName,
        lastName,
        email,
        password,
        phoneNumber,
        country,
        dob,
        receiveUpdates
    } = req.body;

	console.log(
        'sign up info is', firstName, lastName, phoneNumber, email, password, country, dob, receiveUpdates
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

        // Validate phone number
        // if (!isValidPhoneNumber(phoneNumber)) {
        //     return res.status(403).json({ error: 'Invalid phone number format.' });
        // }

		// Check if email already exist in the database
        const existAsAnAdmin = await adminModel.findOne({ email });

		if (existAsAnAdmin) {
			return res.status(401).json({ error: 'User already exist.' });
		}

		const user = await customerModel.findOne({ email });

		if (user) {
			return res.status(401).json({ error: 'User already exist.' });
		}

		const role = 'customer';

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
            phoneNumber,
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

		emailFunction(
			email,
			'Verify your email to proceed your Dman Officials Customer sign up.',
			`<p>Please click the following link to verify your email: 
				<a href=${process.env.CLIENT_URL}/sign-up-email-verification/${verificationToken}>Verify Email</a>
			</p>`
		);
		console.log("customer account successfully created!")
		return res.status(201).json({ 
			userId: createdUser._id,
			message: "An email on how to complete sign up was sent to you"});

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
console.log('usr', userId)
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

		emailFunction(
			email,
			'Resending of sign up verification email.',
			`<p>Please click the following link to verify your email: 
				<a href=${process.env.CLIENT_URL}/sign-up-email-verification/${verificationToken}>Verify Email</a>
			</p>`
		);

		return res.status(200).json({ message: 'An email was sent to you' });
	} catch (error) {
		console.log('server error while verifying email', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
};


// LOGIN FUNCTION
const loginFunction = async (req, res) => {
	const { email, password } = req.body;

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

			emailFunction(
				email,
				'Verify your email to proceed.',
				`<p>Please click the following link to verify your email: 
					<a href=${process.env.CLIENT_URL}/${verificationToken}>Verify Email</a>
				</p>`
			);

			return res.status(403).json({
				error: 'Email is not verified!',
				redirectUrl: `${process.env.CLIENT_URL}/email-sent/${user._id}`,
				userId: user._id,
				role: user.role,
			});
		
		
		}

		// Sign JWT tokens
		const accessToken = jwt.sign(
			{
			  id: user._id,
			  role: user.role,
			},
			accessTokenSecret,
			{ expiresIn: '15m' }
		  );
	  
		  const refreshToken = jwt.sign(
			{
			  id: user._id,
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
						secure: true,
						maxAge: 7 * 24 * 60 * 60 * 1000, // 7 day
						sameSite: 'None'
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

  // Check if the email exists in the system
  const user = await customerModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Generate JWT token with expiration
  const resetToken = jwt.sign({ email }, jwt_secret, { expiresIn: '10m' });

  // Generate reset link
  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  // Send email with the reset link
  emailFunction(
    email,
    'Reset Your Password',
    `<p>Click the link below to reset your password:</p>
     <a href="${resetLink}">${resetLink}</a>
     <p>This link will expire in 10 minutes.</p>`
  );

  return res.status(200).json({ message: 'Password reset link has been sent to your email.' });

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
  






module.exports = {
    loginFunction,
    signupFunction,
	verifySignUpEmailFunction,
	resendSignUpVerificationEmailFunction,
	forgotPasswordFunction,
	resetPasswordFunction
}