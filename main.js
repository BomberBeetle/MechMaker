const Discord = require('discord.js');
const fs = require('fs');
const client = new Discord.Client();
const glicko = require("./glicko.js");
const request = require('request');
const MongoClient = require('mongodb').MongoClient;
const timeouts = [];
var url = ""; 
var activities = [
  {
    text: "seu 3-0",
    status: {type: 'WATCHING'}
  },
  {
    text: "mísseis voarem",
    status: {type: 'WATCHING'}
  },
  {
    text: "uma money match",
    status: {type: 'PLAYING'}
  },
  {
    text: "Touhou Eurobeat",
    status: {type: 'LISTENING'}
  },
  {
    text: "pedras",
    status: {type: 'PLAYING'}
  },
  {
    text: "pessoas com bash",
    status: {type: 'PLAYING'}
  },
  {
    text: "Neo Fire Capital, impulsivamente",
    status: {type: 'LISTENING'}
  },
  {
    text: "seus johns",
    status: {type: 'LISTENING'}
  },
  {
    text: "estalactites derreterem",
    status: {type: 'WATCHING'}
  },
  {
    text: "uma baleia azul (ou é um cão?)",
    status: {type: 'WATCHING'}
  },
  {
    text: "contra o br guy, (por favor me ajud",
    status: {type: 'PLAYING'}
  }
]

try{
  guilds = JSON.parse(fs.readFileSync("guilds.json"));
}

catch(a){
  console.log(a);
  guilds = [];
}

try{
  url = JSON.parse(fs.readFileSync("dbLocation.json")).url;
}
catch{
  url = "mongodb://127.0.0.1/";
}


function writeGuilds(){
  var guildsCopy =JSON.parse(JSON.stringify(guilds));
  guildsCopy.forEach((element, index) => {guildsCopy[index].matches = [] ;guildsCopy[index].queue = [];});
  fs.writeFile("guilds.json", JSON.stringify(guildsCopy), (err) => {if (err) throw err;});
}

function writeGuildsBackup(){
  MongoClient.connect(url, (err, client) => {
    if (err) {
    console.log(err)
    return;
  }
  var db = client.db('MMDB');
  var guilds = db.collection('guilds');
  guilds.find().toArray((err, doc) =>{
    if (err) {
      console.log(err)
      return;
    }
    fs.writeFile('backup.json', doc);
  })
  })
}

function insertGuild(guild){
  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('MMDB');
    var guilds = db.collection('guilds');
    guilds.insertOne(guild);
    console.log(`Nova Guild: ${guild.id}`)
    client.close();
  })
}
function updateGuild(guildQueryObj, updateParamsObj){
  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('MMDB');
    var guilds = db.collection('guilds');
    guilds.updateMany(guildQueryObj, updateParamsObj);
    client.close();
  })
}
function deleteGuild(){
  MongoClient.connect(url, (err, client) => {
    if (err) throw err;
    var db = client.db('MMDB');
    var guilds = db.collection('guilds');
    guilds.deleteOne({id: guild.id});
    console.log(`Deletou Guild: ${guild.id}`)
    client.close();
  })
}

function handleMessageGuild(queryObj, msg){
  var guild = undefined;
   MongoClient.connect(url, (err, client) => {
     if (err)
       throw err;
     var db = client.db('MMDB');
     var guilds = db.collection('guilds');
     guilds.findOne(queryObj, (err, doc)=>{
      if (err) throw err;
      if(!doc){
        var guildObj =
        {
          id: msg.guild.id,
          queue: [],
          matches: [],
          players: [],
          bans: [],
          itens: [],
          basecoins: 400,
          wincoins: 200
        }
        insertGuild(guildObj);
        if(msg.guild.roles.exists("name", "MM Curator")){
          msg.guild.createRole({name: "MM Curator", color:"#FFFF00"});
        }
        
        if(msg.guild.channels.findAll("name", "ladder-bot").length < 1){
          msg.guild.createChannel('ladder-bot', {type: "text"});
        }
      }
      handleMsg(doc?doc:guildObj, msg);
      client.close();
     });
   })
}

client.on('ready', () => {
 console.log(`Logged in as ${client.user.tag}!`);
 setInterval(()=>{
  let rand = Math.floor((Math.random() * 10));
  client.user.setActivity(activities[rand].text, activities[rand].status);
 },30000)
 client.user.setActivity(activities[10].text, activities[10].status);
 });

client.on('guildCreate', guild => {
var guildObj =
  {
    id: guild.id,
    queue: [],
    matches: [],
    players: [],
    bans: [],
    itens: [],
    basecoins: 400,
    wincoins: 200
  }
  insertGuild(guildObj);
  if(guild.roles.exists("name", "MM Curator")){
    guild.createRole({name: "MM Curator", color:"#FFFF00"});
  }
  
  if(guild.channels.findAll("name", "ladder-bot").length < 1){
    guild.createChannel('ladder-bot', {type: "text"});
  }
})

client.on('guildDelete', guild =>
{
  guilds.splice(guilds.findIndex(element => element.id === guild.id), 1);
  deleteGuild(guild)
})

client.on('message', msg => {
  //#region fazer registro
  if(msg.channel.type == "dm"){
    return;
  }

  handleMessageGuild({id: msg.guild.id}, msg);

})

