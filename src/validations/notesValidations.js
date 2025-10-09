import { Joi, Segments } from 'celebrate';
import { isValidObjectId } from 'mongoose';
import { TAGS } from '../constants/tags.js';

export const getNotesSchema = {
  [Segments.QUERY]: {
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(5).max(15).default(10),
    tag: Joi.string().valid(...TAGS),
    search: Joi.string().trim().allow(''),
    sortBy: Joi.string()
      .valid('_id', 'title', 'content', 'createdAt')
      .default('_id'),
    sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
  },
};

export const createNoteSchema = {
  [Segments.BODY]: {
    title: Joi.string().min(3).max(30).required(),
    content: Joi.string().max(80),
    tag: Joi.string().valid(...TAGS),
  },
};

const objectIdValidator = (value, helpers) => {
  const isValidId = isValidObjectId(value);
  return !isValidId ? helpers.message('Invalid id format!') : value;
};

export const noteIdParam = {
  [Segments.PARAMS]: {
    noteId: Joi.string().custom(objectIdValidator).required(),
  },
};

export const updateNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(3),
    content: Joi.string().min(3),
    tag: Joi.string().valid(...TAGS),
  }).min(1),
};
