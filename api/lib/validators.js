const Joi = require("joi");

const taskStatusValues = ["pending", "in_progress", "completed"];

const assignmentSchema = Joi.object({
  user_id: Joi.string().required(),
  raw_text: Joi.string().trim().min(1).max(10000).required(),
  title: Joi.string().trim().min(1).max(255).required(),
  due_date: Joi.string().required(),
});

const assignmentUpdateSchema = Joi.object({
  title: Joi.string().trim().min(1).max(255),
  due_date: Joi.string(),
}).min(1);

const taskSchema = Joi.object({
  description: Joi.string().trim().min(1).max(1000).required(),
  priority: Joi.number().integer().min(0).required(),
  time_estimate: Joi.number().integer().min(1).max(3).allow(null).optional(),
  status: Joi.string().valid(...taskStatusValues).required(),
});

const taskUpdateSchema = Joi.object({
  description: Joi.string().trim().min(1).max(1000),
  priority: Joi.number().integer().min(0),
  time_estimate: Joi.number().integer().min(1).max(3).allow(null),
  status: Joi.string().valid(...taskStatusValues),
}).min(1);

const uuidSchema = Joi.string().uuid();

module.exports = {
  taskStatusValues,
  validateAssignment: (data) => assignmentSchema.validate(data),
  validateAssignmentUpdate: (data) => assignmentUpdateSchema.validate(data),
  validateTask: (data) => taskSchema.validate(data),
  validateTaskUpdate: (data) => taskUpdateSchema.validate(data),
  validateUuid: (value) => uuidSchema.validate(value),
};
