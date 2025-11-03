let express = require('express');

//create a http server
let app = express();

//have our server respond to get with appropriate file from the 'public' folder
app.use(express.static('public'));

// post got
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
let myObject = {
    "secret": "This is my secret data!"
}

//handle search requests
app.get('/search', mySearchRequestHandler);

function mySearchRequestHandler(req, res) {
    let question = req.query.q;
    console.log("Search query: " + question);
    console.log('Hello there! your question is  ' + question);
    console.log("A search request was made!");
    res.send('Hello there! your question is  ' + question);
}

//build a post report handler
app.post('/shareSecret', myReportRequestHandler);
let secretList = [];

function myReportRequestHandler(req, res) {

    console.log(req.body);


    let secret = req.body.secreat;
    secretList.push(secret);

    console.log("A secret report was received!");
    res.send('Your secret report was received loud and clear!');
}

app.get('/allSecrets', myAllSecretsRequestHandler);
function myAllSecretsRequestHandler(req, res) {
    //res.send(secretList.toString());
    let secretHtml = "<h1>All Secrets</h1><ul>";
    for (let i = 0; i < secretList.length; i++) {
        secretHtml += "<li>" + secretList[i] + "</li>";

    }
    secretHtml += "</ul>";
    res.send(secretHtml);

}

app.listen(8080);
