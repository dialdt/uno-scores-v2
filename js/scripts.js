let config = {
  headers: {
    responseType: 'text/xml',
  }
}

if(window.location.pathname === '/main') {
  var modalPlayer = document.getElementById('modal-player');
  var addPlayer = document.getElementById('player');
  var modalReset = document.getElementById('modal-reset');
  var close = document.getElementsByClassName('close-btn');
  var resetBtn = document.getElementById('reset');
  var notification = document.getElementsByClassName('notify')[0];
  var notifyFailureMsg = document.getElementsByClassName('notify-failure')[0];

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
    return `
      <div class="input-group mb-3">
        <input class="input form-control" type="number" id="${text}" placeholder="${text}">
        <div class="input-group-append">
          <span name="${text}" class="input-group-text winner-btn btn btn-primary" onclick="update(\'teams\', this.getAttribute(\'name\'), this.parentElement.previousElementSibling.value)">🎉 Winner!</span>
          <span id="${text}" class="remove input-group-text" onclick="remove(\'teams\',this.getAttribute(\'id\'))">🗑️</span>
        </div>
      </div>`;
  } else if (context === 'leaderboard') {
    return `<li class="player-score list-group-item">${text} <span class="score">${score}</span></li>`;
  }
}

function notify(result, message) {
  if(result === 'winner') {
    notification.innerHTML = `${randomText(emojisGood)} ${randomText(notifySuccess)}`;
    notification.style.display = 'block';
    setTimeout(function(){
      notification.style.display = 'none'
    }, 1000)
  } else if(result === 'failure') {
    notifyFailureMsg.innerHTML = `${randomText(emojisBad)} ${randomText(notifyFailure)}<br/><em>${message}</em>`;
    notifyFailureMsg.style.backgroundColor = '#d63031';
    notifyFailureMsg.style.display = 'block';
    setTimeout(function(){
      notifyFailureMsg.style.display = 'none'
    }, 2000)
  } else if(result === 'success') {
    notifyFailureMsg.innerHTML = `${randomText(emojisGood)} ${randomText(notifySuccess)}<br/><em>${message}</em>`;
    notifyFailureMsg.style.backgroundColor = '#00b894';
    notifyFailureMsg.style.display = 'block';
    setTimeout(function(){
      notifyFailureMsg.style.display = 'none'
    }, 2000)
  }
}

let base;

axios.get('/.netlify/functions/auth', config).then(function(response) {
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
    notifySuccess = ['Boom!', 'Owned it!', 'Killin\' it!', 'Brilliant!', 'Fantastic', 'Can I kick it?', 'Dude. Sweet.'],
    notifyFailure = ['Crap', 'Oh no!', 'Not happening', 'Oops', 'Computer says no'],
    emojisGood = ['🥳', '🤩', '🎉', '🎊'],
    emojisBad = ['😲', '💩', '😫', '🥴'],
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
    notify('failure', error);
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
            notify('success', 'Player added successfully');
            updateScores.innerHTML += populate(`${item}`, 0, 'player')
            document.getElementById('scores').innerHTML += populate(`${item}`, 0, 'leaderboard');
            document.getElementsByClassName('modal-body')[0].innerHTML = '✅';
            setTimeout(() => {
              document.getElementsByClassName('modal-body')[0].innerHTML = '<input type="text" id="newPlayer" class="form-control" placeholder="New player name">';
            }, 3000)
          }).catch(function(error){
            notify('failure', error);
          })
        } else {
          notify('failure', 'Please enter a value');
        }

      }
}

function remove(collection, item) {
  var data = init(collection);
  data.update({
    [`${item}`]: firebase.firestore.FieldValue.delete()
  }).then(function(){
    notify('success', 'Player removed successfully');

  }).catch(function(error){
    notify('failure', error);
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
        notify('winner', 'Score updated successfully')
        display(collection);
      });
    } else {
      notify('failure', 'Document does not exist');
    }
  }).catch(function(error){
    notify('failure', error);
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
    notify('failure', 'Error returning data');
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
    window.location.href = '../';
  }).catch(function(error){
    notify('failure', error);
  });
  //clear local storage as data will be pulled on next Login
  // TODO: 2. log user out if logged in OR do not present logout button
}

// READ functions

function randomText(arr) {
  // returns a random item from an input array
  var randomNum = Math.floor(Math.random() * arr.length);
  return arr[randomNum];
}

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
          notify('success', 'Scores reset successfully')
          display(collection);
        })
      }
    } else {
      notify('failure', error);
    }
  });
}
