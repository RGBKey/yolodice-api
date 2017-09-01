const tls = require('tls');
const fs = require('fs');
const EventEmitter = require('events');
//-----------------------//
const bitcore = require('bitcore-lib');
const Message = require('bitcore-message');

/**
 * A class that handles connections to the YOLOdice API.
 * 
 * @class YOLOdice
 * @extends {EventEmitter}
 */
class YOLOdice extends EventEmitter {

    /**
     * Creates an instance of YOLOdice.
     * 
     * @param {string} key - A WIF format Bitcoin private key used to sign the login request
     * @param {Object} [options] - An optional object to change some aspects of the server
     * @param {string} [options.host] - The host to connect to (defaults to api.yolodice.com)
     * @param {number} [options.port] - The port to connect to (defaults to 4444)
     * @memberof YOLOdice
     */
    constructor(key, options) {
        super();
        this.host = 'api.yolodice.com';
        this.port = 4444;
        if(options) {
            this.host = options.host || this.host;
            this.port = options.port || this.port;
        }
        this.key = bitcore.PrivateKey.fromWIF(key);
        this.initVariables();
        this.transport = tls.connect({
           host: this.host,
           port: this.port
        });
        this.transport.setEncoding('utf8');
        this.transport.on('secureConnect', () => {
            this.connected();
        });
        this.transport.on('close', (withError) => {
            
        });
        this.transport.on('error', (err) => {
            this.emit('error', err);
        });
        this.transport.on('data', (data) => {
            this.in(data);
        });
    }

    /**
     * Initializes certain instance variables
     * 
     * @memberof YOLOdice
     * @instance
     */
    initVariables() {
        // Constants
        this.betRefreshDelay = 3000;
        this.SATOSHIS = 100000000;
        // Incoming message handling
        this.buffer = '';
        this.requests = {};
        this.id = 0;
    }

    /**
     * Called internally when the TLS socket is connected
     * 
     * @memberof YOLOdice
     * @instance
     */
    connected() {
        this.send({
            method: 'generate_auth_challenge'
        });
    }

    /**
     * Called internally when the TLS socket emits a 'data' event
     * 
     * @param {string} data - The incoming UTF8 encoded string
     * @memberof YOLOdice
     * @instance
     */
    in(data) {
        while(data.length > 0) {
            let i = data.indexOf('\n');
            if(i > 0) {
                let chunk = this.buffer + data.substring(0, i+1);
                this.handle(JSON.parse(chunk));
                this.buffer = '';
                data = data.substring(i+1, data.length);
            } else if(i < 0) {
                this.buffer += data;
                data = '';
            }
        }
    }

    /**
     * Handles a individual response from the server
     * 
     * @param {Object} res - The response from the server
     * @memberof YOLOdice
     * @instance
     */
    handle(res) {
        if(this.requests[res.id]) {
            let req = this.requests[res.id];
            if(req._callback) {
                req._callback(res);
            } else {
                switch(this.requests[res.id].method) {
                    case 'generate_auth_challenge':
                        this.auth(res.result);
                        break;
                    case 'auth_by_address':
                        require('./handlers/auth_by_address.js')(this, res);
                        break;
                }
            }
            delete this.requests[res.id];
        } else {
            switch(res.method) {
                case 'update_user_data':
                    break;
            }
        }
    }

    /**
     * Serializes data and sends it through the TLS socket
     * 
     * @param {Object} data 
     * @memberof YOLOdice
     * @instance
     */
    out(data) {
        this.transport.write(JSON.stringify(data)+'\n');
    }

    /**
     * Records the request sent in this.requests and sends the data. Can also be used to send unsupported/new methods.
     * 
     * @param {Object} req - The request to send
     * @param {YOLOdice~responseHandler} [callback] - An optional callback to call when a response is received
     *     The callback is passed the entire response object
     * @memberof YOLOdice
     * @instance
     */
    send(req, callback) {
        req.id = this.id++;
        if(callback) {
            req._callback = callback;
        }
        this.out(req);
        this.requests[req.id] = req;
    }

    /**
     * Signs a message with the client's private key
     * 
     * @param {string} msg - The message to sign
     * @returns {string} The signature
     * @fires YOLOdice#sign
     * @memberof YOLOdice
     * @instance
     */
    sign(msg) {
        this.emit('sign', msg);
        msg = Message(msg);
        let sig = msg.sign(this.key);
        if(msg.verify(this.key.toAddress(), sig)){
            return sig;
        } else {
            this.emit('error', new Error('Created invalid signature'));
            this.quit();
        }
    }

    /**
     * Sends an authorization after receiving a challenge
     * 
     * @param {string} challenge - The challenge to sign and send to the server
     * @memberof YOLOdice
     * @instance
     */
    auth(challenge) {
        this.send({
            method: 'auth_by_address',
            params: {
                address: this.key.toAddress().toString(),
                signature: this.sign(challenge)
            }
        });
    }

