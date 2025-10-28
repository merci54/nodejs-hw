import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import createHttpError from 'http-errors';
import { createSession, setSessionCookies } from '../services/auth.js';
import { Session } from '../models/session.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  let isUserExist = await User.findOne({ email });

  if (isUserExist) {
    return next(createHttpError(400, 'This email has already exists'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(user._id);
  setSessionCookies(res, newSession);

  res.status(201).json(user);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, 'Invalid email or password!'));
  }

  const isPasswordGood = await bcrypt.compare(password, user.password);

  if (!isPasswordGood) {
    return next(createHttpError(401, 'Invalid email or password!'));
  }

  await Session.deleteOne({
    userId: user._id,
  });

  const newSession = await createSession(user._id);
  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;
  if (sessionId) {
    await Session.deleteOne({
      _id: sessionId,
    });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.clearCookie('sessionId');

  res.status(204).send();
};

export const refreshUserSession = async (req, res, next) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    return next(createHttpError(401, 'Session was not found or invalid'));
  }

  const isRefreshTokenExpired = new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    return next(createHttpError(401, 'Refresh token expired'));
  }

  await Session.deleteOne({
    _id: sessionId,
    refreshToken,
  });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({
    email,
  });

  if (!user) {
    return res.status(200).json({
      message: 'If this email exists, a reset link has been sent',
    });
  }

  const resetToken = jwt.sign({ sub: user._id, email }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const templatePath = path.resolve('src/templates/reset-password-email.html');
  const templateSource = await fs.readFile(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  const html = template({
    name: user.username,
    link: `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`,
  });

  try {
    await sendEmail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset your password',
      html,
    });

    console.log(resetToken);
  } catch {
    res.status(500).json({
      message: 'Failed to send mail',
    });
  }

  res.status(200).json({
    message: 'If this email exists, a reset link has been sent',
  });
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  let payload;

  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return next(createHttpError(401, 'Invalid token or session!'));
  }

  const user = await User.findOne({
    _id: payload.sub,
    email: payload.email,
  });

  if (!user) {
    return next(createHttpError(404, 'User not found'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.updateOne(
    {
      _id: payload.sub,
    },
    { password: hashedPassword },
  );

  await Session.deleteMany({
    userId: user._id,
  });

  res.status(200).json({
    message: 'Password has been successfully changed',
  });
};
