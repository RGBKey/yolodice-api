# yolodice-api

An API wrapper for the [YOLOdice ](https://yolodice.com/r?2FYJC-7JZ)[API](https://dev.yolodice.com)

Sample usage:

```
npm install yolodice-api --save
```

```javascript
const YOLOdice = require('./server.js');
let client = new YOLOdice('YOUR_API_PRIVATE_KEY');

client.on('loggedIn', (user) => {
    console.log(`Logged in as (${user.id})${user.name}`);
});

client.on('error', (err) => {
    console.dir(err);
});

process.on('SIGINT', () => {
    client.quit();
});

```

```
A:\Code\yolodice-api>node app
Logged in as (12345)YourName
```

Nearly all the methods that take a callback (with the exception of `getBalance()`) return the entire server response as the first and only argument to the callback function. These objects follow the JSON-RPC 2.0 spec, which means they all have an `id` property and have a `result` property on success and an `error` property on failure. To access the info, you should in most cases check to see if the response has a `result` property and parse the data from there.

Unsupported methods (none at the time of this writing) can be called by using `YOLOdice.send(obj, callback)` where `obj` is the object to send and callback is the method to call with the response when the server responds. Example:

```javascript
client.send({
    method: 'some_unsupported_method',
    params: {
        param_a: 1,
        param_b: 2
    }
}, aCallbackFunction(res) {
    if(res.result) {
        console.log('Got response');
    }
});
```

The class does most of the legwork for you here, it will automatically add an `id` property to the object before it sends it to the server and use it to track when the server responds, and it will then call the callback with the response.

*Please note this is an early version of this library and many methods have not been tested extensively or at all. Please use at your own risk.*

<a name="YOLOdice"></a>

## YOLOdice ⇐ <code>EventEmitter</code>
**Kind**: global class  
**Extends**: <code>EventEmitter</code>  

* [YOLOdice](#YOLOdice) ⇐ <code>EventEmitter</code>
    * [new YOLOdice()](#new_YOLOdice_new)
    * _instance_
        * [.send(req, [callback])](#YOLOdice+send)
        * [.sign(msg)](#YOLOdice+sign) ⇒ <code>string</code>
        * [.quit()](#YOLOdice+quit)
        * [.readSiteData([callback])](#YOLOdice+readSiteData)
        * [.readUser(id, [callback])](#YOLOdice+readUser)
        * [.readUserData(id, [callback])](#YOLOdice+readUserData)
        * [.getBalance([callback])](#YOLOdice+getBalance)
        * [.createBet(attrs, [includeDatas], [callback])](#YOLOdice+createBet)
        * [.readBet(id, [callback])](#YOLOdice+readBet)
        * [.listBets([userId], [options], [callback])](#YOLOdice+listBets)
        * [.readSeed(id, [callback])](#YOLOdice+readSeed)
        * [.readCurrentSeed(userId, [callback])](#YOLOdice+readCurrentSeed)
        * [.listSeeds([options], [callback])](#YOLOdice+listSeeds)
        * [.createSeed(attrs, [callback])](#YOLOdice+createSeed)
        * [.patchSeed(id, attrs, [callback])](#YOLOdice+patchSeed)
        * [.readDepositAddress([callback])](#YOLOdice+readDepositAddress)
        * [.readDeposit(id, [callback])](#YOLOdice+readDeposit)
        * [.listDeposits([options], [callback])](#YOLOdice+listDeposits)
        * [.readWithdrawingConfig([callback])](#YOLOdice+readWithdrawingConfig)
        * [.readWithdrawal(id, [callback])](#YOLOdice+readWithdrawal)
        * [.listWithdrawals([options], [callback])](#YOLOdice+listWithdrawals)
        * [.readWithdrawalConfig([callback])](#YOLOdice+readWithdrawalConfig)
        * [.createWithdrawal(attrs, [callback])](#YOLOdice+createWithdrawal)
        * [.patchWithdrawal(id, attrs, [callback])](#YOLOdice+patchWithdrawal)
        * [.cancelWithdrawal(id, [callback])](#YOLOdice+cancelWithdrawal)
        * [.readInvestment(id, [callback])](#YOLOdice+readInvestment)
        * [.listInvestments([status], [callback])](#YOLOdice+listInvestments)
        * [.createInvestment(attrs, leverage, [callback])](#YOLOdice+createInvestment)
        * [.patchInvestment(id, attrs, [callback])](#YOLOdice+patchInvestment)
        * [.ping([callback])](#YOLOdice+ping)
        * ["error"](#YOLOdice+event_error)
        * ["sign"](#YOLOdice+event_sign)
        * ["loggedIn"](#YOLOdice+event_loggedIn)
    * _static_
        * [.YOLOdice](#YOLOdice.YOLOdice)
            * [new YOLOdice(key, [options])](#new_YOLOdice.YOLOdice_new)
    * _inner_
        * [~responseHandler](#YOLOdice..responseHandler) : <code>function</code>

<a name="new_YOLOdice_new"></a>

### new YOLOdice()
A class that handles connections to the YOLOdice API.

### YOLOdice.YOLOdice
**Kind**: static class of [<code>YOLOdice</code>](#YOLOdice)  
<a name="new_YOLOdice.YOLOdice_new"></a>

#### new YOLOdice(key, [options])
Creates an instance of YOLOdice.


| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | A WIF format Bitcoin private key used to sign the login request |
| [options] | <code>Object</code> | An optional object to change some aspects of the server |
| [options.host] | <code>string</code> | The host to connect to (defaults to api.yolodice.com) |
| [options.port] | <code>number</code> | The port to connect to (defaults to 4444) |

<a name="YOLOdice+send"></a>

### YOLOdice.send(req, [callback])
Records the request sent in this.requests and sends the data. Can also be used to send unsupported/new methods.

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| req | <code>Object</code> | The request to send |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | An optional callback to call when a response is received     The callback is passed the entire response object |

<a name="YOLOdice+sign"></a>

### YOLOdice.sign(msg) ⇒ <code>string</code>
Signs a message with the client's private key

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  
**Returns**: <code>string</code> - The signature  
**Emits**: [<code>sign</code>](#YOLOdice+event_sign)  

| Param | Type | Description |
| --- | --- | --- |
| msg | <code>string</code> | The message to sign |

<a name="YOLOdice+quit"></a>

### YOLOdice.quit()
Gracefully closes the connection and terminates the process

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  
<a name="YOLOdice+readSiteData"></a>

### YOLOdice.readSiteData([callback])
Requests site data and calls callback with the data

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readUser"></a>

### YOLOdice.readUser(id, [callback])
Returns user data including id, name, date created and roles

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The user id to look up |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readUserData"></a>

### YOLOdice.readUserData(id, [callback])
Returns more extensive user data

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The user id to look up |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+getBalance"></a>

### YOLOdice.getBalance([callback])
An abstraction for readUserData on yourself

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback |

<a name="YOLOdice+createBet"></a>

### YOLOdice.createBet(attrs, [includeDatas], [callback])
Creates a bet. Requires the play permission

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| attrs | <code>Object</code> | Bet attributes |
| attrs.amount | <code>number</code> | The amount of the bet IN SATOSHIS |
| attrs.target | <code>number</code> | The target of the bet, in the range [1, 989900] |
| attrs.range | <code>string</code> | Either 'hi' or 'lo' |
| [includeDatas] | <code>boolean</code> | If true, the response will include site and user data |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readBet"></a>

### YOLOdice.readBet(id, [callback])
Reads the data from a single bet

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The bet id to look up |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+listBets"></a>

### YOLOdice.listBets([userId], [options], [callback])
An array of hashes each containing a single bet

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [userId] | <code>number</code> |  | The id of the user |
| [options] | <code>Object</code> |  | The options to restrict data |
| [options.user_id] | <code>number</code> |  | The user ID to restrict bets to |
| [options.order] | <code>string</code> | <code>&quot;desc&quot;</code> | Either 'asc' or 'desc' to sort in ascending or descending order. Default descending |
| [options.id_marker] | <code>number</code> |  | If order='asc', only bets > idMarker are returned. If order='desc', only bets < idMarker |
| [options.limit] | <code>number</code> | <code>100</code> | Limit the number of objects returned. Default 100, max 1000 |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) |  | The callback function |

<a name="YOLOdice+readSeed"></a>

### YOLOdice.readSeed(id, [callback])
Reads the attributes of a seed

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the seed |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readCurrentSeed"></a>

### YOLOdice.readCurrentSeed(userId, [callback])
Reads the current seed for the specified user

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| userId | <code>number</code> | The user to get the seed for |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+listSeeds"></a>

### YOLOdice.listSeeds([options], [callback])
Lists the seeds that meet the given criteria

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Options to restrict results |
| [options.user_id] | <code>number</code> |  | User ID to restrict seeds to |
| [options.order] | <code>string</code> | <code>&quot;desc&quot;</code> | Order, either 'asc' or 'desc' (see listBets) |
| [options.id_marker] | <code>string</code> |  | id marker (see listBets) |
| [options.limit] | <code>number</code> | <code>100</code> | Limit number of results. Default 100, max 1000 |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) |  | The callback function |

<a name="YOLOdice+createSeed"></a>

### YOLOdice.createSeed(attrs, [callback])
Creates a new seed for the user

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| attrs | <code>Object</code> | The attributes of the new seed |
| attrs.client_seed | <code>string</code> | User provided part of the seed |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+patchSeed"></a>

### YOLOdice.patchSeed(id, attrs, [callback])
Updates and returns the current seed

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the seed to patch |
| attrs | <code>Object</code> | The attributes to change |
| attrs.client_seed | <code>string</code> | The client seed. Must be 6-128 chars and [a-zA-Z0-9 \-_] |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readDepositAddress"></a>

### YOLOdice.readDepositAddress([callback])
Reads the current deposit address for the authenticated user

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readDeposit"></a>

### YOLOdice.readDeposit(id, [callback])
Returns the information for a single deposit

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the deposit |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+listDeposits"></a>

### YOLOdice.listDeposits([options], [callback])
Lists deposits

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Options for restricting results |
| [options.order] | <code>string</code> | <code>&quot;desc&quot;</code> | Order, either 'asc' or 'desc' (see listBets) |
| [options.id_marker] | <code>string</code> |  | id marker (see listBets) |
| [options.limit] | <code>number</code> | <code>100</code> | Limit number of results. Default 100, max 1000 |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) |  | The callback function |

<a name="YOLOdice+readWithdrawingConfig"></a>

### YOLOdice.readWithdrawingConfig([callback])
Contains info about withdrawing

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readWithdrawal"></a>

### YOLOdice.readWithdrawal(id, [callback])
Reads withdrawal specified by id

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The withdrawal id |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+listWithdrawals"></a>

### YOLOdice.listWithdrawals([options], [callback])
Lists withdrawals for the logged in user

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [options] | <code>Object</code> |  | Options for restricting results |
| [options.order] | <code>string</code> | <code>&quot;desc&quot;</code> | Order, either 'asc' or 'desc' (see listBets) |
| [options.id_marker] | <code>string</code> |  | id marker (see listBets) |
| [options.limit] | <code>number</code> | <code>100</code> | Limit number of results. Default 100, max 1000 |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) |  | The callback function |

<a name="YOLOdice+readWithdrawalConfig"></a>

### YOLOdice.readWithdrawalConfig([callback])
Contains info about withdrawing

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+createWithdrawal"></a>

### YOLOdice.createWithdrawal(attrs, [callback])
Creates a withdrawal. Returns the withdrawal (identical format to readWithdrawal)

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| attrs | <code>Object</code> | The withdrawal attributes |
| attrs.to_address | <code>string</code> | The address to send the coins to |
| attrs.amount | <code>number</code> | The amount to withdrawal IN SATOSHIS |
| attrs.withdrawal_type | <code>string</code> | 'instant' or 'batch' |
| attrs.allow_pending | <code>boolean</code> | If there are not enough funds in hot wallet, setting this     to true allows the withdrawal to be put into a pending state awaing hot wallet refill |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+patchWithdrawal"></a>

### YOLOdice.patchWithdrawal(id, attrs, [callback])
Can only be used to cancel pending withdrawals

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the withdrawal to cancel |
| attrs | <code>Object</code> | Attributes of the patch |
| attrs.status | <code>string</code> | Can only be 'canceled' |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+cancelWithdrawal"></a>

### YOLOdice.cancelWithdrawal(id, [callback])
Wrapper method for patchWithdrawal to cancel withdrawals

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the withdrawal to cancel |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+readInvestment"></a>

### YOLOdice.readInvestment(id, [callback])
Reads the investment for the given id

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the investment |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+listInvestments"></a>

### YOLOdice.listInvestments([status], [callback])
Lists investments for the logged in user

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [status] | <code>string</code> | If status is set to 'open' then will only list open investments |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+createInvestment"></a>

### YOLOdice.createInvestment(attrs, leverage, [callback])
Creates an investment

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| attrs | <code>Object</code> | The investment attributes |
| attrs.base | <code>number</code> | The initial value of the investment IN SATOSHIS |
| leverage | <code>number</code> | The leverage of the investment, from 1 to 10 |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+patchInvestment"></a>

### YOLOdice.patchInvestment(id, attrs, [callback])
Patches (closes) an investment

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | The id of the investment |
| attrs | <code>Object</code> | The investment patch attributes |
| attrs.status | <code>string</code> | Only 'canceled' value is supported (to cancel the investment) |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

<a name="YOLOdice+ping"></a>

### YOLOdice.ping([callback])
Pings the server

**Kind**: instance method of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| [callback] | [<code>responseHandler</code>](#YOLOdice..responseHandler) | The callback function |

## Events

<a name="YOLOdice+event_error"></a>

### "error"
Error

**Kind**: event emitted by [<code>YOLOdice</code>](#YOLOdice)  
<a name="YOLOdice+event_sign"></a>

### "sign"
Fires when the instance signs a message with it's Bitcoin key

**Kind**: event emitted by [<code>YOLOdice</code>](#YOLOdice)  
<a name="YOLOdice+event_loggedIn"></a>

### "loggedIn"
Fires when the user is successfully logged in

**Kind**: event emitted by [<code>YOLOdice</code>](#YOLOdice)  
<a name="YOLOdice.YOLOdice"></a>

<a name="YOLOdice..responseHandler"></a>

### YOLOdice~responseHandler : <code>function</code>
Callback called when a response is received from the server

**Kind**: inner typedef of [<code>YOLOdice</code>](#YOLOdice)  

| Param | Type | Description |
| --- | --- | --- |
| response | <code>Object</code> | The response received from the server |

