const db = require("quick.db");
const config = require('../config.json');
const discord = require('discord.js');
module.exports.run = async (client, message, args, prefix, embed) => {
  // db.delete("reasons")
if (!db.has("reasons")) db.set("reasons",[]);

if (args[0]==null){
if (db.get("reasons")==[]) return message.channel.send("No reasons have been made!") ;
const data = db.get("reasons");
const embed = new discord.MessageEmbed()
.setTitle("Warning Reasons:");

data.forEach(element => embed.addField(element.name,`${element.description}\n AutoMutePath:${config.mutePaths[element.autoMutePath]}`));
message.channel.send(embed);
}else{
    switch(args[0].toLowerCase()) {
        case "add":
            command=args.join(" ").replace("add","").split("-");
            //checks the mute path
            console.log(command)
            let autoMute=null
            if (command[2]){
            if (command[2]>config.mutePaths.length || command[2]<0)return message.channel.send("Thats Not a mute path!")
            autoMute=command[2];
            }
            //checks the 
            if (!command[0]) return message.channel.send("You must give your reason a name!")
            if (!command[1]) return message.channel.send("You must give your reason a description!")
            db.push("reasons",{name:command[0],description:command[1],autoMutePath:autoMute})
            message.channel.send(`i have added ${command[0]}, ${command[1]}. AutoMutePath=${autoMute}`)
          break;
        case "remove":
        console.log()
        let  arr=args.shift()
        index=client.findWarnReason(args.join(" ").replace("remove ",""));
        console.log(index)
        if (index==-1) return message.channel.send("I could not find that reason!");
        data1 = db.get("reasons");
        let data=[];
        for (let i = 0; i < db.get("reasons").length; i++) {
            if (i!=index) data.push(data1);
            ;
          }
        console.log(data)
        //db.set("reasons",data);
        return message.channel.send(`I removed ${args.join(" ").replace("remove ","")} from reasons!`)
          break;
    }
}
};


exports.help = {
	name: 'reason',
	category: 'Staff',
	description: 'Warn a user',
	usage: 'warn [user] [reason category] [auto mute path]',
};