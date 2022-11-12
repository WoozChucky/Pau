/* eslint-disable @typescript-eslint/no-namespace */
export namespace Events {
  export namespace Http {
    export const Listening = 'http-server.listening';
    export const ErrorListening = 'http-server.error-listening';
    export const Error = 'http-server.error';
  }

  export namespace P2P {
    export const Listening = 'p2p-server.listening';
    export const Error = 'p2p-server.error';
  }

  export namespace BlockchainManager {
    export const BlockGenerated = 'blockchain-manager.block-generated';
  }
}
