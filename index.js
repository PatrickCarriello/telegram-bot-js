require("dotenv").config();
const fs = require("fs");
const axios = require("axios");
const TelegramBot = require("node-telegram-bot-api");
const idsList = JSON.parse(fs.readFileSync("./ids.json", "utf8"));
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const port = process.env.PORT || 3005;
let ids = idsList.ids;
let names = idsList.names;

const botToken = process.env.BOT_TOKEN;
const chatGroupID = process.env.CHATGROUP_ID;
// console.log(idsList);

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(botToken, { polling: true });

// Interação inicial
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "Olá, bem vindo(a) ao Jarvis!");
  if (isAuthorized(chatId)) {
    //   bot.sendMessage(chatId, menu);
    console.log(
      getCurrentTime() + " - " + msg.chat.first_name + " solicitou /start."
    );
    help(chatId);
  } else {
    notAuthorized(msg);
  }
});

// Menu de ajuda
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;

  if (isAuthorized(chatId)) {
    console.log(
      getCurrentTime() + " - " + msg.chat.first_name + " solicitou /help."
    );
    help(chatId);
  } else {
    notAuthorized(msg);
  }
});

// Comando echo pra testes
// apenas retorna qualquer mensagem recebida
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  //   console.log(chatId);
  if (isAuthorized(chatId)) {
    const resp = match[1];
    console.log(
      getCurrentTime() +
        " - " +
        msg.chat.first_name +
        " solicitou echo de: " +
        resp
    );
    bot.sendMessage(chatId, resp);
  } else {
    notAuthorized(msg);
  }
});

// Adiciona usuários
bot.onText(/\/add (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  // console.log(chatId);
  if (isAuthorized(chatId)) {
    const message = match[1].split(" ");
    const command = message[0];
    const id = message[1];
    const name = message[2];

    // console.log(command);
    // console.log(id);
    // console.log(name);

    if (command == "user" && id && name) {
      console.log(
        getCurrentTime() +
          " - " +
          msg.chat.first_name +
          " adicionou o usuário " +
          name +
          ", ID: " +
          id
      );
      addId(id, name);
    } else {
      bot.sendMessage(
        chatId,
        "Comando executado de forma incorreta. Ex.: /add user [id] [name]"
      );
    }
  } else {
    notAuthorized(msg);
  }
});

// Pega os últimos dados lidos pelo Arduino
bot.onText(/\/status/, async (msg, match) => {
  const chatId = msg.chat.id;
  console.log(
    getCurrentTime() + " - " + msg.chat.first_name + " solicitou /status."
  );
  if (isAuthorized(chatId)) {
    try {
      const { data } = await axios.get(
        process.env.JARVIS_ADDRESS + "data/status"
      );
      // console.log("data", data);
      let message = "";
      for (const item in data) {
        if (typeof data[item] == "object") {
          message += item + ": " + JSON.stringify(data[item]) + " \n";
        } else {
          message += item + ": " + data[item] + " \n";
        }
      }
      bot.sendMessage(chatId, message);
    } catch (error) {
      console.log(error);
      console.log(getCurrentTime() + " - Erro ao recuperar os dados atuais.");
      bot.sendMessage(chatId, "Erro ao recuperar os dados atuais.");
    }
  } else {
    notAuthorized(msg);
  }
});

// Envia comandos para o Jarvis
bot.onText(/\/command (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  // console.log(chatId);
  if (isAuthorized(chatId)) {
    const message = match[1].split(" ");
    const command = message[0];
    const what = message[1];
    // console.log("command", command);
    // console.log("what", what);

    // Comandos para o Jarvis (Arduino)
    const commands = {
      command: ["bomba", "lampada", "ventilador"],
      liga: ["bmb1", "B", "C"],
      desliga: ["bmb0", "b", "c"],
    };

    if (command && what) {
      const index = commands.command.indexOf(what);
      // console.log("index", index);

      if (Number.isInteger(index)) {
        const item = commands[command][index];
        // console.log("Item", item);

        if (item) {
          // envia o comando para o jarvis
          try {
            await axios.get(process.env.JARVIS_ADDRESS + "data/" + item);
            console.log(
              getCurrentTime() +
                " - Comando '" +
                command +
                " " +
                what +
                "' enviado para o Javis. Solicitado por " +
                msg.chat.first_name
            );
            bot.sendMessage(chatId, what + " " + command + "da com sucesso.");
          } catch (error) {
            console.log(
              getCurrentTime() +
                " - Erro ao enviar o comando '" +
                command +
                " " +
                what +
                "' para o Javis."
            );
            bot.sendMessage(chatId, "Erro ao enviar o comando para o Jarvis.");
          }
        } else {
          bot.sendMessage(chatId, "Comando inválido.");
        }
      } else {
        bot.sendMessage(chatId, "Item do comando inválido.");
      }
    } else {
      bot.sendMessage(
        chatId,
        "Comando executado de forma incorreta. Ex.: /command [liga/desliga] [o que?]"
      );
    }
  } else {
    notAuthorized(msg);
  }
});

