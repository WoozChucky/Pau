/* eslint-disable @typescript-eslint/naming-convention */

import { ArgumentParser } from 'argparse';

import { Application } from './application';
import { Settings } from './config';
import { Logger } from './utils/logging';

// TODO: Move this out of here
function getParsedArgument(arg: any) {
  if (Array.isArray(arg)) {
    return arg[0];
  } else {
    return arg;
  }
}

const argParser = new ArgumentParser({
  add_help: true,
  description: 'Description',
  exit_on_error: true,
});

argParser.add_argument('-n', '--name', {
  help: '--name node1',
  type: 'str',
  required: true,
  nargs: 1,
  dest: 'name',
  metavar: '<NAME>',
});

argParser.add_argument('-host', '--hostname', {
  help: '--hostname 0.0.0.0',
  default: '0.0.0.0',
  type: 'str',
  required: false,
  nargs: 1,
  dest: 'hostname',
  metavar: '<HOSTNAME>',
});

argParser.add_argument('-p', '--port', {
  default: 3000,
  type: 'int',
  nargs: 1,
  dest: 'port',
  help: '--port 3000',
  metavar: '<PORT>',
  required: false,
});

const parsedArgs = argParser.parse_args();

Logger.info(`Parsed Arguments: ${parsedArgs}`, parsedArgs);

const hostname = getParsedArgument(parsedArgs.hostname);
const port = getParsedArgument(parsedArgs.port);
const name = getParsedArgument(parsedArgs.name);

const appInstance = new Application(port, name, Settings.DataFolder, hostname);

appInstance
  .initialize()
  .then(() => Logger.info(`Node ${name} UP and running...`))
  .catch((err) => Logger.error(`Node ${name} failed to start. ${err}`));
