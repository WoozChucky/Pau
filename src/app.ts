import { Application } from './application';
import { ArgumentParser } from 'argparse';
import { Logger } from './utils/logging';

const argParser = new ArgumentParser({
    add_help: true,
    description: "Description",
    exit_on_error: true
});

argParser.add_argument(
    '-p2p',
    '--p2p-port',
    {
        default: 6000,
        type: 'int',
        nargs: 1,
        dest: 'P2P_PORT',
        help: '--p2p-port 6000',
        metavar: '<P2P_PORT>',
        required: false
    }
)

argParser.add_argument(
    '-http',
    '--http-port',
    {
        help: "--http-port 3000",
        type: 'int',
        default: 3000,
        required: false,
        nargs: 1,
        dest: 'HTTP_PORT',
        metavar: '<HTTP_PORT>'
    }
);

argParser.add_argument(
    '-d',
    '--data-folder',
    {
        help: "--data-folder dist/data",
        type: 'string',
        default: 'dist/data',
        nargs: 1,
        dest: 'DATA',
        metavar: '<DATA>'
    }
);

argParser.add_argument(
    '-n',
    '--name',
    {
        help: "--name node1",
        type: 'string',
        required: true,
        nargs: 1,
        dest: 'NAME',
        metavar: '<NAME>'
    }
);

argParser.add_argument(
    '-a',
    '--addresses',
    {
        help: "1 | 0",
        type: 'int',
        default: 0,
        nargs: 1,
        dest: 'USE_FILE',
        metavar: '<USE_FILE>'
    }
);

const parsedArgs = argParser.parse_args();

Logger.info('Parsed Arguments: ', parsedArgs);

const httpPort = parsedArgs["HTTP_PORT"];
const p2pPort = parsedArgs["P2P_PORT"];
const dataFolder = parsedArgs["DATA"];
const name = parsedArgs["NAME"][0];
const use_address = parsedArgs['USE_FILE'] == 1;

const appInstance = new Application(httpPort, p2pPort, name, dataFolder, use_address);

appInstance.initialize().then();

