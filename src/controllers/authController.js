import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import createHttpError from 'http-errors';
import { createSession, setSessionCookie } from '../services/auth.js';
import { Session } from '../models/session.js';

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  let isUserExist = await User.findOne({ email });

  if (isUserExist) {
    return next(createHttpError(500, 'This email has already exists'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(user._id);
  setSessionCookie(res, newSession);

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
  setSessionCookie(res, newSession);

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

export const refreshSession = async (req, res, next) => {
  const { sessionId, refreshToken } = req.cookies;

  const session = await Session.findOne({
    _id: sessionId,
    refreshToken,
  });

  if (!session) {
    return next(createHttpError(401, 'Session was not found or invalid'));
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    return next(createHttpError(401, 'Refresh token expired'));
  }

  await Session.deleteOne({
    _id: sessionId,
    refreshToken,
  });

  const newSession = await createSession(session.userId);
  setSessionCookie(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const getUser = async (req, res, next) => {
  const { sessionId } = req.cookies;

  const session = await Session.findOne({
    _id: sessionId,
  });

  if (!session) {
    return next(createHttpError(401, 'Session was not found or invalid'));
  }

  const user = await User.findOne({
    _id: session.userId,
  });

  res.status(200).json(user);
};
