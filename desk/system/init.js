Scripts.loadCSS('/system/style.css');
Scripts.loadJS('/system/core.js');
Scripts.loadJS('/system/apps/Desktop.app/index.js');
Scripts.loadJS('/system/lib/socket.io.js');
var sys = {
    socket: undefined,
    config: undefined,
};

var webid = {
    priv: 1,
    userid: undefined,
}

async function startsockets() {
    const devsocket = await fs.read('/system/info/devsocket');
    return new Promise((resolve) => {
        try {
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }

            if (devsocket === "true") {
                sys.socket = io('wss://webdeskbeta.meower.xyz/');
                wm.notif('Using beta socket server', 'This is for testing purposes only and might not even be online.');
            } else {
                sys.socket = io("wss://webdesk.meower.xyz/");
            }

            const timeout = setTimeout(() => {
                console.log('<!> Connection timeout: No response in 6 seconds');
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
            }, 6000);

            /* if (params.get('listen') === "yes") {
                sys.socket.onAny((event, ...args) => {
                    console.log(`Received event: ${event}`, args);
                });
            } */

            sys.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                console.log('<!> Connection error: ', error);
                sys.socket.disconnect();
                sys.socket = undefined;
                resolve(false);
                webid.priv = -1;
            });

            sys.socket.on("servmsg", (data) => {
                wm.snack(data);
            });

            sys.socket.on("error", (data) => {
                if (data == "No token provided" && sys.setupd === false) {
                    console.log(`<!> Quiet error: ` + data);
                } else {
                    wm.snack(data);
                }
            });

            sys.socket.on("force_update", (data) => {
                window.location.reload();
            });

            sys.socket.on("connect", async () => {
                clearTimeout(timeout);
                const token = await fs.read('/user/info/token');
                console.log('<i> Connected to WebDesk server');
                if (token) {
                    sys.socket.emit("login", token);
                } else {
                    console.log('<!> No token');
                }
                resolve(true);
            });

            sys.socket.on("checkback", async (thing) => {
                if (thing.error === true) {
                    await fs.del('/user/info/token');
                    window.location.reload();
                } else {
                    sys.name = thing.username;
                    sd = thing.username;
                    await set.set('name', thing.username);
                    webid.token = await fs.read('/user/info/token');
                    webid.priv = thing.priv;
                    webid.userid = thing.userid;
                    if (thing.priv === 0) {
                        wm.notif('Your account has been limited.', `You can still use WebDesk normally, but you can't use online services.`);
                    }
                    console.log(`<i> Logged in!
- Username: ${thing.username}
- Account permission level: ${thing.priv}
- UserID: ${thing.userid}
- Token: ${UI.truncate(webid.token, 8)}`);
                }
                resolve(true);
            });

            sys.socket.on("webcall", async (call) => {
                const notif = wm.notif('Call from ' + call.username, undefined, async function () {
                    app.webcomm.webcall.init(call.username, call.deskid, call.id);
                }, 'Answer');
                setTimeout(function () {
                    if (notif) {
                        ui.dest(notif.div);
                    }
                }, 15000);
            });

            var recsock = [];

            sys.socket.on("umsg", async (msg) => {
                if (!recsock[msg.username]) {
                    recsock[msg.username] = [];
                }

                recsock[msg.username].push(msg.contents);

                if (random[msg.username]) {
                    await app.webcomm.webchat.init(msg.username, [msg.contents], false);
                } else {
                    if (random[msg.username + "notif"]) {
                        ui.dest(random[msg.username + "notif"]);
                    }

                    const notif = wm.notif(msg.username, msg.contents, async function () {
                        random[msg.username] = tk.mbw('WebChat', '300px', 'auto', true);
                        random[msg.username].messaging = tk.c('div', random[msg.username].main);
                        random[msg.username].chatting = tk.c('div', random[msg.username].messaging, 'embed nest message-container');
                        random[msg.username].chatting.style.overflow = "auto";
                        random[msg.username].chatting.style.height = "320px";
                        tk.ps(`Talking with ${msg.username}`, 'smtxt', random[msg.username].chatting);

                        if (sys.filter === true) {
                            tk.ps(`Some filters can detect things YOU send, as they monitor your typing.`, 'smtxt', random[msg.username].chatting);
                        }

                        random[msg.username].containchatdiv = tk.c('div', random[msg.username].messaging);
                        random[msg.username].containchatdiv.style.display = "flex";

                        random[msg.username].input = tk.c('input', random[msg.username].containchatdiv, 'i1 tnav');
                        random[msg.username].input.placeholder = "Message " + msg.username;

                        function send() {
                            const message = random[msg.username].input.value;
                            if (message) {
                                sys.socket.emit("message", { token: webid.token, username: msg.username, contents: message });
                                const div = tk.c('div', random[msg.username].chatting, 'msg mesent');
                                div.innerText = ui.filter(message);
                                div.style.marginBottom = "3px";
                                random[msg.username].input.value = '';
                                random[msg.username].chatting.scrollTop = random[msg.username].chatting.scrollHeight;
                            }
                        }

                        random[msg.username].containchatdiv.style.marginTop = "5px";

                        tk.cb('b1 title resist', 'Send', () => send(), random[msg.username].containchatdiv);
                        ui.key(random[msg.username].input, "Enter", () => send());

                        random[msg.username].closebtn.addEventListener('mousedown', function () {
                            random[msg.username] = undefined;
                        });

                        app.webcomm.add(msg.username);
                        app.webcomm.webchat.init(msg.username, recsock[msg.username], true);
                    }, 'Open');

                    random[msg.username + "notif"] = notif.div;
                }

                random[msg.username].closebtn.addEventListener('mousedown', function () {
                    recsock[msg.username] = undefined;
                });
            });
        } catch (error) {
            console.log(error);
            if (sys.socket) {
                sys.socket.disconnect();
                sys.socket = undefined;
            }
            resolve(false);
        }
    });
}