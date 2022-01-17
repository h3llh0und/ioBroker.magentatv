'use strict';

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require('@iobroker/adapter-core');

// Load your modules here, e.g.:
//const puppeteer = require('puppeteer');
const crypto = require('crypto');
const request = require('request');
const net = require('net');
const ipInfo = require('ip');
const keyCodes = require('./lib/keyCodes');
//const playModes = require('./lib/playMode');
const xmlHelper = require('./lib/xmlHelper');
const Event = require('./lib/Event');
const express = require('express');
const GetUserId = require('./lib/GetUserId');

class Magentatv extends utils.Adapter {

    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    constructor(options) {
        super({
            ...options,
            name: 'magentatv'
        });
        this.on('ready', this.onReady.bind(this));
        this.on('stateChange', this.onStateChange.bind(this));
        // this.on('objectChange', this.onObjectChange.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    /**
	 * Is called when databases are connected and adapter received configuration.
	 */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        if(this.config.terminalId === null || this.config.terminalId === undefined || this.config.localIP !== ipInfo.address()) {
            const config =  await this.getForeignObjectAsync('system.adapter.' + this.namespace);
            if(config !== null && config !== undefined) {
                config.native.terminalId = this.uuidv4();
                config.native.localIP = ipInfo.address();
                await this.setForeignObjectAsync('system.adapter.' + this.namespace, config);
            }
        }

        if((this.config.remoteIP !== '' && this.config.remoteIP !== undefined) && (this.config.remotePort !== 0 && this.config.remotePort !== undefined)) {

            this.remoteHostnameAndPort = this.config.remoteIP + ':' + this.config.remotePort;
            this.localHostnameAndPort = this.config.localIP + ':' + this.config.localPort;
            this.pairingCode = '';
            this.verificationCode = '';
            this.connected = false;
            this.setState('info.connection', {val: false, ack: true});
            this.promise = null;

            this.StartServerExpress();
            this.ConnectToReceiver();

            this.interval = setInterval(this.ConnectToReceiver.bind(this), 300000);
        }

        for (const [key] of Object.entries(keyCodes)) {
            await this.setObjectNotExistsAsync('Keys.' + key, {
                type: 'state',
                common: {
                    name: key,
                    type: 'boolean',
                    role: 'button',
                    read: false,
                    write: true,
                },
                native: {},
            });
        }

        await this.setObjectNotExistsAsync('Playmode', {
            type: 'state',
            common: {
                name: 'Playmode',
                type: 'number',
                role: 'Playmode',
                read: true,
                write: false,
                states: {
                    0: 'Stop',
                    1: 'Pause',
                    2: 'NormalPlay',
                    3: 'TrickMode',
                    4: 'MulticastChannelPlay',
                    5: 'UnicastChannelPlay',
                    20: 'Buffering'
                },
            },
            native: {},
        });
        await this.setObjectNotExistsAsync('Playmode', {
            type: 'state',
            common: {
                name: 'Playmode',
                type: 'number',
                role: 'Playmode',
                read: true,
                write: false,
                states: {
                    0: 'Stop',
                    1: 'Pause',
                    2: 'NormalPlay',
                    3: 'TrickMode',
                    4: 'MulticastChannelPlay',
                    5: 'UnicastChannelPlay',
                    20: 'Buffering'
                },
            },
            native: {},
        });

        await this.setObjectNotExistsAsync('Channel', {
            type: 'state',
            common: {
                name: 'Channel',
                type: 'number',
                role: 'Channel',
                read: true,
                write: false
            },
            native: {},
        });

        Event.updateFunction = this.setStateAsync;
        Event.createFunction = this.setObjectNotExistsAsync;

        await Event.CreateState('CurrentEvent');
        await Event.CreateState('NextEvent');
        await Event.SaveToState('CurrentEvent');
        await Event.SaveToState('NextEvent');
        await this.setStateAsync('Channel', 0, true);
        await this.setStateAsync('Playmode', 0, true);

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        this.subscribeStates('Keys.*');

        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates('lights.*');
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates('*');

        //GetUserId('test', 'test');
    }

