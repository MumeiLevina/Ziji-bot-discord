const { useLogger } = require("@zibot/zihooks");
const { GuildQueueEvent } = require("discord-player");
const { EmbedBuilder } = require("discord.js");

module.exports = {
	name: GuildQueueEvent.Error,
	type: "Player",
	/**
	 * @param { import('discord-player').GuildQueue } queue
	 * @param { Error } error
	 */

	execute: async (queue, error) => {
		const logger = useLogger();
		queue.player.client?.errorLog("Player Error");
		queue.player.client?.errorLog(error.message);
		logger.error(`Player Error: ${error.message}`);
		logger.error(error.stack);
		
		// Gửi thông báo lỗi cho người dùng
		if (queue?.metadata?.channel) {
			try {
				const embed = new EmbedBuilder()
					.setColor("Red")
					.setTitle("❌ Lỗi phát nhạc")
					.setDescription(`Đã xảy ra lỗi khi phát nhạc: ${error.message}`);
				
				await queue.metadata.channel.send({ 
					embeds: [embed],
					ephemeral: true
				}).catch(e => logger.error("Không thể gửi thông báo lỗi: " + e));
			} catch (err) {
				logger.error("Lỗi khi gửi thông báo: " + err);
			}
		}
	},
};
