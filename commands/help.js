// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, prefix, embed) => {
	if (!args[1]) {
		const genArr = [], ticketArr = [];
		client.cmdhelp.filter((cmd) => cmd.category === 'General').forEach((cmd) => genArr.push(cmd.name));
		client.cmdhelp.filter((cmd) => cmd.category === 'Tickets').forEach((cmd) => ticketArr.push(cmd.name));
		embed.setTitle('Commands');
		embed.addField('General', `\`${genArr.join('`, `')}\``, true);
		embed.addField('Tickets', `\`${ticketArr.join('`, `')}\``, true);
		return message.channel.send(embed);
	} else {
		let info = {};
		client.cmdhelp.filter((cmd) => cmd.name === args[1].toLowerCase()).forEach((cmd) => info = cmd);
		if (!info['name']) return message.channel.send('Enter a valid command');
		embed.setTitle(`Info about ${info['name']}`);
		embed.addField('Description :', info['description']);
		embed.addField('Usage :', info['usage']);
		return message.channel.send(embed);
	}
};


exports.help = {
	name: 'help',
	category: 'General',
	description: 'Get help',
	usage: 'help [command]',
};