    /**
     * Gracefully closes the connection and terminates the process
     * 
     * @memberof YOLOdice
     * @instance
     */
    quit() {
        this.transport.end();
        process.exit();
    }

    // Methods above this line are generally abstractions of the connection/authentication process //
    //---------------------------------------------------------------------------------------------//
    //    Methods after this line are generally just wrappers for the rest of the API methods      //

    /**
     * Requests site data and calls callback with the data
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readSiteData(callback) {
        this.send({
            method: 'read_site_data'
        }, callback);
    }

    /**
     * Returns user data including id, name, date created and roles
     * 
     * @param {number} id - The user id to look up
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readUser(id, callback) {
        this.send({
            method: 'read_user',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * Returns more extensive user data
     * 
     * @param {number} id - The user id to look up
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readUserData(id, callback) {
        this.send({
            method: 'read_user_data',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * An abstraction for readUserData on yourself
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback
     * @memberof YOLOdice
     * @instance
     */
    getBalance(callback) {
        if(this.loggedIn) {
            this.readUserData(this.user.id, (data) => {
                if(data.result) {
                    callback(data.result.balance);
                } else {
                    this.emit('error', new Error('Error getting user data'));
                }
            });
        } else {
            this.emit('error', new Error('Cannot get balance before logged in'));
        }
    }

