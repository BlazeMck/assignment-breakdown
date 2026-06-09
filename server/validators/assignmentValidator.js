/**
 * Assignment Validation Schemas
 * Uses Joi to ensure data integrity for both creation and updates
 */
const Joi = require("joi");

// Schema for creating new assignments
const assignmentSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  raw_text: Joi.string().min(1).required(),
  title: Joi.string().min(1).max(255).required(),
  due_date: Joi.date().iso().required(),
});

// Schema for updating assignments (partial updates allowed)
const assignmentUpdateSchema = Joi.object({
  raw_text: Joi.string().min(1),
  title: Joi.string().min(1).max(255),
  due_date: Joi.date().iso(),
}).min(1);

const validateAssignment = (data) => {
  return assignmentSchema.validate(data);
};

const validateAssignmentUpdate = (data) => {
  return assignmentUpdateSchema.validate(data);
};

const validateUserId = (userId) => {
  return Joi.object({
    user_id: Joi.string().uuid().required(),
  }).validate({ user_id: userId });
};

module.exports = {
  validateAssignment,
  validateAssignmentUpdate,
  validateUserId,
};
