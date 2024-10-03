var video = document.querySelector("#videoElement");

if (navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(function (stream) {
      video.srcObject = stream;
    })
    .catch(function (error) {
      console.log("Camera.js: Algo de errado ocorreu, tente novamente\nVerifique se a permisão de acesso a câmera foi concedido!");
    });
}