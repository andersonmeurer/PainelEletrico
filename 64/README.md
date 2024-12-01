-- Inicialize o projeto Node.js:
npm init -y

-- Instale as dependências Express e Johnny-Five firmata e ws:
/*
express: Framework para criar aplicações web.
johnny-five: Biblioteca para controle de hardware com JavaScript.
firmata: Protocolo para comunicação entre o Johnny-Five e o microcontrolador (ex.: Arduino).
*/
npm install express@4.17.1 johnny-five@2.1.0 firmata@2.3.0 serialport@9.0.0 ws@8.18.0



npm config set python python3
npm config set python "C:\Users\Meurer\AppData\Local\Programs\Python\Python313\python.exe"
Baixe o Visual Studio Build Tools.
Durante a instalação, selecione:
"C++ build tools"
"Windows 10 SDK" (necessário para compilar extensões).