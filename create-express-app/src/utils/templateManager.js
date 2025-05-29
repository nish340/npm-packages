const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/**
 * Copy template files to target directory
 * @param {Object} options - Options for template generation
 * @param {string} options.language - 'javascript' or 'typescript'
 * @param {string} options.targetDir - Target directory path
 * @param {string} options.database - Database type
 * @param {Object} options.features - Features to include
 */
async function copyTemplateFiles(options) {
  const { language, targetDir, database, features } = options;
  
  // Determine template source directory
  const templateDir = path.join(__dirname, '..', '..', 'templates', language === 'typescript' ? 'ts' : 'js');
  
  try {
    // Copy base template files
    await fs.copy(templateDir, targetDir);
    console.log(chalk.green('✓ Base template files copied'));
    
    // Update package.json with project name
    const packageJsonPath = path.join(targetDir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);
    packageJson.name = path.basename(targetDir);
    await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    
    // Configure database
    await configureDatabase(targetDir, database, language);
    
    // Configure features
    await configureFeatures(targetDir, features, language);
    
    console.log(chalk.green('✓ Project files configured successfully'));
  } catch (error) {
    console.error(chalk.red(`Error copying template files: ${error.message}`));
    throw error;
  }
}

/**
 * Configure database files based on selected database
 */
async function configureDatabase(targetDir, database, language) {
  // Implementation would handle different database setups
  // For now, we're using MongoDB as default in the templates
}

/**
 * Configure features based on selected options
 */
async function configureFeatures(targetDir, features, language) {
  // Implementation would enable/disable features based on selection
  // For now, all features are included in the templates
}

module.exports = {
  copyTemplateFiles
};