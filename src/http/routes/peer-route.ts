

this.router.get("/", PeerRoute.getPeers.bind(this));

this.router.post('/', PeerRoute.addPeer.bind(this));

this.router.post('/ask', PeerRoute.askPeer.bind(this));

this.router.post('/ask/:peer', PeerRoute.askPeer.bind(this));