function handleMsg(guild, msg){

  if(msg.content.split(" ")[0] === "$ban"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.mentions.users.length < 1 ){
        msg.channel.send("O comando foi formatado de forma errada. A sintaxe correta é `$ban @jogador`");
      }
      else{
        var user = msg.mentions.users.first();
          if(!guild.bans.find(element => element === user.id)){
            updateGuild({id: guild.id}, {$push: {bans :{id: user.id}}})
            if(guild.players.find(element => element.id === user.id)){
              updateGuild({id: guild.id}, {$pull: {players: {id: user.id}}})
            }
            msg.channel.send(`O usuário <@${user.id}> foi banido da ladder e seus registros foram apagados.`);
          }
          else{
            msg.channel.send(`O usuário <@${user.id}> já está banido da ladder.`);
          }
        }     
    }
    else{
      msg.reply("você não tem autorização para fazer isto. Em caso de jogador problemático, mencione um MM Curator.");
    }
  } 
  
  else if(msg.content.split(" ")[0] ==="$s_add_msg"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
        if(msg.mentions.channels.size < 1){
          msg.reply(`o comando está formatado de forma errada. A formatação certa é \`$s_add_msg #canal\`. A mensagem deve conter um arquivo .json formatado desta forma:
\`\`\`json
{
  "content":"mensagem blablablablabla <&pName> (<&pName> marca um lugar onde deve ser enviado o nome do comprador da mensagem)",
  "desc":"descrição curta, o id e um numero inteiro maior que 1",
  "id": 1832947520
  }
\`\`\`
`);
        }
        if(msg.attachments.size < 1){
        msg.reply(`você deve incluir um arquivo .json com as informações do item, nesta formatação:
\`\`\`json
{
  "content":"mensagem blablablablabla <&pName> (<&pName> marca um lugar onde deve ser enviado o nome do comprador da mensagem)",
  "desc":"descrição curta, o id e um numero inteiro maior que 1",
  "id": 1832947520
}
}\`\`\``);
      } 
        else{          
          try{
            request(msg.attachments.first().url, {json: true}, (err, res, body) => {
              if(err){throw err;}
              console.log(body);
              if(!parseInt(body.id) || parseInt(body.id) < 0){
                msg.reply("o ID inserido é inválido. É necessário que o ID seja um número inteiro e maior que 0.");
              }  
              else if(!Number.isInteger(parseInt(body.price)) || parseInt(body.price) < 0){
                msg.reply("o preço inserido é inválido. É necessário que o preço seja um número inteiro e maior ou igual 0.");
              }  
              else if(guild.itens.findIndex(element => element.id === body.id) !== -1){
                msg.reply("o ID inserido é inválido. Este ID já está na loja.");
              }
              else if(!body.desc || !body.content){
                msg.reply(`você deve incluir um arquivo .json com as informações do item, nesta formatação:
\`\`\`json
{
  "content":"mensagem blablablablabla <&pName> (<&pName> marca um lugar onde deve ser enviado o nome do comprador da mensagem)",
  "desc":"descrição curta, o id e um numero inteiro maior que 1",
  "id": 1832947520
}
}\`\`\``);
              }
              else{
               updateGuild(
                {id: guild.id}, 
                {
                  $push:
                  {
                    itens: {
                      type: "msg",
                      id: parseInt(body.id),
                      desc: body.desc,
                      content: body.content,
                      price: parseInt(body.price),
                      channelId: msg.mentions.channels.first().id,
                      req: undefined
                    }
                  }
                });
                msg.reply("o item foi adicionado com sucesso.");
            } 
          }
            )
        }
          catch{
            msg.reply(`você deve incluir um arquivo .json com as informações do item, nesta formatação:
\`\`\`json
{
  "content":"mensagem blablablablabla <&pName> (<&pName> marca um lugar onde deve ser enviado o nome do comprador da mensagem)",
  "desc":"descrição curta, o id e um numero inteiro maior que 1",
  "id": 1832947520
}
}\`\`\``);
            }
        }
    }
    else{
      msg.reply("você não tem autorização para fazer isto.");
    }
  }
  
  else if(msg.content.split(" ")[0] ==="$s_add_role"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.content.split(" ").length < 3 || msg.mentions.roles.size < 1){
        msg.reply("o comando está formatado de forma errada. A formatação certa é `$s_add_role preço @Role`.");
      }
      else if( parseInt(msg.content.split(" ")[1]) < 0){
        msg.reply("o preço inserido é inválido. É necessário que o preço seja um número inteiro e maior ou igual a 0.");
      }  
      else if(guild.itens.findIndex(element => element.roleId === msg.mentions.roles.first().id) !== -1){
        msg.reply("o role mencionado é inválido. Este role já está na loja.");
      }

      else{
        updateGuild({id: guild.id}, {$push: {itens : {
          type: "role",
          roleId: msg.mentions.roles.first().id,
          price: parseInt(msg.content.split(" ")[1]),
          req: undefined
        }
      }
        })
      msg.reply("a role foi inserida com sucesso na loja!");
      }
  }
  else{
    msg.reply("você não tem autorização para fazer isto.");
  }
  }

  else if(msg.content.split(" ")[0] ==="$s_add_item"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.attachments.size < 1){
        msg.reply(`você deve incluir um arquivo .json com as informações do item, nesta formatação:
\`\`\`json
{
"desc":"descrição",
"name":"nome",
"id": 1832947520,
"price": 100
}\`\`\`
Observação: \`id\` e \`price\` é um número inteiro e maior ou igual a 0.`);
      }
  else{
    try{
      request(msg.attachments.first().url, {json: true}, (err, res, body) => {
        if(err){throw err;}
        if(!parseInt(body.id) || parseInt(body.id) < 0){
          msg.reply("o ID inserido é inválido. É necessário que o ID seja um número inteiro e maior que 0.");
        }  
        else if(!Number.isInteger(parseInt(body.price)) || parseInt(body.price) < 0){
          msg.reply("o preço inserido é inválido. É necessário que o ID seja um número inteiro e maior ou igual a 0.");
        }  
        else if(guild.itens.findIndex(element => element.id === body.id) !== -1){
          msg.reply("o ID inserido é inválido. Este ID já está na loja.");
        }
        else if(!body.desc || !body.name){
          msg.reply(`o arquivo incluído foi formatado de forma errada. A formatação certa é:
\`\`\`json
{
"desc":"descrição",
"name":"nome",
"id": 1832947520
}\`\`\`
Observação: \`id\` é um número inteiro e maior ou igual a 0.`);
        }
        else{
          updateGuild({id: guild.id},
          {
            $push :{
              itens:{
                type: "item",
                id: parseInt(body.id),
                desc: body.desc,
                name: body.name,
                price: parseInt(body.price),
                req: undefined
              }
            }
          });
          msg.reply("o item foi adicionado com sucesso.");      
      } 
    }
      )
  }
    catch{
      msg.reply(`o processamento do arquivo falhou. Você deve incluir um arquivo .json com as informações do item, nesta formatação:
      \`\`\`json
{
  "desc":"descrição",
  "name":"nome",
  "id": 1832947520
}\`\`\`
Observação: \`id\` é um número inteiro e maior ou igual a 0.`);
      }
    }
  }

  else{
    msg.reply("você não tem autorização para fazer isto.");
  }
  }

  else if(msg.content.split(" ")[0] ==="$kick"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.mentions.users.length < 1 ){
        msg.channel.send("O comando foi formatado de forma errada. A sintaxe correta é `$kick @jogador`");
      }
      else{
        var playerIndex = guild.players.findIndex(element => element.id === msg.mentions.users.first().id);
        if(playerIndex === -1){
          msg.channel.send("Este usuário não está registrado na ladder.");
        }
        else{
          updateGuild({id: guild.id}, {$pull: {players:{id: msg.mentions.users.first().id}}});
          msg.channel.send("O registro desse usuário da ladder foi retirado com successo.");
        }
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto. Em caso de jogador problemático, mencione um MM Curator.");
    }
  }
  else if(msg.content.split(" ")[0] === "$unban"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.mentions.users.length < 1){
        msg.channel.send("O comando foi formatado de forma errada. A sintaxe correta é `$unban @Jogador`");
      }
      else{
        var bannedIndex = guild.bans.findIndex(element => element.id === msg.mentions.users.first().id);
        if(bannedIndex === -1){
          msg.channel.send("O usuário mencionado não está banido atualmente.")
        }
        else{
          updateGuild({id: guild.id}, {$pull :{bans:{id: msg.mentions.users.first().id}}});
          msg.channel.send("O usuário foi desbanido com sucesso.");
        }
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto. Caso queira apelar um banimento, mencione um MM Curator.");
    }
  }
  else if(msg.content === "$balance" || msg.content === "$carteira"){
    var playerIndex = guild.players.findIndex(element => element.id === msg.author.id);
    if(playerIndex !== -1){
      msg.reply("você atualmente tem " +  guild.players[playerIndex].money + " moedas.")
    }
    else{
      msg.reply(" seu perfil não foi encontrado na ladder... (tente usar $sub para se registrar)");
    }
  }
  else if(msg.content === "$sub"){

    if(!guild.players.find(element => element.id === msg.author.id)){
    var ban = guild.bans.find(element => element.id === msg.author.id);
    if(!ban){

    updateGuild({id: guild.id}, {$push: {players: glicko.playerInit({}, msg.author.id)}});

    msg.reply(" você se registrou com sucesso na Ladder!");

    }
    else{
      msg.reply(`você está banido da ladder. Vai sentar no cantinho e pensar no que você fez.`);
    }

    }

    else{

      msg.reply(" você já está registrado na Ladder!")

    }

  }
  //#endregion
  //#region tirar registro

  else if(msg.content === "$unsub"){

    var playerIndex = guild.players.findIndex(element => element.id === msg.author.id);
    var queueIndex = guild.queue.findIndex(element => element === msg.author.id)
    var matchIndex = guild.matches.findIndex(element => element[0].id === msg.author.id || element[1].id === msg.author.id);

    if(queueIndex !== -1 || matchIndex !== -1){
      msg.reply("não é possível cancelar sua inscrição agora. Tente novamente mais tarde.");
      return;
    }
    
    if (playerIndex !== -1){

      updateGuild({id: guild.id}, {$pull : {players: {id: msg.author.id}}});

      msg.reply(" você cancelou seu registro na ladder com sucesso.");
    }
    else{

      msg.reply(" seu perfil não foi encontrado na ladder... (tente usar $sub para se registrar)");

    }
  }
