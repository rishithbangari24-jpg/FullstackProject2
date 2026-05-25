const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate access token
const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '15m',
  });
};

// Helper to generate refresh token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRE || '7d',
  });
};

// Helper to set cookie options
const getCookieOptions = () => {
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching REFRESH_TOKEN_EXPIRE
  };
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      res.status(400);
      return next(new Error('Please provide username, email, and password'));
    }

    // Check if user already exists (middleware error handles dups, but we can do a quick check here too)
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      res.status(400);
      return next(new Error('Username or email already exists'));
    }

    // Generate random avatar if not provided (default premium avatars)
    const avatarSeed = Math.floor(Math.random() * 1000);
    const defaultAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}`;

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      avatar: defaultAvatar,
    });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Send cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(201).json({
      success: true,
      accessToken,
      refreshToken, // Send in response body too in case client frontend requires it (robust API design)
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log in user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      res.status(400);
      return next(new Error('Please provide email and password'));
    }

    // Find user (by email or username)
    const user = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: email }],
    });

    if (!user || !(await user.comparePassword(password))) {
      res.status(401);
      return next(new Error('Invalid credentials'));
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save();

    // Send cookie
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res, next) => {
  // Read token from cookie, header, or body
  const token =
    req.cookies?.refreshToken ||
    req.body?.refreshToken ||
    (req.headers.authorization?.startsWith('Bearer') ? req.headers.authorization.split(' ')[1] : null);

  if (!token) {
    res.status(401);
    return next(new Error('Refresh token is required'));
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    // Check if user exists and has that refresh token
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      res.status(401);
      return next(new Error('Invalid refresh token'));
    }

    // Generate a new access token
    const newAccessToken = generateAccessToken(user._id);

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    res.status(401);
    return next(new Error('Refresh token expired or invalid'));
  }
};

// @desc    Log out user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = async (req, res, next) => {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;

  try {
    if (token) {
      const user = await User.findOne({ refreshToken: token });
      if (user) {
        user.refreshToken = '';
        await user.save();
      }
    }

    // Clear cookie
    res.clearCookie('refreshToken', getCookieOptions());

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    // Update simple fields
    if (req.body.username) user.username = req.body.username;
    if (req.body.bio !== undefined) user.bio = req.body.bio;
    if (req.body.avatar) user.avatar = req.body.avatar;

    // Check if changing password
    if (req.body.password) {
      if (req.body.password.length < 6) {
        res.status(400);
        return next(new Error('Password must be at least 6 characters'));
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  updateUserProfile,
};
