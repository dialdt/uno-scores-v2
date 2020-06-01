var modal = document.getElementsByClassName('modal');
var addPlayer = document.getElementById('player');
var addRule = document.getElementById('rule');
var close = document.getElementsByClassName('close');

addPlayer.onclick = function() {
  modal[0].style.display = 'block';
}

addRule.onclick = function() {
  modal[1].style.display = 'block';
}

for(btn of close) {
  btn.onclick = function() {
    this.parentElement.parentElement.style.display = 'none';
  }
}


class Database {
  constructor(apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId) {
    this.apiKey = apiKey;
    this.authDomain = authDomain;
    this.databaseURL = databaseURL;
    this.projectId = projectId;
    this.storageBucket = storageBucket;
    this.messagingSenderId = messagingSenderId;
    this.appId = appId;
  }

  config() {
    firebase.initializeApp({
      apiKey: this.apiKey,
      authDomain: this.authDomain,
      databaseURL: this.databaseURL,
      projectId: this.projectId,
      storageBucket: this.storageBucket,
      messagingSenderId: this.messagingSenderId,
      appId: this.appId
    });
  }

  init(collection) {
    return firebase.firestore().collection(collection).doc(localStorage.getItem('user'));
  }

}

fetch('/.netlify/functions/auth').then(function(data){
  console.log(data.result)
});

var database = new Database(
  config.apiKey,
  config.authDomain,
  config.databaseURL,
  config.projectId,
  config.storageBucket,
  config.messagingSenderId,
  config.appId
);

database.config();

var greetings = ['Aloha', 'Yo', 'Hey', 'Hello', 'Welcome', 'Hi', 'Word up', 'What\'s up', '\'sup'],
    newScore,
    usr,
    name,

provider = new firebase.auth.GoogleAuthProvider();

async function login() {
  await firebase.auth().signInWithPopup(provider).then(function(result){
    //store user id in local storage
    localStorage.setItem('user', result.user.uid);
    localStorage.setItem('userName', result.user.displayName);
    //store authentication state in session storage
    sessionStorage.setItem('authState', 'Authenticated');
    //navigate to main page
    randomGreeting(result.user.displayName);
    window.location.href = '/main/';
  }).catch(function(error){
    console.log(error);
  });

}

function add(collection, item) {

      if(collection === 'teams') {
        var newPlayer = document.getElementById('updateScores');
        var data = database.init(collection);
        //some validation
        if(item != '') {
          data.update({
                [`${item}`]: 0
          }).then(function(){
            console.log('data added successfully!');
            updateScores.innerHTML += '<li class="player"><label for=' + `${item}` + '">'+ `${item}` + '</label><input class="input" type="number" id="' + `${item}` + '"><button class="button-primary" onclick="update(\'teams\', this.previousElementSibling.getAttribute(\'Id\'), this.previousElementSibling.value)">Winner!</button><button class="smallBtn" onclick="remove(\'teams\',this.previousElementSibling.previousElementSibling.getAttribute(\'id\'))">x</button></li>';
            document.getElementById('scores').innerHTML += '<li>' + `${item}` + ': 0</li>';
          }).catch(function(error){
            console.log('error writing data');
          })
        } else {
          console.log('Please enter a value');
        }

      } else if (collection === 'rules') {
        //If adding a rule do something else
        var rulesDiv = document.getElementsByClassName('houseRules')[0];
        var ruleNum;
        var data = database.init('rules');
        data.get().then(function(doc){
          if(doc.exists) {
            //count fields
            ruleNum = 'rule' + (Object.keys(doc.data()).length === 0 ? 1 : Object.keys(doc.data()).length + 1);
            data.update({
              [`${ruleNum}`] : item
            });
          } else {
            data.set({
              [`${ruleNum}`] : item
            });

          }
          rulesDiv.innerHTML += '<li id="' + ruleNum + '">' + item + '<button onclick="remove(\'rules\',this.parentElement.getAttribute(\'id\'))">x</button></li>';

        })
      }
}

function remove(collection, item) {
  var data = database.init(collection);
  data.update({
    [`${item}`]: firebase.firestore.FieldValue.delete()
  }).then(function(){
    console.log('Item removed');

  }).catch(function(error){
    console.log(error);
  });
    display(collection);
}

