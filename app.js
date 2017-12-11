/*-----------------------------------------------------------------------------
A simple echo bot for the Microsoft Bot Framework. 
-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('botbuilder');
var azure = require('azure-storage');
var connectionString = 'DefaultEndpointsProtocol=https;AccountName=memefunctionstorage;AccountKey=/rOwErr/F+yO3TupawAPHZP8ZMvWSr5DVL9WucLnGGSHkcFvk2dsctTgA1A79HmFw/2ZRrv7AhxAe4ljYdmKAw==;EndpointSuffix=core.windows.net';

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat connector for communicating with the Bot Framework Service
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    stateEndpoint: process.env.BotStateEndpoint,
    openIdMetadata: process.env.BotOpenIdMetadata 
});

// Listen for messages from users 
server.post('/api/messages', connector.listen());

/*----------------------------------------------------------------------------------------
* Bot Storage: This is a great spot to register the private state storage for your bot. 
* We provide adapters for Azure Table, CosmosDb, SQL Azure, or you can implement your own!
* For samples and documentation, see: https://github.com/Microsoft/BotBuilder-Azure
* ---------------------------------------------------------------------------------------- */

// Create your bot with a function to receive messages from the user
var bot = new builder.UniversalBot(connector, function (session) {
    // session.send("You said: %s", session.message.text);
    // //hello 
    var queuedMessage = { address: session.message.address, text: session.message.text };
    session.sendTyping();
    var queueSvc = azure.createQueueService(connectionString);
    queueSvc.createQueueIfNotExists('result', function(err, result, response){
        if(!err){
            var queueMessageBuffer = new Buffer(JSON.stringify(queuedMessage)).toString('base64');
            queueSvc.createMessage('result', queueMessageBuffer, function(err, result, response){
                if(!err){
                    session.send('Your message (\'' + session.message.text + '\') has been added to a queue, and it will be sent back to you via a Function');
                } else {
                    session.send('There was an error inserting your message into queue');
                }
            });
        } else {
            session.send('There was an error creating your queue');
        }
    });
});

bot.on('trigger', function (message) {
    // handle message from trigger function
    var queuedMessage = message.value;
    var reply = new builder.Message()
        .address(queuedMessage.address)
        .text('This is coming from the trigger: ' + queuedMessage.text);
    bot.send(reply);
});