//#endregion

  //#region pegar o ranking do jogador

  else if(msg.content.split(" ")[0] === "$rate" || msg.content.split(" ")[0] === "$rank"){

      if(msg.mentions.users.size > 0){

        var playerIndex = guild.players.findIndex(element => element.id === msg.mentions.users.first().id)

        if (playerIndex !== -1){

          guild.players.sort((a,b) => b.rating - a.rating);

          playerIndex = guild.players.findIndex(element => element.id === msg.mentions.users.first().id)
        //msg.channel.send(" sua rating atual é " + guild.players[playerIndex].rating.toFixed(2) + " e você está na posição " + (guild.players.length - playerIndex) + " das leaderboards." );
        msg.channel.send(`\`\`\`css
Rating de ${msg.guild.members.resolve(guild.players[playerIndex].id).user.tag}

Posição na Ladder: ${playerIndex + 1}
Rating: ${guild.players[playerIndex].rating.toFixed(2)}
Vitórias: ${guild.players[playerIndex].wins}
Derrotas: ${guild.players[playerIndex].losses}
Empates: ${guild.players[playerIndex].draws}
Win Rate: ${((guild.players[playerIndex].wins/(guild.players[playerIndex].losses + guild.players[playerIndex].wins + guild.players[playerIndex].draws))*100).toFixed(2) + "%"}
         \`\`\``);  
      }
        else{
          msg.channel.send("Este usuário não está registrado na ladder.");
        }
      }

      else{

        var playerIndex = guild.players.findIndex(element => element.id === msg.author.id);

        if (playerIndex !== -1){
          guild.players.sort((a,b) => b.rating - a.rating);

        playerIndex = guild.players.findIndex(element => element.id === msg.author.id);
        
       // msg.reply(" sua rating atual é " + guild.players[playerIndex].rating.toFixed(2) + " e você está na posição " + (guild.players.length - playerIndex) + " das leaderboards." );

       msg.channel.send(`\`\`\`css
Rating de ${msg.guild.members.resolve(guild.players[playerIndex].id).user.tag}
       
Posição na Ladder: ${playerIndex + 1}
Rating: ${guild.players[playerIndex].rating.toFixed(2)}
Vitórias: ${guild.players[playerIndex].wins}
Derrotas: ${guild.players[playerIndex].losses}
Empates: ${guild.players[playerIndex].draws}
Win Rate: ${((guild.players[playerIndex].wins/(guild.players[playerIndex].losses + guild.players[playerIndex].wins + guild.players[playerIndex].draws))*100).toFixed(2) + "%"}\`\`\``);
        }    
        else{

          msg.reply(" seu perfil não foi encontrado na ladder... (tente usar $sub para se registrar). Você ainda pode ver o perfil de outros jogadores usando `$rate @jogador`");
    
        }  
      }
  }
  //#endregion
  else if(msg.content === "$top"){
    var playerCount = guild.players.length;
    guild.players.sort((a,b) => b.rating - a.rating);
    var strings = []
    for(var i = 0; i < (playerCount < 10? playerCount:10); i++){
      let member = msg.guild.members.resolve(guild.players[i].id);
      strings[i] = `${i+1} - ${member==null?"???":member.user.tag} - Rating: ${guild.players[i].rating.toFixed(2)}`    
    }
    msg.channel.send(`\`\`\`css
Melhores Jogadores:

${strings.join("\n")}
      \`\`\``);
  }
  else if(msg.content.split(" ")[0] === "$s_edit_role"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.mentions.roles.size < 1){
        msg.reply("o comando foi usado de forma errada. A sintaxe correta é `$s_edit_role preço @role`. O preço deve ser inteiro e menor ou igual a 0.");
      }
      else if(parseInt(msg.content.split(" ")[1]) < 0){
        msg.reply("o comando foi usado de forma errada. A sintaxe correta é `$s_edit_role preço @role`. O preço deve ser inteiro e menor ou igual a 0.");
      }
      else{
        var roleItemIndex = guild.itens.findIndex(element => element.roleId === msg.mentions.roles.first().id);
        if(roleItemIndex !== -1){
          //guild.itens[roleItemIndex].price = parseInt(msg.content.split(" ")[1]);
          updateGuild({id: guild.id, "itens.roleId": msg.mentions.roles.first().id}, { $set: {"itens.$.price" : parseInt(msg.content.split(" ")[1])}});
          msg.reply("o preço dessa role foi mudado com sucesso.");
        }
        else{
          msg.reply("esta role não está na loja.");
        }
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto.");
    }
  }
  else if(msg.content.split(" ")[0] === "$s_edit_msg"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      var msgIndex = guild.itens.findIndex(element => element.id === parseInt(msg.content.split(" ")[1]) && element.type === "msg");
      if(msg.attachments.size < 1){
        msg.reply(`a formatação correta do comando é \`$s_edit_msg ID\`. Você deve incluir um arquivo .json com as informações da mensagem, nesta formatação:
\`\`\`json
{
"desc":"descrição",
"content":"conteúdo <&pName>",
"price": preço
}\`\`\`
Observação: <&pName> indica um lugar onde o nome do comprador da mensagem deve ser colocado. "price" deve ser um número inteiro maior ou igual a 0.
Para não editar um atributo, omita ele do arquivo .json.`);
      }
      else if(parseInt(msg.content.split(" ")[1]) < 1 || !parseInt(msg.content.split(" ")[1])){
        msg.reply("o ID inserido é inválido. O ID deve ser um número inteiro maior que 0.");
      }
      else if(msgIndex === -1){
        msg.reply("não existe nenhuma mensagem com este ID.");
      }
      else{
        try{
          request(msg.attachments.first().url, {json: true}, (err, res, body) => {
            if(err){throw err;}
            if(body.desc){
              updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.desc" : body.desc}});
            }
            if(body.content){
              updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.content" : body.content}});
            }
            if(body.price || body.price === 0){
              if(parseInt(body.price) >= 0){
                updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.price" : body.price}});
              }
              else{
                msg.reply("o preço informado no arquivo é invalido. Porém, as outras alterações foram feitas.");
                return;
              }
            }
            msg.reply("as alterações foram feitas com sucesso.");
          })
        }
        catch{
          msg.reply("houve um erro no processamento do arquivo.");
        }
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto.");
    }
  }
  else if(msg.content.split(" ")[0] === "$s_edit_item"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      var msgIndex = guild.itens.findIndex(element => element.id === parseInt(msg.content.split(" ")[1]) && element.type === "item");
      if(msg.attachments.size < 1){
        msg.reply(`a formatação correta do comando é \`$s_edit_item ID\`. Você deve incluir um arquivo .json com as informações da mensagem, nesta formatação:
\`\`\`json
{
"desc":"descrição",
"name":"nome",
"price": preço
}\`\`\`
Observação: "price" deve ser um número inteiro maior ou igual a 0.
Para não editar um atributo, omita ele do arquivo .json.`);
      }
      else if(parseInt(msg.content.split(" ")[1]) < 1 || !parseInt(msg.content.split(" ")[1])){
        msg.reply("o ID inserido é inválido. O ID deve ser um número inteiro maior que 0.");
      }
      else if(msgIndex === -1){
        msg.reply("não existe nenhum item com este ID.");
      }
      else{
        try{
          request(msg.attachments.first().url, {json: true}, (err, res, body) => {
            if(err){throw err;}
            if(body.desc){
              updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.desc" : body.desc}});
            }
            if(body.name){
              updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.name" : body.name}});
            }
            if(body.price || body.price === 0){
              if(parseInt(body.price) >= 0){
                updateGuild({id: guild.id, "itens.id": parseInt(msg.content.split(" ")[1])}, { $set: {"itens.$.price" : body.price}});
              }
              else{
                msg.reply("o preço informado no arquivo é invalido. Porém, as outras alterações foram feitas.");
                return;
              }
            }
            msg.reply("as alterações foram feitas com sucesso.");
          })
        }
        catch{
          msg.reply("houve um erro no processamento do arquivo.");
        }
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto.");
    }
  }
  else if(msg.content.split(" ")[0] === "$s_rem"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(msg.mentions.roles.size > 0){
        var roleItemIndex = guild.itens.findIndex(element => element.roleId === msg.mentions.roles.first().id);
        if(roleItemIndex !== -1){
          updateGuild({id: guild.id}, {$pull: {itens: {roleId: msg.mentions.roles.first().id}}});
          msg.reply("esta role foi removida da loja com sucesso.");
        }
        else{
          msg.reply("esta role não está na loja.");
        }
      }
      else if(parseInt(msg.content.split(" ")[1]) > 0){
        var itemIndex =  guild.itens.findIndex(element => element.id === parseInt(msg.content.split(" ")[1]));
        if(itemIndex !== -1){
          updateGuild({id: guild.id}, {$pull: {itens: {id:parseInt(msg.content.split(" ")[1])}}});
          guild.players.forEach((player) => {
            var pItemIndex = player.inv.findIndex(element => element.id === parseInt(msg.content.split(" ")[1]))
            if(pItemIndex !== -1){
              updateGuild({id: guild.id, players: {id: player.id}}, {$pull: {"players.$.inv" : {id: parseInt(msg.content.split(" ")[1])}}});
            }
          })
          msg.reply("este item foi removido da loja com sucesso.");
        }
        else{
          msg.reply("este item não está na loja.");
        }
      }
      else{
        msg.reply("o comando foi utilizado de forma errada. A formatação certa é `$s_rem ID|@Role` Se for utilizado um ID, este deve ser um número inteiro maior do que 0");
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto.");
    }
  }
  else if(msg.content.split(" ")[0] === "$inv"){
    var senderIndex = guild.players.findIndex(element => element.id === msg.author.id);
    if(senderIndex !== -1){
    var page = parseInt(msg.content.split(" ")[1]);
    if(!page || page < 1){
      page = 1;
    }
    var itens = guild.players[senderIndex].inv;
    var itemCount = itens.length;
    var pages = Math.ceil(itemCount/10);
    if(page > pages){
      msg.reply(`a página escolhida é muito alta. Só existem ${pages} páginas de itens no momento.`);
    }
    else{
      var counterLimit = itemCount - (10 * (page-1)) < 10 ? itemCount - (10 * (page-1)) : 10;
      var msgContent = "";
      for(var i = 0; i < counterLimit ; i++){
        var entry = i + (page-1)*10;
        var itemInfo = guild.itens.find(element => element.id === itens[entry].id);
        msgContent += `ID: ${itens[entry].id} - ${itemInfo.name} x${itens[entry].count}\n`;
      }
      msg.channel.send(`\`\`\`json
Seus Itens - Página ${page} de ${pages}

${msgContent}
Use $detail|$detalhar ID para ver a descrição do item.
\`\`\``);
      }
    }
    else{
      msg.reply("você não está registrado na ladder! Use `$sub` para se registrar.");
    }
  }
  else if(msg.content.split(" ")[0] === "$cancel"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      var argRegex =  /^[0-9]+$/;
      if(msg.content.split(" ").length < 2){
        msg.channel.send("Comando formatado de forma errada. Utilize `$cancel índice`. Para verificar o índice das partidas, use $tretas.");
      }
      else if(!argRegex.test(msg.content.split(" ")[1])){
        msg.channel.send("Comando formatado de forma errada. Utilize `$cancel índice`. Para verificar o índice das partidas, use $tretas.");
      }
      else if(parseInt(msg.content.split(" ")[1]) < 0 || parseInt(msg.content.split(" ")[1]) >= guild.matches.length){
        msg.channel.send("Não existe partida com este índice.")
      }
      else{
        updateGuild({id: guild.id}, {$pull: {matches: guild.matches[parseInt(msg.content.split(" ")[1])] }})
        msg.channel.send("Partida cancelada com sucesso. Tome cuidado pois o índice de outras partidas pode ter sido afetado. Para verificar o índice das partidas, use $tretas.");
      }
    }
    else{
      msg.reply("você não tem autorização para fazer isto. Em caso de partida problemática, mencione um MM Curator.");
    }
  }
  else if(msg.content === "$tretas"){
    strings = [];
    guild.matches.forEach((element, index, array) => {
      strings.push(`${index} - ${msg.guild.members.resolve(element[0].id).user.tag} VS. ${msg.guild.members.resolve(element[1].id).user.tag}`)
    });
    msg.channel.send(`\`\`\`css
Partidas Atuais:

${strings.join("\n")}\`\`\``);
  }
  else if(msg.content.split(" ")[0] === "$s_role_set_req"){
    if(msg.mentions.roles.size < 1 || msg.content.split(" ").length > 3){
      msg.reply("o comando foi formatado de forma errada. A formatação correta é `$s_role_set_req @Role @Requisito`. Não coloque nenhum @ após @Role se quiser limpar os requisitos da role.`");
    }
    else{
    var role = guild.itens.find(e => e.roleId === msg.content.split(" ")[1].substr(3, msg.content.split(" ")[1].length -4))
    if(role){
      if(msg.mentions.roles.size < 2){
        updateGuild({id: guild.id, "itens.roleId" : msg.mentions.roles.last().id}, {$set: {"itens.$.req":  undefined}});
        msg.reply("o requisito desta role foi removido");
      }
      else{
        updateGuild({id: guild.id, "itens.roleId" :  msg.content.split(" ")[1].substr(3, msg.content.split(" ")[1].length -4)}, {$set: {"itens.$.req" : msg.content.split(" ")[2].substr(3, msg.content.split(" ")[2].length -4)}});
        msg.reply("o requisito desta role foi definido.");
      }
    }
    else{
      msg.reply("esta role não foi encontrada na loja.");
    }
  }
  }
  else if(msg.content.split(" ")[0] === "$s_item_set_req" || msg.content.split(" ")[0] === "$s_item_set_req"){
    if(msg.content.split(" ").length < 2){
      msg.reply("o comando foi formatado de forma errada. A formatação correta é `$s_item_set_req id @Requisito`. Não coloque nenhum @ após 'id' se quiser limpar os requisitos da role.`");
    }
    else if(!(parseInt(msg.content.split(" ")[1]) > 0)){
      msg.reply("o ID inserido é inválido. O ID deve ser um número inteiro maior que 0.");
    }
    else{
      var item = guild.itens.find(e => e.id === parseInt(msg.content.split(" ")[1]));
      if(item){
        if(msg.mentions.roles.size < 1){
          updateGuild({id: guild.id, "itens.id" : parseInt(msg.content.split(" ")[1])}, {$set: {"itens.$.req":  undefined}});
          msg.reply("o requisito deste item foi removido");
        }
        else{
          updateGuild({id: guild.id, "itens.id" : parseInt(msg.content.split(" ")[1])}, {$set: {"itens.$.req":  msg.mentions.roles.first().id}});
          msg.reply("o requisito deste item foi definido.");
        }
      }
      else{
        msg.reply("este item não foi encontrado na loja."); 
      }
    }
  }
  else if(msg.content.split(" ")[0] === "$balset"){
    if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
    if(msg.mentions.users.size > 0){
      if(parseInt(msg.content.split(" ")[1]) >= 0){
        var playerIndex = guild.players.findIndex(element => element.id === msg.mentions.users.first().id);
        if(playerIndex !== -1){
          updateGuild({id: guild.id, "players.id" : msg.mentions.users.first().id}, {$set : {"players.$.money" : msg.content.split(" ")[1]}});
          msg.reply("você mudou a quantidade de moedas deste usuário com sucesso!")
        }
        else{
          msg.reply("este jogador não está registrado na ladder.");
        }
      }
      else{
        msg.reply("O comando está formatado de forma errada. A formatação certa é `$balset moedas @Jogador`. O número de moedas deve ser maior ou igual a 0.")
      }
    }
    else{
      msg.reply("O comando está formatado de forma errada. A formatação certa é `$balset moedas @Jogador`");
    }
    }
    else{
      msg.reply("você não tem permissão para fazer isto.");
    }
  }
  else if(msg.content.split(" ")[0] === "$basecoins"){
    if(msg.content.split(" ").length < 2){
      msg.reply(`a quantidade base de moedas ganhas após uma partida é ${guild.basecoins}.`);
    }
    else if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(parseInt(msg.content.split(" ")[1]) >= 0){
        updateGuild({id: guild.id}, {$set: {basecoins: parseInt(msg.content.split(" ")[1])}});
        msg.reply(`a quantidade base de moedas ganhas após uma partida foi atualizada.`);
      }
      else{
        msg.reply("o número de moedas inserido é inválido. Ele deve ser um número inteiro maior que 0. ");
      }
    }
    else{
      msg.reply("você não tem permissão para fazer isso.");
    }
  }
  else if(msg.content.split(" ")[0] === "$wincoins"){
    if(msg.content.split(" ").length < 2){
      msg.reply(`a quantidade de moedas ganhas por jogo ganho após uma partida é ${guild.wincoins}.`);
    }
    else if(msg.guild.members.resolve(msg.author.id).roles.exists("name", "MM Curator")){
      if(parseInt(msg.content.split(" ")[1]) >= 0){
        updateGuild({id: guild.id}, {$set: {wincoins: parseInt(msg.content.split(" ")[1])}});
        msg.reply(`a quantidade de moedas ganhas por jogo ganho após uma partida foi atualizada.`); 
      }
      else{
        msg.reply("o número de moedas inserido é inválido. Ele deve ser um número inteiro maior ou igual a 0. ");
      }
    }
    else{
      msg.reply("você não tem permissão para fazer isso.");
    }
  }
  else if(msg.content.split(" ")[1] === "$matches" || msg.content.split(" ")[0] === "$partidas"){

    if(msg.mentions.users.size > 0){

      var playerIndex = guild.players.findIndex(element => element.id === msg.mentions.users.first().id);

      if(playerIndex !== -1){

        var matchCount = guild.players[playerIndex].matches.length;

        var regexNumber = /^[0-9]+$/

        var strings = [];

        if(msg.content.split(" ").length < 3){

        for(var i = 0; i < (matchCount < 10? matchCount:10); i++){

          let playerScore = guild.players[playerIndex].matches[i].player_score;

          let opponentScore = guild.players[playerIndex].matches[i].opponent_score

          strings.push(`${i+1} - VS.${guild.players[playerIndex].matches[i].opponent} // Resultado: ${playerScore} - ${opponentScore} (${playerScore > opponentScore?"W":"L"}) // Data: ${guild.players[playerIndex].matches[i].date}`);
      
        }

        msg.channel.send(`\`\`\`css
Partidas de ${msg.mentions.users.first().tag}:
Página 1 de ${(Math.ceil(guild.players[playerIndex].matches.length/10))}
${strings.join("\n")}
Use $matches x para ver a página x.\`\`\``);

    }

      else if(regexNumber.test(msg.content.split(" ")[1])){

        var page = parseInt(msg.content.split(" ")[1])
        var pages = (Math.ceil(guild.players[playerIndex].matches.length/10));
        var counterLimit = matchCount - (10 * page) < 10 ? matchCount - (10 * page) : 10;
        if(page > pages){
          msg.reply(`O número da página escolhida é muito alto. O número de páginas deste usuário é ${pages}.`);
        }

        else{
          for(var i = 0; i < counterLimit; i++){

          console.log(guild.players[playerIndex].matches);

          let playerScore = guild.players[playerIndex].matches[10*(page - 1) + i].player_score;

          let opponentScore = guild.players[playerIndex].matches[10*(page - 1) + i].opponent_score

          strings.push(`${(10 * (page -1)) + i+1} - VS.${guild.players[playerIndex].matches[10*(page - 1) + i].opponent} // Resultado: ${playerScore} - ${opponentScore} (${playerScore > opponentScore?"W":"L"}) // Data: ${guild.players[playerIndex].matches[10*(page - 1) + i].date}`);
        
          }

          msg.channel.send(`\`\`\`css
Partidas de ${msg.mentions.users.first().tag}:
Página ${page} de ${pages}
${strings.join("\n")}
Use $matches x para ver a página x.\`\`\``);

        }
      }
      else{
        msg.reply("o comando foi formatado de forma errada. A formatação certa é: `$matches [pagina] [@Jogador]`");
      }
   
  }
    else{

      msg.reply("O perfil desta pessoa não foi encontrado na Ladder.");

    }
    }

    else{
    var playerIndex = guild.players.findIndex(element => element.id === msg.author.id);

    if(playerIndex !== -1){

      var matchCount = guild.players[playerIndex].matches.length;

      var regexNumber = /^[0-9]+$/

      var strings = [];

      if(msg.content.split(" ").length < 2){

      for(var i = 0; i < (matchCount < 10? matchCount:10); i++){

        let playerScore = guild.players[playerIndex].matches[i].player_score;

        let opponentScore = guild.players[playerIndex].matches[i].opponent_score

        strings.push(`${i+1} - VS.${guild.players[playerIndex].matches[i].opponent} // Resultado: ${playerScore} - ${opponentScore} (${playerScore > opponentScore?"W":"L"}) // Data: ${guild.players[playerIndex].matches[i].date}`);
      
      }

        msg.channel.send(`\`\`\`css
Suas Partidas:
Página 1 de ${(Math.ceil(guild.players[playerIndex].matches.length/10))}
${strings.join("\n")}
Use $matches x para ver a página x.\`\`\``);

    }

      else if(regexNumber.test(msg.content.split(" ")[1])){

        var page = parseInt(msg.content.split(" ")[1])
        var pages = (Math.ceil(guild.players[playerIndex].matches.length/10));
        var counterLimit = matchCount - (10 * page) < 10 ? matchCount - (10 * page) : 10;
        if(page > pages){
          msg.reply(`O número da página escolhida é muito alto. O número de páginas deste usuário é ${pages}.`);
        }

        else{
          for(var i = 0; i < counterLimit; i++){

          console.log(guild.players[playerIndex].matches);

          let playerScore = guild.players[playerIndex].matches[10*(page - 1) + i].player_score;

          let opponentScore = guild.players[playerIndex].matches[10*(page - 1) + i].opponent_score

          strings.push(`${(10 * (page -1)) + i+1} - VS.${guild.players[playerIndex].matches[10*(page - 1) + i].opponent} // Resultado: ${playerScore} - ${opponentScore} (${playerScore > opponentScore?"W":"L"}) // Data: ${guild.players[playerIndex].matches[10*(page - 1) + i].date}`);
        
          }

          msg.channel.send(`\`\`\`css
Suas Partidas:
Página ${page} de ${pages}
${strings.join("\n")}
Use $matches x para ver a página x.\`\`\``);

        }
      }
      else{
        msg.reply("o comando foi formatado de forma errada. A formatação certa é: `$matches [pagina] [@Jogador]`");
      }
   
  }
    else{

      msg.reply(" seu perfil não foi encontrado na ladder... (tente usar $sub para se registrar). Você ainda pode ver o perfil de outros jogadores usando `$rate @jogador`");

    }
  }
  }
  else if(msg.content === "$qcount" || msg.content === "$cfila"){
    msg.channel.send(`A fila de matchmaking atualmente tem ${guild.queue.length} pessoas.`);
  }
  //entrar no queue
  else if(msg.content === "$queue" || msg.content === "$q" || msg.content === "$fila"){

    var senderIndex = guild.players.findIndex(element => element.id === msg.author.id);
    var queueIndex = guild.queue.findIndex(element => element === msg.author.id);
    var matchIndex = guild.matches.findIndex(element => element[0].id === msg.author.id || element[1].id === msg.author.id);

    if (senderIndex !== -1 && matchIndex === -1 && queueIndex === -1){
        updateGuild({id: guild.id}, {$push: {queue: msg.author.id}});
        msg.channel.send("Você entrou na fila de matchmaking com sucesso (preste atenção nas suas mentions.)! Lembre-se que todas as partidas devem ser Bo5.");
        msg.delete();
    }
    else if(senderIndex==-1){

        msg.channel.send("Você não está registrado na Ladder! Use `$sub` para se registrar.")
        msg.delete();

      }
    else if(queueIndex !== -1){
      msg.channel.send("Você já está na fila!");
      msg.delete();
    }
    else{
        msg.channel.send("Não é possível entrar na fila enquanto você ainda está em uma partida.");
        msg.delete();
      }
    }
  //sair da queue

  else if(msg.content === "$unq" || msg.content === "$sair" ){

    if(guild.players.findIndex(element => element.id === msg.author.id) !== -1){

      var senderIndex = guild.queue.findIndex(element => element === msg.author.id);

      if(senderIndex === -1){
        msg.channel.send("Você não está na fila de matchmaking! Use $queue para entrar.");
        msg.delete();
      }
     else{
        updateGuild({id: guild.id}, {$pull: {queue: msg.author.id}});
        msg.channel.send("Você saiu da fila com sucesso.");
        msg.delete();
      }
    }

    else
    {

      msg.reply(" seu perfil não foi encontrado na ladder... (tente usar $sub para se registrar)");

    }
  }
  
  else if(msg.content.split(" ")[0] === "$buy" | msg.content.split(" ")[0] === "$comprar"){
    var senderIndex = guild.players.findIndex(element => element.id === msg.author.id);
    if(senderIndex < 0){
      msg.reply("você não está registrado na Ladder! Use `$sub` para se registrar.");
      return;
    }
    if(msg.content.split(" ").size < 2){
      msg.reply("para comprar algo, use `$buy|$comprar ID|@Role`");
    }
    else if(msg.mentions.roles.size > 0){
      var role = guild.itens.find(element => element.roleId === msg.mentions.roles.first().id)
      if(role){
        if(role.req){
          if(!msg.member.roles.has(role.req)){
          msg.reply(`você não tem a role @${msg.guild.roles.find(e => e.id === role.req).name}, que é necessária para comprar esta role.`);
          return;
          }
        }
        if(role.price > guild.players[senderIndex].money){
          msg.reply(`você não tem dinheiro o bastante para comprar esta role. Esta role custa ${role.price} moedas, mas você só tem ${guild.players[senderIndex].money} moedas`);
        }
        else{
          if(!msg.guild.members.resolve(guild.players[senderIndex].id).roles.find(element => element.id === role.roleId)){
          msg.guild.members.resolve(guild.players[senderIndex].id).addRole(role.roleId);
          updateGuild({id: guild.id, "players.id" : guild.players[senderIndex].id},{$set: {"players.$.money" :guild.players[senderIndex].money - role.price}});
          guild.players[senderIndex].money -= role.price;
          msg.reply(`você comprou esta role com sucesso! Você tem ${guild.players[senderIndex].money} moedas restantes`)
          }
          else{
          msg.reply("você já tem esta role!");
          }
        }
      }
      else{
        msg.reply("desculpe, esta role não está disponível para compra.");
      }
      msg.delete();
    }
    else if(parseInt(msg.content.split(" ")[1]) > 0 ){
      var item = guild.itens.find(element => element.id === parseInt(msg.content.split(" ")[1]));
      if(item){
        if(item.req){
          if(!msg.member.roles.has(item.req)){
          msg.reply(`você não tem a role @${msg.guild.roles.find(e => e.id === item.req).name}, que é necessária para comprar este item.`);
          return;
          }
        }
        if(item.type === "item"){
          if(item.price > guild.players[senderIndex].money){
            msg.reply(`você não tem moedas o bastante para comprar esta mensagem. Esta mensagem custa ${item.price} moedas, mas você só tem ${guild.players[senderIndex].money} moedas`);
          }
          else{
            var entryIndex = guild.players[senderIndex].inv.findIndex(element => element.id === item.id)
            if(entryIndex !== -1){
              guild.players[senderIndex].inv[entryIndex].count++;
              updateGuild({id: guild.id, "players.id": msg.author.id}, {$set: { "players.$.inv":  guild.players[senderIndex].inv}});//FAAALTA FAZER TUDO DPS DISSO.
            }
            else{
              updateGuild({id: guild.id, "players.id": msg.author.id}, {$push: {"players.$.inv" : {id: item.id, count: 1}}});
            }
            updateGuild({id: guild.id, "players.id" : guild.players[senderIndex].id},{$set: {"players.$.money" :guild.players[senderIndex].money - item.price}});
            guild.players[senderIndex].money -= item.price;
            msg.reply(`você comprou ${item.name} com sucesso! Você ainda tem ${guild.players[senderIndex].money} moedas em sua carteira.`);
          }
        }
        else if(item.type === "msg"){
          if(item.price > guild.players[senderIndex].money){
            msg.reply(`você não tem moedas o bastante para comprar esta mensagem. Esta mensagem custa ${item.price} moedas, mas você só tem ${guild.players[senderIndex].money} moedas`);
          }
          else{
            msg.guild.channels.get(item.channelId).send(item.content.replace("<&pName>",msg.author.toString()));
            updateGuild({id: guild.id, "players.id" : guild.players[senderIndex].id},{$set: {"players.$.money" :guild.players[senderIndex].money - item.price}});
            guild.players[senderIndex].money -= item.price;
            msg.channel.send(`Mensagem enviada com sucesso! Você tem ${guild.players[senderIndex].money} moedas agora.`);
          }
        }
      }
      else{
        msg.reply("não existe um item com este ID.");
      }
    }
    else{
      msg.reply("para comprar algo, use `$buy|$comprar ID|@Role`. O ID deve ser um número inteiro e maior que 0.");
    }
  }

  else if(msg.content.split(" ")[0] === "$detail" | msg.content.split(" ")[0] === "$detalhar"){
    if(!parseInt(msg.content.split(" ")[1]) || parseInt(msg.content.split(" ")[1]) < 1){
      msg.reply("o comando foi formatado de forma errada. O formato certo é `$detail|detalhar ID`.");
    }
    var item = guild.itens.find(element => element.id === parseInt(msg.content.split(" ")[1]));
    if(!item){
      msg.reply("não existe nenhum item com este ID.");
    }
    else{
      if(item.type === "msg"){
        msg.channel.send(`\`\`\`json
${item.content.replace("<&pName>", "{nome}")}
\`\`\`
Preço: ${item.price}
Canal: <#${item.channelId}>`)
      }
      else if(item.type === "item"){
        msg.channel.send(`Nome: ${item.name}
Descrição:\`\`\`json
${item.desc.replace("<&pName>", "{nome}")}
\`\`\`
Preço: ${item.price}`)
      }
    }
  }
  else if(msg.content === "$shop" || msg.content === "$loja"){
    msg.reply("para ver os itens, roles, e mensagens disponíveis para compra use `$shop/$loja itens|roles|msgs página`");
  }

  else if(msg.content.split(" ")[0] === "$shop" || msg.content.split(" ")[0] === "$loja"){
    var page = parseInt(msg.content.split(" ")[2]);
    if(!page || page < 1){
      page = 1;
    }

    if(msg.content.split(" ")[1] === "roles"){
      var roles = guild.itens.filter(item => item.type === "role");
      var roleCount = roles.length;
      var pages = Math.ceil(roleCount/10);
      if(page > pages){
        msg.reply(`a página escolhida é muito alta. Só existem ${pages} páginas de roles no momento.`);
      }
      else{
      var counterLimit = roleCount - (10 * (page-1)) < 10 ? roleCount - (10 * (page-1)) : 10;
      var msgContent = "";
      for(var i = 0; i < counterLimit ; i++){
        var entry = i + (page-1)*10;
        msgContent += `@${msg.guild.roles.get(roles[entry].roleId).name} - ${roles[entry].price} Moedas\n`;
      }
      msg.channel.send(`\`\`\`json
Roles - Página ${page} de ${pages}

${msgContent}
\`\`\``);
      }
    }

    else if(msg.content.split(" ")[1] === "msgs"){
      var msgs = guild.itens.filter(item => item.type === "msg");
      var msgCount = msgs.length;
      var pages = Math.ceil(msgCount/10);
      if(page > pages){
        msg.reply(`a página escolhida é muito alta. Só existem ${pages} páginas de mensagens no momento.`);
      }
      else{
        var counterLimit = msgCount - (10 * (page-1)) < 10 ? msgCount - (10 * (page-1)) : 10;
      var msgContent = "";
      for(var i = 0; i < counterLimit ; i++){
        var entry = i + (page-1)*10;
        msgContent += `ID: ${msgs[entry].id} - ${msgs[entry].desc} - ${msgs[entry].price} Moedas\n`;
      }
      msg.channel.send(`\`\`\`json
Mensagens - Página ${page} de ${pages}

${msgContent}
Use $detail|$detalhar ID para ver o conteúdo da mensagem.
\`\`\``);
      }
    }
    else if(msg.content.split(" ")[1] === "itens"){
      var itens = guild.itens.filter(item => item.type === "item");
      var itemCount = itens.length;
      var pages = Math.ceil(itemCount/10);
      if(page > pages){
        msg.reply(`a página escolhida é muito alta. Só existem ${pages} páginas de itens no momento.`);
      }
      else{
        var counterLimit = itemCount - (10 * (page-1)) < 10 ? itemCount - (10 * (page-1)) : 10;
      var msgContent = "";
      for(var i = 0; i < counterLimit ; i++){
        var entry = i + (page-1)*10;
        msgContent += `ID: ${itens[entry].id} - ${itens[entry].name} - ${itens[entry].price} Moedas\n`;
      }
      msg.channel.send(`\`\`\`json
Itens - Página ${page} de ${pages}

${msgContent}
Use $detail|$detalhar ID para ver a descrição do item.
\`\`\``);
      }
    }
    else{
      msg.reply("para ver os itens, roles, e mensagens disponíveis para compra use `$shop/$loja itens|roles|msgs`");
    }
  }
  

 //#region aceitar partida  de matchmaking
  else if(msg.content === "$accept" || msg.content === "$a" || msg.content === "$aceitar"){

    var senderIndex = guild.matches.findIndex(element => element[0].id === msg.author.id || element[1].id === msg.author.id);

    if(senderIndex === -1){

       msg.reply("você não tem nenhuma partida pendente! Use $queue para entrar na fila de matchmaking. Use $unq se você já está na fila e deseja sair");
      
    }

    else
    {
      var playerIndex = guild.matches[senderIndex].findIndex(element => element.id === msg.author.id)

      if(guild.matches[senderIndex][0].accepted&&guild.matches[senderIndex][1].accepted){

        msg.reply("sua partida já está em progresso!");

      }
      else if(guild.matches[senderIndex][playerIndex].accepted)
      {

        msg.reply("você já aceitou sua partida! Espere seu oponente aceitar a partida.");

      }
      else
      {

        if(guild.matches[senderIndex][(playerIndex===0?1:0)].accepted){
          var matchCopy = JSON.parse(JSON.stringify(guild.matches[senderIndex]));
          guild.matches[senderIndex][playerIndex].accepted= true;
          updateGuild({id: guild.id, matches : matchCopy}, {$set: {"matches.$" : guild.matches[senderIndex]}});
          var timeout = timeouts.find(e => e.timestamp === guild.matches[senderIndex][2]);
          if(timeout){
            clearTimeout(timeout.timeout); 
            timeouts.splice(timeouts.findIndex(e => e.timestamp === timeout.timestamp), 1);
          }
          client.guilds.get(guild.id).channels.find('name', 'ladder-bot').send(`Todos os participantes estão prontos! A partida Bo5 entre <@${guild.matches[senderIndex][0].id}> e <@${guild.matches[senderIndex][1].id}> começa agora! Use $score x-y (X -> Pontuação de <@${guild.matches[senderIndex][0].id}> ; Y -> Pontuação de <@${guild.matches[senderIndex][1].id}>) após a partida e $confirm para confirmar a pontuação reportada para encerrar a partida.`);
        }
        else{
          var matchCopy = JSON.parse(JSON.stringify(guild.matches[senderIndex]));
          guild.matches[senderIndex][playerIndex].accepted= true;
          updateGuild({id: guild.id, matches : matchCopy}, {$set: {"matches.$" : guild.matches[senderIndex]}}); 
          msg.reply("Partida aceita com sucesso! Espere seu oponente aceitá-la também. Uma mention será feita no servidor quando sua partida estiver pronta.");
        }

      }

        
      }
  }
    //#endregion

    //#region reportar score
    else if(msg.content.split(" ")[0] === "$score" || msg.content.split(" ")[0] === "$pts" ){
      var senderIndex = guild.matches.findIndex(element => element[0].id === msg.author.id || element[1].id === msg.author.id);

    if(senderIndex === -1){

      msg.reply("você não esta nenhuma partida ! Use $queue para entrar na fila de matchmaking. Use $unq se você já está na fila e deseja sair");
      return;

    }
    else if(!(guild.matches[senderIndex][0].accepted&&guild.matches[senderIndex][1].accepted)){

      msg.reply("sua partida ainda não começou!");

    }
    else{


      try{

        var playerIndex = guild.matches[senderIndex].findIndex(element => element.id === msg.author.id);
        var reportStrings = msg.content.split(" ")[1].split("-");
        reported_score = [parseInt(reportStrings[0]), parseInt(reportStrings[1])];
        var regex = /[0-9]+-[0-9]+/
        var isValid = regex.test(msg.content.split(" ")[1]);
        if(reported_score[0] === (NaN) || reported_score[1] === (NaN) || !isValid){
          throw 45;
        }
        if(reported_score[0] == 3){
          if(reported_score[1] > 2){
            msg.reply("a pontuação enviada é inválida. A partida deve ser Bo5 (Melhor de 5 partidas). Exemplos Válidos: 3-0, 3-2, 3-1. Exemplos Inválidos: 3-3, 2-2, 2-1, 5-3");
            return;
          }
        }
        else if(reported_score[1] == 3){
          if(reported_score[0] > 2){
            msg.reply("a pontuação enviada é inválida. A partida deve ser Bo5 (Melhor de 5 partidas). Exemplos Válidos: 3-0, 3-2, 3-1. Exemplos Inválidos: 3-3, 2-2, 2-1, 5-3");
            return;
          }
        }
        else{
          msg.reply("a pontuação enviada é inválida. A partida deve ser Bo5 (Melhor de 5 partidas). Exemplos Válidos: 3-0, 3-2, 3-1. Exemplos Inválidos: 3-3, 2-2, 2-1, 5-3");
          return;
        }
        var matchCopy = JSON.parse(JSON.stringify(guild.matches[senderIndex]));
        guild.matches[senderIndex][playerIndex].reported_score = reported_score;
        updateGuild({id: guild.id, "matches" : matchCopy}, {$set: {"matches.$" : guild.matches[senderIndex]}}); 
        msg.reply(`a pontuação da sua partida com <@${guild.matches[senderIndex][playerIndex === 0? 1:0].id}> foi enviada com sucesso. O seu oponente deve usar $confirm para confirmar apontuação enviada por você. Alternativamente, você pode usar $confirm para confirmar a pontuação enviada por seu oponente.`);
      }

      catch(e){

        if(e === 45){
          var username1 = msg.guild.members.resolve(guild.matches[senderIndex][0].id).user.tag;
          var username2 = msg.guild.members.resolve(guild.matches[senderIndex][1].id).user.tag;
          msg.reply(`a formatação do comando está errada. A formatação correta é: \`$score (Pontuação de ${username1})\`-(Pontuação de ${username2}). Exemplo: \`$score 2-1\``);
        }

      }

    }
    
    }
    //#endregion
    //#region comfirmar score
    else if(msg.content === "$confirm" || msg.content === "$confirmar" || msg.content === "$c"){
      var senderIndex = guild.matches.findIndex(element => element[0].id === msg.author.id || element[1].id === msg.author.id);

      if(senderIndex === -1){
  
        msg.reply("você não esta nenhuma partida ! Use $queue para entrar na fila de matchmaking. Use $unq se você já está na fila e deseja sair");
        return;
      }
      else if(!(guild.matches[senderIndex][0].accepted && guild.matches[senderIndex][1].accepted)){
        msg.reply("sua partida ainda não começou!");
        return;
      }
      else{
        var playerIndex = guild.matches[senderIndex].findIndex(element => element.id === msg.author.id);

        var reported_score = guild.matches[senderIndex][playerIndex===0?1:0].reported_score;

        if(reported_score[0]+1 && reported_score[1]+1){
          var player0Index = guild.players.findIndex(element => element.id === guild.matches[senderIndex][0].id);
          var player0 = JSON.parse(JSON.stringify(guild.players[player0Index]));
          var player1Index = guild.players.findIndex(element => element.id === guild.matches[senderIndex][1].id);
          var player1 = JSON.parse(JSON.stringify(guild.players[player1Index]));

          player0.s = reported_score[1];

          player1.s = reported_score[0];

          var updated0 = glicko.calc(player0, [player1]).update;

          var updated1 = glicko.calc(player1, [player0]).update;

          guild.players[player0Index].rating = updated0.rating;
          guild.players[player0Index].rd = updated0.rd;
          guild.players[player0Index].vol = updated0.vol;

          guild.players[player1Index].rating = updated1.rating;
          guild.players[player1Index].rd = updated1.rd;
          guild.players[player1Index].vol = updated1.vol;

          var p0Money = guild.basecoins + reported_score[0]*guild.wincoins;
          var p1Money = guild.basecoins + reported_score[1]*guild.wincoins;

          if(reported_score[0] > reported_score[1]){
            guild.players[player0Index].wins++;
            guild.players[player1Index].losses++;
          } 
          else if(reported_score[0] < reported_score[1]){
            guild.players[player1Index].wins++;
            guild.players[player0Index].losses++;
          }
          else{
            guild.players[player1Index].draws++;
            guild.players[player0Index].draws++;
          }

          guild.players[player0Index].money += p0Money;
          guild.players[player1Index].money += p1Money;

          guild.players[player0Index].matches.push({
            opponent:  msg.guild.members.resolve(guild.players[player1Index].id).user.tag,
            player_score: reported_score[0],
            opponent_score: reported_score[1],
            date: Date.now()
          });

          guild.players[player1Index].matches.push({
            opponent: msg.guild.members.resolve(guild.players[player0Index].id).user.tag,
            player_score: reported_score[1],
            opponent_score: reported_score[0],
            date: Date.now()
          });
          
          updateGuild({id: guild.id, "players.id":guild.players[player0Index].id},{$set: {"players.$" : guild.players[player0Index]}})
          updateGuild({id: guild.id, "players.id":guild.players[player1Index].id},{$set: {"players.$" : guild.players[player1Index]}})
          updateGuild({id: guild.id}, {$pull: {"matches" : guild.matches[senderIndex]}}); 

          msg.reply(`a pontuação da sua partida contra <@${guild.matches[senderIndex][playerIndex===0?1:0].id}> foi enviada com sucesso. Os dois participantes podem ver seus rankings atualizados com o comando $rate.`);
          msg.channel.send(`<@${guild.players[player0Index].id}>, você ganhou ${p0Money} moedas! Veja sua carteira atual com $balance.`);
          msg.channel.send(`<@${guild.players[player1Index].id}>, você ganhou ${p1Money} moedas! Veja sua carteira atual com $balance.`);

          
        }
        else{
          var username1 = msg.guild.members.resolve(guild.matches[senderIndex][0].id).user.tag;
          var username2 = msg.guild.members.resolve(guild.matches[senderIndex][1].id).user.tag;
          msg.reply(`seu oponente ainda não enviou uma pontuação. Use \`$score ${username1}-${username2}\` para enviar uma pontuação.`);
        }
      }
  }
  //#endregion
}

