import figlet from 'figlet';
import chalk from 'chalk';

export const showBanner = (port: number = 3001, network: string = 'Cronos Testnet') => {
  console.clear();

  const banner = figlet.textSync('Cronos x402', {
    font: 'Slant',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  });

  console.log(chalk.blue(banner));
  console.log(chalk.cyan('------------------------------------------------------------'));
  console.log(chalk.bold.white(' 🚀 AGENTIC TREASURY SYSTEM'));
  console.log(chalk.cyan('------------------------------------------------------------'));
  console.log(chalk.green(` ✅ Status:    `) + chalk.white('Online'));
  console.log(chalk.green(` 📡 Port:      `) + chalk.white(port.toString()));
  console.log(chalk.green(` 🔗 Network:   `) + chalk.white(`${network} (EVM)`));
  console.log(chalk.green(` 🤖 Mode:      `) + chalk.white('Autonomous Agent'));
  console.log(chalk.cyan('------------------------------------------------------------'));
  console.log(chalk.gray(' Press CTRL+C to stop the server'));
  console.log('\n');
};

