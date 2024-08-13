// validators.js
const Joi = require('joi');

module.exports = {
    validateTarget,
    validateVisitor
};


const targetSchema = Joi.object({
    id: Joi.string().required(),
    url: Joi.string().uri().required(),
    value: Joi.number().positive().required(),
    maxAcceptsPerDay: Joi.number().integer().positive().required(),
    accept: Joi.object({
        geoState: Joi.object({
            $in: Joi.array().items(Joi.string().length(2).lowercase()).required()
        }).required(),
        hour: Joi.object({
            $in: Joi.array().items(Joi.string().pattern(/^[0-9]{2}$/)).required()
        }).required()
    }).required()
});

const visitorSchema = Joi.object({
    geoState: Joi.string().length(2).lowercase().required(),
    publisher: Joi.string().required(),
    timestamp: Joi.date().iso().required()
});

function validateTarget(target) {
    return targetSchema.validate(target);
}

function validateVisitor(visitor) {
    return visitorSchema.validate(visitor);
}