client.login('token');
//funçoes helper
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
  }
}
//#region watchers
const queueWatcher = setInterval(() => {

    MongoClient.connect(url, (err, dbClient) => {
    if (err) throw err;
    var db = dbClient.db('MMDB');
    db.collection('guilds').find({}).toArray((err, guilds) => {
      if (err) throw err;
      guilds.forEach(
        (guild) => {
    
        if(guild.queue.length >= 2){
    
          var matchQuequeQuantity = Math.floor(guild.queue.length/2);
    
          shuffleArray(guild.queue);
    
          for(var i = 0; i < matchQuequeQuantity; i++){
          
            var match = [{id:guild.queue[i*2], accepted: false, reported_score: [undefined,undefined]}, {id:guild.queue[i*2+1], accepted:false, reported_score: [undefined,undefined]}] 
            var timeout = {timestamp: Date.now(), timeout: setTimeout( function (){
              MongoClient.connect(url, (err, dbClient) => {
              if (err) throw err;
              var db = dbClient.db('MMDB');
              db.collection('guilds').find({id: guild.id}).toArray((err, guilds) => {
              if (err) throw err;
              var match = guilds[0].matches.find(e => e[2] === timeout.timestamp)
              if(match[0].accepted&&match[1].accepted){
                return;
              }
              else{
                var player0Index = guild.players.findIndex(element => element.id === match[0].id);
                var player0 = JSON.parse(JSON.stringify(guild.players[player0Index]));
                var player1Index = guild.players.findIndex(element => element.id === match[1].id);
                var player1 = JSON.parse(JSON.stringify(guild.players[player1Index]));
            
                player0.s = 0;
            
                player1.s = 0;
            
                if(!match[0].accepted){
            
                  var updated0 = glicko.calc(player0, [player1]).update;
            
                  guild.players[player0Index].rating = updated0.rating;
                  guild.players[player0Index].rd = updated0.rd;
                  guild.players[player0Index].vol = updated0.vol;
            
                }
                if(!match[1].accepted){
                  var updated1 = glicko.calc(player1, [player0]).update;
            
                  guild.players[player1Index].rating = updated1.rating;
                  guild.players[player1Index].rd = updated1.rd;
                  guild.players[player1Index].vol = updated1.vol;
            
                }
            
                updateGuild({id: guild.id}, {$pull: {"matches" : match}});
                updateGuild({id: guild.id, "players.id":guild.players[player0Index].id},{$set: {"players.$" : guild.players[player0Index]}})
                updateGuild({id: guild.id, "players.id":guild.players[player1Index].id},{$set: {"players.$" : guild.players[player1Index]}})
            
                try{
                client.guilds.get(guild.id).channels.find('name', 'ladder-bot').send(`A partida entre <@${match[0].id}> VS <@${match[1].id}> foi cancelada, pois algum dos jogadores não aceitou a partida a tempo. Os jogadores que não aceitaram a partida foram punidos.`);
                  }
                  catch{
                    client.guilds.get(guild.id).owner.send("O canal '#ladder-bot' não foi encontrado no servidor, e ele é necessário para o funcionamento do bot. Por favor, verifique a visibilidade do canal para o bot e a existência do mesmo. Para qualquer pergunta, contate @xdre#1888.");
                  }
              }})
              })} ,60000)}
            timeouts.push(timeout);
            match.push(JSON.parse(JSON.stringify(timeout.timestamp)));
            updateGuild({id: guild.id}, {$push: {matches: match}});
            console.log(timeouts);
            try{
            client.guilds.get(guild.id).channels.find('name', 'ladder-bot').send(`Uma partida foi encontrada! <@${guild.queue[i*2]}> VS <@${guild.queue[i*2+1]}> ! A partida começará após os dois usarem o comando $accept. Se algum dos jogadores não aceitarem a partida em 1 minuto, a partida será cancelada e os jogadores que não aceitarem serão punidos. Preste atenção nas suas mentions!`);
            client.guilds.get(guild.id).members.get(guild.queue[i*2]).user.send(`x1? Foi encontrada uma partida para você no servidor ${client.guilds.get(guild.id).name}. Você tem 1 minuto para aceitar a partida.`)
            client.guilds.get(guild.id).members.get(guild.queue[i*2 + 1]).user.send(`x1? Foi encontrada uma partida para você no servidor ${client.guilds.get(guild.id).name}. Você tem 1 minuto para aceitar a partida.`)
            }
            catch{
              client.guilds.get(guild.id).owner.send("O canal '#ladder-bot' não foi encontrado no servidor, e ele é necessário para o funcionamento do bot. Por favor, verifique a visibilidade do canal para o bot e a existência do mesmo. Para qualquer pergunta, contate xdre#1888.");
            }
            
          }
          for(var i = 0; i < matchQuequeQuantity*2; i++){
    
           updateGuild({id: guild.id}, {$pull: {queue: guild.queue[i]}});
    
          }
    
        }
        
      }) 
    })
  
    
  })}, 5000);

const backupWatcher = setInterval( writeGuildsBackup, 18000000)
//#endregion
