const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

/**
 * Compiles an email template using Handlebars.
 * @param {string} templateName - The name of the template (e.g., 'paymentSuccess' or 'paymentFailure').
 * @param {Object} data - Data to inject into the template.
 * @returns {string} - The compiled HTML string.
 */
const compileEmailTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '../templates/emailTemplates', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);
  return template(data);
};

module.exports = { compileEmailTemplate };