function update(collection, item, value) {
  var data = database.init(collection);
  var score = Number(value) //Prev: button.previousElementSibling.value;

  data.get().then(function(doc){
    if(doc.exists) {
      var obj = doc.data();
      var currentScore = obj[item];
      newScore =  Number(currentScore) + score;
      data.update({
          [`${item}`]: `${newScore}`
      }).then(function(){
        display(collection);
      });
    } else {
      return 'no such document!';
    }
  }).catch(function(error){
    return 'There was an error: ' + error;
  });
}

function display(collection) {
  // clear all displays
  var display = document.getElementsByClassName('display');
  /*for (var i = 0; i < display.length; i++) {
    display[i].innerHTML = '';
  }*/

  var data = database.init(collection);
  var scoresDiv = document.getElementById('scores');
  var updateScores = document.getElementById('updateScores');
  var addPlayerMsg = document.getElementById('addPlayersMsg');
  var display = document.getElementsByClassName(collection + '-display');
  data.get().then(function(doc){

    for (var i = 0; i < display.length; i++) {
      display[i].innerHTML = '';
    }

    //1. check if document exists
    if(doc.exists) {

      //1a. if document exists, check if it contains any data.  If so, output data
      if(Object.keys(doc.data()).length > 0) {
        //get player data
        var obj = doc.data();
        var sortedObj = sortObj(obj);

        //loop through database object and output li
        for(var key in sortedObj) {
          var name = sortedObj[key][0];
          var score = sortedObj[key][1];

          //update page elements with db data
          if(collection === 'teams') {
            document.getElementById('updateScores').innerHTML += '<li class="player"><label for=' + name + '">'+ name + '</label><input class="input" type="number" id="' + name + '"><button class="button-primary" onclick="update(\'teams\', this.previousElementSibling.getAttribute(\'Id\'), this.previousElementSibling.value)">Winner!</button><button class="smallBtn" onclick="remove(\'teams\',this.previousElementSibling.previousElementSibling.getAttribute(\'id\'))">x</button></li>';
            document.getElementById('scores').innerHTML += '<li class="player">' + name + ': ' + score + '</li>';
          } else if (collection === 'rules') {
              for(var i = 0; i < display.length; i++) {
                display[i].innerHTML = ''
              }
              document.getElementsByClassName('houseRules')[0].innerHTML += '<li id="' + sortedObj[key][0] + '">' + sortedObj[key][1] + '<button onclick="remove(\'rules\',this.parentElement.getAttribute(\'id\'))">x</button></li>';
          }
        };
      } else {
        //1b. if document exists but does not contain any data, clear page and prompt user to add data
        if(addPlayerMsg != null && collection === 'teams') {
          addPlayerMsg.innerHTML = '<p>Add a player to get started</p>';
        }
      }
    } else {
      //2. if document does not exist, prompt user to create a new document
      if(addPlayerMsg != null && collection === 'teams') {
        addPlayerMsg.innerHTML = '<p>No team here!  Please <a href="#" onclick="window.location.href=\'/create/\'">add a team</a> to get started</p>';
      }
    }
  }).catch(function(error){
    console.log(error);
  });
  var usr = localStorage.getItem('userName');
  if(usr != null) {
    document.getElementById('welcome').innerHTML = '<small>' + sessionStorage.getItem('greeting') + ' <a onclick="logout()" href="#">logout?</a></small>';
  }
}

function logout() {
  //// TODO: 1. check user logged in
  firebase.auth().signOut().then(function(){
    localStorage.clear();
    sessionStorage.clear();
    console.log('logged out');
    window.location.href = '../';
  }).catch(function(error){
    console.log(error);
  });
  //clear local storage as data will be pulled on next Login
  // TODO: 2. log user out if logged in OR do not present logout button
}

// READ functions

function randomGreeting(name) {
  var randomNum = Math.floor(Math.random() * greetings.length);
  sessionStorage.setItem('greeting',greetings[randomNum] + ', ' + name);
}

function sortObj(obj) {
  return Object.entries(obj).sort((a,b)=>b[1]-a[1]);
}

function reset(collection) {
  var data = database.init(collection);
  data.get().then(function(doc){
    if(doc.exists){
      var obj = doc.data();
      for(var key in obj) {
        data.update({
          [`${key}`]: 0
        }).then(function(){
          display(collection);
        })
      }
    } else {
      console.log('no such document');
    }
  });
}
