const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { execSync } = require('child_process');
const { copyTemplateFiles } = require('./utils/templateManager');

/**
 * Generate a new Express project
 */
async function generateProject(options) {
  const { projectName, targetDir, language, database, features } = options;
  
  try {
    console.log(chalk.blue(`\n📁 Creating project structure...`));
    
    // Ensure target directory exists
    await fs.ensureDir(targetDir);
    
    // Copy template files
    await copyTemplateFiles({
      language,
      targetDir,
      database,
      features
    });
    
    // Install dependencies
    console.log(chalk.blue(`\n📦 Installing dependencies...`));
    try {
      process.chdir(targetDir);
      execSync('npm install', { stdio: 'inherit' });
      console.log(chalk.green('✓ Dependencies installed successfully'));
    } catch (error) {
      console.warn(chalk.yellow(`\n⚠️  Couldn't install dependencies automatically. Run 'npm install' manually in the project directory.`));
    }
    
    return true;
  } catch (error) {
    console.error(chalk.red(`\n❌ Error generating project: ${error.message}`));
    return false;
  }
}

module.exports = { generateProject };