    StartServerExpress() {
        const self = this;
        const app = express();

        app.use('*', function(req, res) {
            let body = '';
            req.on('data', function (chunk) {
                body += chunk;
            });

            req.on('end', async function () {
                self.log.debug('Received Message: ' + body);
                if (body.indexOf('X-pairingCheck:') >= 0) {
                    self.log.debug('Receiver connected');
                    self.connected = true;
                    self.setState('info.connection', {val: true, ack: true});
                    self.pairingCode = body.substring(body.indexOf('X-pairingCheck:') + 'X-pairingCheck:'.length, body.indexOf('</messageBody>'));
                    self.verificationCode = crypto.createHash('md5').update(self.pairingCode + self.config.terminalId + self.config.userID).digest('hex').toUpperCase();

                    const soapBody = '<u:X-pairingCheck xmlns:u="urn:schemas-upnp-org:service:X-CTC_RemotePairing:1"><pairingDeviceID>' + self.config.terminalId + '</pairingDeviceID><verificationCode>' + self.verificationCode + '</verificationCode></u:X-pairingCheck>';
                    const soapXml = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>' + soapBody + '</s:Body></s:Envelope>';
                    const url = 'http://' + self.remoteHostnameAndPort + '/upnp/service/X-CTC_RemotePairing/Control';
                    const headers = {
                        'CONNECTION': 'CLOSE',
                        'Content-Type': 'text/xml; charset=UTF-8',
                        'Accept': '',
                        'USER_AGENT': 'Darwin/16.5.0 UPnP/1.0 HUAWEI_iCOS/iCOS V1R1C00 DLNADOC/1.50',
                        'HOST': self.remoteHostnameAndPort,
                        'SOAPACTION': '"urn:schemas-upnp-org:service:X-CTC_RemotePairing:1#X-pairingCheck"'
                    };

                    request({
                        method: 'POST',
                        headers: headers,
                        uri: url,
                        body: soapXml
                    }
                    );
                } else {
                    if(body.indexOf('STB_') >= 0) {
                        const xml = body.replace(/&quot;/g, '"');
                        let stbEvent = null;
                        if(xml.indexOf('STB_playContent') >= 0) {
                            stbEvent = xmlHelper.substringBetween(xml, '<STB_playContent>', '</STB_playContent>');
                        } else if(xml.indexOf('STB_EitChanged') >= 0){
                            stbEvent = xmlHelper.substringBetween(xml, '<STB_EitChanged>', '</STB_EitChanged>');
                        }
                        else {
                            self.log.debug('Unknown Event: ' + xml);
                        }
                        if(stbEvent !== null) {
                            const json = JSON.parse(stbEvent);
                            if(json.type === 'EVENT_EIT_CHANGE') {
                                await self.setStateAsync('Channel', parseInt(json.channel_num), true);
                                if(json.program_info.length > 0 && json.program_info[0].short_event !== null && json.program_info[0].short_event !== undefined && json.program_info[0].short_event.length > 0) {
                                    Event.UpdateFromJson(json.program_info[0]);
                                    await Event.SaveToState('CurrentEvent');
                                }
                                if(json.program_info.length > 1 && json.program_info[1].short_event !== null && json.program_info[1].short_event !== undefined && json.program_info[1].short_event.length > 0) {
                                    Event.UpdateFromJson(json.program_info[1]);
                                    await Event.SaveToState('NextEvent');
                                }
                            } else if(json.new_play_mode !== null) {
                                await self.setStateAsync('Playmode', json.new_play_mode, true);
                            }
                        }
                    }
                    else {
                        self.log.debug('Unknown Body: ' + body);
                    }

                }
                res.end('');
                body = '';
            });
        });

        app.listen(this.config.localPort, this.config.localIP, () => {
            self.log.debug('Callback Server started');
        });
    }

