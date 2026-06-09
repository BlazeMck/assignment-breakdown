const Joi = require("joi");

const assignmentSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  raw_text: Joi.string().min(1).required(),
  title: Joi.string().min(1).max(255).required(),
  due_date: Joi.date().iso().required(),
});

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

module.exports = {
  validateAssignment,
  validateAssignmentUpdate,
};
