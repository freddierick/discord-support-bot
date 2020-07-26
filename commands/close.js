// eslint-disable-next-line no-unused-vars
module.exports.run = async (client, message, args, prefix, embed) => {
	if (message.channel.name.includes('-modmail')) {
		const memberID = await client.modmails.get(message.channel.id);
		const member = message.guild.members.cache.get(memberID);
		if (member) {
			embed.setAuthor('');
			embed.setFooter('');
			embed.setDescription('Your ModMail ticket is closed!');
			member.send(embed);
		}
		client.modmails.delete(message.channel.id);
		client.modmails.delete(memberID);
		return message.channel.delete();
	} else if (message.channel.name.includes('-ticket')) {
		const memberID = await client.tickets.get(message.channel.id);
		client.tickets.delete(message.channel.id);
		client.tickets.delete(memberID);
		return message.channel.delete();
	} else {
		embed.setTitle('This is not a (modmail) ticket!');
		return message.channel.send(embed);
	}
};


exports.help = {
	name: 'close',
	category: 'Tickets',
	description: 'Close a ticket / modmail',
	usage: 'close [reason]',
};