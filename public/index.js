let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
const filter = document.querySelector('#filter')
const checkboxTheme = document.querySelector('#theme')
const toggleButton_1 = document.getElementById('toggle-cam')
const toggleButton_2 = document.getElementById('toggle-audio')
let client = {}
let currentFilter

//get stream
navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  })
  .then(stream => {
    socket.emit('NewClient')
    video.srcObject = stream
    video.play()

    filter.addEventListener('change', (event) => {
      currentFilter = event.target.value
      video.style.filter = currentFilter
      SendFilter(currentFilter)
      event.preventDefault
    })

    //used to initialize a peer
    function InitPeer(type) {
      let peer = new Peer({
        initiator: (type == 'init') ? true : false,
        stream: stream,
        trickle: false
      })
      peer.on('stream', function(stream) {
        CreateVideo(stream)
      })
      peer.on('data', function(data) {
        let decodedData = new TextDecoder('utf-8').decode(data)
        let peervideo = document.querySelector('#peerVideo')
        peervideo.style.filter = decodedData
      })
      return peer
    }

    //for peer of type init
    function MakePeer() {
      client.gotAnswer = false
      let peer = InitPeer('init')
      peer.on('signal', function(data) {
        if (!client.gotAnswer) {
          socket.emit('Offer', data)
        }
      })
      client.peer = peer
    }

    //for peer of type not init
    function FrontAnswer(offer) {
      let peer = InitPeer('notInit')
      peer.on('signal', (data) => {
        socket.emit('Answer', data)
      })
      peer.signal(offer)
      client.peer = peer
    }

    function SignalAnswer(answer) {
      client.gotAnswer = true
      let peer = client.peer
      peer.signal(answer)
    }

    // Creating Video
    function CreateVideo(stream) {
      let video = document.createElement('video')
      video.id = 'peerVideo'
      video.srcObject = stream
      video.setAttribute('class', 'embed-responsive-item')
      document.querySelector('#peerDiv').appendChild(video)
      video.play()
      //wait for 1 sec
      setTimeout(() => SendFilter(currentFilter), 500)
    }

    function SessionActive() {
      document.write('Session Active. Please come back later')
    }


    //The other peer can see the filter that peer 1 applied
    function SendFilter(filter) {
      if (client.peer) {
        client.peer.send(filter)
      }
    }

    // Mute/Umute mic
    toggleButton_1.addEventListener('click', () => {
      const videoTrack = stream.getTracks().find(track => track.kind === 'video');
      if (videoTrack.enabled) {
        videoTrack.enabled = false;
        toggleButton_1.innerHTML = 'Show cam'
      } else {
        videoTrack.enabled = true;
        toggleButton_1.innerHTML = "Hide cam"
      }
    });

    //Show/Hide cam
    toggleButton_2.addEventListener('click', () => {
      const audioTrack = stream.getTracks().find(track => track.kind === 'audio');
      if (audioTrack.enabled) {
        audioTrack.enabled = false;
        toggleButton_2.innerHTML = 'Unmute Audio'
      } else {
        audioTrack.enabled = true;
        toggleButton_2.innerHTML = "Mute Audio"
      }
    });


    //Remove peer(closing the tab)
      function RemovePeer() {
      document.getElementById("peerVideo").remove();
      if (client.peer) {
        client.peer.destroy()
      }
    }

    socket.on('BackOffer', FrontAnswer)
    socket.on('BackAnswer', SignalAnswer)
    socket.on('SessionActive', SessionActive)
    socket.on('CreatePeer', MakePeer)
    socket.on('Disconnect', RemovePeer)

  })
  .catch(err => document.write(err))

//Appling dark theme
checkboxTheme.addEventListener('click', () => {
  if (checkboxTheme.checked == true) {
    document.body.style.backgroundColor = '#212529'


  } else {
    document.body.style.backgroundColor = '#fff'

  }
})
