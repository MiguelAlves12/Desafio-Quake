const readline = require('readline');
const fs = require('fs');
const readable = fs.createReadStream('Quake.txt');

const rl = readline.createInterface({
    input: readable,
    output: process.stdout,
    terminal:false
});

let bodyJson = [];
let countGame = 1;
let total_kills = 0;
let index=0;

rl.on('line', (line) => {
        let time = line.substring(0,7);
        line = line.replace(time,"");
        arrayLine = line.split(":");
        //Verifica inicio da partida e controi a estrutura principal
        if(arrayLine[0] == 'InitGame'){
            let game = {"game":countGame++,
                         "status":{
                             "total_kills": total_kills,
                             "players":[]
                        }
                    } 
            bodyJson.push(game);
        //Verifica jogadores que se desconectam da partida    
        }else if(arrayLine[0] == 'ClientDisconnect'){
            let idClient = arrayLine[1];
            let indexPlayerRemove = bodyJson[index].status.players.findIndex(el => el.id == idClient);//faz busca do jogador a ser desconectado 
            if(indexPlayerRemove >= 0){
                bodyJson[index].status.players[indexPlayerRemove].connect = false;
                bodyJson[index].status.players[indexPlayerRemove].id = 0 //id = 0, pois jogador está desconectado 
            }
         //Verifica conexão de um jogador ou mudança
        }else if(arrayLine[0].trim() == 'ClientUserinfoChanged'){
            let strClient = arrayLine[1];
            let player = strClient.split("\\t");
            let startPosition = player[0].indexOf("n\\");
            let idPlayer = parseInt(player[0].substring(0,startPosition).trim());
            namePlayer = player[0].substring(startPosition+2);

            let existPlayer =  bodyJson[index].status.players.findIndex(el => el.id == idPlayer);//verifica se jogador já foi criado

            //verifica se jogador já existe, caso sim ele está fazendo uma mudança de nome
            if(existPlayer >= 0){
                //Verifica se o nome não é mesmo que já está usando
                if(bodyJson[index].status.players[existPlayer].nome != namePlayer){
                    let oldName =  bodyJson[index].status.players[existPlayer].nome;
                    let newName = namePlayer;
                    bodyJson[index].status.players[existPlayer].nome = newName;
                    let indexRemove = bodyJson[index].status.players[existPlayer].old_names.indexOf(newName);
                    //valida se o novo nome já estava na lista de old_names, caso sim remove ele
                    if(indexRemove >= 0) bodyJson[index].status.players[existPlayer].old_names.splice(indexRemove,1);
                    bodyJson[index].status.players[existPlayer].old_names.push(oldName);
                }
             //caso o jogador não exist, a estrutura principal do jogador é criada e acrescentada a lista de players    
            }else{
                let indexDesconnected = bodyJson[index].status.players.findIndex(el => el.nome == namePlayer && el.connect == false);
                //verifica se jogador esta desconectado, caso sim ele coloca o novo id e true em connect
                if(indexDesconnected >= 0){
                    bodyJson[index].status.players[indexDesconnected].id = idPlayer;
                    bodyJson[index].status.players[indexDesconnected].connect = true;
                }else{
                    bodyJson[index].status.players.push({
                        "id": idPlayer,
                        "nome": namePlayer,
                        "kills": 0,
                        "died": 0,
                        "connect":true,
                        "old_names": []
                    });
                }
            }
        //Valida kills               
        }else if(arrayLine[0].trim() == 'Kill'){
            let kill = arrayLine[2].trim();
            let arrayKill = kill.split("killed");
            let playerKilled = arrayKill[0].trim();
            let playerDead = arrayKill[1].split("by")[0].trim();
            let indexPlayerDead = bodyJson[index].status.players.findIndex(el => el.nome == playerDead);
            let indexPlayerKilled = bodyJson[index].status.players.findIndex(el => el.nome == playerKilled);
            //Valida se a morte foi pelo mundo, caso não acrescenta a kill ao jogador que matou e died ao jogador que foi morto.
            if(playerKilled != "<world>"){
                bodyJson[index].status.players[indexPlayerKilled].kills++;
                bodyJson[index].status.players[indexPlayerDead].died++;
            //caso seja morte pelo mundo tira uma kill do jogador morto    
            }else{
                bodyJson[index].status.players[indexPlayerDead].kills--;
            }
            bodyJson[index].status.total_kills = total_kills++;//conta as kills da partida inteira
        //Valida fim de jogo
        }else if(arrayLine[0].trim() == 'ShutdownGame'){
            if(bodyJson[index].status.total_kills > 0){ bodyJson[index].status.total_kills++ }
            total_kills = 0;
            index++;
        }
  }).on('close', () => {
    console.log("---------------<TODOS OS JOGOS>---------------");
    console.log(bodyJson);
    console.log("-----------------------<PLACAR DE CADA JOGO>-----------------------");
    console.log(" ");
    for(let el in bodyJson){
        console.log("---------------<PLACAR DO JOGO: "+bodyJson[el].game+">-----------------");
        console.log(bodyJson[el])
        console.log("--------------------<PLAYERS>-------------------");
        console.log(bodyJson[el].status.players);
        console.log("------------------------------------------------");
    }
    process.exit(0);
  });