    /**
     * Creates a bet. Requires the play permission
     * 
     * @param {Object} attrs - Bet attributes
     * @param {number} attrs.amount - The amount of the bet IN SATOSHIS
     * @param {number} attrs.target - The target of the bet, in the range [1, 989900]
     * @param {string} attrs.range - Either 'hi' or 'lo'
     * @param {boolean} [includeDatas] - If true, the response will include site and user data
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    createBet(attrs, includeDatas, callback) {
        this.send({
            method: 'create_bet',
            params: {
                attrs,
                includeDatas
            }
        }, callback);
    }

    /**
     * Reads the data from a single bet
     * 
     * @param {number} id - The bet id to look up
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readBet(id, callback) {
        this.send({
            method: 'read_bet',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * An array of hashes each containing a single bet
     * 
     * @param {number} [userId] - The id of the user
     * @param {Object} [options] - The options to restrict data
     * @param {number} [options.user_id] - The user ID to restrict bets to
     * @param {string} [options.order=desc] - Either 'asc' or 'desc' to sort in ascending or descending order. Default descending
     * @param {number} [options.id_marker] - If order='asc', only bets > idMarker are returned. If order='desc', only bets < idMarker
     * @param {number} [options.limit=100] - Limit the number of objects returned. Default 100, max 1000
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    listBets(options, callback) {
        this.send({
            method: 'list_bets',
            params: options || {}
        }, callback);
    }

    /**
     * Reads the attributes of a seed
     * 
     * @param {number} id - The id of the seed
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readSeed(id, callback) {
        this.send({
            method: 'read_seed',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * Reads the current seed for the specified user
     * 
     * @param {number} userId - The user to get the seed for
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readCurrentSeed(userId, callback) {
        this.send({
            method: 'read_current_seed',
            params: {
                selector: {
                    user_id: userId
                }
            }
        }, callback);
    }

    /**
     * Lists the seeds that meet the given criteria
     * 
     * @param {Object} [options] - Options to restrict results
     * @param {number} [options.user_id] - User ID to restrict seeds to
     * @param {string} [options.order=desc] - Order, either 'asc' or 'desc' (see listBets)
     * @param {string} [options.id_marker] - id marker (see listBets)
     * @param {number} [options.limit=100] - Limit number of results. Default 100, max 1000
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    listSeeds(options, callback) {
        this.send({
            method: 'list_seeds',
            params: options || {}
        }, callback);
    }

    /**
     * Creates a new seed for the user
     * 
     * @param {Object} attrs - The attributes of the new seed
     * @param {string} attrs.client_seed - User provided part of the seed
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    createSeed(attrs, callback) {
        this.send({
            method: 'create_seed',
            params: {
                attrs
            }
        }, callback);
    }

    /**
     * Updates and returns the current seed
     * 
     * @param {number} id - The id of the seed to patch
     * @param {Object} attrs - The attributes to change
     * @param {string} attrs.client_seed - The client seed. Must be 6-128 chars and [a-zA-Z0-9 \-_]
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    patchSeed(id, attrs, callback) {
        this.send({
            method: 'patch_seed',
            params: {
                selector: {
                    id
                },
                attrs
            }
        }, callback);
    }

    /**
     * Reads the current deposit address for the authenticated user
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readDepositAddress(callback) {
        this.send({
            method: 'read_deposit_address'
        }, callback);
    }

    /**
     * Returns the information for a single deposit
     * 
     * @param {number} id - The id of the deposit
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readDeposit(id, callback) {
        this.send({
            method: 'read_deposit',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * Lists deposits
     * 
     * @param {Object} [options] - Options for restricting results
     * @param {string} [options.order=desc] - Order, either 'asc' or 'desc' (see listBets)
     * @param {string} [options.id_marker] - id marker (see listBets)
     * @param {number} [options.limit=100] - Limit number of results. Default 100, max 1000
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    listDeposits(options, callback) {
        this.send({
            method: 'list_deposits',
            params: options || {}
        }, callback);
    }

    /**
     * Contains info about withdrawing
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readWithdrawingConfig(callback) {
        this.send({
            method: 'read_withdrawing_config'
        }, callback);
    }

    /**
     * Reads withdrawal specified by id
     * 
     * @param {number} id - The withdrawal id
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readWithdrawal(id, callback) {
        this.send({
            method: 'read_withdrawal',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * Lists withdrawals for the logged in user
     * 
     * @param {Object} [options] - Options for restricting results
     * @param {string} [options.order=desc] - Order, either 'asc' or 'desc' (see listBets)
     * @param {string} [options.id_marker] - id marker (see listBets)
     * @param {number} [options.limit=100] - Limit number of results. Default 100, max 1000
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    listWithdrawals(options, callback) {
        this.send({
            method: 'list_withdrawals',
            params: options || {}
        }, callback);
    }

    /**
     * Contains info about withdrawing
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readWithdrawalConfig(callback) {
        this.send({
            method: 'read_withdrawal_config'
        }, callback);
    }

    /**
     * Creates a withdrawal. Returns the withdrawal (identical format to readWithdrawal)
     * 
     * @param {Object} attrs - The withdrawal attributes
     * @param {string} attrs.to_address - The address to send the coins to
     * @param {number} attrs.amount - The amount to withdrawal IN SATOSHIS
     * @param {string} attrs.withdrawal_type - 'instant' or 'batch'
     * @param {boolean} attrs.allow_pending - If there are not enough funds in hot wallet, setting this
     *     to true allows the withdrawal to be put into a pending state awaing hot wallet refill
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    createWithdrawal(attrs, callback) {
        this.send({
            method: 'create_withdrawal',
            params: {
                attrs
            }
        }, callback);
    }

    /**
     * Can only be used to cancel pending withdrawals
     * 
     * @param {number} id - The id of the withdrawal to cancel
     * @param {Object} attrs - Attributes of the patch
     * @param {string} attrs.status - Can only be 'canceled'
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    patchWithdrawal(id, attrs, callback) {
        this.send({
            method: 'patch_withdrawal',
            params: {
                selector: {
                    id
                },
                attrs
            }
        }, callback);
    }

    /**
     * Wrapper method for patchWithdrawal to cancel withdrawals
     * 
     * @param {number} id - The id of the withdrawal to cancel
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    cancelWithdrawal(id, callback) {
        this.send({
            method: 'patch_withdrawal',
            params: {
                selector: {
                    id
                },
                attrs: {
                    status: 'canceled'
                }
            }
        }, callback);
    }

    /**
     * Reads the investment for the given id
     * 
     * @param {number} id - The id of the investment
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    readInvestment(id, callback) {
        this.send({
            method: 'read_investment',
            params: {
                selector: {
                    id
                }
            }
        }, callback);
    }

    /**
     * Lists investments for the logged in user
     * 
     * @param {string} [status] - If status is set to 'open' then will only list open investments
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    listInvestments(status, callback) {
        this.send({
            method: 'list_investments',
            params: {
                status
            }
        }, callback);
    }

    /**
     * Creates an investment
     * 
     * @param {Object} attrs - The investment attributes
     * @param {number} attrs.base - The initial value of the investment IN SATOSHIS
     * @param {number} leverage - The leverage of the investment, from 1 to 10
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    createInvestment(attrs, callback) {
        this.send({
            method: 'create_investment',
            params: {
                attrs
            }
        }, callback);
    }

    /**
     * Patches (closes) an investment 
     * 
     * @param {number} id - The id of the investment
     * @param {Object} attrs - The investment patch attributes
     * @param {string} attrs.status - Only 'canceled' value is supported (to cancel the investment)
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    patchInvestment(id, attrs, callback) {
        this.send({
            method: 'patch_investment',
            params: {
                selector: {
                    id
                },
                attrs
            }
        }, callback);
    }

    /**
     * Pings the server
     * 
     * @param {YOLOdice~responseHandler} [callback] - The callback function
     * @memberof YOLOdice
     * @instance
     */
    ping(callback) {
        this.send({
            method: 'ping'
        }, callback);
    }

    /**
     * @event YOLOdice#error
     * @type {Object} Error
     */

    /**
     * Fires when the instance signs a message with it's Bitcoin key
     * 
     * @event YOLOdice#sign
     * @type {string} msg
     */

    /**
     * Fires when the user is successfully logged in
     * 
     * @event YOLOdice#loggedIn
     */
}

/**
 * Callback called when a response is received from the server
 * @callback YOLOdice~responseHandler
 * @param {Object} response - The response received from the server
 */

module.exports = YOLOdice;