// Qualquer mensagem recebida
bot.on("message", (msg) => {
  //   console.log(msg.chat);
  const chatId = msg.chat.id;
  //   const name = msg.chat.first_name;
  //   const lastName = msg.chat.last_name;
  //   const username = msg.chat.username;
  //   console.log("chatId", chatId);
  //   console.log("name", name);
  //   console.log("lastName", lastName);
  //   console.log("username", username);
  //   console.log("msg", msg.text);

  if (isAuthorized(chatId)) {
    // bot.sendMessage(chatId, "Olá!");
  } else {
    notAuthorized(msg);
  }
});

// Adiciona usuários autorizados a interagir com o bot
function addId(id, name) {
  const data = { ids: [...ids, parseInt(id)], names: [...names, name] };
  const jsonString = JSON.stringify(data);
  fs.writeFileSync("./ids.json", jsonString, (err) => {
    if (err) {
      console.log(getCurrentTime() + " - Erro ao salvar os dados.", err);
    } else {
      //
    }
  });
  ids.push(parseInt(id));
  names.push(name);
  //   console.log("ids", ids);
  //   console.log("names", names);
  console.log(
    getCurrentTime() +
      " - Usuário adicionado: id: " +
      id +
      ", nome: " +
      name +
      "."
  );
}

// Verifica se é um usuário autorizado
function isAuthorized(id) {
  return ids.find((element) => element === id);
}

// Envia mensagem de "não autorizado"
function notAuthorized(msg) {
  bot.sendMessage(
    msg.chat.id,
    "Você não possui autorização para utilizar este bot."
  );
  console.log(getCurrentTime() + " - Usuário não autorizado:", msg);
}

// Mensagem padrão de ajuda
function help(chatId) {
  bot.sendMessage(
    chatId,
    "/start ou /help -> Início da interação com o bot. Este menu.\n" +
      "/status -> Solicita os últimos dados registrados\n" +
      "/command [liga/desliga] [o que?]\n" +
      " [o que?]\n" +
      "  |- bomba -> bomba d'água"
  );
}

// Pega o timestamp atual formatado
function getCurrentTime() {
  const date = new Date();
  return (
    ("0" + date.getDate().toString()).slice(-2) +
    "/" +
    ("0" + (date.getMonth() + 1).toString()).slice(-2) +
    "/" +
    date.getFullYear() +
    " " +
    ("0" + date.getHours().toString()).slice(-2) +
    ":" +
    ("0" + date.getMinutes().toString()).slice(-2) +
    ":" +
    ("0" + date.getSeconds().toString()).slice(-2) +
    ":" +
    ("00" + date.getMilliseconds().toString()).slice(-3)
  );
}

// Rota GET /
app.get("/", function requestListener(req, res) {
  res.setHeader("Content-Type", "application/json");
  res.status(200).send({ message: "Telegram Jarvis bot alive!" });
});

// Rota POST /
app.post("/", (req, res) => {
  const body = req.body;
  const message = body.message;

  if (message) {
    bot.sendMessage(chatGroupID, message);
    console.log(
      getCurrentTime() + " - Mensagem recebida e enviada para o grupo:",
      message
    );
    res.setHeader("Content-Type", "application/json");
    res.status(200).send({ message: "OK" });
  }
});

// Inicia o servidor
app.listen(port, function listen() {
  console.log(`Bot Jarvis Telegram escutando em http://localhost:${port}`);
});
