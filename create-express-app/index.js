#!/usr/bin/env node

const inquirer = require('inquirer');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs-extra');
const { generateProject } = require('./src/generator');

console.log(chalk.bold.cyan('🚀 Welcome to @nish34/create-express-app!'));
console.log(chalk.cyan('Let\'s build your scalable Express application...\n'));

const questions = [
  {
    name: 'projectName',
    type: 'input',
    message: 'Project name:',
    default: 'my-express-app',
    validate: input => {
      if (/^([A-Za-z\-_\d])+$/.test(input)) return true;
      return 'Project name may only include letters, numbers, underscores and hashes.';
    }
  },
  {
    name: 'language',
    type: 'list',
    message: 'Select language:',
    choices: ['JavaScript', 'TypeScript']
  },
  {
    name: 'database',
    type: 'list',
    message: 'Select database:',
    choices: ['MongoDB', 'PostgreSQL', 'MySQL', 'None']
  },
  {
    name: 'features',
    type: 'checkbox',
    message: 'Select features:',
    choices: [
      { name: 'Morgan (HTTP request logger)', value: 'morgan', checked: true },
      { name: 'Helmet (Security headers)', value: 'helmet', checked: true },
      { name: 'CORS', value: 'cors', checked: true },
      { name: 'JWT Authentication', value: 'jwt', checked: true },
      { name: 'Custom Logger', value: 'logger', checked: true },
      { name: 'Swagger API Documentation', value: 'swagger', checked: true },
      { name: 'Email Service', value: 'email', checked: false }
    ]
  }
];

async function run() {
  try {
    const answers = await inquirer.prompt(questions);
    
    const targetDir = path.join(process.cwd(), answers.projectName);
    
    if (fs.existsSync(targetDir)) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: `Directory ${answers.projectName} already exists. Overwrite?`,
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        return;
      }
      
      fs.removeSync(targetDir);
    }
    
    // Process features into a more usable format
    const features = {};
    answers.features.forEach(feature => {
      features[feature] = true;
    });
    
    // Generate the project
    const success = await generateProject({
      projectName: answers.projectName,
      targetDir,
      language: answers.language.toLowerCase(),
      database: answers.database.toLowerCase(),
      features
    });
    
    if (success) {
      console.log(chalk.green.bold('\n✅ Success! Your Express app is ready.'));
      console.log(chalk.green(`\nCreated ${answers.projectName} at ${targetDir}`));
      console.log(chalk.cyan('\nInside that directory, you can run:'));
      console.log(chalk.cyan('\n  npm run dev'));
      console.log(chalk.cyan('    Starts the development server with hot reload'));
      console.log(chalk.cyan('\n  npm start'));
      console.log(chalk.cyan('    Starts the production server'));
      console.log(chalk.cyan('\nAPI Documentation will be available at:'));
      console.log(chalk.cyan('  http://localhost:3000/api-docs'));
      console.log(chalk.cyan('\nHappy coding! 🎉'));
    }
  } catch (error) {
    console.error(chalk.red('\nError creating project:'), error);
    process.exit(1);
  }
}

run();