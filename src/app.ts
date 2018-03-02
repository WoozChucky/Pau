import { HttpServer } from './httpServer/server';
import { initWallet } from './blockchain/wallet';
import { Application } from './application';
import { ArgumentParser } from 'argparse';

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
    ['--data'],
    {
        help: "--data dist/data/db",
        type: 'string',
        defaultValue: 'dist/data/db',
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

let parsedArgs = argParser.parseArgs();

console.log(parsedArgs);

let httpPort = parsedArgs["HTTP_PORT"];
let p2pPort = parsedArgs["P2P_PORT"];
let dataFolder = parsedArgs["DATA"];
let name = parsedArgs["NAME"][0];


//initWallet();

new Application(httpPort, p2pPort, name, dataFolder).initialize();