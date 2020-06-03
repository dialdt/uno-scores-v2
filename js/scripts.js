

if(window.location.pathname === '/main') {
  var modalPlayer = document.getElementById('modal-player');
  var addPlayer = document.getElementById('player');
  var modalReset = document.getElementById('modal-reset');
  var close = document.getElementsByClassName('close-btn');
  var resetBtn = document.getElementById('reset');

  resetBtn.onclick = function() {
    modalReset.style.display = 'block';
  }

  addPlayer.onclick = function() {
    modalPlayer.style.display = 'block';
  }

  for(btn of close) {
    btn.onclick = function() {
      modalPlayer.style.display = 'none';
      modalReset.style.display = 'none';
    }
  }
}

function populate(text, score, context) {
  if(context === 'player') {
    return `<li class="player list-group-item"><label for=${text}" class="sr-only">${text}</label><input class="input form-control" type="number" id="${text}" placeholder="${text}"><button class="winner-btn btn btn-primary" onclick="update(\'teams\', this.previousElementSibling.getAttribute(\'Id\'), this.previousElementSibling.value)">
🎉 Winner!</button><span class="remove" onclick="remove(\'teams\',this.previousElementSibling.previousElementSibling.getAttribute(\'id\'))">🗑️</span></li>`;
  } else if (context === 'leaderboard') {
    return `<li class="player-score list-group-item">${text} <span class="score">${score}</span></li>`;
  }
}

let base;

axios.get('/.netlify/functions/auth').then(function(response) {
  let val = response.data.result
  base = firebase.initializeApp({
    apiKey: val.apiKey,
    authDomain: val.authDomain,
    databaseURL: val.databaseURL,
    projectId: val.projectId,
    storageBucket: val.storageBucket,
    messagingSenderId: val.messagingSenderId,
    appId: val.appId
  })
  if(window.location.pathname == '/main') {
    display('teams');
  }
})


function init(collection) {
  return firebase.firestore().collection(collection).doc(localStorage.getItem('user'));
}

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
    console.log('error message' + error);
  })

}

function add(collection, item) {

      if(collection === 'teams') {
        var newPlayer = document.getElementById('updateScores');
        var data = init(collection);
        //some validation
        if(item != '') {
          data.update({
                [`${item}`]: 0
          }).then(function(){
            console.log('data added successfully!');
            updateScores.innerHTML += populate(`${item}`, 0, 'player')
            document.getElementById('scores').innerHTML += populate(`${item}`, 0, 'leaderboard');
            document.getElementsByClassName('modal-body')[0].innerHTML = '✅ Player added!';
            setTimeout(() => {
              document.getElementsByClassName('modal-body')[0].innerHTML = '<input type="text" id="newPlayer" class="form-control" placeholder="New player name">';
            }, 3000)
          }).catch(function(error){
            console.log('error writing data');
          })
        } else {
          console.log('Please enter a value');
        }

      }
}

function remove(collection, item) {
  var data = init(collection);
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
  var data = init(collection);
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

  var data = init(collection);
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
            document.getElementById('updateScores').innerHTML += populate(name, 0, 'player');
            //'<li class="player"><label for=' + name + '" class="sr-only">'+ name + '</label><input class="input form-control" type="number" id="' + name + '" placeholder="' + name + '"><button class="button-primary btn btn-primary" onclick="update(\'teams\', this.previousElementSibling.getAttribute(\'Id\'), this.previousElementSibling.value)">Winner!</button><button class="smallBtn btn btn-danger" onclick="remove(\'teams\',this.previousElementSibling.previousElementSibling.getAttribute(\'id\'))">x</button></li>';
            document.getElementById('scores').innerHTML += populate(name, score, 'leaderboard');
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
  var data = init(collection);
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
