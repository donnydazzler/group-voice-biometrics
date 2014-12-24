---
layout: index
---
### Introduction
Many of us appreciate that authenticating via username and password is a cumbersome way to establish an identity. In addition, passwords are vulnerable if they are not managed correctly by their owners and keepers. A number of alternative authentication mechanisms have emerged over the years, one of which is voice-based authentication. While it's not a silver bullet, voice-based authentication can be an attractive option in certain types of scenarios. One use case I wanted to explore further was a group of users sharing a single device and needing to establish their identity to perform a low-risk transaction. For example, staff members at a retail store may authenticate with a shared terminal to see if an item is in stock, or a restaurant server may login to a shared terminal to locate an open table. All this without having to remember yet another password. Sounds good? Awesome, let's jump in!

I decided to build a browser-based app to demonstrate the concept. Of course, the application could be a native mobile or desktop app, basically anything that can talk HTTP. I used the MEAN stack ([MongoDB](http://www.mongodb.org/), [Express.js](http://expressjs.com/), [AngularJS](https://angularjs.org/), [Node.js](http://nodejs.org/)), because I've found this to be a great environment for rapid prototyping. And for the all-important voice authentication step, I chose to use the [VoiceIt API](http://www.voiceit-tech.com/).

At this point I should note that the folks at VoiceIt were tremendously helpful as I worked on this demo. When I started building the app, I wasn't sure how this particular use case could be solved using the VoiceIt API. My original plan was to register and enroll individual users within the VoiceIt system. One drawback with this approach was that every user required their own username and password - the exact scenario I was hoping to avoid. I could have generated users with dummy usernames and passwords and looped through their voiceprints looking for a match on every authentication attempt, but this would have been inefficient. Fortunately Noel Grover at VoiceIt had a better idea: create a single VoiceIt user and associate all of the voiceprints with this user. The key to this is that every successful VoiceIt enrollment generates a unique enrollment ID. Following a successful enrollment, our demo app stores the user's first name and enrollment ID in MongoDB. If there's a voiceprint match at authentication time, VoiceIt returns the matching enrollment ID in the response. The demo app does a quick lookup to retrieve the user's information based on their enrollment ID, and the app knows who the end user is based on their voice alone.

### The Demo App
If you want to build or run the demo app, the first step is to sign up for a (free) Developer ID at the [Voiceprint Developer Portal](https://siv.voiceprintportal.com/). Once you have your Developer ID and password, login to the Voiceprint Developer Portal and create an end user. This is the user we will use to register the voiceprints. Your Developer ID, the end user's username and the end user's password are all required to run the demo, but these parameters are stored on the server and the end user doesn't need to know anything about them.

I'm going to assume that you are comfortable with [Yeoman](http://yeoman.io/) and MongoDB and have both of these installed. We'll use the [angular-fullstack generator](https://github.com/DaftMonk/generator-angular-fullstack) to build out the app; this is a wonderful generator for building MEAN apps quickly and takes care of the tedious work for you. Don't forget that MongoDB (i.e., the `mongod` process) must be up and running before generating the app. Create a new directory, cd into it, and run the angular-fullstack generator:

`yo angular-fullstack group-voice-biometrics`

Here's a [screenshot](https://raw.githubusercontent.com/gmillward/group-voice-biometrics/gh-pages/images/generate-app.png) of the options I selected.

Most of the defaults are fine for us. Quick tip: `protractor.conf.js` needs a few tweaks if you want to run a standalone Selenium server:

```javascript
//chromeOnly: true,
directConnect: false,
chromeDriver: '/usr/local/lib/node_modules/protractor/selenium/chromedriver',
seleniumServerJar: '/usr/local/lib/node_modules/protractor/selenium',
seleniumAddress: 'http://localhost:4444/wd/hub',
```

A `grunt serve` from the project's root directory will start the app. `grunt build` and `grunt test` are also worth running here, just to make sure that everything is working fine.

The generator gives us some very useful dependencies out of the box; we'll grab a few more for this app:

* voice-it - wrapper module for the VoiceIt API
* q - for promises
* request - to simplify server-side HTTP requests

Run `npm install voice-it q request --save` to install the modules and add them to the dependency list. Now that the app's foundation is in place, let's build out the server side.

### Server-Side
Before jumping into the server-side code, I have an Express body-parser configuration tip for you: since we are going to be POSTing WAV files to the server rather than JSON data, we need to ensure that the server is prepared to receive this kind of data and also files of a reasonable size. This gave me a multi-day headache; I'm hoping that others will benefit from my lesson learned! So make the following changes in `server/config/express.js`:

```javascript
//app.use(bodyParser.urlencoded({ extended: false }));
//app.use(bodyParser.json());
app.use(bodyParser.raw({limit: '50mb', type: 'audio/wav'}));
```

Next, create the following environment variables to store the important config data:
`VOICEIT_EMAIL`
`VOICEIT_PWD`
`VOICEIT_DEV_ID`

Add a server-side config file `server/config/config.js`; this file contains all of the configuration data for the app and the property names are compatible with the VoiceIt API wrapper:

```javascript
module.exports = {
  VOICEIT_DEV_ID: process.env.VOICEIT_DEV_ID,
  email: process.env.VOICEIT_EMAIL,
  password: process.env.VOICEIT_PWD,
  accuracy: 0, // recommended 0-2, but can be 3-5
  confidence: 90, // recommended 90-92, but can be 88-89
  accuracyPasses: 5,
  accuracyPassIncrement: 2,
  voiceprintTextConfidenceThreshold: 0.5
};
```

Let's generate our server-side enrollment and authentication endpoints:
```
yo angular-fullstack:endpoint enrollment
```
```
yo angular-fullstack:endpoint authentication
```

The enrollment and authentication processes are very similar, so most of the server-side logic is in a shared `audioHandler` component. The authentication controller basically invokes the audioHandler with the action `authenticate`, and the enrollment controller sends action `enroll`. Since our use case involves a small group of users who most likely know each other, I opted to go with enrollment by first name only. The first name forms an index in the database (if you have multiple people with the same first name, nicknames may be required). The enrollment collection in MongoDB is defined using Mongoose as follows:

```javascript
var EnrollmentSchema = new Schema({
  firstName: {type: String, index: true},
  enrollmentId: [Number]
  });
```

As you can see, the `firstName` field is of type string and indexed. We also store an array of `enrollmentId`s with each enrollment - there is no limit as to the number that can be stored by VoiceIt.

The meat of the server-side logic is in the `audioHandler`. This contains several helper functions to process incoming requests and communicate with the VoiceIt wrapper and MongoDB. Let's look at the exported function:

```javascript
module.exports = function handleAudio(req, res, action) {
var dataView,
enrollmentId,
detectedVoiceprintText,
detectedTextConfidence,
firstName,
enrollment,
promise;

dataView = req.body;
firstName = req.query && req.query.firstName;

if (dataView) {
var voiceIt = new VoiceIt({
developerId: config.VOICEIT_DEV_ID
});

config.wav = dataView;

if (action === 'enroll') {
promise = voiceIt.enrollments.create(config);
}
if (action === 'authenticate') {
promise = voiceIt.authentications.authentication(config);
}

promise.then(function (body) {
console.log('voiceIt response body:', body);

enrollmentId = body.EnrollmentID;
detectedVoiceprintText = body.DetectedVoiceprintText;
detectedTextConfidence = body.DetectedTextConfidence;

if (enrollmentId) {
if (action === 'enroll') {
  processEnrollment(enrollmentId, detectedTextConfidence, firstName);
}
if (action === 'authenticate') {
  processAuthentication(enrollmentId);
}
} else {
  console.log('No enrollment ID returned from VoiceIt');
  return res.status(400).json({result: 'No enrollment ID returned from VoiceIt'});
}
}, function (err) {
  console.log('error calling VoiceIt:', err);
  return res.status(400).json({result: 'error calling VoiceIt: ' + err});
  });
  } else {
    console.log('No audio data in request body');
    return res.status(400).json({result: 'No audio data in request body'});
  }
};
```

Both the enrollment and authentication endpoints only accept HTTP POST requests. We start out by getting the WAV file from the request body and the user's first name (if one was passed in). An instance of the VoiceIt wrapper is created using the Developer ID obtained from the configuration. We add the WAV file to the config object; this is named such that it can be passed directly to the VoiceIt wrapper. The VoiceIt wrapper uses promises, so a successful response invokes the first function in our `then()` call. We grab the enrollment ID from the response body along with the speech to text confidence determined by VoiceIt. If we got an enrollment ID back from VoiceIt, this means that the request was successful.

If the action was `enroll`, the `processEnrollment()` helper function is invoked. This checks to make sure that the speech to text confidence is high enough. I found this was a helpful addition to the VoiceIt API - if the speech to text confidence is low, the enrollment recording is less than ideal and is unlikely to yield good authentication results. The text confidence range is 0-1; I found that a threshold of 0.5 ensures that poor enrollment recordings are rejected. If the speech to text confidence exceeds the configured threshold, we have an enrollment ID that should be stored in MongoDB. The helper function creates an enrollment object consisting of the user's first name and the enrollment ID. We use the `findOneAndUpdate()` method to essentially do an upsert - either insert a new record if a matching first name does not exist, otherwise update the existing record with the new enrollment ID.

If the action was `authenticate`, the `processAuthentication()` helper function is invoked. Here we use the `findOne()` method to lookup the user record based on the enrollment ID returned by VoiceIt. If we find the user in the database, the server returns their first name. This wraps up the server-side, so let's move on to the client-side.

### Client-Side

Our app uses the [Web Audio API](http://www.w3.org/TR/webaudio/) to capture audio in the browser. Unfortunately the Web Audio API is relatively new and isn't supported by all browsers yet, so the demo works best in recent desktop versions of Chrome and Firefox. We'll use Matt Diamond's [RecorderJS](https://github.com/mattdiamond/Recorderjs) plugin to export the audio. This is included in the app as a shared client-side component. One small but important change I made in `recorderWorker.js` was to export a `DataView` rather than a `Blob`; I found this was necessary in order for the server-side to process the WAV file in the request body.

Continuing our journey from the back-end to front-end, let's generate an AngularJS service to support our future client-side controllers:

`yo angular-fullstack:service audioService`

As its name suggests, this service is responsible for handling audio data on the client. The service essentially acts as the glue between the Web Audio API, the RecorderJS plugin and our back-end server; it handles both enrollment and authentication recordings. At this point I should give a shout out to Chris Wilson and his [AudioRecorder demo](https://webaudiodemos.appspot.com/AudioRecorder/). I borrowed a couple of his initialization functions to connect the audio from the browser to the RecorderJS plugin. With the audio foundation in place, we can build out the audio service by adding methods to support the start of a recording:

```javascript
this.startRecording = function (theAction, theFirstName, callback) {
  if (!audioRecorder) {
    callback('audioRecorder is not set');
    return;
  }
  action = theAction;
  firstName = theFirstName;
  audioRecorder.clear();
  audioRecorder.record();
  console.log('now recording, action:', action);
};
```

The following method and helper function are invoked when a recording ends:
```javascript
this.stopRecording = function (callback) {
if (!audioRecorder) {
callback('audioRecorder is not set');
return;
}
audioRecorder.stop();
console.log('stopped recording, action:', action);

var promise = sendAudio();
promise.then(function (result) {
if (result) {
result.action = action;
callback(null, result);
} else {
callback('no result returned from server');
}
}, function (err) {
callback(err);
});
};

function sendAudio() {
var deferred = $q.defer(), url;
audioRecorder.getBuffer(function () {
// exportWAV() interleaves the left and right channels (typed arrays), encodes and returns a DataView.
// The wav is in little-endian format (least significant byte is first; the most common CPU architecture).
audioRecorder.exportWAV(function (dataView) {
// POST wav data to server-side
url = (action === 'authenticate') ? '/api/authentications' : '/api/enrollments';
$.ajax({
url: url + '?firstName=' + firstName,
type: 'POST',
contentType: 'audio/wav',
data: dataView,
processData: false
}).success(function (data) {
//console.log('Response from server:', data);
deferred.resolve(data);
}).error(function (jqXHR, textStatus, errorThrown) {
  //console.log('textStatus:', textStatus);
  //console.log('errorThrown:', errorThrown);
  deferred.reject(errorThrown);
  });
  });
  });
  return deferred.promise;
}
```

Once the recording process is completed, the service's helper function automatically exports the WAV file (using RecorderJS) and POSTs it to the server-side.

Next, let's generate the client-side enrollment and authentication routes using our good friend the angular-fullstack generator:

```
yo angular-fullstack:route enroll
```
```
yo angular-fullstack:route authenticate
```

These routes require very similar presentation logic, so let's generate a shared AngularJS controller to keep the code DRY:
javascript
`yo angular-fullstack:controller global`

The global controller adds a `startRecording()` method to `$scope`:

```javascript
$scope.startRecording = function (action) {
if ($scope.recording) {
// force timer to stop
$scope.recording = false;
$scope.counter = 0;
return;
}
if (action === 'enroll' && !$scope.firstName) {
$scope.status = 'Please enter your first name!';
return;
}
$scope.counter = 5;
$scope.status = 'Recording...';

// start countdown
var promise = $timeout(countdown, 1000);
promise.then(function () {
resetUI();
processAudio();
});

// start recording
audioService.startRecording(action, $scope.firstName, function (err) {
if (err) {
$scope.status = 'Please reload the page and enable your microphone!';
$timeout.cancel(promise);
}
});
};
```

This method handles the presentation logic when the user starts recording and uses the audioService we defined earlier. A countdown timer is used to control the recording. Once the timer stops, the recording is stopped and the above service sends the audio off to the server for processing. All that's left to do in the controller is handle the service's response:

```javascript
function processAudio() {
audioService.stopRecording(function (err, result) {
// handle audioService response
if (err) {
console.log('error with audio request:', err);
$scope.status = 'Oops, there was an error!';
return;
}

if (result.action === 'enroll') {
$scope.enrollNumber = result.enrollmentId.length;
if (result.result === 'success') {
$scope.status = 'Successful enrollment!';
return;
} else {
$scope.status = 'Sorry your enrollment was unsuccessful. Please try again.';
return;
}
}

if (result.action === 'authenticate') {
if (result.result === 'success') {
$scope.status = 'Hi ' + result.firstName + '!';
} else {
$scope.status = 'Sorry we were unable to authenticate you. Please try again.';
}
}
});
}
```

Finally, the angular-fullstack generator created a shared navbar component for our app. We just need to add our `/enroll` and `/authenticate` routes to the controller array so they appear in the header menu:

```javascript
$scope.menu = [{
'title': 'Home',
'link': '/'
}, {
'title': 'Enroll',
'link': '/enroll'
}, {
'title': 'Authenticate',
'link': '/authenticate'
}];
```

### Running the app
Navigate to the project root, enter `grunt serve` and go to [http://localhost:9000/](http://localhost:9000/) in your recent version of Chrome or Firefox. You should see a page like [this](https://raw.githubusercontent.com/gmillward/group-voice-biometrics/gh-pages/images/main.png).

During the enrollment phase, don't forget to enable the microphone and enter a first name. Make sure your microphone volume is nice and high (I set mine to the highest level with ambient noise reduction enabled). Click on the mic to record 3-7 [enrollments](https://raw.githubusercontent.com/gmillward/group-voice-biometrics/gh-pages/images/enroll.png).

At this point, you can start authenticating with your [voice](https://raw.githubusercontent.com/gmillward/group-voice-biometrics/gh-pages/images/authenticate.png)!

Here's the [GitHub repo](https://github.com/gmillward/group-voice-biometrics) for the demo app. (Keep in mind this is demo code, so it's not fully optimized. Pull requests are welcome :)

### Next steps
There are numerous extension points to this app. For example, you could add support for profile images, or add an audio visualization during the recording process (a la Chris Wilson's AudioRecorder demo, or [KITT's Voice Synthesizer](https://www.youtube.com/watch?v=WiTYzppwU7s)?!). On the server-side, the authentication process could be used to create an OAuth "voice grant flow". The OAuth Authorization Server would issue an OAuth access token upon successful voice authentication. Another extension point would be to combine the voice authentication process with a command. This becomes a powerful way to enhance the user experience: the user could authenticate and jump to a specific part of the app simply by saying a command.
