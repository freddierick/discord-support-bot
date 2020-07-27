const nodeMajorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeMajorVersion < 12) {
	console.error('Unsupported NodeJS version! Please install NodeJS 12 or newer.');
	process.exit(1);
}

const fs = require('fs');
const path = require('path');

try {
	fs.accessSync(path.join(__dirname, 'node_modules'));
} catch (e) {
	console.error('Please run "npm i" or run the install.bat before starting the bot!');
	process.exit(1);
}

try {
	fs.accessSync(path.join(__dirname, 'config.json'));
} catch (e) {
	console.error('You need to rename config.example.json to config.json, and fill in the values!');
	process.exit(1);
}

try {
	fs.accessSync(path.join(__dirname, '.env'));
} catch (e) {
	console.error('You need to rename .env.example to .env, and fill in the values!');
	process.exit(1);
}

require('dotenv').config();
const config = require('./config.json');
const prefix = config.prefix || '!';
const embedColor = config.embedColor || 'RANDOM';
const confirmEmoji = config.confirmEmoji || '✅';
const ModMailCategory = config.ModMailCategory;
const TicketCategory = config.TicketCategory;
const supportRole = config.supportRole;
const serverID = config.serverID;

if(!process.env.token) {
	console.error('You need to specify the bot token in the .env file!');
	process.exit(1);
}

if(!serverID) {
	console.error('You need to specify the main server id in the config.json file!');
	process.exit(1);
}

const Discord = require('discord.js');
const db = require("quick.db");
const Keyv = require('keyv');
// const users = new Keyv('sqlite://./data/users.sqlite');
const modmails = new Keyv('sqlite://./data/modmails.sqlite');
const tickets = new Keyv('sqlite://./data/tickets.sqlite');

const Client = new Discord.Client();
// Client.users = users;
Client.modmails = modmails;
Client.tickets = tickets;
Client.ModMailCategory = ModMailCategory;
Client.TicketCategory = TicketCategory;
Client.supportRole = supportRole;
Client.commands = new Discord.Collection();
Client.cmdhelp = new Discord.Collection();

Client.findWarnReason = (name) => {
	let data = db.get("reasons");
		let temp=[];
		data.forEach(element => temp.push(element.name==(" "+name)))
        console.log(temp)
		const index=temp.indexOf(true);
		console.log(index)
		return index;
		
}

Client.loadCommands = () => {
	fs.readdir('./commands/', (err, files) => {
		if (err) console.error(err);

		const jsFiles = files.filter(f => f.split('.').pop() === 'js');

		console.log(`LOG Loading a total of ${jsFiles.length} commands.`);

		jsFiles.forEach(async (f) => {
			delete require.cache[require.resolve(`./commands/${f}`)];
			const props = require(`./commands/${f}`);
			Client.commands.set(f, props);
			Client.cmdhelp.set(props.help.name, props.help);
		});
	});
};

Client.login(process.env.token).catch(() => {
	console.error('The token you specified is invalid!');
});

Client.on('ready', () => {
	console.log(`${Client.user.tag} has started!`);
	Client.user.setActivity('DM For help!');
	Client.loadCommands();
});

Client.on('message', async message => {
	const embed = new Discord.MessageEmbed().setColor(embedColor);
	const args = message.content.slice(prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	const cmd = Client.commands.get(command + '.js');
	if (cmd && message.guild && !message.author.bot) {
		if (!message.channel.permissionsFor(message.guild.me).has('EMBED_LINKS')) return message.channel.send('I don\'t have permission to send embed messages!');
		embed.setFooter(`Do ${prefix}help [command] for usage and info about a command!`);
		embed.setAuthor(message.member.displayName, message.author.avatarURL());
		return cmd.run(Client, message, args, prefix, embed);
	}

	if (message.guild === null && !message.author.bot) {
		let active = await modmails.get(message.author.id);
		const guild = Client.guilds.cache.get(serverID);
		const avatar = await Client.getProfilePic(message.author);

		let channel = null;
		let found = true;

		try {
			if (active) channel = await Client.channels.cache.get(active.channelID);
			if (active && !channel) found = false;
		} catch (e) {
			found = false;
		}

		if (!active || !found) {
			active = {};
			channel = await guild.channels.create(`${message.author.username}-ModMail`, {
				type: 'text',
				permissionOverwrites: [
					{
						type: 'role',
						id: guild.id,
						deny: ['VIEW_CHANNEL'],
					},
					{
						type: 'member',
						id: message.author.id,
						allow: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'READ_MESSAGE_HISTORY'],
					},
				],
			}).catch(console.error);

			if (ModMailCategory) {
				const category = guild.channels.cache.find(c => c.id == ModMailCategory && c.type == 'category');
				if (category) await channel.setParent(category.id);
			}

			if (supportRole) {
				const support = guild.roles.cache.find(r => r.id == supportRole);
				if (support) await channel.createOverwrite(support, { 'VIEW_CHANNEL': true, 'SEND_MESSAGES': true, 'READ_MESSAGE_HISTORY': true });
			}

			embed
				.setAuthor(`Hello, ${message.author.tag}`, avatar)
				.setFooter('ModMail ticket created!');
			await message.author.send(embed).catch(console.error);

			active.channelID = channel.id;
			active.targetID = message.author.id;
		}

		channel = Client.channels.cache.get(active.channelID);
		channel.fetchWebhooks().then((webhooks) => {
			const foundHook = webhooks.find((webhook) => webhook.name == 'modmail');
			if (!foundHook) {
				channel.createWebhook('modmail')
					.then((webhook) => {
						webhook.send(message.content, {
							username: message.author.username,
							avatarURL: avatar,
						});
					});
			} else {
				foundHook.send(message.content, {
					username: message.author.username,
					avatarURL: avatar,
				});
			}
		});
		message.react(confirmEmoji);
		modmails.set(message.author.id, active);
		return modmails.set(channel.id, message.author.id);
	}

	let support = await modmails.get(message.channel.id);
	if (support && !message.content.startsWith(prefix) && !message.author.bot) {
		support = await modmails.get(support);
		const supportUser = Client.users.cache.get(support.targetID);
		if (!supportUser) return message.channel.delete();

		supportUser.send(message.content);

		return message.react(confirmEmoji);
	}
});

Client.getProfilePic = (user) => {
	if (user.avatar == null) {
		return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.discriminator) % 5}.png`;
	} else {
		return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
	}
};
