import { Application } from './application';
import { ArgumentParser } from 'argparse';
import { logger } from './utils/logging';

let argParser = new ArgumentParser({
    version: '0.0.1',
    addHelp: true,
    description: "Description"
});

argParser.addArgument(
    ['--http-port'],
    {
        help: "--http-port 3000",
        type: 'int',
        defaultValue: 3000,
        nargs: 1,
        dest: 'HTTP_PORT',
        metavar: '<HTTP_PORT>'
    }
);

argParser.addArgument(
    ['--p2p-port'],
    {
        help: "--p2p-port 6000",
        type: 'int',
        defaultValue: 6000,
        nargs: 1,
        dest: 'P2P_PORT',
        metavar: '<P2P_PORT>',
    }
);

argParser.addArgument(
    ['--data-folder'],
    {
        help: "--data-folder dist/data",
        type: 'string',
        defaultValue: 'dist/data',
        nargs: 1,
        dest: 'DATA',
        metavar: '<DATA>'
    }
);

argParser.addArgument(
    ['--name'],
    {
        help: "--name node1",
        type: 'string',
        required: true,
        nargs: 1,
        dest: 'NAME',
        metavar: '<NAME>'
    }
);

argParser.addArgument(
    ['--addresses'],
    {
        help: "1 | 0",
        type: 'int',
        defaultValue: 0,
        nargs: 1,
        dest: 'USE_FILE',
        metavar: '<USE_FILE>'
    }
);

let parsedArgs = argParser.parseArgs();

logger.info('Parsed Arguments: ', parsedArgs);

let httpPort = parsedArgs["HTTP_PORT"][0];
let p2pPort = parsedArgs["P2P_PORT"][0];
let dataFolder = parsedArgs["DATA"];
let name = parsedArgs["NAME"][0];
let use_address = parsedArgs['USE_FILE'] == 1;

new Application(httpPort, p2pPort, name, dataFolder, use_address).initialize();