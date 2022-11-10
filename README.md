Welcome to the worst blockchain implementation ever seen
==============================================

This sample code helps get you started with blockchain technology. Or at least should <.<

What's Here
-----------

This sample includes:

* HTTP API
* P2P Protocol
* [Wallet Concept](docs/blockchain/wallet/README.md)
* Nodes Discovery
* Local Database
* Cryptography
* and last, but not least... awful code!


Getting Started
---------------

These directions assume you want to develop some sort of DApp (Decentralized Application) on your local computer, and not
from wherever it is you want to host your nodes. (At least when starting)

To work on the sample code, you'll need to clone your project's repository to your
local computer. If you haven't, do that first. You can find instructions @ Google and GitHub on how to clone a repository.

1. Install Node.js on your computer.  For details on available installers visit
   https://nodejs.org/en/download/.

2. Install NPM dependencies:

        $ npm install

3. Start the development node (starts a node names master):

        $ npm start

4. Open http://127.0.0.1:3000/v1/status in a web browser to view your service details.


Development Scripts
-------------------

1. Start a single node

       $ npm start

2. Start a single node watching for changes

        $ npm run start:watch

3. Start a single node watching for changes and build to /dist folder

        $ npm run start:dev

4. Build to /dist folder

        $ npm run build

5. Run Linter
    
       $ npm run lint

What Do I Do Next?
------------------

Once you managed to keep your node running without it crashing in the first 5 minutes,
look for the api routes, try to understand what they do, fail miserably and open an issue about the non existent documentation.

Now seriously, this is the most alpha project you will ever find on GitHub, i'm also still learning so don't expect to use this in any production environment.
I plan to write some real documentation which should provide some help about where to start, but only after i feel this can actually be used by other developers.

In case you REALLY want to help me out in any way or have a problem, contact me at nuno.levezinho@live.com.pt

(When I have time I'll try to actually write a proper README, until then, good luck!)

LICENSE
------------------
All code here provided is under MIT license.
