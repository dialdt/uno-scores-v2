var config = {};
const decoder = new TextDecoder('utf-8');
fetch('/.netlify/functions/auth').then(response => {
    response.body
      .getReader()
      .read()
      .then(({value, done}) => {
        const val = JSON.parse(decoder.decode(value)).result
        config = {
          'apiKey': val.apiKey,
          'authDomain': val.authDomain,
          'databaseURL': val.databaseURL,
          'projectId': val.projectId,
          'storageBucket': val.storageBucket,
          'messagingSenderId': val.messagingSenderId,
          'appId': val.appId
        }
        return
      })
  });