    /**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
    onUnload(callback) {
        try {
            // @ts-ignore
            clearInterval(this.interval);
            this.setState('info.connection', {val: false, ack: true});
            callback();
        } catch (e) {
            callback();
        }
    }

    /**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
    async onStateChange(id, state) {
        if (!state || state.ack) {
            return;
        }

        const stateParts = id.split('.');
        const command = stateParts.pop();
        const parent = stateParts.pop();
        if(parent === 'Keys') {
            //Dann ist es ein Button
            await this.SendKeyCode(keyCodes[command]);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    onMessage(obj) {
        if (typeof obj === 'object' && obj.message) {
        //     if (obj.command === 'GetUserId') {
        //         // Send response in callback if required
        //         const self = this;
        //         if (obj.callback) {
        //             this.GetUserId(obj.message.username, obj.message.password, function (userId){
        //                 self.sendTo(obj.from, obj.command, userId, obj.callback);
        //             });
        //         }
        //     }
        }
    }

    //GetUserId(username, password, OnReceivedUserId) {
    // (async () => {
    // 	this.log.info('Get User ID');
    // 	const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'})
    // 	const page = await browser.newPage()
    // 	await page.goto('https://web.magentatv.de/login', { waitUntil: 'networkidle2' })
    // 	await page.type('#username', username)
    // 	await page.click('#pw_submit')
    // 	await page.waitForNavigation()
    // 	await page.type('#pw_pwd', password)
    // 	page.on('requestfinished', async (request) => {
    // 		if(request.url().includes("DTAuthenticate")){
    // 			try {
    // 				var json = await request.response().json();
    // 				let userId = crypto.createHash('md5').update(json.userID).digest("hex").toUpperCase();
    // 				OnReceivedUserId(userId);
    // 				browser.close()
    // 			} catch (error) {
    // 				this.log.info(error);
    // 			}
    // 		}
    // 	});
    // 	await page.click('#pw_submit')
    // 	await page.waitForNavigation()
    // })()
    //}

    uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    ConnectToReceiver()
    {
        this.connected = false;
        this.setState('info.connection', {val: false, ack: true});
        let url = 'http://' + this.remoteHostnameAndPort;
        const msg = "SUBSCRIBE /upnp/service/X-CTC_RemotePairing/Event HTTP/1.1\r\nHOST: '" + this.remoteHostnameAndPort + "'\r\nCALLBACK: <http://" + this.localHostnameAndPort + '/magentatv/notify/>\r\nNT: upnp:event\r\nTIMEOUT: Second-300\r\nCONNECTION: close\r\n\r\n';

        const client = new net.Socket();
        const self = this;
        client.connect(this.config.remotePort, this.config.remoteIP, function() {
            client.write(msg);
        });
        client.on('data', function() {
            client.destroy();

            const soapBody = '<u:X-pairingRequest xmlns:u="urn:schemas-upnp-org:service:X-CTC_RemotePairing:1"><pairingDeviceID>' + self.config.terminalId + '</pairingDeviceID><friendlyName>iobroker.1</friendlyName><userID>' + self.config.userID + '</userID></u:X-pairingRequest>';
            url = 'http://' + self.remoteHostnameAndPort + '/upnp/service/X-CTC_RemotePairing/Control';
            const soapXml = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>' + soapBody + '</s:Body></s:Envelope>';
            const headers = {'CONNECTION': 'CLOSE', 'Content-Type': 'text/xml; charset=UTF-8', 'Accept' : '', 'USER_AGENT': 'Darwin/16.5.0 UPnP/1.0 HUAWEI_iCOS/iCOS V1R1C00 DLNADOC/1.50', 'HOST': self.remoteHostnameAndPort, 'SOAPACTION': '"urn:schemas-upnp-org:service:X-CTC_RemotePairing:1#X-pairingRequest"'};

            request({ method: 'POST',
                headers: headers,
                uri: url,
                body: soapXml
            });
        });
    }

    async SendKeyCode(keyCode)
    {
        if(!this.connected) {
            this.log.debug('Not Connected');
            return;
        }
        await this.SendKeyCodeToReceiver(keyCode);
    }

    SendKeyCodeToReceiver(keyCode)
    {
        if(!this.connected) {
            this.log.debug('Not Connected');
            return;
        }

        this.log.debug('Sending Keycode: ' + keyCode);

        const soapBody ='<u:X_CTC_RemoteKey xmlns:u="urn:schemas-upnp-org:service:X-CTC_RemoteControl:1"><InstanceID>0</InstanceID><KeyCode>keyCode=' + keyCode + '^' + this.config.terminalId + ':' + this.verificationCode+ '^userID:' + this.config.userID + '</KeyCode></u:X_CTC_RemoteKey>';
        const soapXml = '<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"><s:Body>' + soapBody + '</s:Body></s:Envelope>';
        const url = 'http://' + this.remoteHostnameAndPort + '/upnp/service/X-CTC_RemoteControl/Control';
        const headers = {'CONNECTION': 'CLOSE', 'Content-Type': 'text/xml; charset=UTF-8', 'Accept' : '', 'USER_AGENT': 'Darwin/16.5.0 UPnP/1.0 HUAWEI_iCOS/iCOS V1R1C00 DLNADOC/1.50', 'HOST': this.remoteHostnameAndPort, 'SOAPACTION': '"urn:schemas-upnp-org:service:X-CTC_RemoteControl:1#X_CTC_RemoteKey"'};

        const self = this;
        request({
            method: 'POST',
            headers: headers,
            uri: url,
            body: soapXml
        }, function() {
            self.promise();
        });
        return new Promise(resolve=> self.promise = resolve);
    }


}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
    module.exports = (options) => new Magentatv(options);
} else {
    // otherwise start the instance directly
    new Magentatv();
}
//# sourceMappingURL=main.js.map