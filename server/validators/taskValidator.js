/**
 * Task Validation Schemas
 * Uses Joi to ensure task payloads are safe before they hit the database
 */
const Joi = require("joi");

// Keep the allowed lifecycle values centralized so routes and tests stay in sync.
const taskStatusValues = ["pending", "in_progress", "completed"];

// time_estimate is a relative effort level stored as an integer:
// 1 = Low, 2 = Medium, 3 = High. The client maps these back to labels.
const taskCreateSchema = Joi.object({
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

const validateTask = (data) => taskCreateSchema.validate(data);
const validateTaskUpdate = (data) => taskUpdateSchema.validate(data);
const validateUuidParam = (value, fieldName = "id") =>
  Joi.object({
    [fieldName]: Joi.string().uuid().required(),
  }).validate({ [fieldName]: value });

module.exports = {
  taskStatusValues,
  validateTask,
  validateTaskUpdate,
  validateUuidParam,
};
