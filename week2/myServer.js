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

app.set('view engine', 'ejs');
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
    res.render('reportReceived.ejs', {
        message: 'Your secret report was received loud and clear!',
        submitted: secret
    });
}

app.get('/allSecrets', myAllSecretsRequestHandler);
function myAllSecretsRequestHandler(req, res) {
    //res.send(secretList.toString());
    // let secretHtml = "<h1>All Secrets</h1><ul>";
    // for (let i = 0; i < secretList.length; i++) {
    //     secretHtml += "<li>" + secretList[i] + "</li>";

    // }
    // secretHtml += "</ul>";
    // res.send(secretHtml);
    let dataToRender = {
        mySecrets: secretList
    };
    res.render('secrets.ejs', dataToRender);

}
app.get('/sayHello', mySayHelloRequestHandler);
function mySayHelloRequestHandler(req, res) {
    let name = req.query.name;
    let dataToRender = {
        nameKey: name
    };
    res.render('sayHello.ejs',dataToRender);
}

// render a hello page with a name from query string
app.get('/sayHello', (req, res) => {
    const name = req.query.name || 'Guest';
    res.render('sayHello.ejs', { nameKey: name });
});

app.listen(8080);
